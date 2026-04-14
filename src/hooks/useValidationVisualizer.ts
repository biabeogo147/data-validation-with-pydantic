import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import { getFixtureMounts } from '../lib/exercise-runner';
import { getRuntimeBasePath } from '../lib/github-pages';
import { runExerciseInPyodide } from '../lib/pyodide-client';
import {
  buildVisualizationRequest,
  parseVisualizationStdout,
  type VisualizationRequest,
  type VisualizationRowResult,
  type VisualizationStep,
} from '../lib/validation-visualizer';
import type {
  ExerciseDefinition,
  ExercisePlaceholderValues,
  ExerciseRunResult,
} from '../types/exercise';

export type VisualizationPlaybackSpeed = '1x' | '2x' | '4x';
export type ValidationVisualizerMode = 'choice' | 'walkthrough' | 'direct';

export interface ValidationVisualizerState {
  isOpen: boolean;
  status: 'closed' | 'choice' | 'loading' | 'playing' | 'complete' | 'error';
  mode: ValidationVisualizerMode;
  exerciseId: string | null;
  speed: VisualizationPlaybackSpeed | null;
  request: VisualizationRequest | null;
  rawRows: Record<string, string>[];
  steps: VisualizationStep[];
  rowResults: VisualizationRowResult[];
  runResult: ExerciseRunResult | null;
  currentStepIndex: number;
  detail: string;
  error: string | null;
}

const INITIAL_STATE: ValidationVisualizerState = {
  isOpen: false,
  status: 'closed',
  mode: 'choice',
  exerciseId: null,
  speed: null,
  request: null,
  rawRows: [],
  steps: [],
  rowResults: [],
  runResult: null,
  currentStepIndex: -1,
  detail: '',
  error: null,
};

const PLAYBACK_DELAY_MS: Record<VisualizationPlaybackSpeed, number> = {
  '1x': 1000,
  '2x': 500,
  '4x': 250,
};

function sleep(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function uniquePackages(packages: string[]) {
  return Array.from(new Set(packages.filter(Boolean)));
}

async function executeVisualizationRequest(
  request: VisualizationRequest,
  exercise: ExerciseDefinition,
  token: number,
  activeTokenRef: RefObject<number>,
  setState: Dispatch<SetStateAction<ValidationVisualizerState>>,
  loadingDetail: string,
) {
  const execution = await runExerciseInPyodide(
    {
      code: request.pythonSource,
      packages: uniquePackages([
        'pydantic',
        ...(exercise.runConfig.pythonPackages ?? []),
      ]),
      fixtures: getFixtureMounts(exercise, getRuntimeBasePath()),
    },
    () => {
      if (activeTokenRef.current !== token) {
        return;
      }

      setState((currentState) => ({
        ...currentState,
        detail: loadingDetail,
      }));
    },
  );

  if (activeTokenRef.current !== token) {
    return null;
  }

  return parseVisualizationStdout(execution.stdout);
}

export function useValidationVisualizer(options: {
  runExercise: (
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) => Promise<ExerciseRunResult>;
}) {
  const [state, setState] = useState<ValidationVisualizerState>(INITIAL_STATE);
  const activeTokenRef = useRef(0);
  const pendingExerciseRef = useRef<ExerciseDefinition | null>(null);
  const pendingValuesRef = useRef<ExercisePlaceholderValues | null>(null);

  function close() {
    activeTokenRef.current += 1;
    pendingExerciseRef.current = null;
    pendingValuesRef.current = null;
    setState(INITIAL_STATE);
  }

  async function finalizeRun(token: number) {
    const exercise = pendingExerciseRef.current;
    const values = pendingValuesRef.current;

    if (!exercise || !values || activeTokenRef.current !== token) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'loading',
      detail: 'Running the full exercise checks after the walkthrough...',
    }));

    const result = await options.runExercise(exercise, values);

    if (activeTokenRef.current !== token) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'complete',
      runResult: result,
      detail: 'Visualization complete. Final exercise result is ready.',
    }));
  }

  async function runDirect(
    token: number,
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) {
    setState({
      isOpen: true,
      status: 'loading',
      mode: 'direct',
      exerciseId: exercise.id,
      speed: null,
      request: null,
      rawRows: [],
      steps: [],
      rowResults: [],
      runResult: null,
      currentStepIndex: -1,
      detail: 'Running the exercise directly without the walkthrough...',
      error: null,
    });

    try {
      const request = exercise.visualizationConfig
        ? buildVisualizationRequest(exercise, values)
        : null;

      if (request) {
        const parsed = await executeVisualizationRequest(
          request,
          exercise,
          token,
          activeTokenRef,
          setState,
          'Preparing the full CSV results without the walkthrough...',
        );

        if (parsed && activeTokenRef.current === token) {
          setState((currentState) => ({
            ...currentState,
            rawRows: parsed.rawRows,
            rowResults: parsed.rowResults,
            detail: 'Whole-file CSV results are ready. Running final exercise checks...',
          }));
        }
      }
    } catch (error) {
      if (activeTokenRef.current !== token) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      setState((currentState) => ({
        ...currentState,
        error: message,
        detail: 'Could not prepare the whole-file CSV preview. Running final checks anyway...',
      }));
    }

    const result = await options.runExercise(exercise, values);

    if (activeTokenRef.current !== token) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'complete',
      runResult: result,
      detail: 'Direct run complete. Final CSV result is ready.',
    }));
  }

  async function open(
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) {
    const token = activeTokenRef.current + 1;
    activeTokenRef.current = token;
    pendingExerciseRef.current = exercise;
    pendingValuesRef.current = values;

    if (!exercise.visualizationConfig) {
      await runDirect(token, exercise, values);
      return;
    }

    setState({
      isOpen: true,
      status: 'choice',
      mode: 'choice',
      exerciseId: exercise.id,
      speed: null,
      request: null,
      rawRows: [],
      steps: [],
      rowResults: [],
      runResult: null,
      currentStepIndex: -1,
      detail: 'Choose a playback speed or skip the visual walkthrough.',
      error: null,
    });
  }

  async function skip() {
    const exercise = pendingExerciseRef.current;
    const values = pendingValuesRef.current;

    if (!exercise || !values) {
      return;
    }

    await runDirect(activeTokenRef.current, exercise, values);
  }

  async function startPlayback(speed: VisualizationPlaybackSpeed) {
    const exercise = pendingExerciseRef.current;
    const values = pendingValuesRef.current;

    if (!exercise || !values) {
      return;
    }

    const token = activeTokenRef.current;
    let request: VisualizationRequest;

    try {
      request = buildVisualizationRequest(exercise, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((currentState) => ({
        ...currentState,
        status: 'error',
        error: message,
        detail: 'The visualizer could not be prepared for this exercise.',
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'loading',
      mode: 'walkthrough',
      speed,
      request,
      rawRows: [],
      steps: [],
      rowResults: [],
      runResult: null,
      currentStepIndex: -1,
      error: null,
      detail: 'Preparing the field-by-field visualization...',
    }));

    try {
      const parsed = await executeVisualizationRequest(
        request,
        exercise,
        token,
        activeTokenRef,
        setState,
        'Preparing the Python runtime for the walkthrough...',
      );

      if (!parsed || activeTokenRef.current !== token) {
        return;
      }

      setState((currentState) => ({
        ...currentState,
        status: 'playing',
        mode: 'walkthrough',
        request,
        rawRows: parsed.rawRows,
        steps: parsed.steps,
        rowResults: parsed.rowResults,
        runResult: null,
        currentStepIndex: -1,
        detail:
          parsed.steps.length > 0
            ? 'Animating each row and field through the Pydantic model...'
            : 'No visualization steps were returned.',
      }));

      for (let index = 0; index < parsed.steps.length; index += 1) {
        if (activeTokenRef.current !== token) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          status: 'playing',
          currentStepIndex: index,
          detail: `Validating step ${index + 1} of ${parsed.steps.length} across the CSV file...`,
        }));

        await sleep(PLAYBACK_DELAY_MS[speed]);
      }

      if (activeTokenRef.current !== token) {
        return;
      }

      setState((currentState) => ({
        ...currentState,
        status: 'loading',
        currentStepIndex:
          parsed.steps.length > 0 ? parsed.steps.length - 1 : -1,
        detail: 'Field walkthrough complete. Running final exercise checks...',
      }));

      await finalizeRun(token);
    } catch (error) {
      if (activeTokenRef.current !== token) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      setState((currentState) => ({
        ...currentState,
        status: 'error',
        error: message,
        detail: 'The visualization failed before the run could finish.',
      }));
    }
  }

  return {
    state,
    close,
    open,
    skip,
    startPlayback,
  };
}
