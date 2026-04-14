import { baseModelExercise } from './base-model';
import { csvImportExercise } from './csv-import';
import { strictProfileExercise } from './strict-profile';

export const exerciseCatalog = [
  baseModelExercise,
  strictProfileExercise,
  csvImportExercise,
];

export const visibleExerciseCatalog = exerciseCatalog.filter(
  (exercise) => exercise.visible !== false,
);
