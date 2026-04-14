import { visibleExerciseCatalog } from '../data/exercises';

export function useExercises() {
  return {
    exercises: visibleExerciseCatalog,
  };
}
