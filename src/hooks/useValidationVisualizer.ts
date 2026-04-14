import { useRef, useState } from 'react';

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
import type { ExerciseDefinition, ExercisePlaceholderValues } from '../types/exercise';

export type VisualizationPlaybackSpeed = '1x' | '2x' | '4x';

export interface ValidationVisualizerState {
  isOpen: boolean;
  status: 'closed' | 'choice' | 'loading' | 'playing' | 'complete' | 'error';
  exerciseId: string | null;
  speed: VisualizationPlaybackSpeed | null;
  request: VisualizationRequest | null;
  rawRows: Record<string, string>[];
  steps: VisualizationStep[];
  rowResults: VisualizationRowResult[];
  currentStepIndex: number;
  detail: string;
  error: string | null;
}

const INITIAL_STATE: ValidationVisualizerState = {
  isOpen: false,
  status: 'closed',
  exerciseId: null,
  speed: null,
  request: null,
  rawRows: [],
  steps: [],
  rowResults: [],
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

export function useValidationVisualizer(options: {
  runExercise: (
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) => Promise<unknown>;
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
      detail: 'Running the full exercise checks after the walkthrough...',
    }));

    await options.runExercise(exercise, values);

    if (activeTokenRef.current !== token) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      status: 'complete',
      detail: 'Visualization complete. The main run result has been updated.',
    }));
  }

  async function open(
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) {
    if (!exercise.visualizationConfig) {
      await options.runExercise(exercise, values);
      return;
    }

    const token = activeTokenRef.current + 1;
    activeTokenRef.current = token;
    pendingExerciseRef.current = exercise;
    pendingValuesRef.current = values;

    setState({
      isOpen: true,
      status: 'choice',
      exerciseId: exercise.id,
      speed: null,
      request: null,
      rawRows: [],
      steps: [],
      rowResults: [],
      currentStepIndex: -1,
      detail: 'Choose a playback speed or skip the visual walkthrough.',
      error: null,
    });
  }

  async function skip() {
    const exercise = pendingExerciseRef.current;
    const values = pendingValuesRef.current;

    close();

    if (!exercise || !values) {
      return;
    }

    await options.runExercise(exercise, values);
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
      speed,
      request,
      rawRows: [],
      steps: [],
      rowResults: [],
      currentStepIndex: -1,
      error: null,
      detail: 'Preparing the field-by-field visualization...',
    }));

    try {
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
            detail: 'Preparing the Python runtime for the walkthrough...',
          }));
        },
      );

      if (activeTokenRef.current !== token) {
        return;
      }

      const parsed = parseVisualizationStdout(execution.stdout);

      setState((currentState) => ({
        ...currentState,
        status: 'playing',
        request,
        rawRows: parsed.rawRows,
        steps: parsed.steps,
        rowResults: parsed.rowResults,
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
        status: 'complete',
        currentStepIndex:
          parsed.steps.length > 0 ? parsed.steps.length - 1 : -1,
        detail: 'Field walkthrough complete.',
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
