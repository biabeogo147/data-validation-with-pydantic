import type { ExerciseDefinition } from '../../types/exercise';

export const baseModelExercise: ExerciseDefinition = {
  id: 'base-model-intro',
  title: 'Build your first BaseModel',
  shortTitle: 'BaseModel',
  description:
    'Define a simple Pydantic model and watch Pydantic coerce string input into the right Python types.',
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
      description: 'Create a Pydantic model with `name` and `age` fields.',
      placeholderHint: 'Use `class A(BaseModel): ...`',
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
        description: 'Two valid rows for a basic coercion walkthrough.',
      },
    ],
  },
  hints: [
    'Pydantic models inherit from `BaseModel`.',
    'Every row from `csv.DictReader` starts as strings.',
  ],
  explanation:
    'Pydantic reads each CSV row as a string-based dictionary and uses the field annotations on `A` to coerce `age` into an integer for every row.',
  solutionCode: {
    MODEL_A: ['class A(BaseModel):', '    name: str', '    age: int'].join('\n'),
  },
  visible: true,
  uiConfig: {
    runButtonLabel: 'Run Validation',
    editorLayout: 'single',
    outputMode: 'stacked',
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
    title: 'Whole-file coercion',
    description: 'Watch Pydantic process every row in the CSV and coerce `age` field values.',
  },
};
