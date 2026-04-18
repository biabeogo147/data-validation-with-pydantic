import {
  getVisibleRowResults,
  type ModelFieldHighlight,
} from '../../lib/validation-visualizer';
import { getPlaybackControlsState } from '../../lib/visualizer-playback';
import type {
  ValidationVisualizerState,
  VisualizationPlaybackSpeed,
} from '../../hooks/useValidationVisualizer';
import { useI18n } from '../../i18n/I18nProvider';
import type { AppMessages } from '../../i18n/messages';
import type { ExerciseRunResult } from '../../types/exercise';

interface ValidationVisualizerModalProps {
  state: ValidationVisualizerState;
  onClose: () => void;
  onSkip: () => void;
  onVisualize: () => void;
  onPauseToggle: () => void;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onStartPlayback: (speed: VisualizationPlaybackSpeed) => void;
}

interface CodeSnippetLine {
  type: 'line';
  lineNumber: number;
  content: string;
}

interface CodeSnippetGap {
  type: 'gap';
  key: string;
}

function formatValue(value: unknown) {
  const clippedValue = clipValue(value);

  if (typeof value === 'string') {
    return JSON.stringify(clippedValue);
  }

  return JSON.stringify(clippedValue, null, 2) ?? 'null';
}

const valuePreClassName =
  'mt-2 max-h-64 min-w-0 overflow-auto whitespace-pre-wrap break-all text-sm leading-6 text-slate-100';

const MAX_PREVIEW_STRING_LENGTH = 120;
const MAX_CURRENT_ROW_STRING_LENGTH = 84;
const MAX_FULL_MODEL_CODE_LINES = 10;

function formatCurrentRowValue(value: unknown) {
  const clippedValue = clipValue(value, MAX_CURRENT_ROW_STRING_LENGTH);

  if (typeof value === 'string') {
    return JSON.stringify(clippedValue);
  }

  return JSON.stringify(clippedValue, null, 2) ?? 'null';
}

function clipValue(
  value: unknown,
  maxStringLength: number = MAX_PREVIEW_STRING_LENGTH,
): unknown {
  if (typeof value === 'string') {
    return value.length > maxStringLength
      ? `${value.slice(0, maxStringLength - 3)}...`
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => clipValue(item, maxStringLength));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        clipValue(item, maxStringLength),
      ]),
    );
  }

  return value;
}

function filterRecordColumns(
  record: Record<string, unknown> | null | undefined,
  columns: string[],
) {
  if (!record) {
    return null;
  }

  if (columns.length === 0) {
    return record;
  }

  return Object.fromEntries(
    columns
      .filter((column) => column in record)
      .map((column) => [column, record[column]]),
  );
}

function getOrderedValidatedColumns(
  rawRows: Record<string, string>[],
  request: ValidationVisualizerState['request'],
) {
  const availableColumns = rawRows[0]
    ? Object.keys(rawRows[0])
    : request?.fieldSequence ?? [];
  const configuredColumns =
    request?.fieldSequence && request.fieldSequence.length > 0
      ? request.fieldSequence
      : availableColumns;
  const visibleColumns = Array.from(new Set(configuredColumns.filter(Boolean))).filter(
    (column) => availableColumns.length === 0 || availableColumns.includes(column),
  );

  return {
    visibleColumns: visibleColumns.length > 0 ? visibleColumns : availableColumns,
    totalColumns:
      configuredColumns.length > 0
        ? configuredColumns.length
        : visibleColumns.length > 0
          ? visibleColumns.length
          : availableColumns.length,
  };
}

function getDisplayColumns(
  rawRows: Record<string, string>[],
  request: ValidationVisualizerState['request'],
) {
  return getOrderedValidatedColumns(rawRows, request);
}

function getCurrentRowDisplayColumns(
  rawRows: Record<string, string>[],
  request: ValidationVisualizerState['request'],
  currentStep: ValidationVisualizerState['steps'][number] | null,
) {
  const { visibleColumns: orderedColumns, totalColumns } = getOrderedValidatedColumns(
    rawRows,
    request,
  );

  if (!request || request.maxVisibleColumns === null) {
    return {
      visibleColumns: orderedColumns,
      totalColumns,
    };
  }

  const maxVisibleColumns = Math.max(1, request.maxVisibleColumns);

  if (orderedColumns.length <= maxVisibleColumns) {
    return {
      visibleColumns: orderedColumns,
      totalColumns,
    };
  }

  const activeFieldIndex = currentStep
    ? Math.max(orderedColumns.indexOf(currentStep.fieldName), 0)
    : 0;
  const startIndex = currentStep
    ? Math.max(0, activeFieldIndex - maxVisibleColumns + 1)
    : 0;
  const endIndex = Math.min(orderedColumns.length, startIndex + maxVisibleColumns);

  return {
    visibleColumns: orderedColumns.slice(startIndex, endIndex),
    totalColumns,
  };
}

function getRunStatusBadgeClasses(status: 'running' | ExerciseRunResult['status']) {
  switch (status) {
    case 'pass':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
    case 'fail':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-200';
    case 'error':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-200';
    case 'running':
      return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100';
  }
}

function getRunStatusLabel(
  status: 'running' | ExerciseRunResult['status'],
  messages: AppMessages,
) {
  switch (status) {
    case 'pass':
      return messages.common.pass;
    case 'fail':
      return messages.common.fail;
    case 'error':
      return messages.visualizer.error;
    case 'running':
      return messages.common.running;
  }
}

function getHighlightRanges(
  highlight: ModelFieldHighlight | null | undefined,
) {
  if (!highlight) {
    return [];
  }

  if ('ranges' in highlight && Array.isArray(highlight.ranges) && highlight.ranges.length) {
    return highlight.ranges;
  }

  return [
    {
      startLine: highlight.startLine,
      endLine: highlight.endLine,
    },
  ];
}

function buildCodeSnippet(
  codeLines: string[],
  highlight: ModelFieldHighlight | null | undefined,
): Array<CodeSnippetLine | CodeSnippetGap> {
  if (codeLines.length <= MAX_FULL_MODEL_CODE_LINES) {
    return codeLines.map((content, index) => ({
      type: 'line',
      lineNumber: index + 1,
      content,
    }));
  }

  const ranges = getHighlightRanges(highlight);

  if (ranges.length === 0) {
    return codeLines.map((content, index) => ({
      type: 'line',
      lineNumber: index + 1,
      content,
    }));
  }

  const snippet: Array<CodeSnippetLine | CodeSnippetGap> = [];

  ranges.forEach((range, rangeIndex) => {
    if (rangeIndex > 0) {
      snippet.push({
        type: 'gap',
        key: `gap-${range.startLine}-${range.endLine}`,
      });
    }

    for (let lineNumber = range.startLine; lineNumber <= range.endLine; lineNumber += 1) {
      snippet.push({
        type: 'line',
        lineNumber,
        content: codeLines[lineNumber - 1] ?? '',
      });
    }
  });

  return snippet;
}

function getFocusedWalkthroughRow({
  rawRows,
  currentStep,
}: {
  rawRows: Record<string, string>[];
  currentStep: ValidationVisualizerState['steps'][number] | null;
}) {
  if (rawRows.length === 0) {
    return null;
  }

  const rowIndex = currentStep
    ? Math.min(currentStep.rowIndex, rawRows.length - 1)
    : 0;

  return {
    rowIndex,
    row: rawRows[rowIndex],
  };
}

function renderExerciseResultSection({
  detail,
  result,
  messages,
}: {
  detail: string;
  result: ExerciseRunResult | null;
  messages: AppMessages;
}) {
  const status = result?.status ?? 'running';

  return (
    <section className="mt-8 min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
            {messages.visualizer.finalResultEyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {messages.visualizer.finalResultTitle}
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${getRunStatusBadgeClasses(
            status,
          )}`}
        >
          {getRunStatusLabel(status, messages)}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{detail}</p>

      {result?.checks.length ? (
        <div className="mt-6 grid gap-3">
          {result.checks.map((check) => (
            <article
              key={check.id}
              className={`rounded-2xl border p-4 ${
                check.passed
                  ? 'border-emerald-400/20 bg-emerald-500/8'
                  : 'border-amber-400/20 bg-amber-500/8'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">{check.label}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.2em] ${
                    check.passed
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : 'bg-amber-500/15 text-amber-200'
                  }`}
                >
                  {check.passed ? messages.common.pass : messages.common.fail}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{check.message}</p>
              {check.detail ? (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/80 p-3 text-xs leading-6 text-rose-200">
                  {check.detail}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {result?.stderr ? (
        <div className="mt-6">
          <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            {messages.visualizer.stderrTitle}
          </h4>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-rose-400/20 bg-rose-950/40 p-4 text-xs leading-6 text-rose-100">
            {result.stderr}
          </pre>
        </div>
      ) : null}
    </section>
  );
}

function renderWholeFileResultSection({
  rawRows,
  rowResults,
  pendingRows,
  visibleColumns,
  totalRows,
  maxDisplayedRows,
  emptyMessage,
  messages,
}: {
  rawRows: Record<string, string>[];
  rowResults: {
    rowIndex: number;
    passed: boolean;
    validatedRow: Record<string, unknown> | null;
    errors: string[];
  }[];
  pendingRows: number;
  visibleColumns: string[];
  totalRows: number;
  maxDisplayedRows: number | null;
  emptyMessage: string;
  messages: AppMessages;
}) {
  const displayedRowResults =
    maxDisplayedRows === null ? rowResults : rowResults.slice(0, maxDisplayedRows);
  const passedRows = rowResults.filter((rowResult) => rowResult.passed).length;
  const failedRowResults = rowResults.filter((rowResult) => !rowResult.passed);
  const failedRows = failedRowResults.length;
  const displayedFailedRowResults =
    maxDisplayedRows === null
      ? failedRowResults
      : failedRowResults.slice(0, maxDisplayedRows);
  const hiddenPreviewCount =
    maxDisplayedRows !== null && totalRows > maxDisplayedRows
      ? totalRows - maxDisplayedRows
      : 0;
  const hiddenFailedPreviewCount =
    displayedFailedRowResults.length < failedRows
      ? failedRows - displayedFailedRowResults.length
      : 0;

  return (
    <section className="mt-8 min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            {messages.visualizer.wholeFileEyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {messages.visualizer.wholeFileTitle}
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
            {messages.visualizer.passedRows(passedRows)}
          </span>
          <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            {messages.visualizer.failedRows(failedRows)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            {messages.visualizer.showingResultRows(
              displayedRowResults.length,
              totalRows,
            )}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            {messages.visualizer.pendingRows(pendingRows)}
          </span>
        </div>
      </div>

      {displayedRowResults.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedRowResults.map((rowResult) => {
            const rawRow = rawRows[rowResult.rowIndex];
            const filteredRawRow = filterRecordColumns(rawRow, visibleColumns);
            const filteredValidatedRow = filterRecordColumns(
              rowResult.validatedRow,
              visibleColumns,
            );

            return (
              <article
                key={`row-result-${rowResult.rowIndex}`}
                className={`min-w-0 rounded-3xl border p-5 ${
                  rowResult.passed
                    ? 'border-emerald-400/20 bg-emerald-500/8'
                    : 'border-amber-400/20 bg-amber-500/8'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-semibold text-white">
                    {messages.visualizer.rowLabel(rowResult.rowIndex)}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                      rowResult.passed
                        ? 'bg-emerald-500/15 text-emerald-100'
                        : 'bg-amber-500/15 text-amber-100'
                    }`}
                  >
                    {rowResult.passed
                      ? messages.visualizer.rowValid
                      : messages.visualizer.rowInvalid}
                  </span>
                </div>

                <div className="mt-4 grid min-w-0 gap-3">
                  <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {messages.visualizer.rawCsvRow}
                    </p>
                    <pre className={valuePreClassName}>
                      {formatValue(filteredRawRow)}
                    </pre>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {messages.visualizer.validationResult}
                    </p>
                    <pre className={valuePreClassName}>
                      {rowResult.passed
                        ? formatValue(filteredValidatedRow)
                        : formatValue(rowResult.errors)}
                    </pre>
                  </div>
                </div>
              </article>
            );
          })}

          {hiddenPreviewCount > 0 ? (
            <article className="min-w-0 rounded-3xl border border-dashed border-white/15 bg-slate-950/45 p-5">
              <p className="text-4xl font-semibold tracking-[0.2em] text-slate-300">
                ...
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {messages.visualizer.hiddenRowsSummary(
                  hiddenPreviewCount,
                  maxDisplayedRows ?? displayedRowResults.length,
                )}
              </p>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm leading-7 text-slate-400">
          {emptyMessage}
        </div>
      )}

      {failedRows > 0 ? (
        <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/8 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                {messages.visualizer.failedRowsEyebrow}
              </p>
              <h4 className="mt-3 text-lg font-semibold text-white">
                {messages.visualizer.failedRowsTitle}
              </h4>
            </div>
            <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
              {messages.visualizer.showingFailedRows(
                displayedFailedRowResults.length,
                failedRows,
              )}
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedFailedRowResults.map((rowResult) => {
              const rawRow = rawRows[rowResult.rowIndex];
              const filteredRawRow = filterRecordColumns(rawRow, visibleColumns);

              return (
                <article
                  key={`failed-row-${rowResult.rowIndex}`}
                  className="min-w-0 rounded-3xl border border-amber-400/20 bg-slate-950/65 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-base font-semibold text-white">
                      {messages.visualizer.rowLabel(rowResult.rowIndex)}
                    </p>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.22em] text-amber-100">
                      {messages.visualizer.rowInvalid}
                    </span>
                  </div>

                  <div className="mt-4 grid min-w-0 gap-3">
                    <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {messages.visualizer.rawCsvRow}
                      </p>
                      <pre className={valuePreClassName}>
                        {formatValue(filteredRawRow)}
                      </pre>
                    </div>

                    <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {messages.visualizer.validationErrors}
                      </p>
                      <pre className={valuePreClassName}>
                        {formatValue(rowResult.errors)}
                      </pre>
                    </div>
                  </div>
                </article>
              );
            })}

            {hiddenFailedPreviewCount > 0 ? (
              <article className="min-w-0 rounded-3xl border border-dashed border-amber-400/20 bg-slate-950/55 p-5">
                <p className="text-4xl font-semibold tracking-[0.2em] text-amber-100">
                  ...
                </p>
                <p className="mt-4 text-sm leading-7 text-amber-50/90">
                  {messages.visualizer.hiddenFailedRowsSummary(
                    hiddenFailedPreviewCount,
                  )}
                </p>
              </article>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getCompletedStepMap(state: ValidationVisualizerState) {
  const upperBound =
    state.currentStepIndex >= 0 ? state.currentStepIndex + 1 : 0;

  return new Map(
    state.steps
      .slice(0, upperBound)
      .map((step) => [`${step.rowIndex}:${step.fieldName}`, step]),
  );
}

export function ValidationVisualizerModal({
  state,
  onClose,
  onSkip,
  onVisualize,
  onPauseToggle,
  onPreviousStep,
  onNextStep,
  onStartPlayback,
}: ValidationVisualizerModalProps) {
  const { messages } = useI18n();

  if (!state.isOpen) {
    return null;
  }

  if (!state.request && state.mode === 'choice') {
    if (!state.isOpen || state.status === 'choice') {
      return state.isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                  {messages.visualizer.walkthroughEyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  {messages.visualizer.walkthroughChoiceTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {state.detail}
                </p>
              </div>
              <button
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
                type="button"
                onClick={onClose}
              >
                {messages.common.close}
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-left transition hover:border-cyan-300 hover:bg-cyan-500/18"
                type="button"
                onClick={onVisualize}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
                  {messages.visualizer.walkthroughEyebrow}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {messages.visualizer.visualizeLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {messages.visualizer.visualizeDescription}
                </p>
              </button>

              <button
                className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/25 hover:bg-white/10"
                type="button"
                onClick={onSkip}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  {messages.visualizer.directRunLabel}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {messages.visualizer.skipLabel}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {messages.visualizer.directRunDescription}
                </p>
              </button>
            </div>
          </div>
        </div>
      ) : null;
    }
  }

  if (state.mode === 'direct') {
    const { visibleColumns } = getDisplayColumns(state.rawRows, state.request);
    const pendingRows = Math.max(state.rawRows.length - state.rowResults.length, 0);
    const maxDisplayedRows = state.request?.maxVisualizedRows ?? null;
    const directStatus =
      state.runResult?.status ??
      (state.status === 'error' ? 'error' : 'running');
    const directErrorMessage = state.error ?? state.runResult?.stderr ?? null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 px-4 py-6 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1800px] rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                {messages.visualizer.directResultEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                {messages.visualizer.directResultTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {state.detail}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${getRunStatusBadgeClasses(
                  directStatus,
                )}`}
              >
                {getRunStatusLabel(directStatus, messages)}
              </span>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
                type="button"
                onClick={onClose}
              >
                {messages.common.close}
              </button>
            </div>
          </div>

          {directErrorMessage ? (
            <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-950/35 p-5 text-sm leading-7 text-rose-100">
              {directErrorMessage}
            </div>
          ) : null}

          {renderWholeFileResultSection({
            rawRows: state.rawRows,
            rowResults: state.rowResults,
            pendingRows,
            visibleColumns,
            totalRows: state.rawRows.length,
            maxDisplayedRows,
            emptyMessage: messages.visualizer.directResultEmpty,
            messages,
          })}
        </div>
      </div>
    );
  }

  if (!state.request) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
        <div className="w-full max-w-2xl rounded-[32px] border border-rose-400/20 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-rose-300">
                {messages.visualizer.preparedErrorEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                {messages.visualizer.preparedErrorTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {state.error ?? state.detail}
              </p>
            </div>
            <button
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
              type="button"
              onClick={onClose}
            >
              {messages.common.close}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const completedStepMap = getCompletedStepMap(state);
  const currentStep =
    state.currentStepIndex >= 0 ? state.steps[state.currentStepIndex] : null;
  const activeHighlight = currentStep
    ? state.request.highlights[currentStep.fieldName]
    : null;
  const codeLines = state.request.modelCode.split('\n');
  const codeSnippet = buildCodeSnippet(codeLines, activeHighlight);
  const { visibleColumns: resultColumns } = getDisplayColumns(
    state.rawRows,
    state.request,
  );
  const { visibleColumns: csvColumns } = getCurrentRowDisplayColumns(
    state.rawRows,
    state.request,
    currentStep,
  );
  const visibleRowResults = getVisibleRowResults(
    state.rowResults,
    state.steps,
    state.currentStepIndex,
    state.status,
  );
  const rowResultMap = new Map(
    visibleRowResults.map((rowResult) => [rowResult.rowIndex, rowResult]),
  );
  const pendingRows = Math.max(state.rawRows.length - visibleRowResults.length, 0);
  const animatedRowCount =
    state.request.maxVisualizedRows === null
      ? state.rawRows.length
      : Math.min(state.request.maxVisualizedRows, state.rawRows.length);
  const focusedRow = getFocusedWalkthroughRow({
    rawRows: state.rawRows,
    currentStep,
  });
  const focusedRowResult = focusedRow ? rowResultMap.get(focusedRow.rowIndex) : null;
  const shouldShowExerciseResult =
    Boolean(state.runResult) ||
    (state.mode === 'walkthrough' &&
      state.status === 'loading' &&
      state.currentStepIndex >= 0);
  const playbackControls = getPlaybackControlsState({
    currentStepIndex: state.currentStepIndex,
    totalSteps: state.steps.length,
    isPlaybackPaused: state.isPlaybackPaused,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1800px] rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
              {messages.visualizer.walkthroughEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {messages.visualizer.walkthroughTitle(state.request.modelClassName)}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{state.detail}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {state.request.maxVisualizedRows !== null &&
            state.rawRows.length > state.request.maxVisualizedRows ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {messages.visualizer.animatedRows(
                  animatedRowCount,
                  state.rawRows.length,
                )}
              </span>
            ) : null}
            {state.status === 'playing' ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {messages.visualizer.playbackLabel}
                </span>
                {(['1x', '2x', '4x'] as VisualizationPlaybackSpeed[]).map((speed) => {
                  const isActive = state.speed === speed;

                  return (
                    <button
                      key={speed}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'border-cyan-400/30 bg-cyan-500/12 text-cyan-100'
                          : 'border-white/10 text-slate-200 hover:border-white/25 hover:bg-white/5'
                      }`}
                      type="button"
                      onClick={() => {
                        onStartPlayback(speed);
                      }}
                    >
                      {speed}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {state.status === 'playing' && state.steps.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                  disabled={!playbackControls.canPrevious}
                  type="button"
                  onClick={onPreviousStep}
                >
                  {messages.visualizer.previousLabel}
                </button>
                <button
                  className="rounded-full border border-cyan-400/30 bg-cyan-500/12 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-slate-500"
                  disabled={!playbackControls.canPauseToggle}
                  type="button"
                  onClick={onPauseToggle}
                >
                  {playbackControls.isPlaybackPaused
                    ? messages.visualizer.resumeLabel
                    : messages.visualizer.pauseLabel}
                </button>
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-500"
                  disabled={!playbackControls.canNext}
                  type="button"
                  onClick={onNextStep}
                >
                  {messages.visualizer.nextLabel}
                </button>
              </div>
            ) : null}
            <button
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
              type="button"
              onClick={onClose}
            >
              {messages.common.close}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {state.request.fieldSequence.map((fieldName, index) => {
            const completedStep = currentStep
              ? completedStepMap.get(`${currentStep.rowIndex}:${fieldName}`)
              : null;
            const isActive = currentStep?.fieldName === fieldName;

            return (
              <div
                key={fieldName}
                className={`rounded-full border px-3 py-2 text-sm ${
                  isActive
                    ? 'border-cyan-300 bg-cyan-500/12 text-cyan-100'
                    : completedStep
                      ? completedStep.passed
                        ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100'
                        : 'border-amber-400/30 bg-amber-500/12 text-amber-100'
                      : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                {index + 1}. {fieldName}
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.35fr)_minmax(0,0.9fr)]">
          <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              {messages.visualizer.validatedOutputEyebrow}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              {messages.visualizer.currentFieldResultTitle}
            </h3>

            {currentStep ? (
              <div
                className={`mt-5 rounded-3xl border p-5 ${
                  currentStep.passed
                    ? 'border-emerald-400/25 bg-emerald-500/8'
                    : 'border-amber-400/25 bg-amber-500/8'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-white">
                    {messages.visualizer.rowFieldTitle(
                      currentStep.rowIndex,
                      currentStep.fieldName,
                    )}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                      currentStep.passed
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {currentStep.passed
                      ? messages.visualizer.accepted
                      : messages.visualizer.error}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {currentStep.message}
                </p>

                <div className="mt-4 grid min-w-0 gap-3">
                  <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {messages.visualizer.rawValue}
                    </p>
                    <pre className={valuePreClassName}>
                      {formatValue(currentStep.rawValue)}
                    </pre>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      {messages.visualizer.pydanticOutput}
                    </p>
                    <pre className={valuePreClassName}>
                      {currentStep.passed
                        ? formatValue(currentStep.validatedValue)
                        : currentStep.message}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-400">
                {messages.visualizer.pickPlaybackSpeed}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              {messages.visualizer.pydanticClassEyebrow}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              {messages.visualizer.highlightedModelLinesTitle}
            </h3>

            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85">
              {codeSnippet.map((item) => {
                if (item.type === 'gap') {
                  return (
                    <div
                      key={item.key}
                      className="border-y border-white/6 bg-slate-900/75 px-4 py-2 text-center text-xs uppercase tracking-[0.24em] text-slate-500"
                    >
                      {messages.visualizer.relatedCodeContinuesBelow}
                    </div>
                  );
                }

                const isActive = getHighlightRanges(activeHighlight).some(
                  (range) =>
                    item.lineNumber >= range.startLine &&
                    item.lineNumber <= range.endLine,
                );

                return (
                  <div
                    key={`${item.lineNumber}-${item.content}`}
                    className={`grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-4 py-2 font-mono text-sm leading-7 ${
                      isActive
                        ? 'bg-cyan-500/14 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.32)]'
                        : 'bg-transparent'
                    }`}
                  >
                    <span className="text-right text-slate-500">{item.lineNumber}</span>
                    <span className={isActive ? 'text-cyan-50' : 'text-slate-200'}>
                      {item.content || ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                {messages.visualizer.rawInputEyebrow}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-white">
                {messages.visualizer.currentCsvRowsTitle}
              </h3>
            </div>

            {focusedRow ? (
              <div className="mt-5">
                <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-semibold text-white">
                      {messages.visualizer.rowInFocus(focusedRow.rowIndex)}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                        focusedRowResult
                          ? focusedRowResult.passed
                            ? 'bg-emerald-500/15 text-emerald-100'
                            : 'bg-amber-500/15 text-amber-100'
                          : 'bg-cyan-500/15 text-cyan-100'
                      }`}
                    >
                      {focusedRowResult
                        ? focusedRowResult.passed
                          ? messages.visualizer.rowStatusComplete
                          : messages.visualizer.rowStatusInvalid
                        : messages.visualizer.rowStatusInProgress}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {csvColumns.map((column) => {
                      const isActive =
                        currentStep?.rowIndex === focusedRow.rowIndex &&
                        currentStep.fieldName === column;
                      const rawColumnValue = focusedRow.row[column] ?? null;

                      return (
                        <div
                          key={`${focusedRow.rowIndex}-${column}`}
                          data-active-column={isActive ? 'true' : 'false'}
                          data-column-name={column}
                          className={`grid gap-2 rounded-2xl border px-4 py-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] ${
                            isActive
                              ? 'border-cyan-300/35 bg-cyan-500/12 text-cyan-50 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.22)]'
                              : 'border-white/10 bg-slate-950/75 text-slate-100'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-300 break-all">
                            {column}
                          </p>
                          <p
                            className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm"
                            title={String(rawColumnValue ?? '')}
                          >
                            {formatCurrentRowValue(rawColumnValue)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm leading-7 text-slate-400">
                {messages.visualizer.activeCsvRowsPlaceholder}
              </div>
            )}

            {state.error ? (
              <div className="mt-5 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
                {state.error}
              </div>
            ) : null}
          </section>
        </div>

        {(state.status === 'loading' ||
          state.status === 'playing' ||
          state.status === 'complete' ||
          visibleRowResults.length > 0) &&
          renderWholeFileResultSection({
            rawRows: state.rawRows,
            rowResults: visibleRowResults,
            pendingRows,
            visibleColumns: resultColumns,
            totalRows: state.rawRows.length,
            maxDisplayedRows: state.request.maxVisualizedRows,
            emptyMessage: messages.visualizer.walkthroughResultEmpty,
            messages,
          })}

        {shouldShowExerciseResult &&
          renderExerciseResultSection({
            detail: state.detail,
            result: state.runResult,
            messages,
          })}
      </div>
    </div>
  );
}
