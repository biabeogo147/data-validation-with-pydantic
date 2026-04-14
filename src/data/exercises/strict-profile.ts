import type { ExerciseDefinition } from '../../types/exercise';

export const strictProfileExercise: ExerciseDefinition = {
  id: 'strict-profile',
  title: 'Enforce strict integer validation',
  shortTitle: 'Strict Fields',
  description:
    'Define a profile model that accepts real integers but rejects strings that only look like integers.',
  difficulty: 'intermediate',
  tags: ['StrictInt', 'Field', 'ValidationError'],
  templateCode: [
    'import csv',
    'from pathlib import Path',
    'from pydantic import BaseModel, StrictInt, ValidationError',
    '',
    '{{MODEL_PROFILE}}',
    '',
    'csv_path = Path("/data/strict-profile.csv")',
    'valid_rows = []',
    'invalid_rows = []',
    '',
    'with csv_path.open("r", encoding="utf-8") as handle:',
    '    reader = csv.DictReader(handle)',
    '    for row in reader:',
    '        try:',
    '            profile = Profile.model_validate(row)',
    '            valid_rows.append(profile.model_dump())',
    '        except ValidationError as exc:',
    '            invalid_rows.append({"row": row, "errors": len(exc.errors())})',
    '',
    'print({"valid_count": len(valid_rows), "invalid_count": len(invalid_rows), "invalid_rows": invalid_rows})',
  ].join('\n'),
  placeholders: [
    {
      id: 'MODEL_PROFILE',
      label: 'Define Profile',
      description: 'Use a strict integer type for the age field.',
      placeholderHint: 'Hint: `StrictInt` is already imported for you.',
      defaultCode: [
        'class Profile(BaseModel):',
        '    username: str',
        '    age: StrictInt',
      ].join('\n'),
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [
    {
      id: 'accepts-real-integers',
      kind: 'python_assert',
      label: 'strict fields reject CSV strings',
      code: ['assert len(valid_rows) == 0', 'assert len(invalid_rows) == 2'].join(
        '\n',
      ),
      successMessage: 'StrictInt rejects both CSV rows because their ages are strings.',
      failureMessage: 'Every CSV row should fail because `StrictInt` will not coerce strings.',
    },
    {
      id: 'rejects-string-number',
      kind: 'python_assert',
      label: 'captures validation errors per row',
      code: 'assert all(item["errors"] >= 1 for item in invalid_rows)',
      successMessage: 'Each invalid CSV row reports at least one validation error.',
      failureMessage: 'The invalid rows list should capture validation error counts.',
    },
  ],
  fileCsvConfig: {
    files: [
      {
        id: 'profiles',
        fileCsvPath: 'fixtures/strict-profile.csv',
        description: 'Rows that stay as strings after CSV parsing, ideal for StrictInt rejection.',
      },
    ],
  },
  hints: [
    'Use `StrictInt` if you want a field that will not coerce strings into integers.',
    'Keep `username` as a normal string field.',
  ],
  explanation:
    'CSV values are strings by default, so `StrictInt` rejects them. This makes the exercise a good demonstration of why strict types can be useful for detecting untrusted or pre-parsed input.',
  solutionCode: {
    MODEL_PROFILE: [
      'class Profile(BaseModel):',
      '    username: str',
      '    age: StrictInt',
    ].join('\n'),
  },
  visible: true,
  uiConfig: {
    runButtonLabel: 'Check Strictness',
    editorLayout: 'single',
    outputMode: 'stacked',
  },
  learningConfig: {
    estimatedMinutes: 8,
    objectives: [
      'Recognize when coercion is helpful and when it is not.',
      'Use strict field types to enforce exact input types.',
    ],
  },
  visualizationConfig: {
    modelClassName: 'Profile',
    modelPlaceholderId: 'MODEL_PROFILE',
    csvFileId: 'profiles',
    fieldOrder: ['username', 'age'],
    title: 'Whole-file strict validation',
    description: 'See how `StrictInt` rejects CSV rows because every age value arrives as a string.',
  },
};
