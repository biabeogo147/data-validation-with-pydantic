import type { ExerciseDefinition } from '../../types/exercise';
import { baseModelExercise } from './base-model';
import { fieldConstraintExercise } from './field-constraint';
import { fieldValidatorExercise } from './field-validator';
import { fullAmazonSchemaExercise } from './full-amazon-schema';
import { modelValidatorExercise } from './model-validator';

export const exerciseCatalog: ExerciseDefinition[] = [
  baseModelExercise,
  fieldConstraintExercise,
  fieldValidatorExercise,
  modelValidatorExercise,
  fullAmazonSchemaExercise,
];
