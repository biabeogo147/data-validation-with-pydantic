import type {
  ExerciseDefinition,
  ExercisePlaceholderValues,
  ExerciseVisualizationConfig,
} from '../types/exercise';

export interface ModelFieldHighlight {
  fieldName: string;
  startLine: number;
  endLine: number;
  ranges?: Array<{
    startLine: number;
    endLine: number;
  }>;
}

export interface VisualizationRequest {
  modelClassName: string;
  modelCode: string;
  csvMountPath: string;
  fieldSequence: string[];
  visibleColumns: string[];
  maxVisualizedRows: number | null;
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

function countCharacters(value: string, targetCharacter: string) {
  return Array.from(value).filter((character) => character === targetCharacter)
    .length;
}

function getLineIndentation(line: string) {
  const match = line.match(/^(\s*)/);
  return match?.[1].length ?? 0;
}

function mergeHighlightRanges(
  ranges: Array<{
    startLine: number;
    endLine: number;
  }>,
) {
  if (ranges.length === 0) {
    return [];
  }

  const sortedRanges = [...ranges].sort(
    (left, right) => left.startLine - right.startLine,
  );
  const mergedRanges = [sortedRanges[0]];

  for (const range of sortedRanges.slice(1)) {
    const previousRange = mergedRanges[mergedRanges.length - 1];

    if (range.startLine <= previousRange.endLine + 1) {
      previousRange.endLine = Math.max(previousRange.endLine, range.endLine);
      continue;
    }

    mergedRanges.push({ ...range });
  }

  return mergedRanges;
}

function parseFieldValidatorTargets(decoratorSource: string) {
  return Array.from(
    decoratorSource.matchAll(/["']([A-Za-z_][A-Za-z0-9_]*)["']/g),
    (match) => match[1],
  );
}

function findFieldValidatorRanges(lines: string[]) {
  const validatorRanges: Array<{
    fields: string[];
    range: {
      startLine: number;
      endLine: number;
    };
  }> = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!lines[lineIndex].includes('@field_validator(')) {
      continue;
    }

    const decoratorStartIndex = lineIndex;
    let decoratorEndIndex = lineIndex;
    let parenthesisBalance =
      countCharacters(lines[lineIndex], '(') - countCharacters(lines[lineIndex], ')');

    while (parenthesisBalance > 0 && decoratorEndIndex + 1 < lines.length) {
      decoratorEndIndex += 1;
      parenthesisBalance +=
        countCharacters(lines[decoratorEndIndex], '(') -
        countCharacters(lines[decoratorEndIndex], ')');
    }

    let functionLineIndex = decoratorEndIndex + 1;

    while (functionLineIndex < lines.length) {
      const line = lines[functionLineIndex];

      if (/^\s*def\s+/.test(line)) {
        break;
      }

      functionLineIndex += 1;
    }

    if (functionLineIndex >= lines.length) {
      continue;
    }

    const functionIndentation = getLineIndentation(lines[functionLineIndex]);
    let blockEndIndex = functionLineIndex;

    for (
      let blockLineIndex = functionLineIndex + 1;
      blockLineIndex < lines.length;
      blockLineIndex += 1
    ) {
      const line = lines[blockLineIndex];

      if (line.trim().length === 0) {
        continue;
      }

      if (getLineIndentation(line) <= functionIndentation) {
        break;
      }

      blockEndIndex = blockLineIndex;
    }

    const fields = parseFieldValidatorTargets(
      lines.slice(decoratorStartIndex, decoratorEndIndex + 1).join('\n'),
    );

    if (fields.length > 0) {
      validatorRanges.push({
        fields,
        range: {
          startLine: decoratorStartIndex + 1,
          endLine: blockEndIndex + 1,
        },
      });
    }

    lineIndex = blockEndIndex;
  }

  return validatorRanges;
}

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
  const csvFiles = exercise.fileCsvConfig.files;

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
  const fieldValidatorRanges = findFieldValidatorRanges(lines);

  return Object.fromEntries(
    fieldNames.map((fieldName) => {
      const lineIndex = lines.findIndex((line) =>
        new RegExp(`^\\s*${fieldName}\\s*:`).test(line),
      );
      const ranges = mergeHighlightRanges([
        {
          startLine: lineIndex >= 0 ? lineIndex + 1 : 1,
          endLine: lineIndex >= 0 ? lineIndex + 1 : 1,
        },
        ...fieldValidatorRanges
          .filter((validatorRange) => validatorRange.fields.includes(fieldName))
          .map((validatorRange) => validatorRange.range),
      ]);
      const firstRange = ranges[0] ?? {
        startLine: 1,
        endLine: 1,
      };
      const lastRange = ranges[ranges.length - 1] ?? firstRange;

      return [
        fieldName,
        {
          fieldName,
          startLine: firstRange.startLine,
          endLine: lastRange.endLine,
          ranges,
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

function sanitizeVisibleColumns(
  configuredVisibleColumns: string[] | undefined,
  fallbackColumns: string[],
): string[] {
  const columns = configuredVisibleColumns?.length
    ? configuredVisibleColumns
    : fallbackColumns;

  return Array.from(new Set(columns.filter(Boolean)));
}

function sanitizeMaxVisualizedRows(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
}

function buildVisualizationPythonSource(
  prelude: string,
  modelCode: string,
  modelClassName: string,
  csvMountPath: string,
  fieldSequence: string[],
  maxVisualizedRows: number | null,
): string {
  const maxVisualizedRowsLiteral =
    maxVisualizedRows === null ? 'None' : String(maxVisualizedRows);
  const generatedScript = [
    'import json as __visualizer_json',
    'import csv',
    'from pathlib import Path',
    'from typing import Any',
    'from pydantic import ValidationError, create_model',
    '',
    `__visualizer_csv_path = Path(${JSON.stringify(csvMountPath)})`,
    `__visualizer_fields = ${JSON.stringify(fieldSequence)}`,
    `__visualizer_max_visualized_rows = ${maxVisualizedRowsLiteral}`,
    `__visualizer_model = ${modelClassName}`,
    '',
    'def __build_visualizer_field_model(__model, __field):',
    '    __field_info = __model.model_fields[__field]',
    '    __decorators = getattr(__model, "__pydantic_decorators__", None)',
    '    __model_validators = getattr(__decorators, "model_validators", {}) if __decorators else {}',
    '    if not __model_validators:',
    '        __optional_fields = {',
    '            __name: (Any | None, None)',
    '            for __name in __model.model_fields',
    '            if __name != __field',
    '        }',
    '        return create_model(',
    '            f"__Visualizer_{__field}",',
    '            __base__=__model,',
    '            **__optional_fields,',
    '        )',
    '    __validators = {}',
    '    if __decorators:',
    '        for __validator_name, __decorator in getattr(__decorators, "field_validators", {}).items():',
    '            __validator_info = getattr(__decorator, "info", None)',
    '            __validator_fields = getattr(__validator_info, "fields", ()) if __validator_info else ()',
    '            if __field not in __validator_fields:',
    '                continue',
    '            __attribute_name = getattr(__decorator, "cls_var_name", __validator_name)',
    '            __validator = __model.__dict__.get(__attribute_name)',
    '            if __validator is not None:',
    '                __validators[f"{__field}_{__attribute_name}"] = __validator',
    '    return create_model(',
    '        f"__Visualizer_{__field}",',
    '        __validators=__validators,',
    '        **{',
    '            __field: (',
    '                __field_info.annotation,',
    '                __field_info,',
    '            )',
    '        },',
    '    )',
    '',
    'with __visualizer_csv_path.open("r", encoding="utf-8") as __visualizer_handle:',
    '    __visualizer_rows = list(csv.DictReader(__visualizer_handle))',
    `print(${JSON.stringify(VISUALIZER_ROWS_MARKER)} + __visualizer_json.dumps(__visualizer_rows))`,
    '',
    'for __row_index, __visualizer_row in enumerate(__visualizer_rows):',
    '    if __visualizer_max_visualized_rows is None or __row_index < __visualizer_max_visualized_rows:',
    '        for __field in __visualizer_fields:',
    '            __field_model = __build_visualizer_field_model(__visualizer_model, __field)',
    '            __payload = {__field: __visualizer_row[__field]} if __field in __visualizer_row else {}',
    '            __raw_value = __visualizer_row.get(__field)',
    '',
    '            try:',
    '                __validated = __field_model.model_validate(__payload)',
    '                __validated_value = getattr(__validated, __field)',
    `                print(${JSON.stringify(VISUALIZER_MARKER)} + __visualizer_json.dumps({`,
    '                    "rowIndex": __row_index,',
    '                    "fieldName": __field,',
    '                    "passed": True,',
    '                    "rawValue": __raw_value,',
    '                    "validatedValue": __validated_value,',
    '                    "message": f"Accepted as {type(__validated_value).__name__}",',
    '                }))',
    '            except ValidationError as __field_error:',
    '                __errors = __field_error.errors()',
    '                __first_error = __errors[0] if __errors else {}',
    `                print(${JSON.stringify(VISUALIZER_MARKER)} + __visualizer_json.dumps({`,
    '                    "rowIndex": __row_index,',
    '                    "fieldName": __field,',
    '                    "passed": False,',
    '                    "rawValue": __raw_value,',
    '                    "validatedValue": None,',
    '                    "message": __first_error.get("msg", str(__field_error)),',
    '                }))',
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
  const visibleColumns = sanitizeVisibleColumns(
    visualizationConfig.visibleColumns,
    fieldSequence,
  );
  const maxVisualizedRows = sanitizeMaxVisualizedRows(
    visualizationConfig.maxVisualizedRows,
  );
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
    visibleColumns,
    maxVisualizedRows,
    highlights,
    pythonSource: buildVisualizationPythonSource(
      prelude,
      modelCode,
      visualizationConfig.modelClassName,
      csvMountPath,
      fieldSequence,
      maxVisualizedRows,
    ),
  };
}

export function parseVisualizationStdout(stdout: string): {
  rawRows: Record<string, string>[];
  steps: VisualizationStep[];
  rowResults: VisualizationRowResult[];
} {
  const rawRows: Record<string, string>[] = [];
  const steps: VisualizationStep[] = [];
  const rowResults: VisualizationRowResult[] = [];

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
  }

  return {
    rawRows,
    steps,
    rowResults,
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
