// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useValidationVisualizer } from './useValidationVisualizer';
import { I18nProvider } from '../i18n/I18nProvider';
import type { ExerciseDefinition, ExerciseRunResult } from '../types/exercise';

const buildVisualizationRequestMock = vi.fn();
const parseVisualizationStdoutMock = vi.fn();
const runExerciseInPyodideMock = vi.fn();
const getFixtureMountsMock = vi.fn();

vi.mock('../lib/validation-visualizer', () => ({
  buildVisualizationRequest: (...args: unknown[]) =>
    buildVisualizationRequestMock(...args),
  parseVisualizationStdout: (...args: unknown[]) =>
    parseVisualizationStdoutMock(...args),
}));

vi.mock('../lib/pyodide-client', () => ({
  runExerciseInPyodide: (...args: unknown[]) => runExerciseInPyodideMock(...args),
}));

vi.mock('../lib/exercise-runner', () => ({
  getFixtureMounts: (...args: unknown[]) => getFixtureMountsMock(...args),
}));

vi.mock('../lib/github-pages', () => ({
  getRuntimeBasePath: () => '/',
}));

const exercise: ExerciseDefinition = {
  id: 'visualize-base-model',
  title: 'Visualize model validation',
  description: 'Shows field-by-field validation.',
  templateCode: '{{MODEL_A}}',
  placeholders: [
    {
      id: 'MODEL_A',
      defaultCode: 'class A(BaseModel):\n    age: int',
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [],
  fileCsvConfig: {
    files: [
      {
        id: 'people',
        fileCsvPath: 'fixtures/people.csv',
      },
    ],
  },
  visualizationConfig: {
    modelClassName: 'A',
    modelPlaceholderId: 'MODEL_A',
    csvFileId: 'people',
    fieldOrder: ['age', 'rating_count'],
    maxVisibleColumns: 2,
    maxVisualizedRows: 1,
  },
};

const visualizationRequest = {
  modelClassName: 'A',
  modelCode: 'class A(BaseModel):\n    age: int\n    rating_count: int',
  csvMountPath: '/data/people.csv',
  fieldSequence: ['age', 'rating_count'],
  maxVisibleColumns: 2,
  maxVisualizedRows: 1,
  highlights: {
    age: {
      fieldName: 'age',
      startLine: 2,
      endLine: 2,
    },
    rating_count: {
      fieldName: 'rating_count',
      startLine: 3,
      endLine: 3,
    },
  },
  pythonSource: 'print("demo")',
};

const parsedVisualization = {
  rawRows: [
    {
      age: '19',
      rating_count: '1,234',
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
    {
      rowIndex: 0,
      fieldName: 'rating_count',
      passed: true,
      rawValue: '1,234',
      validatedValue: 1234,
      message: 'Accepted as int',
    },
  ],
  rowResults: [
    {
      rowIndex: 0,
      passed: true,
      validatedRow: {
        age: 19,
        rating_count: 1234,
      },
      errors: [],
    },
  ],
};

const finalRunResult: ExerciseRunResult = {
  status: 'pass',
  stdout: 'ok',
  stderr: '',
  checks: [],
};

let latestVisualizer: ReturnType<typeof useValidationVisualizer> | null = null;
const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function HookHarness({
  runExercise,
}: {
  runExercise: (
    exercise: ExerciseDefinition,
    values: Record<string, string>,
  ) => Promise<ExerciseRunResult>;
}) {
  latestVisualizer = useValidationVisualizer({
    runExercise,
  });

  return null;
}

describe('useValidationVisualizer', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;
  const runExerciseMock = vi.fn<
    (
      exercise: ExerciseDefinition,
      values: Record<string, string>,
    ) => Promise<ExerciseRunResult>
  >();

  beforeEach(async () => {
    vi.useFakeTimers();
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    latestVisualizer = null;

    buildVisualizationRequestMock.mockReset();
    parseVisualizationStdoutMock.mockReset();
    runExerciseInPyodideMock.mockReset();
    getFixtureMountsMock.mockReset();
    runExerciseMock.mockReset();

    buildVisualizationRequestMock.mockReturnValue(visualizationRequest);
    parseVisualizationStdoutMock.mockReturnValue(parsedVisualization);
    runExerciseInPyodideMock.mockResolvedValue({
      stdout: '__PYDANTIC_VISUALIZER_ROWS__[]',
      stderr: '',
    });
    getFixtureMountsMock.mockReturnValue([]);
    runExerciseMock.mockResolvedValue(finalRunResult);

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        createElement(
          I18nProvider,
          { initialLocale: 'vi' },
          createElement(HookHarness, {
            runExercise: runExerciseMock,
          }),
        ),
      );
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });

    container.remove();
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = false;
    vi.useRealTimers();
  });

  it('auto-advances the walkthrough after visualize starts without requiring manual next clicks', async () => {
    expect(latestVisualizer).not.toBeNull();

    await act(async () => {
      await latestVisualizer!.open(exercise, {
        MODEL_A: 'class A(BaseModel):\n    age: int\n    rating_count: int',
      });
    });

    expect(latestVisualizer!.state.status).toBe('choice');

    await act(async () => {
      await latestVisualizer!.startPlayback('1x');
    });

    expect(runExerciseInPyodideMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Function),
      'vi',
    );

    expect(latestVisualizer!.state.status).toBe('playing');
    expect(latestVisualizer!.state.currentStepIndex).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(latestVisualizer!.state.currentStepIndex).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.resolve();
    });

    expect(runExerciseMock).toHaveBeenCalledTimes(1);
    expect(latestVisualizer!.state.status).toBe('complete');
  });
});
