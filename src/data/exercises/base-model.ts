import type { ExerciseDefinition } from '../../types/exercise';

export const baseModelExercise: ExerciseDefinition = {
  id: 'base-model-intro',
  title: 'Build your first BaseModel',
  shortTitle: 'BaseModel',
  description:
    'Define a simple Pydantic model and watch Pydantic coerce string input into the right Python types.',
  editorImports: ['from pydantic import BaseModel'],
  difficulty: 'beginner',
  tags: ['BaseModel', 'model_validate', 'coercion'],
  templateCode: [
    'import csv',
    'from pathlib import Path',
    'from pydantic import BaseModel, ValidationError',
    '',
    '{{MODEL_A}}',
    '',
    'csv_path = Path("/data/base-model.csv")',
    'valid_rows = []',
    'invalid_rows = []',
    '',
    'with csv_path.open("r", encoding="utf-8") as handle:',
    '    reader = csv.DictReader(handle)',
    '    for row in reader:',
    '        try:',
    '            obj = A.model_validate(row)',
    '            valid_rows.append(obj.model_dump())',
    '        except ValidationError as exc:',
    '            invalid_rows.append({"row": row, "errors": len(exc.errors())})',
    '',
    'print({"valid_count": len(valid_rows), "invalid_count": len(invalid_rows), "valid_rows": valid_rows})',
  ].join('\n'),
  placeholders: [
    {
      id: 'MODEL_A',
      label: 'Define model A',
      defaultCode: ['class A(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [
    {
      id: 'model-shape',
      kind: 'python_assert',
      label: 'A validates every CSV row',
      code: ['assert len(valid_rows) == 2', 'assert len(invalid_rows) == 0'].join('\n'),
      successMessage: 'Your model validates the full CSV file.',
      failureMessage: 'Both rows in the CSV should validate successfully.',
    },
    {
      id: 'coerces-csv-ages',
      kind: 'python_assert',
      label: 'coerces CSV ages into integers',
      code: 'assert all(isinstance(row["age"], int) for row in valid_rows)',
      successMessage: 'CSV string values were coerced into integers.',
      failureMessage: 'Validated rows should contain integer ages after parsing.',
    },
  ],
  fileCsvConfig: {
    files: [
      {
        id: 'people',
        fileCsvPath: 'fixtures/base-model.csv',
      },
    ],
  },
  hints: [
    'Pydantic models inherit from `BaseModel`.',
    'Every row from `csv.DictReader` starts as strings.',
  ],
  example: {
    title: 'Example output',
    code: [
      "{'valid_count': 2, 'invalid_count': 0, 'valid_rows': [",
      "  {'name': 'An', 'age': 20},",
      "  {'name': 'Binh', 'age': 21}",
      ']}',
    ].join('\n'),
  },
  solutionCode: {
    MODEL_A: ['class A(BaseModel):', '    name: str', '    age: int'].join('\n'),
  },
  uiConfig: {
    runButtonLabel: 'Run Validation',
  },
  learningConfig: {
    estimatedMinutes: 5,
    objectives: [
      'Define a Pydantic model with typed fields.',
      'Use `model_validate` to convert raw data into a model instance.',
    ],
  },
  visualizationConfig: {
    modelClassName: 'A',
    modelPlaceholderId: 'MODEL_A',
    csvFileId: 'people',
    fieldOrder: ['name', 'age'],
  },
};
