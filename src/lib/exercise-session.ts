import { getInitialPlaceholderValues } from './template';
import type { ExerciseDefinition, ExercisePlaceholderValues } from '../types/exercise';

export interface ExerciseSessionState {
  selectedExerciseId: string;
  draftsByExerciseId: Record<string, ExercisePlaceholderValues>;
  activePlaceholderByExerciseId: Record<string, string>;
  showSolutionByExerciseId: Record<string, boolean>;
}

function buildInitialDrafts(exercises: ExerciseDefinition[]) {
  return Object.fromEntries(
    exercises.map((exercise) => [exercise.id, getInitialPlaceholderValues(exercise)]),
  ) as Record<string, ExercisePlaceholderValues>;
}

function buildInitialPlaceholderSelection(exercises: ExerciseDefinition[]) {
  return Object.fromEntries(
    exercises.map((exercise) => [exercise.id, exercise.placeholders[0]?.id ?? '']),
  ) as Record<string, string>;
}

export function createInitialExerciseSessionState(
  exercises: ExerciseDefinition[],
  selectedExerciseId?: string,
): ExerciseSessionState {
  return {
    selectedExerciseId: selectedExerciseId ?? exercises[0]?.id ?? '',
    draftsByExerciseId: buildInitialDrafts(exercises),
    activePlaceholderByExerciseId: buildInitialPlaceholderSelection(exercises),
    showSolutionByExerciseId: {},
  };
}
