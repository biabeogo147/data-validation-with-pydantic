# Architecture Notes

## Design Goal

Keep the app split into three clean layers:

1. **Exercise content**
   Files in `src/data/exercises` describe tutorial lessons as typed config.

2. **Generic engine**
   Files in `src/lib` assemble template code, mount fixtures, run Python, and normalize checks into a frontend-friendly result.

3. **UI**
   React components render catalog, instructions, editor, and output without hardcoding exercise logic.

## Why Config-Driven

Adding a new lesson should not require changes to the runner or UI. A contributor only needs to:

- create a new `ExerciseDefinition`
- optionally add CSV fixtures under `public/fixtures`
- export the exercise from the catalog

## Execution Flow

1. UI reads the exercise catalog.
2. Learner edits one or more placeholders.
3. `template.ts` injects placeholder code into `templateCode`.
4. `exercise-runner.ts` derives fixture mounts and builds the final Python script.
5. `pyodide-client.ts` loads Pyodide, loads packages, mounts CSV files, and executes the script.
6. The runner converts Python/assertion output into normalized `pass`, `fail`, or `error` states for the UI.

## Check Strategy

The engine supports two check kinds:

- `python_assert`
  Appends generated Python assertion blocks after learner code. Each block prints a machine-readable result line that the runner parses.

- `stdout_contains`
  Evaluates whether the visible script output contains a configured string.

This keeps the first version simple while still allowing both semantic validation and lightweight output checks.

## GitHub Pages

The app is a normal static Vite build:

- no server execution
- no API routes
- no database
- no login state

GitHub Actions handles test, build, artifact upload, and Pages deployment.
