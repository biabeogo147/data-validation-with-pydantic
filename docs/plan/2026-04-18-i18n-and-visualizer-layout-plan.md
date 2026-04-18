# Visualizer Layout And I18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the walkthrough raw-input panel, increase whole-file result density, centralize app UI copy behind a language toggle, and replace manual walkthrough column lists with a field-order-driven sliding column window.

**Architecture:** Keep the existing exercise/content model intact and only centralize app-owned UI strings. Update the visualizer modal so the walkthrough always shows the single active CSV row, renders one column per line, and slides a fixed-size column window across the validated fields based on the current field. Remove `visibleColumns` from visualization config so `fieldOrder` becomes the single source of truth for walkthrough ordering and whole-file result rendering.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Vitest

---

### Task 1: Record The New UI Plan

**Files:**
- Create: `docs/plan/2026-04-18-i18n-and-visualizer-layout-plan.md`

- [ ] **Step 1: Write the plan file**

Document the approved direction:
- raw-input walkthrough shows only the current CSV row
- the raw-input panel renders one column per line
- the visible raw-input columns slide as the active validated field advances
- `fieldOrder` drives walkthrough order and whole-file result columns
- `visibleColumns` is removed from visualization config
- whole-file result uses 3 cards per row on large screens
- app-owned UI copy moves into a central i18n dictionary
- add a visible language toggle in the shell header

- [ ] **Step 2: Save the plan in `docs/plan`**

Expected result: a dated implementation plan exists in the user-requested location.

### Task 2: Lock The New Visualizer Behavior With Failing Tests

**Files:**
- Modify: `src/components/output/ValidationVisualizerModal.test.ts`
- Test: `src/components/output/ValidationVisualizerModal.test.ts`

- [ ] **Step 1: Write a failing test for the sliding raw-row window**

Add a test that sets `maxVisibleColumns = 4`, focuses the fifth field, and asserts the walkthrough shows fields 2-5 while field 1 is hidden.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm.cmd run test:run -- src/components/output/ValidationVisualizerModal.test.ts`
Expected: FAIL because the current modal still shows the wrong walkthrough column set.

- [ ] **Step 3: Write a failing test for one-row-per-column raw display**

Assert the raw-input area renders a single active row, shows one column/value line per rendered field, and only highlights the active field.

- [ ] **Step 4: Write a failing test for 3-up whole-file cards**

Assert the whole-file result section uses a large-screen 3-column layout instead of the current 2-column layout.

- [ ] **Step 5: Run the focused test file again**

Run: `npm.cmd run test:run -- src/components/output/ValidationVisualizerModal.test.ts`
Expected: FAIL with the new layout expectations.

### Task 3: Lock The New I18n Shell With Failing Tests

**Files:**
- Modify: `src/App.test.ts`
- Modify: `src/components/editor/PlainCodeEditor.test.ts`
- Modify: `src/components/exercise/ExerciseDetails.test.ts`
- Modify: `src/components/exercise/CsvPreviewPanel.test.ts`

- [ ] **Step 1: Write a failing test for the language toggle**

Add an app-level test that expects a visible `VI / EN` toggle and default English shell copy.

- [ ] **Step 2: Write failing assertions for centralized app copy**

Pick representative components and assert they read shared strings rather than hardcoded labels:
- editor import hint
- CSV preview labels
- exercise detail section labels

- [ ] **Step 3: Run the focused tests to verify they fail**

Run: `npm.cmd run test:run -- src/App.test.ts src/components/editor/PlainCodeEditor.test.ts src/components/exercise/ExerciseDetails.test.ts src/components/exercise/CsvPreviewPanel.test.ts`
Expected: FAIL until the i18n layer exists.

### Task 4: Implement The Centralized I18n Layer

**Files:**
- Create: `src/i18n/messages.ts`
- Create: `src/i18n/I18nProvider.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/editor/EditorImportsHint.tsx`
- Modify: `src/components/exercise/ExerciseDetails.tsx`
- Modify: `src/components/exercise/ExerciseList.tsx`
- Modify: `src/components/exercise/CsvPreviewPanel.tsx`
- Modify: `src/components/output/ValidationVisualizerModal.tsx`

- [ ] **Step 1: Add a typed messages dictionary**

Create a centralized message tree with `en` and `vi` locales for app-owned UI copy only.

- [ ] **Step 2: Add a small provider/hook**

Expose current locale, translated strings, and a locale setter.

- [ ] **Step 3: Add the language toggle in the app shell**

Render a small `VI / EN` control in the main header and wire it to the provider.

- [ ] **Step 4: Replace hardcoded shell/component strings**

Move labels, headings, helper copy, and button text into the shared dictionary while leaving exercise-config content untouched.

- [ ] **Step 5: Run the focused i18n tests**

Run: `npm.cmd run test:run -- src/App.test.ts src/components/editor/PlainCodeEditor.test.ts src/components/exercise/ExerciseDetails.test.ts src/components/exercise/CsvPreviewPanel.test.ts`
Expected: PASS

### Task 5: Implement The New Visualizer Layout

**Files:**
- Modify: `src/components/output/ValidationVisualizerModal.tsx`
- Test: `src/components/output/ValidationVisualizerModal.test.ts`

- [ ] **Step 1: Replace single-row focus with a sliding row window**

Compute the active field window from `fieldOrder` and `maxVisibleColumns`, keeping the walkthrough constrained to a moving column slice around the current field.

- [ ] **Step 2: Replace raw-input cards with row-based key/value lines**

Render the current row as column/value lines so no special long/short card logic remains, and apply highlighted styling only to the active column.

- [ ] **Step 3: Increase whole-file density to 3-up on large screens**

Use a responsive grid that becomes 3 columns on large screens while keeping tablet/mobile readable.

- [ ] **Step 4: Reuse centralized i18n strings in the modal**

Move walkthrough labels and status copy onto the shared dictionary.

- [ ] **Step 4.5: Remove redundant manual walkthrough column config**

Replace `visibleColumns` usage with `fieldOrder`-derived rendering and add `maxVisibleColumns` where a smaller walkthrough window is needed.

- [ ] **Step 5: Run the focused visualizer test file**

Run: `npm.cmd run test:run -- src/components/output/ValidationVisualizerModal.test.ts`
Expected: PASS

### Task 6: Verify The Full App

**Files:**
- Verify only

- [ ] **Step 1: Run the full test suite**

Run: `npm.cmd run test:run`
Expected: PASS with 0 failing tests.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`
Expected: successful typecheck and Vite build.

- [ ] **Step 3: Review the changed UI copy and layouts**

Confirm:
- `Raw Input` shows exactly one active row
- the visible raw-input columns slide with the active field
- only the active field is visually highlighted in the walkthrough
- each raw column is a dedicated row
- whole-file result shows 3 cards per row on large screens
- `VI / EN` toggle swaps app-owned copy
