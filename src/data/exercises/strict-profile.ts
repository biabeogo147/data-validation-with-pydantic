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
    'from pydantic import BaseModel, StrictInt, ValidationError',
    '',
    '{{MODEL_PROFILE}}',
    '',
    'valid_profile = Profile.model_validate({"username": "alice", "age": 22})',
    'strict_error_name = ""',
    '',
    'try:',
    '    Profile.model_validate({"username": "alice", "age": "22"})',
    'except ValidationError as exc:',
    '    strict_error_name = type(exc).__name__',
    '',
    'print(valid_profile.model_dump())',
    'print(strict_error_name)',
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
      label: 'accepts integer input',
      code: ['assert valid_profile.username == "alice"', 'assert valid_profile.age == 22'].join(
        '\n',
      ),
      successMessage: 'The model accepts a real integer payload.',
      failureMessage: 'The valid payload should still be accepted.',
    },
    {
      id: 'rejects-string-number',
      kind: 'python_assert',
      label: 'rejects string numbers',
      code: 'assert strict_error_name == "ValidationError"',
      successMessage: 'The model rejects string input for the strict field.',
      failureMessage: 'The age field should reject `"22"` when strict mode is enabled.',
    },
  ],
  fileCsvConfig: {
    files: [],
  },
  hints: [
    'Use `StrictInt` if you want a field that will not coerce strings into integers.',
    'Keep `username` as a normal string field.',
  ],
  explanation:
    'Strict field types are helpful when your schema should reject coercion and accept only already-correct values from the caller.',
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
};
