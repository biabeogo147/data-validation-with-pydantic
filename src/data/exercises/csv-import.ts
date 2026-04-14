import type { ExerciseDefinition } from '../../types/exercise';

export const csvImportExercise: ExerciseDefinition = {
  id: 'csv-import',
  title: 'Validate CSV rows with a Pydantic model',
  shortTitle: 'CSV Validation',
  description:
    'Read a CSV file from the repo, validate each row with Pydantic, and separate valid rows from invalid ones.',
  editorImports: ['from pydantic import BaseModel', 'from pydantic import ValidationError'],
  difficulty: 'intermediate',
  tags: ['csv', 'fixtures', 'ValidationError'],
  templateCode: [
    'import csv',
    'from pathlib import Path',
    'from pydantic import BaseModel, ValidationError',
    '',
    '{{USER_MODEL}}',
    '',
    'csv_path = Path("/data/users.csv")',
    'valid_rows = []',
    'invalid_rows = []',
    '',
    'with csv_path.open("r", encoding="utf-8") as handle:',
    '    reader = csv.DictReader(handle)',
    '    for row in reader:',
    '        try:',
    '            user = User.model_validate({"name": row["name"], "age": row["age"]})',
    '            valid_rows.append(user.model_dump())',
    '        except ValidationError:',
    '            invalid_rows.append(row["name"])',
    '',
    'print({"valid_count": len(valid_rows), "invalid_rows": invalid_rows})',
  ].join('\n'),
  placeholders: [
    {
      id: 'USER_MODEL',
      label: 'Define User',
      defaultCode: ['class User(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [
    {
      id: 'valid-count',
      kind: 'python_assert',
      label: 'keeps only valid rows',
      code: ['assert len(valid_rows) == 2', 'assert invalid_rows == ["Broken"]'].join(
        '\n',
      ),
      successMessage: 'Your model validates two rows and rejects the broken one.',
      failureMessage: 'The CSV run should keep 2 valid rows and reject `Broken`.',
    },
    {
      id: 'coerces-csv-age',
      kind: 'python_assert',
      label: 'coerces CSV ages to integers',
      code: 'assert all(isinstance(row["age"], int) for row in valid_rows)',
      successMessage: 'Validated rows now contain integer ages.',
      failureMessage: 'Each validated age should end up as an integer.',
    },
  ],
  fileCsvConfig: {
    files: [
      {
        id: 'users',
        fileCsvPath: 'fixtures/users.csv',
      },
    ],
  },
  hints: [
    'The CSV file is mounted for Pyodide at `/data/users.csv`.',
    'Use `ValidationError` to capture bad rows without crashing the whole script.',
  ],
  example: {
    title: 'Example output',
    code: "{'valid_count': 2, 'invalid_rows': ['Broken']}",
  },
  solutionCode: {
    USER_MODEL: ['class User(BaseModel):', '    name: str', '    age: int'].join(
      '\n',
    ),
  },
  uiConfig: {
    runButtonLabel: 'Run CSV Exercise',
  },
  learningConfig: {
    estimatedMinutes: 10,
    objectives: [
      'Validate row-based data coming from a CSV file.',
      'Handle per-row validation failures without aborting the whole import.',
    ],
  },
  visualizationConfig: {
    modelClassName: 'User',
    modelPlaceholderId: 'USER_MODEL',
    csvFileId: 'users',
    fieldOrder: ['name', 'age'],
  },
};
