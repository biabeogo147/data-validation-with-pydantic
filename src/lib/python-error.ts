import type { AppLocale } from '../i18n/messages';
import {
  getPythonErrorMessages,
  type PythonErrorHintKey,
} from '../i18n/python-errors';

const ERROR_PREFIXES = ['Python execution failed:', 'PythonError:'];
const TRACEBACK_MARKER = 'Traceback (most recent call last):';
const EXCEPTION_PATTERN = /^([A-Za-z_][\w.]*(?:Error|Exception)?):\s*(.+)$/;
const VISUALIZER_MODEL_UNAVAILABLE_MARKER =
  '__PYDANTIC_VISUALIZER_MODEL_SCHEMA_UNAVAILABLE__';
const VISUALIZER_FIELDS_UNAVAILABLE_MARKER =
  '__PYDANTIC_VISUALIZER_FIELD_SCHEMAS_UNAVAILABLE__';
const VISUALIZER_MISSING_FIELD_MARKER =
  '__PYDANTIC_VISUALIZER_MISSING_FIELD__';
const VISUALIZER_FIELD_UNAVAILABLE_MARKER =
  '__PYDANTIC_VISUALIZER_FIELD_SCHEMA_UNAVAILABLE__';
const MISSING_REQUIRED_FIELD_PATTERN =
  /^["']?(?:Field '([^']+)' was not found on the visualization model\.|Your Pydantic class is missing the field "([^"]+)" required by this exercise\.)["']?$/;

const EXCEPTION_HINTS: Record<string, PythonErrorHintKey> = {
  AttributeError: 'imports',
  ImportError: 'importsAndModules',
  IndentationError: 'syntax',
  ModuleNotFoundError: 'importsAndModules',
  NameError: 'imports',
  PydanticSchemaGenerationError: 'schema',
  PydanticUserError: 'schema',
  SyntaxError: 'syntax',
  TabError: 'syntax',
  TypeError: 'schema',
  ValueError: 'schema',
};

function stripKnownPrefixes(message: string) {
  let normalized = message.trim();

  for (const prefix of ERROR_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
    }
  }

  return normalized;
}

function getTracebackSummaryLine(lines: string[]) {
  return [...lines]
    .reverse()
    .find((line) => EXCEPTION_PATTERN.test(line.trim()));
}

function getMarkedFieldName(detail: string, marker: string) {
  return detail.startsWith(`${marker}:`)
    ? detail.slice(marker.length + 1).trim()
    : null;
}

function normalizeInternalSchemaError(
  exceptionName: string,
  detail: string,
  locale: AppLocale,
) {
  const messages = getPythonErrorMessages(locale);
  const markedMissingField = getMarkedFieldName(
    detail,
    VISUALIZER_MISSING_FIELD_MARKER,
  );

  if (markedMissingField) {
    return [
      messages.schemaDefinition,
      `${messages.missingField(markedMissingField)} ${messages.addFieldAndRetry(markedMissingField)}`,
    ].join('\n');
  }

  const markedUnavailableField = getMarkedFieldName(
    detail,
    VISUALIZER_FIELD_UNAVAILABLE_MARKER,
  );

  if (markedUnavailableField) {
    return [
      messages.schemaDefinition,
      messages.walkthroughFieldUnavailable(markedUnavailableField),
    ].join('\n');
  }

  if (detail === VISUALIZER_MODEL_UNAVAILABLE_MARKER) {
    return [messages.schemaDefinition, messages.walkthroughModelUnavailable].join(
      '\n',
    );
  }

  if (detail === VISUALIZER_FIELDS_UNAVAILABLE_MARKER) {
    return [messages.schemaDefinition, messages.walkthroughFieldsUnavailable].join(
      '\n',
    );
  }

  const missingFieldMatch = detail.match(MISSING_REQUIRED_FIELD_PATTERN);
  const missingFieldName = missingFieldMatch?.[1] ?? missingFieldMatch?.[2];

  if (missingFieldName) {
    return [
      messages.schemaDefinition,
      `${messages.missingField(missingFieldName)} ${messages.addFieldAndRetry(missingFieldName)}`,
    ].join('\n');
  }

  if (
    exceptionName === 'RuntimeError' &&
    (
      detail === 'Could not prepare your Pydantic class for the validation walkthrough.' ||
      detail ===
        'Could not prepare the fields on your Pydantic class for the validation walkthrough.' ||
      /^The field "([^"]+)" on your Pydantic class could not be prepared for this exercise\.$/.test(
        detail,
      )
    )
  ) {
    if (
      detail ===
      'Could not prepare your Pydantic class for the validation walkthrough.'
    ) {
      return [messages.schemaDefinition, messages.walkthroughModelUnavailable].join(
        '\n',
      );
    }

    if (
      detail ===
      'Could not prepare the fields on your Pydantic class for the validation walkthrough.'
    ) {
      return [
        messages.schemaDefinition,
        messages.walkthroughFieldsUnavailable,
      ].join('\n');
    }

    const fieldUnavailableMatch = detail.match(
      /^The field "([^"]+)" on your Pydantic class could not be prepared for this exercise\.$/,
    );

    if (fieldUnavailableMatch?.[1]) {
      return [
        messages.schemaDefinition,
        messages.walkthroughFieldUnavailable(fieldUnavailableMatch[1]),
      ].join('\n');
    }
  }

  return null;
}

export function normalizePythonExecutionError(
  message: string,
  locale: AppLocale = 'en',
) {
  const normalized = stripKnownPrefixes(message);
  const messages = getPythonErrorMessages(locale);

  if (!normalized.includes(TRACEBACK_MARKER)) {
    return normalized;
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
  const summaryLine = getTracebackSummaryLine(lines);

  if (!summaryLine) {
    return normalized;
  }

  const summaryMatch = summaryLine.trim().match(EXCEPTION_PATTERN);

  if (!summaryMatch) {
    return normalized;
  }

  const [, exceptionName, detail] = summaryMatch;
  const internalSchemaMessage = normalizeInternalSchemaError(
    exceptionName,
    detail,
    locale,
  );

  if (internalSchemaMessage) {
    return internalSchemaMessage;
  }

  const hintKey = EXCEPTION_HINTS[exceptionName];
  const hint = hintKey ? messages.hints[hintKey] : null;

  return [
    messages.schemaDefinition,
    `${exceptionName}: ${detail}${hint ? ` ${hint}` : ''}`,
  ].join('\n');
}
