import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ValidationVisualizerModal } from './ValidationVisualizerModal';
import type { ValidationVisualizerState } from '../../hooks/useValidationVisualizer';
import type { ExerciseRunResult } from '../../types/exercise';

const baseState: ValidationVisualizerState = {
  isOpen: true,
  status: 'playing',
  mode: 'walkthrough',
  exerciseId: 'csv-import',
  speed: '1x',
  request: {
    modelClassName: 'UserRecord',
    modelCode: ['class UserRecord(BaseModel):', '    age: int'].join('\n'),
    csvMountPath: '/data/users.csv',
    fieldSequence: ['age'],
    visibleColumns: ['age'],
    maxVisualizedRows: 1,
    highlights: {
      age: {
        fieldName: 'age',
        startLine: 2,
        endLine: 2,
      },
    },
    pythonSource: 'print("demo")',
  },
  rawRows: [
    {
      age: 'not-an-int',
    },
  ],
  steps: [
    {
      rowIndex: 0,
      fieldName: 'age',
      passed: false,
      rawValue: 'not-an-int',
      validatedValue: null,
      message: 'Input should be a valid integer',
    },
  ],
  rowResults: [
    {
      rowIndex: 0,
      passed: false,
      validatedRow: null,
      errors: [
        'Input should be a valid integer, unable to parse string as an integer',
      ],
    },
  ],
  runResult: null,
  currentStepIndex: 0,
  detail: 'Animating each row and field through the Pydantic model...',
  error: null,
};

describe('ValidationVisualizerModal', () => {
  it('uses a wider desktop layout for the walkthrough columns', () => {
    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: baseState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('w-full max-w-[1800px]');
    expect(markup).toContain('xl:grid-cols-[1.15fr_1.35fr_0.9fr]');
  });

  it('wraps long validation result text inside the result card', () => {
    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: baseState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain(
      'max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-100',
    );
  });

  it('limits raw-input and row-result rendering to configured columns', () => {
    const stateWithExtraColumns: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        visibleColumns: ['age'],
      },
      rawRows: [
        {
          age: '19',
          hidden: 'should-not-render',
        },
      ],
      rowResults: [
        {
          rowIndex: 0,
          passed: true,
          validatedRow: {
            age: 19,
            hidden: 'still-hidden',
          },
          errors: [],
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'age',
          passed: true,
          rawValue: '19',
          validatedValue: 19,
          message: 'Accepted as int',
        },
      ],
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithExtraColumns,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Showing 1 / 2 columns');
    expect(markup).toContain('>age<');
    expect(markup).not.toContain('>hidden<');
    expect(markup).not.toContain('should-not-render');
    expect(markup).not.toContain('still-hidden');
  });

  it('shows only the configured number of raw CSV rows in the walkthrough panel', () => {
    const stateWithManyRows: ValidationVisualizerState = {
      ...baseState,
      request: {
        ...baseState.request!,
        maxVisualizedRows: 2,
      },
      rawRows: [
        {
          age: 'visible-row-1',
        },
        {
          age: 'visible-row-2',
        },
        {
          age: 'hidden-row-3',
        },
      ],
      steps: [],
      rowResults: [],
      currentStepIndex: -1,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithManyRows,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('visible-row-1');
    expect(markup).toContain('visible-row-2');
    expect(markup).not.toContain('hidden-row-3');
  });

  it('limits whole-file result cards to the configured row count and shows an ellipsis cue', () => {
    const stateWithManyResults: ValidationVisualizerState = {
      ...baseState,
      status: 'complete',
      request: {
        ...baseState.request!,
        maxVisualizedRows: 2,
      },
      rawRows: [
        {
          age: 'visible-result-1',
        },
        {
          age: 'visible-result-2',
        },
        {
          age: 'hidden-result-3',
        },
      ],
      steps: [],
      currentStepIndex: -1,
      rowResults: [
        {
          rowIndex: 0,
          passed: true,
          validatedRow: {
            age: 18,
          },
          errors: [],
        },
        {
          rowIndex: 1,
          passed: true,
          validatedRow: {
            age: 21,
          },
          errors: [],
        },
        {
          rowIndex: 2,
          passed: true,
          validatedRow: {
            age: 25,
          },
          errors: [],
        },
      ],
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: stateWithManyResults,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Showing 2 / 3 rows');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('Row 2');
    expect(markup).not.toContain('Row 3');
    expect(markup).toContain('... 1 more row');
    expect(markup).not.toContain('hidden-result-3');
  });

  it('shows the final run result in the popup when skip is chosen', () => {
    const directResult: ExerciseRunResult = {
      status: 'pass',
      stdout: 'valid_rows=2',
      stderr: '',
      checks: [
        {
          id: 'valid-rows',
          label: 'Validated rows',
          passed: true,
          message: 'All rows validated successfully.',
        },
      ],
    };
    const directState: ValidationVisualizerState = {
      ...baseState,
      mode: 'direct',
      status: 'complete',
      speed: null,
      request: null,
      rawRows: [
        {
          age: 'not-an-int',
        },
      ],
      steps: [],
      rowResults: [
        {
          rowIndex: 0,
          passed: false,
          validatedRow: null,
          errors: [
            'Input should be a valid integer, unable to parse string as an integer',
          ],
        },
      ],
      currentStepIndex: -1,
      detail: 'Direct run complete.',
      runResult: directResult,
    };

    const markup = renderToStaticMarkup(
      ValidationVisualizerModal({
        state: directState,
        onClose: () => {},
        onSkip: () => {},
        onStartPlayback: () => {},
      }),
    );

    expect(markup).toContain('Validation results across the full CSV');
    expect(markup).toContain('Row 1');
    expect(markup).toContain('invalid');
    expect(markup).toContain('Exercise result');
    expect(markup).toContain('All rows validated successfully.');
    expect(markup).not.toContain('Current field result');
    expect(markup).not.toContain('Pydantic Class');
  });
});
