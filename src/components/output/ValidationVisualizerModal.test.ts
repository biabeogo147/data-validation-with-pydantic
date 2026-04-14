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
      'overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-100',
    );
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
