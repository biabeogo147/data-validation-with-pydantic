import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ValidationVisualizerModal } from './ValidationVisualizerModal';
import type { ValidationVisualizerState } from '../../hooks/useValidationVisualizer';

const baseState: ValidationVisualizerState = {
  isOpen: true,
  status: 'playing',
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
});
