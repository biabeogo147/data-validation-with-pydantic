import type {
  ExerciseDefinition,
  ExercisePlaceholderValues,
  ExerciseVisualizationConfig,
} from '../types/exercise';

export interface ModelFieldHighlight {
  fieldName: string;
  startLine: number;
  endLine: number;
}

export interface VisualizationRequest {
  modelClassName: string;
  modelCode: string;
  csvMountPath: string;
  fieldSequence: string[];
  highlights: Record<string, ModelFieldHighlight>;
  pythonSource: string;
}

export interface VisualizationStep {
  rowIndex: number;
  fieldName: string;
  passed: boolean;
  rawValue: unknown;
  validatedValue: unknown;
  message: string;
}

const VISUALIZER_MARKER = '__PYDANTIC_VISUALIZER_STEP__';
const VISUALIZER_ROWS_MARKER = '__PYDANTIC_VISUALIZER_ROWS__';
const VISUALIZER_ROW_RESULT_MARKER = '__PYDANTIC_VISUALIZER_ROW_RESULT__';

export interface VisualizationRowResult {
  rowIndex: number;
  passed: boolean;
  validatedRow: Record<string, unknown> | null;
  errors: string[];
}

export type VisualizationPlaybackStatus =
  | 'closed'
  | 'choice'
  | 'loading'
  | 'playing'
  | 'complete'
  | 'error';

function getFileName(fileCsvPath: string): string {
  const segments = fileCsvPath.split('/').filter(Boolean);
  return segments.at(-1) ?? 'fixture.csv';
}

function getVisualizationConfig(
  exercise: ExerciseDefinition,
): ExerciseVisualizationConfig {
  if (!exercise.visualizationConfig) {
    throw new Error(`Exercise "${exercise.id}" does not define visualizationConfig.`);
  }

  return exercise.visualizationConfig;
}

function getModelCode(
  exercise: ExerciseDefinition,
  values: ExercisePlaceholderValues,
  modelPlaceholderId: string,
): string {
  const placeholder = exercise.placeholders.find(
    (item) => item.id === modelPlaceholderId,
  );

  if (!placeholder) {
    throw new Error(
      `Visualization placeholder "${modelPlaceholderId}" was not found.`,
    );
  }

  return values[modelPlaceholderId] ?? placeholder.defaultCode;
}

function getTemplatePrelude(
  templateCode: string,
  modelPlaceholderId: string,
): string {
  const token = `{{${modelPlaceholderId}}}`;
  const tokenIndex = templateCode.indexOf(token);

  if (tokenIndex === -1) {
    throw new Error(`Template token "${modelPlaceholderId}" was not found.`);
  }

  return templateCode.slice(0, tokenIndex).trim();
}

function getVisualizationCsvMountPath(
  exercise: ExerciseDefinition,
  visualizationConfig: ExerciseVisualizationConfig,
): string {
  const csvFiles = exercise.fileCsvConfig?.files ?? [];

  if (csvFiles.length === 0) {
    throw new Error(`Exercise "${exercise.id}" must provide a CSV file.`);
  }

  const targetFile =
    csvFiles.find((file) => file.id === visualizationConfig.csvFileId) ??
    csvFiles[0];

  return targetFile.mountPath ?? `/data/${getFileName(targetFile.fileCsvPath)}`;
}

export function findModelFieldHighlights(
  modelCode: string,
  fieldNames: string[],
): Record<string, ModelFieldHighlight> {
  const lines = modelCode.split('\n');

  return Object.fromEntries(
    fieldNames.map((fieldName) => {
      const lineIndex = lines.findIndex((line) =>
        new RegExp(`^\\s*${fieldName}\\s*:`).test(line),
      );

      return [
        fieldName,
        {
          fieldName,
          startLine: lineIndex >= 0 ? lineIndex + 1 : 1,
          endLine: lineIndex >= 0 ? lineIndex + 1 : 1,
        },
      ];
    }),
  );
}

function inferFieldSequenceFromModelCode(modelCode: string): string[] {
  return modelCode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      return match?.[1] ?? null;
    })
    .filter((fieldName): fieldName is string => Boolean(fieldName));
}

function buildVisualizationPythonSource(
  prelude: string,
  modelCode: string,
  modelClassName: string,
  csvMountPath: string,
  fieldSequence: string[],
): string {
  const generatedScript = [
    'import json as __visualizer_json',
    'import csv',
    'from pathlib import Path',
    'from pydantic import ValidationError, create_model',
    '',
    `__visualizer_csv_path = Path(${JSON.stringify(csvMountPath)})`,
    `__visualizer_fields = ${JSON.stringify(fieldSequence)}`,
    `__visualizer_model = ${modelClassName}`,
    '',
    'with __visualizer_csv_path.open("r", encoding="utf-8") as __visualizer_handle:',
    '    __visualizer_rows = list(csv.DictReader(__visualizer_handle))',
    `print(${JSON.stringify(VISUALIZER_ROWS_MARKER)} + __visualizer_json.dumps(__visualizer_rows))`,
    '',
    'for __row_index, __visualizer_row in enumerate(__visualizer_rows):',
    '    for __field in __visualizer_fields:',
    '        __field_info = __visualizer_model.model_fields[__field]',
    '        __field_model = create_model(',
    '            f"__Visualizer_{__field}",',
    '            **{',
    '                __field: (',
    '                    __field_info.annotation,',
    '                    ...,',
    '                )',
    '            },',
    '        )',
    '        __payload = {__field: __visualizer_row[__field]} if __field in __visualizer_row else {}',
    '        __raw_value = __visualizer_row.get(__field)',
    '',
    '        try:',
    '            __validated = __field_model.model_validate(__payload)',
    '            __validated_value = getattr(__validated, __field)',
    `            print(${JSON.stringify(VISUALIZER_MARKER)} + __visualizer_json.dumps({`,
    '                "rowIndex": __row_index,',
    '                "fieldName": __field,',
    '                "passed": True,',
    '                "rawValue": __raw_value,',
    '                "validatedValue": __validated_value,',
    '                "message": f"Accepted as {type(__validated_value).__name__}",',
    '            }))',
    '        except ValidationError as __field_error:',
    '            __errors = __field_error.errors()',
    '            __first_error = __errors[0] if __errors else {}',
    `            print(${JSON.stringify(VISUALIZER_MARKER)} + __visualizer_json.dumps({`,
    '                "rowIndex": __row_index,',
    '                "fieldName": __field,',
    '                "passed": False,',
    '                "rawValue": __raw_value,',
    '                "validatedValue": None,',
    '                "message": __first_error.get("msg", str(__field_error)),',
    '            }))',
    '',
    '    try:',
    '        __validated_row = __visualizer_model.model_validate(__visualizer_row)',
    `        print(${JSON.stringify(VISUALIZER_ROW_RESULT_MARKER)} + __visualizer_json.dumps({`,
    '            "rowIndex": __row_index,',
    '            "passed": True,',
    '            "validatedRow": __validated_row.model_dump(),',
    '            "errors": [],',
    '        }))',
    '    except ValidationError as __row_error:',
    `        print(${JSON.stringify(VISUALIZER_ROW_RESULT_MARKER)} + __visualizer_json.dumps({`,
    '            "rowIndex": __row_index,',
    '            "passed": False,',
    '            "validatedRow": None,',
    '            "errors": [item.get("msg", str(__row_error)) for item in __row_error.errors()],',
    '        }))',
  ].join('\n');

  return [prelude, modelCode.trim(), generatedScript]
    .filter((part) => part && part.trim().length > 0)
    .join('\n\n');
}

export function buildVisualizationRequest(
  exercise: ExerciseDefinition,
  values: ExercisePlaceholderValues,
): VisualizationRequest {
  const visualizationConfig = getVisualizationConfig(exercise);
  const modelCode = getModelCode(
    exercise,
    values,
    visualizationConfig.modelPlaceholderId,
  );
  const fieldSequence =
    visualizationConfig.fieldOrder ??
    inferFieldSequenceFromModelCode(modelCode);
  const csvMountPath = getVisualizationCsvMountPath(
    exercise,
    visualizationConfig,
  );
  const highlights = findModelFieldHighlights(modelCode, fieldSequence);
  const prelude = getTemplatePrelude(
    exercise.templateCode,
    visualizationConfig.modelPlaceholderId,
  );

  return {
    modelClassName: visualizationConfig.modelClassName,
    modelCode,
    csvMountPath,
    fieldSequence,
    highlights,
    pythonSource: buildVisualizationPythonSource(
      prelude,
      modelCode,
      visualizationConfig.modelClassName,
      csvMountPath,
      fieldSequence,
    ),
  };
}

export function parseVisualizationStdout(stdout: string): {
  rawRows: Record<string, string>[];
  steps: VisualizationStep[];
  rowResults: VisualizationRowResult[];
  visibleStdout: string;
} {
  const rawRows: Record<string, string>[] = [];
  const steps: VisualizationStep[] = [];
  const rowResults: VisualizationRowResult[] = [];
  const visibleLines: string[] = [];

  for (const line of stdout.split('\n')) {
    if (line.startsWith(VISUALIZER_MARKER)) {
      steps.push(
        JSON.parse(line.slice(VISUALIZER_MARKER.length)) as VisualizationStep,
      );
      continue;
    }

    if (line.startsWith(VISUALIZER_ROWS_MARKER)) {
      rawRows.push(
        ...(
          JSON.parse(
            line.slice(VISUALIZER_ROWS_MARKER.length),
          ) as Record<string, string>[]
        ),
      );
      continue;
    }

    if (line.startsWith(VISUALIZER_ROW_RESULT_MARKER)) {
      rowResults.push(
        JSON.parse(
          line.slice(VISUALIZER_ROW_RESULT_MARKER.length),
        ) as VisualizationRowResult,
      );
      continue;
    }

    if (line.trim()) {
      visibleLines.push(line);
    }
  }

  return {
    rawRows,
    steps,
    rowResults,
    visibleStdout: visibleLines.join('\n').trim(),
  };
}

export function getVisibleRowResults(
  rowResults: VisualizationRowResult[],
  steps: VisualizationStep[],
  currentStepIndex: number,
  status: VisualizationPlaybackStatus,
): VisualizationRowResult[] {
  if (status === 'complete') {
    return rowResults;
  }

  if (currentStepIndex < 0 || steps.length === 0) {
    return [];
  }

  const latestStepIndexByRow = new Map<number, number>();

  steps.forEach((step, index) => {
    latestStepIndexByRow.set(step.rowIndex, index);
  });

  return rowResults.filter((rowResult) => {
    const latestStepIndex = latestStepIndexByRow.get(rowResult.rowIndex);
    return latestStepIndex !== undefined && latestStepIndex <= currentStepIndex;
  });
}
