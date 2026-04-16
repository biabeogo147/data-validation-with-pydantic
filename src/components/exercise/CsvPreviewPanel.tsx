import { useEffect, useMemo, useState } from 'react';

import { getFixtureMounts } from '../../lib/exercise-runner';
import { getRuntimeBasePath } from '../../lib/github-pages';
import type { ExerciseCsvFile, ExerciseDefinition } from '../../types/exercise';

interface CsvPreviewPanelProps {
  exercise: ExerciseDefinition;
}

interface CsvPreviewData {
  headers: string[];
  rows: string[][];
  totalColumns: number;
  totalAvailableColumns: number;
  totalDataRows: number;
  shownDataRows: number;
  isTruncated: boolean;
}

const DEFAULT_PREVIEW_ROW_LIMIT = 8;
const PREVIEW_COLUMN_WIDTH = 'minmax(0, 1fr)';

function getDownloadFileName(fileCsvPath: string) {
  const segments = fileCsvPath.split('/').filter(Boolean);
  return segments.at(-1) ?? 'dataset.csv';
}

function parseCsvRecords(contents: string): string[][] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentCell = '';
  let isInsideQuotes = false;
  let index = 0;

  while (index < contents.length) {
    const character = contents[index];
    const nextCharacter = contents[index + 1];

    if (character === '"') {
      if (isInsideQuotes && nextCharacter === '"') {
        currentCell += '"';
        index += 2;
        continue;
      }

      isInsideQuotes = !isInsideQuotes;
      index += 1;
      continue;
    }

    if (!isInsideQuotes && character === ',') {
      currentRecord.push(currentCell);
      currentCell = '';
      index += 1;
      continue;
    }

    if (!isInsideQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      currentRecord.push(currentCell);
      currentCell = '';

      const isMeaningfulRecord =
        currentRecord.length > 1 || currentRecord[0]?.length > 0;

      if (isMeaningfulRecord) {
        records.push(currentRecord);
      }

      currentRecord = [];
      index += 1;
      continue;
    }

    currentCell += character;
    index += 1;
  }

  currentRecord.push(currentCell);

  const isMeaningfulRecord =
    currentRecord.length > 1 || currentRecord[0]?.length > 0;

  if (isMeaningfulRecord) {
    records.push(currentRecord);
  }

  return records;
}

export function parseCsvPreview(
  contents: string,
  maxDataRows: number = DEFAULT_PREVIEW_ROW_LIMIT,
  previewColumns?: string[],
): CsvPreviewData {
  const normalizedContents = contents.replace(/\r\n/g, '\n').trimEnd();

  if (!normalizedContents) {
    return {
      headers: [],
      rows: [],
      totalColumns: 0,
      totalAvailableColumns: 0,
      totalDataRows: 0,
      shownDataRows: 0,
      isTruncated: false,
    };
  }

  const [rawHeaders = [], ...records] = parseCsvRecords(normalizedContents);
  const selectedColumnIndexes =
    previewColumns?.length
      ? previewColumns
          .map((column) => rawHeaders.indexOf(column))
          .filter((index) => index >= 0)
      : rawHeaders.map((_, index) => index);
  const headers = selectedColumnIndexes.map((index) => rawHeaders[index]);
  const totalDataRows = records.length;
  const rows = records.slice(0, maxDataRows).map((record) =>
    selectedColumnIndexes.map((index) => record[index] ?? ''),
  );

  return {
    headers,
    rows,
    totalColumns: headers.length,
    totalAvailableColumns: rawHeaders.length,
    totalDataRows,
    shownDataRows: rows.length,
    isTruncated: totalDataRows > rows.length,
  };
}

interface CsvPreviewTableProps {
  downloadUrl: string;
  fileCsvPath: string;
  preview: CsvPreviewData;
}

export function CsvPreviewTable({
  downloadUrl,
  fileCsvPath,
  preview,
}: CsvPreviewTableProps) {
  const gridTemplateColumns = `72px repeat(${preview.totalColumns}, ${PREVIEW_COLUMN_WIDTH})`;

  return (
    <div className="mt-5 w-full min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            Showing {preview.totalColumns} / {preview.totalAvailableColumns} columns
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            {preview.totalDataRows.toLocaleString()} rows
          </span>
          <span className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100">
            {preview.isTruncated
              ? `Showing first ${preview.shownDataRows} rows`
              : `Showing all ${preview.shownDataRows} rows`}
          </span>
        </div>

        <a
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/8"
          download={getDownloadFileName(fileCsvPath)}
          href={downloadUrl}
        >
          Download CSV
        </a>
      </div>

      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
        <div className="w-full min-w-0">
          <div
            className="grid w-full min-w-0 border-b border-white/10 bg-slate-900/85"
            style={{ gridTemplateColumns }}
          >
            <div className="px-3 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
              Row
            </div>
            {preview.headers.map((header) => (
              <div key={header} className="min-w-0 px-3 py-3">
                <div
                  className="truncate text-xs uppercase tracking-[0.2em] text-slate-300"
                  title={header}
                >
                  {header}
                </div>
              </div>
            ))}
          </div>

          {preview.rows.map((row, rowIndex) => (
            <div
              key={`preview-row-${rowIndex}`}
              className="grid w-full min-w-0 border-b border-white/6 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="px-3 py-3 text-sm font-semibold text-slate-300">
                {rowIndex + 1}
              </div>
              {preview.headers.map((header, columnIndex) => {
                const cellValue = row[columnIndex] ?? '';

                return (
                  <div key={`${rowIndex}-${header}`} className="min-w-0 px-3 py-3">
                    <div className="truncate text-sm text-slate-200" title={cellValue}>
                      {cellValue}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {preview.isTruncated ? (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          The table is shortened for faster reading on the web. Use Download CSV to
          inspect the full dataset.
        </p>
      ) : null}
    </div>
  );
}

export function CsvPreviewPanel({ exercise }: CsvPreviewPanelProps) {
  const fixtures = useMemo(
    () => getFixtureMounts(exercise, getRuntimeBasePath()),
    [exercise],
  );
  const [activeFileId, setActiveFileId] = useState(fixtures[0]?.id ?? '');
  const [contentsByFileId, setContentsByFileId] = useState<Record<string, string>>({});
  const [errorsByFileId, setErrorsByFileId] = useState<Record<string, string>>({});
  const activeFixture =
    fixtures.find((fixture) => fixture.id === activeFileId) ?? fixtures[0] ?? null;
  const activeFileConfig: ExerciseCsvFile | null =
    exercise.fileCsvConfig.files.find((file) => file.id === activeFileId) ??
    exercise.fileCsvConfig.files[0] ??
    null;
  const activeContents = activeFixture ? contentsByFileId[activeFixture.id] : '';
  const activePreview = useMemo(
    () =>
      activeContents
        ? parseCsvPreview(activeContents, DEFAULT_PREVIEW_ROW_LIMIT, activeFileConfig?.previewColumns)
        : null,
    [activeContents, activeFileConfig],
  );

  useEffect(() => {
    setActiveFileId(fixtures[0]?.id ?? '');
    setContentsByFileId({});
    setErrorsByFileId({});
  }, [exercise.id, fixtures]);

  useEffect(() => {
    if (!activeFixture) {
      return;
    }

    if (contentsByFileId[activeFixture.id] || errorsByFileId[activeFixture.id]) {
      return;
    }

    let isCancelled = false;

    void fetch(activeFixture.publicUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${activeFixture.fileCsvPath}.`);
        }

        return response.text();
      })
      .then((contents) => {
        if (isCancelled) {
          return;
        }

        setContentsByFileId((currentState) => ({
          ...currentState,
          [activeFixture.id]: contents,
        }));
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setErrorsByFileId((currentState) => ({
          ...currentState,
          [activeFixture.id]:
            error instanceof Error ? error.message : String(error),
        }));
      });

    return () => {
      isCancelled = true;
    };
  }, [activeFixture, contentsByFileId, errorsByFileId]);

  if (fixtures.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            CSV Preview
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Inspect a readable preview of the repo CSV before you run the exercise.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {fixtures.length > 1 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {fixtures.map((fixture) => (
              <button
                key={fixture.id}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  fixture.id === activeFileId
                    ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/8'
                }`}
                type="button"
                onClick={() => {
                  setActiveFileId(fixture.id);
                }}
              >
                {fixture.fileCsvPath}
              </button>
            ))}
          </div>
        ) : null}

        {activeFixture ? (
          errorsByFileId[activeFixture.id] ? (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs leading-6 text-cyan-50">
              {errorsByFileId[activeFixture.id]}
            </pre>
          ) : activePreview ? (
            <CsvPreviewTable
              downloadUrl={activeFixture.publicUrl}
              fileCsvPath={activeFixture.fileCsvPath}
              preview={activePreview}
            />
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs leading-6 text-cyan-50">
              Loading CSV...
            </pre>
          )
        ) : (
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs leading-6 text-cyan-50">
            No CSV file configured.
          </pre>
        )}
      </div>
    </div>
  );
}
