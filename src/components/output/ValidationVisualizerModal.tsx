import {
  getVisibleRowResults,
} from '../../lib/validation-visualizer';
import type {
  ValidationVisualizerState,
  VisualizationPlaybackSpeed,
} from '../../hooks/useValidationVisualizer';
import type { ExerciseRunResult } from '../../types/exercise';

interface ValidationVisualizerModalProps {
  state: ValidationVisualizerState;
  onClose: () => void;
  onSkip: () => void;
  onStartPlayback: (speed: VisualizationPlaybackSpeed) => void;
}

function formatValue(value: unknown) {
  const clippedValue = clipValue(value);

  if (typeof value === 'string') {
    return JSON.stringify(clippedValue);
  }

  return JSON.stringify(clippedValue, null, 2) ?? 'null';
}

const valuePreClassName =
  'mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-100';

const MAX_PREVIEW_STRING_LENGTH = 120;

function clipValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_PREVIEW_STRING_LENGTH
      ? `${value.slice(0, MAX_PREVIEW_STRING_LENGTH - 3)}...`
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => clipValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        clipValue(item),
      ]),
    );
  }

  return value;
}

function filterRecordColumns(
  record: Record<string, unknown> | null | undefined,
  visibleColumns: string[],
) {
  if (!record) {
    return null;
  }

  if (visibleColumns.length === 0) {
    return record;
  }

  return Object.fromEntries(
    visibleColumns
      .filter((column) => column in record)
      .map((column) => [column, record[column]]),
  );
}

function getDisplayColumns(
  rawRows: Record<string, string>[],
  request: ValidationVisualizerState['request'],
) {
  const availableColumns = rawRows[0]
    ? Object.keys(rawRows[0])
    : request?.fieldSequence ?? [];
  const configuredColumns =
    request?.visibleColumns && request.visibleColumns.length > 0
      ? request.visibleColumns
      : availableColumns;
  const visibleColumns = Array.from(new Set(configuredColumns.filter(Boolean)));

  return {
    visibleColumns: visibleColumns.length > 0 ? visibleColumns : availableColumns,
    totalColumns: availableColumns.length > 0 ? availableColumns.length : visibleColumns.length,
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

function renderExerciseResultSection({
  detail,
  result,
}: {
  detail: string;
  result: ExerciseRunResult | null;
}) {
  const status = result?.status ?? 'running';

  return (
    <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
            Final Result
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Exercise result
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${getRunStatusBadgeClasses(
            status,
          )}`}
        >
          {status}
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
                  {check.passed ? 'pass' : 'fail'}
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
            Stderr / Error
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
}) {
  const displayedRowResults =
    maxDisplayedRows === null ? rowResults : rowResults.slice(0, maxDisplayedRows);
  const passedRows = rowResults.filter((rowResult) => rowResult.passed).length;
  const failedRows = rowResults.filter((rowResult) => !rowResult.passed).length;
  const hiddenPreviewCount =
    maxDisplayedRows !== null && totalRows > maxDisplayedRows
      ? totalRows - maxDisplayedRows
      : 0;
  const hiddenPreviewLabel = hiddenPreviewCount === 1 ? 'row' : 'rows';

  return (
    <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            Whole File Result
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Validation results across the full CSV
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
            Passed rows: {passedRows}
          </span>
          <span className="rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
            Failed rows: {failedRows}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Showing {displayedRowResults.length} / {totalRows} rows
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Pending rows: {pendingRows}
          </span>
        </div>
      </div>

      {displayedRowResults.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
                className={`rounded-3xl border p-5 ${
                  rowResult.passed
                    ? 'border-emerald-400/20 bg-emerald-500/8'
                    : 'border-amber-400/20 bg-amber-500/8'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-base font-semibold text-white">
                    Row {rowResult.rowIndex + 1}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                      rowResult.passed
                        ? 'bg-emerald-500/15 text-emerald-100'
                        : 'bg-amber-500/15 text-amber-100'
                    }`}
                  >
                    {rowResult.passed ? 'valid' : 'invalid'}
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Raw CSV row
                    </p>
                    <pre className={valuePreClassName}>
                      {formatValue(filteredRawRow)}
                    </pre>
                  </div>

                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Validation result
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
            <article className="rounded-3xl border border-dashed border-white/15 bg-slate-950/45 p-5">
              <p className="text-4xl font-semibold tracking-[0.2em] text-slate-300">
                ...
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                ... {hiddenPreviewCount} more {hiddenPreviewLabel} are hidden from
                this preview. The walkthrough shows only the first{' '}
                {maxDisplayedRows} rows here.
              </p>
            </article>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-950/45 p-5 text-sm leading-7 text-slate-400">
          {emptyMessage}
        </div>
      )}
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
  onStartPlayback,
}: ValidationVisualizerModalProps) {
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
                  Validation Walkthrough
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Choose how to play the full CSV validation demo
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
                Close
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(['1x', '2x', '4x'] as VisualizationPlaybackSpeed[]).map(
                (speed) => (
                  <button
                    key={speed}
                    className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-left transition hover:border-cyan-300 hover:bg-cyan-500/18"
                    type="button"
                    onClick={() => {
                      onStartPlayback(speed);
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">
                      Playback
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-white">{speed}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {speed === '1x'
                        ? 'One field every second.'
                        : speed === '2x'
                          ? 'A faster half-second walkthrough per field.'
                          : 'Quick teaching playback at quarter-second steps.'}
                    </p>
                  </button>
                ),
              )}

              <button
                className="rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/25 hover:bg-white/10"
                type="button"
                onClick={onSkip}
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Direct Run
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">Skip</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Run the full validation immediately without the visual teaching
                  flow.
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

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 px-4 py-6 backdrop-blur-md">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                Validation Result
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Full CSV validation without the walkthrough
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {state.detail}
              </p>
            </div>

            <button
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
              type="button"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {renderWholeFileResultSection({
            rawRows: state.rawRows,
            rowResults: state.rowResults,
            pendingRows,
            visibleColumns,
            totalRows: state.rawRows.length,
            maxDisplayedRows,
            emptyMessage:
              'The row-level results will appear here as soon as the direct validation finishes.',
          })}

          {renderExerciseResultSection({
            detail: state.detail,
            result: state.runResult,
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
                Visualization Error
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                The walkthrough could not be prepared
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
              Close
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
  const { visibleColumns: csvColumns, totalColumns } = getDisplayColumns(
    state.rawRows,
    state.request,
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
  const displayedRawRows =
    state.request.maxVisualizedRows === null
      ? state.rawRows
      : state.rawRows.slice(0, state.request.maxVisualizedRows);
  const shouldShowExerciseResult =
    Boolean(state.runResult) ||
    (state.mode === 'walkthrough' &&
      state.status === 'loading' &&
      state.currentStepIndex >= 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 px-4 py-6 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1800px] rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
              Validation Walkthrough
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {state.request.modelClassName} validates the full CSV file
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">{state.detail}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {state.request.maxVisualizedRows !== null &&
            state.rawRows.length > state.request.maxVisualizedRows ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Animating {animatedRowCount} / {state.rawRows.length} rows
              </span>
            ) : null}
            {state.speed ? (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-500/12 px-4 py-2 text-sm font-semibold text-cyan-100">
                {state.speed}
              </span>
            ) : null}
            <button
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:bg-white/5"
              type="button"
              onClick={onClose}
            >
              Close
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

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_1.35fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              Validated Output
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Current field result
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
                    Row {currentStep.rowIndex + 1} · {currentStep.fieldName}
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.22em] ${
                      currentStep.passed
                        ? 'bg-emerald-500/15 text-emerald-200'
                        : 'bg-amber-500/15 text-amber-200'
                    }`}
                  >
                    {currentStep.passed ? 'accepted' : 'error'}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {currentStep.message}
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Raw value
                    </p>
                    <pre className={valuePreClassName}>
                      {formatValue(currentStep.rawValue)}
                    </pre>
                  </div>

                  <div className="rounded-2xl bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Pydantic output
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
                Pick a playback speed to step through each field.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              Pydantic Class
            </p>
            <h3 className="mt-3 text-xl font-semibold text-white">
              Highlighted model lines
            </h3>

            <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85">
              {codeLines.map((line, index) => {
                const lineNumber = index + 1;
                const isActive =
                  activeHighlight &&
                  lineNumber >= activeHighlight.startLine &&
                  lineNumber <= activeHighlight.endLine;

                return (
                  <div
                    key={`${lineNumber}-${line}`}
                    className={`grid grid-cols-[44px_minmax(0,1fr)] gap-4 px-4 py-2 font-mono text-sm leading-7 ${
                      isActive
                        ? 'bg-cyan-500/14 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.32)]'
                        : 'bg-transparent'
                    }`}
                  >
                    <span className="text-right text-slate-500">{lineNumber}</span>
                    <span className={isActive ? 'text-cyan-50' : 'text-slate-200'}>
                      {line || ' '}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
                  Raw Input
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Full CSV input
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  Showing {displayedRawRows.length} / {state.rawRows.length} rows
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                  Showing {csvColumns.length} / {totalColumns} columns
                </span>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/85">
                <div
                  className="grid border-b border-white/10 bg-slate-900/80"
                  style={{
                    gridTemplateColumns: `72px repeat(${csvColumns.length}, minmax(180px, 1fr))`,
                  }}
                >
                  <div className="px-3 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Row
                  </div>
                  {csvColumns.map((column) => (
                    <div
                      key={column}
                      className="min-w-0 truncate px-3 py-3 text-xs uppercase tracking-[0.2em] text-slate-400"
                      title={column}
                    >
                      {column}
                    </div>
                  ))}
                </div>

                {displayedRawRows.map((row, rowIndex) => {
                  const rowResult = rowResultMap.get(rowIndex);

                  return (
                    <div
                      key={`row-${rowIndex}`}
                      className="grid border-b border-white/6 last:border-b-0"
                      style={{
                        gridTemplateColumns: `72px repeat(${csvColumns.length}, minmax(180px, 1fr))`,
                      }}
                    >
                      <div className="px-3 py-3 text-sm font-semibold text-slate-300">
                        {rowIndex + 1}
                      </div>
                      {csvColumns.map((column) => {
                        const stepKey = `${rowIndex}:${column}`;
                        const completedStep = completedStepMap.get(stepKey);
                        const isActive =
                          currentStep?.rowIndex === rowIndex &&
                          currentStep.fieldName === column;

                        return (
                          <div
                            key={`${rowIndex}-${column}`}
                            className={`min-w-0 truncate px-3 py-3 text-sm transition ${
                              isActive
                                ? 'bg-cyan-500/14 text-cyan-50'
                                : completedStep
                                  ? completedStep.passed
                                    ? 'bg-emerald-500/8 text-emerald-100'
                                    : 'bg-amber-500/10 text-amber-100'
                                  : rowResult
                                    ? rowResult.passed
                                      ? 'text-slate-100'
                                      : 'text-slate-200'
                                    : 'text-slate-300'
                            }`}
                            title={String(row[column] ?? '')}
                          >
                            {String(row[column] ?? '')}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

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
            visibleColumns: csvColumns,
            totalRows: state.rawRows.length,
            maxDisplayedRows: state.request.maxVisualizedRows,
            emptyMessage:
              'The row-level results will append here as soon as each CSV row finishes validation.',
          })}

        {shouldShowExerciseResult &&
          renderExerciseResultSection({
            detail: state.detail,
            result: state.runResult,
          })}
      </div>
    </div>
  );
}
