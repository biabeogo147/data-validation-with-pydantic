# Validation Visualizer Plan

## Goal

Add a centered teaching modal that visually demonstrates how a Pydantic class validates every row in a CSV file field by field before showing full-file validation results.

## UX Summary

- Clicking the main run/check button opens a teaching modal instead of executing immediately.
- The modal offers four playback choices: `1x`, `2x`, `4x`, and `Skip`.
- `Skip` closes the modal flow and runs the existing validation immediately without animation.
- The playback modes animate one field at a time across every row in the CSV:
  - right panel: raw CSV table with active row and field highlighted
  - center panel: Pydantic class code
  - left panel: validated field output
- After playback completes, the modal shows:
  - raw input for the whole CSV file
  - validation results for every row in the file

## Technical Shape

1. Extend the exercise contract with `visualizationConfig`.
2. Add a pure helper layer that:
   - maps field names to code line spans inside the model placeholder
   - derives the target CSV file and field order
   - generates a Python visualization script that iterates every row in the CSV
3. Add a Pyodide execution path for visualization steps that returns a structured timeline.
4. Build a centered modal component that:
   - displays the three-column teaching layout
   - animates the active row/field at the selected speed
   - supports `Skip`, `Replay`, and close
5. After animation completes, run the existing exercise execution and refresh the normal result panel while also keeping the modal open on a whole-file summary state.

## Implementation Notes

- Keep the feature config-driven so each exercise can opt in without changing engine code.
- Start with field-level highlighting only; validator-function tracing is out of scope for this MVP.
- Every exercise should use a CSV file as its primary input source.
- Preserve the current reset behavior when switching exercises: the modal must close and output must reset.
