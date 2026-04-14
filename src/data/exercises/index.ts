import type { ExerciseDefinition } from '../../types/exercise';
import { baseModelExercise } from './base-model';
import { csvImportExercise } from './csv-import';
import { strictProfileExercise } from './strict-profile';

export const exerciseCatalog: ExerciseDefinition[] = [
  baseModelExercise,
  strictProfileExercise,
  csvImportExercise,
];
