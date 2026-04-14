# Pydantic Playground

A static, open-source tutorial playground for learning **Pydantic** in the browser.

The app is intentionally scoped as a mini learning IDE:

- exercises are defined in config, not hardcoded into the UI
- every exercise validates data coming from a CSV file in the repo
- Python runs fully client-side with **Pyodide**
- no backend, no database, no auth
- deploys cleanly to **GitHub Pages**

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Pyodide
- Monaco Editor on desktop
- Textarea fallback on mobile
- GitHub Actions for CI and Pages deploy

## Getting Started

```bash
npm install
npm run dev
```

To run the checks and build locally:

```bash
npm run test:run
npm run build
```

## How Exercises Work

The app is **config-driven**. Each exercise is described by a typed object in `src/data/exercises`.

Every exercise can define:

- metadata like `id`, `title`, `description`, `difficulty`, and `tags`
- `templateCode`
- one or more `placeholders`
- `runConfig`
- `checks`
- `fileCsvConfig`
- `visualizationConfig`
- `hints`, `explanation`, `solutionCode`, `uiConfig`, and `learningConfig`

When a learner clicks **Run**, the app:

1. collects the learner's code for each placeholder
2. injects it into the exercise template
3. mounts any configured CSV fixtures into the Pyodide filesystem
4. optionally walks through the CSV field-by-field in the teaching modal
5. executes the assembled Python script against the CSV rows
6. evaluates checks and renders pass/fail output

## Adding A New Exercise

1. Add a new file under `src/data/exercises`.
2. Export an `ExerciseDefinition`.
3. Add it to `src/data/exercises/index.ts`.
4. Every exercise should provide CSV data under `public/fixtures` and reference it with `fileCsvPath`.

Example:

```ts
import type { ExerciseDefinition } from '../../types/exercise';

export const myExercise: ExerciseDefinition = {
  id: 'custom-exercise',
  title: 'Custom exercise',
  description: 'Learners fill the placeholder and run checks.',
  templateCode: ['from pydantic import BaseModel', '', '{{MODEL_A}}'].join('\n'),
  placeholders: [
    {
      id: 'MODEL_A',
      defaultCode: 'class A(BaseModel):\n    name: str',
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [
    {
      id: 'shape-check',
      kind: 'python_assert',
      label: 'model validates data',
      code: 'assert True',
      successMessage: 'Everything passed.',
    },
  ],
  fileCsvConfig: {
    files: [
      {
        id: 'records',
        fileCsvPath: 'fixtures/my-exercise.csv',
      },
    ],
  },
  visualizationConfig: {
    modelClassName: 'A',
    modelPlaceholderId: 'MODEL_A',
    csvFileId: 'records',
    fieldOrder: ['name'],
  },
};
```

## CSV Fixtures

CSV fixtures should live in `public/fixtures`.

At runtime, the engine fetches each configured CSV file and mounts it into the Pyodide filesystem. By default:

- source path: `fixtures/users.csv`
- mounted path in Python: `/data/users.csv`

You can override the mounted path in `fileCsvConfig.files[].mountPath` if needed.

The validation walkthrough modal also uses the CSV fixture directly. It animates every row and field in the file instead of using a separate hardcoded object sample.

## GitHub Pages

The Vite base path is derived automatically for GitHub Pages deployments by reading `GITHUB_REPOSITORY` inside GitHub Actions.

If you need a custom base path, set:

```bash
VITE_BASE_PATH=/your-custom-base/
```

Make sure the repository Pages source is configured to **GitHub Actions**.
