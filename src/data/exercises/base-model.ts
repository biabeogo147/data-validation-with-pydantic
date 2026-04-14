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
    'from pydantic import BaseModel',
    '',
    '{{MODEL_A}}',
    '',
    'obj = A.model_validate({"name": "An", "age": "20"})',
    'print(obj.model_dump())',
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
      label: 'A has the expected fields',
      code: ['assert obj.name == "An"', 'assert obj.age == 20'].join('\n'),
      successMessage: 'Your model validates and coerces the sample payload.',
      failureMessage: 'A should accept `name` as `str` and coerce `age` to `int`.',
    },
    {
      id: 'prints-dict',
      kind: 'stdout_contains',
      label: 'prints the normalized dict',
      text: "'age': 20",
      successMessage: 'The output includes the normalized integer value.',
      failureMessage: 'The output should show `age` as an integer after validation.',
    },
  ],
  fileCsvConfig: {
    files: [],
  },
  hints: [
    'Pydantic models inherit from `BaseModel`.',
    'Use regular Python type annotations on each field.',
  ],
  explanation:
    'Pydantic reads the field annotations on `A` and uses them to validate incoming data. The sample payload passes because `age="20"` can be coerced into an integer.',
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
};
