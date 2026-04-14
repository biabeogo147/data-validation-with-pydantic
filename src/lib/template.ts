import type {
  ExerciseDefinition,
  ExercisePlaceholderValues,
} from '../types/exercise';

const PLACEHOLDER_PATTERN = /{{\s*([A-Z0-9_]+)\s*}}/g;

function getTemplateTokenIds(templateCode: string): string[] {
  return Array.from(templateCode.matchAll(PLACEHOLDER_PATTERN), (match) => match[1]);
}

function getPlaceholderLabel(id: string): string {
  return `Placeholder "${id}"`;
}

export function getInitialPlaceholderValues(
  exercise: Pick<ExerciseDefinition, 'placeholders'>,
): ExercisePlaceholderValues {
  return Object.fromEntries(
    exercise.placeholders.map((placeholder) => [
      placeholder.id,
      placeholder.defaultCode,
    ]),
  );
}

export function assembleExerciseCode(
  exercise: Pick<ExerciseDefinition, 'templateCode' | 'placeholders'>,
  values: ExercisePlaceholderValues,
): string {
  const starterValues = getInitialPlaceholderValues(exercise);
  const mergedValues = {
    ...starterValues,
    ...values,
  };
  const templateTokenIds = new Set(getTemplateTokenIds(exercise.templateCode));

  for (const placeholder of exercise.placeholders) {
    if (!templateTokenIds.has(placeholder.id)) {
      continue;
    }

    const placeholderValue = mergedValues[placeholder.id];
    const isRequired = placeholder.required ?? true;

    if (isRequired && !placeholderValue?.trim()) {
      throw new Error(`${getPlaceholderLabel(placeholder.id)} is required.`);
    }
  }

  return exercise.templateCode.replace(PLACEHOLDER_PATTERN, (_match, rawId) => {
    const placeholderId = rawId.trim();
    const placeholderValue = mergedValues[placeholderId];

    if (!placeholderValue?.trim()) {
      throw new Error(`${getPlaceholderLabel(placeholderId)} is required.`);
    }

    return placeholderValue;
  });
}
