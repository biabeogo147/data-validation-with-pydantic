import { useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';

import { getFixtureMounts } from '../lib/exercise-runner';
import { getRuntimeBasePath } from '../lib/github-pages';
import { runExerciseInPyodide } from '../lib/pyodide-client';
import { useI18n } from '../i18n/I18nProvider';
import {
  buildVisualizationRequest,
  parseVisualizationStdout,
  type VisualizationRequest,
  type VisualizationRowResult,
  type VisualizationStep,
} from '../lib/validation-visualizer';
import {
  getInitialPlaybackStepIndex,
  getNextPlaybackStepIndex,
  getPlaybackAdvance,
  getPlaybackStepDetail,
  getPreviousPlaybackStepIndex,
} from '../lib/visualizer-playback';
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
  isPlaybackPaused: boolean;
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
  isPlaybackPaused: false,
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

const DEFAULT_PLAYBACK_SPEED: VisualizationPlaybackSpeed = '1x';

function uniquePackages(packages: string[]) {
  return Array.from(new Set(packages.filter(Boolean)));
}

async function executeVisualizationRequest(
  request: VisualizationRequest,
  exercise: ExerciseDefinition,
  locale: 'en' | 'vi',
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
        ...(exercise.runConfig?.pythonPackages ?? []),
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
    locale,
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
  const { locale } = useI18n();
  const [state, setState] = useState<ValidationVisualizerState>(INITIAL_STATE);
  const stateRef = useRef<ValidationVisualizerState>(INITIAL_STATE);
  const activeTokenRef = useRef(0);
  const playbackTimerRef = useRef<number | null>(null);
  const pendingExerciseRef = useRef<ExerciseDefinition | null>(null);
  const pendingValuesRef = useRef<ExercisePlaceholderValues | null>(null);

  const setVisualizerState: Dispatch<SetStateAction<ValidationVisualizerState>> = (
    update,
  ) => {
    const nextState =
      typeof update === 'function'
        ? (
            update as (
              currentState: ValidationVisualizerState,
            ) => ValidationVisualizerState
          )(stateRef.current)
        : update;

    stateRef.current = nextState;
    setState(nextState);
  };

  function clearPlaybackTimer() {
    if (typeof window === 'undefined' || playbackTimerRef.current === null) {
      return;
    }

    window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
  }

  function close() {
    clearPlaybackTimer();
    activeTokenRef.current += 1;
    pendingExerciseRef.current = null;
    pendingValuesRef.current = null;
    stateRef.current = INITIAL_STATE;
    setState(INITIAL_STATE);
  }

  async function finalizeRun(token: number) {
    const exercise = pendingExerciseRef.current;
    const values = pendingValuesRef.current;

    if (!exercise || !values || activeTokenRef.current !== token) {
      return;
    }

    setVisualizerState((currentState) => ({
      ...currentState,
      status: 'loading',
      isPlaybackPaused: false,
      detail: 'Running the full exercise checks after the walkthrough...',
    }));

    const result = await options.runExercise(exercise, values);

    if (activeTokenRef.current !== token) {
      return;
    }

    setVisualizerState((currentState) => ({
      ...currentState,
      status: 'complete',
      isPlaybackPaused: false,
      runResult: result,
      detail: 'Visualization complete. Final exercise result is ready.',
    }));
  }

  async function completeWalkthrough(token: number) {
    if (activeTokenRef.current !== token) {
      return;
    }

    clearPlaybackTimer();

    setVisualizerState((currentState) => ({
      ...currentState,
      status: 'loading',
      isPlaybackPaused: false,
      currentStepIndex:
        currentState.steps.length > 0 ? currentState.steps.length - 1 : -1,
      detail: 'Field walkthrough complete. Running final exercise checks...',
    }));

    await finalizeRun(token);
  }

  function schedulePlaybackTick(
    token: number,
    scheduledState: ValidationVisualizerState = stateRef.current,
  ) {
    clearPlaybackTimer();

    if (typeof window === 'undefined' || activeTokenRef.current !== token) {
      return;
    }

    const currentState = scheduledState;

    if (
      currentState.status !== 'playing' ||
      currentState.mode !== 'walkthrough' ||
      currentState.isPlaybackPaused ||
      !currentState.speed
    ) {
      return;
    }

    playbackTimerRef.current = window.setTimeout(() => {
      playbackTimerRef.current = null;

      if (activeTokenRef.current !== token) {
        return;
      }

      const latestState = stateRef.current;

      if (
        latestState.status !== 'playing' ||
        latestState.mode !== 'walkthrough' ||
        latestState.isPlaybackPaused
      ) {
        return;
      }

      const playbackAdvance = getPlaybackAdvance(
        latestState.currentStepIndex,
        latestState.steps.length,
      );

      if (playbackAdvance.kind === 'idle' || playbackAdvance.kind === 'finalize') {
        void completeWalkthrough(token);
        return;
      }

      setVisualizerState((currentPlaybackState) => ({
        ...currentPlaybackState,
        status: 'playing',
        currentStepIndex: playbackAdvance.stepIndex,
        detail: getPlaybackStepDetail(
          playbackAdvance.stepIndex,
          currentPlaybackState.steps.length,
        ),
      }));

      schedulePlaybackTick(token);
    }, PLAYBACK_DELAY_MS[currentState.speed]);
  }

  async function runDirect(
    token: number,
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) {
    let request: VisualizationRequest | null = null;
    clearPlaybackTimer();

    setVisualizerState({
      isOpen: true,
      status: 'loading',
      mode: 'direct',
      exerciseId: exercise.id,
      speed: null,
      isPlaybackPaused: false,
      request,
      rawRows: [],
      steps: [],
      rowResults: [],
      runResult: null,
      currentStepIndex: -1,
      detail: 'Running the exercise directly without the walkthrough...',
      error: null,
    });

    try {
      request = exercise.visualizationConfig
        ? buildVisualizationRequest(exercise, values)
        : null;

      if (request) {
        setVisualizerState((currentState) => ({
          ...currentState,
          request,
        }));

        const parsed = await executeVisualizationRequest(
          request,
          exercise,
          locale,
          token,
          activeTokenRef,
          setVisualizerState,
          'Preparing the full CSV results without the walkthrough...',
        );

        if (parsed && activeTokenRef.current === token) {
          setVisualizerState((currentState) => ({
            ...currentState,
            request,
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
      setVisualizerState((currentState) => ({
        ...currentState,
        error: message,
        detail: 'Could not prepare the whole-file CSV preview. Running final checks anyway...',
      }));
    }

    const result = await options.runExercise(exercise, values);

    if (activeTokenRef.current !== token) {
      return;
    }

    setVisualizerState((currentState) => ({
      ...currentState,
      status: 'complete',
      isPlaybackPaused: false,
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

    clearPlaybackTimer();

    setVisualizerState({
      isOpen: true,
      status: 'choice',
      mode: 'choice',
      exerciseId: exercise.id,
      speed: null,
      isPlaybackPaused: false,
      request: null,
      rawRows: [],
      steps: [],
      rowResults: [],
      runResult: null,
      currentStepIndex: -1,
      detail: 'Choose whether to visualize the walkthrough or skip it.',
      error: null,
    });
  }

  async function visualize() {
    await startPlayback(DEFAULT_PLAYBACK_SPEED);
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
    clearPlaybackTimer();

    try {
      request = buildVisualizationRequest(exercise, values);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setVisualizerState((currentState) => ({
        ...currentState,
        status: 'error',
        isPlaybackPaused: false,
        error: message,
        detail: 'The visualizer could not be prepared for this exercise.',
      }));
      return;
    }

    setVisualizerState((currentState) => ({
      ...currentState,
      status: 'loading',
      mode: 'walkthrough',
      speed,
      isPlaybackPaused: false,
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
        locale,
        token,
        activeTokenRef,
        setVisualizerState,
        'Preparing the Python runtime for the walkthrough...',
      );

      if (!parsed || activeTokenRef.current !== token) {
        return;
      }

      const initialStepIndex = getInitialPlaybackStepIndex(parsed.steps.length);

      const playbackState: ValidationVisualizerState = {
        ...stateRef.current,
        isOpen: true,
        status: parsed.steps.length > 0 ? 'playing' : 'loading',
        mode: 'walkthrough',
        exerciseId: exercise.id,
        speed,
        isPlaybackPaused: false,
        request,
        rawRows: parsed.rawRows,
        steps: parsed.steps,
        rowResults: parsed.rowResults,
        runResult: null,
        currentStepIndex: initialStepIndex,
        detail:
          parsed.steps.length > 0
            ? getPlaybackStepDetail(initialStepIndex, parsed.steps.length)
            : 'No visualization steps were returned. Running final exercise checks...',
        error: null,
      };

      setVisualizerState(playbackState);

      if (parsed.steps.length > 0) {
        schedulePlaybackTick(token, playbackState);
      } else {
        await finalizeRun(token);
      }
    } catch (error) {
      if (activeTokenRef.current !== token) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      setVisualizerState((currentState) => ({
        ...currentState,
        status: 'error',
        isPlaybackPaused: false,
        error: message,
        detail: 'The visualization failed before the run could finish.',
      }));
    }
  }

  function togglePausePlayback() {
    const currentState = stateRef.current;

    if (
      currentState.status !== 'playing' ||
      currentState.mode !== 'walkthrough' ||
      currentState.steps.length === 0
    ) {
      return;
    }

    if (currentState.isPlaybackPaused) {
      const resumedState: ValidationVisualizerState = {
        ...currentState,
        isPlaybackPaused: false,
        detail: getPlaybackStepDetail(
          currentState.currentStepIndex,
          currentState.steps.length,
        ),
      };

      setVisualizerState(resumedState);
      schedulePlaybackTick(activeTokenRef.current, resumedState);
      return;
    }

    clearPlaybackTimer();
    setVisualizerState((playbackState) => ({
      ...playbackState,
      isPlaybackPaused: true,
      detail: 'Walkthrough paused. Use Previous or Next to inspect each step.',
    }));
  }

  function previousStep() {
    const currentState = stateRef.current;

    if (
      currentState.status !== 'playing' ||
      currentState.mode !== 'walkthrough' ||
      currentState.steps.length === 0
    ) {
      return;
    }

    clearPlaybackTimer();
    setVisualizerState((playbackState) => {
      const previousStepIndex = getPreviousPlaybackStepIndex(
        playbackState.currentStepIndex,
        playbackState.steps.length,
      );

      return {
        ...playbackState,
        isPlaybackPaused: true,
        currentStepIndex: previousStepIndex,
        detail: getPlaybackStepDetail(
          previousStepIndex,
          playbackState.steps.length,
        ),
      };
    });
  }

  function nextStep() {
    const currentState = stateRef.current;

    if (
      currentState.status !== 'playing' ||
      currentState.mode !== 'walkthrough' ||
      currentState.steps.length === 0
    ) {
      return;
    }

    clearPlaybackTimer();
    setVisualizerState((playbackState) => {
      const nextStepIndex = getNextPlaybackStepIndex(
        playbackState.currentStepIndex,
        playbackState.steps.length,
      );

      return {
        ...playbackState,
        isPlaybackPaused: true,
        currentStepIndex: nextStepIndex,
        detail: getPlaybackStepDetail(
          nextStepIndex,
          playbackState.steps.length,
        ),
      };
    });
  }

  function setPlaybackSpeed(speed: VisualizationPlaybackSpeed) {
    const currentState = stateRef.current;

    if (
      currentState.mode !== 'walkthrough' ||
      currentState.status !== 'playing' ||
      currentState.steps.length === 0 ||
      currentState.speed === speed
    ) {
      return;
    }

    const updatedState: ValidationVisualizerState = {
      ...currentState,
      speed,
    };

    setVisualizerState(updatedState);

    if (!updatedState.isPlaybackPaused) {
      schedulePlaybackTick(activeTokenRef.current, updatedState);
    }
  }

  return {
    state,
    close,
    open,
    visualize,
    skip,
    startPlayback,
    setPlaybackSpeed,
    togglePausePlayback,
    previousStep,
    nextStep,
  };
}
