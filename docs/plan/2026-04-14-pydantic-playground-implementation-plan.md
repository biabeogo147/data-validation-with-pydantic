# Pydantic Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, open-source tutorial/playground for learning Pydantic that runs fully client-side in the browser with Pyodide and deploys for free on GitHub Pages.

**Architecture:** A single-page React app loads exercise definitions from typed TypeScript config, lets learners fill placeholders in a template, assembles executable Python on demand, mounts repo-hosted CSV fixtures into the Pyodide virtual filesystem, runs the script, and reports pass/fail with logs. The engine stays generic so adding a new exercise only requires adding config and optional fixture files, not changing runtime logic.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library, Pyodide, Monaco Editor, GitHub Actions, GitHub Pages

---

## File Structure

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `postcss.config.js` if needed by the chosen Tailwind setup
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/types/exercise.ts`
- Create: `src/data/exercises/*.ts`
- Create: `src/data/exercises/index.ts`
- Create: `src/lib/template.ts`
- Create: `src/lib/template.test.ts`
- Create: `src/lib/exercise-runner.ts`
- Create: `src/lib/exercise-runner.test.ts`
- Create: `src/lib/pyodide-client.ts`
- Create: `src/lib/github-pages.ts`
- Create: `src/lib/text.ts`
- Create: `src/components/layout/*.tsx`
- Create: `src/components/editor/*.tsx`
- Create: `src/components/exercise/*.tsx`
- Create: `src/components/output/*.tsx`
- Create: `src/hooks/useExercises.ts`
- Create: `src/hooks/useExerciseRunner.ts`
- Create: `src/hooks/useIsMobile.ts`
- Create: `src/assets/fixtures/*.csv`
- Create: `public/.nojekyll`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Create: `docs/architecture.md`

### Task 1: Scaffold The Static App

**Files:**
- Create: root config files for Vite, TypeScript, Vitest, Tailwind, and npm scripts
- Create: base React entry files

- [ ] **Step 1: Define package scripts and dependencies**

Add scripts for `dev`, `build`, `preview`, `test`, and `test:run`. Include React, Vite, Tailwind, Vitest, Testing Library, Pyodide, and Monaco dependencies.

- [ ] **Step 2: Define Vite config for GitHub Pages**

Set `base` from an environment variable or repository name helper so the same codebase can work on project Pages and local development.

- [ ] **Step 3: Add the Tailwind setup**

Use the Vite plugin-based Tailwind integration and a global stylesheet with design tokens for the playground UI.

- [ ] **Step 4: Add CI-safe npm commands**

Ensure `npm run build` and `npm run test:run` can run headlessly in GitHub Actions.

### Task 2: Lock The Exercise Contract First

**Files:**
- Create: `src/types/exercise.ts`
- Create: `src/lib/template.test.ts`
- Create: `src/lib/template.ts`

- [ ] **Step 1: Write failing tests for placeholder extraction and template assembly**

Cover:
- replacing `{{PLACEHOLDER}}` tokens with learner code
- preserving untouched template text
- failing when a required placeholder is missing
- supporting multiple placeholders deterministically

- [ ] **Step 2: Run the template tests and verify expected failures**

Run: `npm run test:run -- src/lib/template.test.ts`
Expected: failing assertions because the template helpers do not exist yet

- [ ] **Step 3: Implement the exercise types and template helpers**

Define the full config contract:
- `ExerciseDefinition`
- `ExercisePlaceholder`
- `ExerciseRunConfig`
- `ExerciseCheckDefinition`
- `ExerciseFileCsvConfig`
- `ExerciseUiConfig`
- `ExerciseLearningConfig`

Implement helper functions for collecting starter code, validating placeholders, and assembling final Python source.

- [ ] **Step 4: Re-run the template tests**

Run: `npm run test:run -- src/lib/template.test.ts`
Expected: pass

### Task 3: Build The Generic Runner Contract

**Files:**
- Create: `src/lib/exercise-runner.test.ts`
- Create: `src/lib/exercise-runner.ts`

- [ ] **Step 1: Write failing tests for runner orchestration**

Cover:
- loading fixture CSV metadata from config
- producing the final Python source for execution
- formatting a normalized run result with `status`, `stdout`, `stderr`, and `assembledCode`
- translating thrown errors into learner-visible output

- [ ] **Step 2: Run the runner tests and verify expected failures**

Run: `npm run test:run -- src/lib/exercise-runner.test.ts`
Expected: failing assertions because the runner helpers do not exist yet

- [ ] **Step 3: Implement the pure orchestration layer**

Keep this layer framework-agnostic:
- derive fixture mount instructions from `fileCsvConfig.fileCsvPath`
- assemble the code
- call a provided execution adapter
- normalize the returned result

- [ ] **Step 4: Re-run the runner tests**

Run: `npm run test:run -- src/lib/exercise-runner.test.ts`
Expected: pass

### Task 4: Add The Browser Pyodide Adapter

**Files:**
- Create: `src/lib/pyodide-client.ts`

- [ ] **Step 1: Write failing tests only for adapter-adjacent pure helpers when practical**

Extract any URL-building, fixture-path, or stdout-parsing helpers into testable units. Keep browser runtime bootstrapping thin.

- [ ] **Step 2: Implement lazy Pyodide bootstrapping**

Load Pyodide on demand, install `pydantic`, expose a single `runExerciseCode` API, and capture stdout/stderr.

- [ ] **Step 3: Mount CSV fixtures from the repo into the Pyodide filesystem**

Fetch each configured CSV via the correct public base path, write it into the virtual filesystem, and make the mounted path predictable for exercises.

- [ ] **Step 4: Add runtime guards**

Return clear learner-facing errors for initialization failure, package install failure, fixture fetch failure, and Python exceptions.

### Task 5: Seed Config-Driven Exercise Content

**Files:**
- Create: `src/data/exercises/index.ts`
- Create: `src/data/exercises/*.ts`
- Create: `src/assets/fixtures/*.csv`

- [ ] **Step 1: Add a small starter catalog**

Create a few representative exercises that prove the model:
- basic `BaseModel` validation
- field coercion and strictness
- CSV-to-model validation using `fileCsvPath`

- [ ] **Step 2: Keep content declarative**

Each exercise should supply:
- metadata
- template code
- placeholder definitions
- checks
- hints and explanation
- optional solution

- [ ] **Step 3: Export a single visible exercise list**

Filter hidden exercises centrally so the UI never has to know content-management rules.

### Task 6: Build The Tutorial UI

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/...`
- Create: `src/hooks/useExercises.ts`
- Create: `src/hooks/useExerciseRunner.ts`
- Create: `src/hooks/useIsMobile.ts`

- [ ] **Step 1: Build the top-level layout**

Include:
- app header
- exercise list/sidebar
- current exercise detail pane
- editor area
- output/result panel

- [ ] **Step 2: Build the editor abstraction**

Use Monaco on desktop and a simple `textarea` fallback on smaller screens or when Monaco cannot load.

- [ ] **Step 3: Connect learner code to placeholders**

Support one or more placeholder editors while keeping the default learner experience simple.

- [ ] **Step 4: Build run-state UX**

Show:
- idle
- booting Pyodide
- running
- pass
- fail
- runtime error

- [ ] **Step 5: Add learning affordances**

Show hints, explanation, tags, difficulty, and optional “show solution” without hardwiring specific exercises into the UI.

### Task 7: Document And Deploy

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Create: `docs/architecture.md`
- Create: `public/.nojekyll`

- [ ] **Step 1: Add CI workflow**

Run install, tests, and build on pushes and pull requests.

- [ ] **Step 2: Add Pages deploy workflow**

Build and deploy `dist` through GitHub Actions with the correct permissions and artifact upload.

- [ ] **Step 3: Document contribution flow**

Explain:
- how exercises are added
- where CSV fixtures live
- how placeholder substitution works
- how to set the GitHub Pages base path

- [ ] **Step 4: Add architecture notes**

Document the engine boundaries so future contributors can extend config without coupling it to UI code.

### Task 8: Verify End-To-End

**Files:**
- Verify: full repository

- [ ] **Step 1: Run focused unit tests**

Run: `npm run test:run`
Expected: all tests pass

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: Vite build succeeds and outputs `dist`

- [ ] **Step 3: Review the built architecture against requirements**

Check that the delivered app is:
- fully static
- config-driven
- backend-free
- GitHub Pages ready
- open-source friendly

