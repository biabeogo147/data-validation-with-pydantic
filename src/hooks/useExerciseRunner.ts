import { useRef, useState } from 'react';

import { executeExercise } from '../lib/exercise-runner';
import { getRuntimeBasePath } from '../lib/github-pages';
import { runExerciseInPyodide, type PyodideStage } from '../lib/pyodide-client';
import type {
  ExerciseDefinition,
  ExercisePlaceholderValues,
  ExerciseRunResult,
} from '../types/exercise';

interface ExerciseRunnerState {
  phase: 'idle' | 'booting' | 'running' | 'pass' | 'fail' | 'error';
  detail: string;
  result: ExerciseRunResult | null;
}

const STAGE_MESSAGES: Record<PyodideStage, string> = {
  booting: 'Loading the Pyodide runtime in your browser...',
  'loading-packages': 'Loading Python packages for this exercise...',
  'mounting-fixtures': 'Mounting CSV fixtures into the virtual filesystem...',
  running: 'Running your Python script and checks...',
};

const RESULT_MESSAGES: Record<ExerciseRunResult['status'], string> = {
  pass: 'All checks passed.',
  fail: 'The code ran, but one or more checks failed.',
  error: 'Execution stopped because of a runtime error.',
};

const IDLE_STATE: ExerciseRunnerState = {
  phase: 'idle',
  detail: 'Run an exercise to see the validation output here.',
  result: null,
};

export function useExerciseRunner() {
  const [state, setState] = useState<ExerciseRunnerState>(IDLE_STATE);
  const activeRunIdRef = useRef(0);

  async function runExercise(
    exercise: ExerciseDefinition,
    values: ExercisePlaceholderValues,
  ) {
    const runId = activeRunIdRef.current + 1;
    activeRunIdRef.current = runId;

    setState({
      phase: 'booting',
      detail: STAGE_MESSAGES.booting,
      result: null,
    });

    const result = await executeExercise(
      exercise,
      values,
      (request) =>
        runExerciseInPyodide(request, (stage) => {
          if (activeRunIdRef.current !== runId) {
            return;
          }

          setState((currentState) => ({
            ...currentState,
            phase: stage === 'running' ? 'running' : 'booting',
            detail: STAGE_MESSAGES[stage],
          }));
        }),
      getRuntimeBasePath(),
    );

    if (activeRunIdRef.current !== runId) {
      return result;
    }

    setState({
      phase: result.status,
      detail: RESULT_MESSAGES[result.status],
      result,
    });

    return result;
  }

  return {
    state,
    runExercise,
    reset() {
      activeRunIdRef.current += 1;
      setState(IDLE_STATE);
    },
  };
}
