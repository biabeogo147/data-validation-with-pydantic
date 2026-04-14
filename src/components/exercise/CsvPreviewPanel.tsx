import { useEffect, useMemo, useState } from 'react';

import { getFixtureMounts } from '../../lib/exercise-runner';
import { getRuntimeBasePath } from '../../lib/github-pages';
import type { ExerciseDefinition } from '../../types/exercise';

interface CsvPreviewPanelProps {
  exercise: ExerciseDefinition;
}

export function CsvPreviewPanel({ exercise }: CsvPreviewPanelProps) {
  const fixtures = useMemo(
    () => getFixtureMounts(exercise, getRuntimeBasePath()),
    [exercise],
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState(fixtures[0]?.id ?? '');
  const [contentsByFileId, setContentsByFileId] = useState<Record<string, string>>({});
  const [errorsByFileId, setErrorsByFileId] = useState<Record<string, string>>({});
  const activeFixture =
    fixtures.find((fixture) => fixture.id === activeFileId) ?? fixtures[0] ?? null;

  useEffect(() => {
    setActiveFileId(fixtures[0]?.id ?? '');
    setIsOpen(false);
    setContentsByFileId({});
    setErrorsByFileId({});
  }, [exercise.id, fixtures]);

  useEffect(() => {
    if (!isOpen || !activeFixture) {
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
  }, [activeFixture, contentsByFileId, errorsByFileId, isOpen]);

  if (fixtures.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            CSV Preview
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Inspect the repo CSV before you run the exercise.
          </p>
        </div>

        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/25 hover:bg-white/8"
          type="button"
          onClick={() => {
            setIsOpen((currentValue) => !currentValue);
          }}
        >
          {isOpen ? 'Hide CSV' : 'View CSV'}
        </button>
      </div>

      {isOpen ? (
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

          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs leading-6 text-cyan-50">
            {activeFixture
              ? errorsByFileId[activeFixture.id] ??
                contentsByFileId[activeFixture.id] ??
                'Loading CSV...'
              : 'No CSV file configured.'}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
