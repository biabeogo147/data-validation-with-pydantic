import { startTransition, useState } from 'react';

import { ExerciseEditor } from './components/editor/ExerciseEditor';
import { ExerciseDetails } from './components/exercise/ExerciseDetails';
import { ExerciseList } from './components/exercise/ExerciseList';
import { RunOutput } from './components/output/RunOutput';
import { ValidationVisualizerModal } from './components/output/ValidationVisualizerModal';
import { useExercises } from './hooks/useExercises';
import { useExerciseRunner } from './hooks/useExerciseRunner';
import { useIsMobile } from './hooks/useIsMobile';
import { useValidationVisualizer } from './hooks/useValidationVisualizer';
import { createInitialExerciseSessionState } from './lib/exercise-session';
import { getInitialPlaceholderValues } from './lib/template';

export default function App() {
  const { exercises } = useExercises();
  const isMobile = useIsMobile();
  const runner = useExerciseRunner();
  const visualizer = useValidationVisualizer({
    runExercise: runner.runExercise,
  });
  const [sessionState, setSessionState] = useState(() =>
    createInitialExerciseSessionState(exercises),
  );

  const selectedExercise =
    exercises.find((exercise) => exercise.id === sessionState.selectedExerciseId) ??
    exercises[0];

  if (!selectedExercise) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-50">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-3xl font-semibold text-white">
            No exercises are available yet.
          </h1>
          <p className="mt-4 text-slate-300">
            Add a new exercise config in <code>src/data/exercises</code> and it
            will appear automatically.
          </p>
        </div>
      </main>
    );
  }

  const currentValues =
    sessionState.draftsByExerciseId[selectedExercise.id] ??
    getInitialPlaceholderValues(selectedExercise);
  const activePlaceholderId =
    sessionState.activePlaceholderByExerciseId[selectedExercise.id] ??
    selectedExercise.placeholders[0]?.id;
  const activePlaceholder =
    selectedExercise.placeholders.find(
      (placeholder) => placeholder.id === activePlaceholderId,
    ) ?? selectedExercise.placeholders[0];
  const showSolution = sessionState.showSolutionByExerciseId[selectedExercise.id] ?? false;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))] p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
          <div className="w-full">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
              Interactive Learning Platform
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Data Validation with Pydantic
            </h1>

            <p className="mt-4 text-base leading-8 text-slate-300">
              Practice with guided exercises, instant feedback, and a
              lightweight in-browser coding environment.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
          <ExerciseList
            exercises={exercises}
            selectedExerciseId={selectedExercise.id}
            onSelect={(exerciseId) => {
              startTransition(() => {
                setSessionState(
                  createInitialExerciseSessionState(exercises, exerciseId),
                );
                visualizer.close();
                runner.reset();
              });
            }}
          />

          <div className="grid gap-6">
            <ExerciseDetails exercise={selectedExercise} />

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                    Editor
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Fill the placeholder code
                  </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/8"
                    type="button"
                    onClick={() => {
                      setSessionState((currentSessionState) => ({
                        ...currentSessionState,
                        draftsByExerciseId: {
                          ...currentSessionState.draftsByExerciseId,
                          [selectedExercise.id]: getInitialPlaceholderValues(
                            selectedExercise,
                          ),
                        },
                      }));
                      visualizer.close();
                      runner.reset();
                    }}
                  >
                    Reset Starter Code
                  </button>
                  <button
                    className="rounded-full border border-cyan-400/30 bg-cyan-500/12 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20"
                    type="button"
                    onClick={() => {
                      setSessionState((currentSessionState) => ({
                        ...currentSessionState,
                        showSolutionByExerciseId: {
                          ...currentSessionState.showSolutionByExerciseId,
                          [selectedExercise.id]: !showSolution,
                        },
                      }));
                    }}
                  >
                    {showSolution ? 'Hide Solution' : 'Show Solution'}
                  </button>
                  <button
                    className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                    disabled={
                      runner.state.phase === 'booting' ||
                      runner.state.phase === 'running'
                    }
                    type="button"
                    onClick={() => {
                      void visualizer.open(selectedExercise, currentValues);
                    }}
                  >
                    {selectedExercise.uiConfig?.runButtonLabel ?? 'Run'}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {selectedExercise.placeholders.map((placeholder) => (
                  <button
                    key={placeholder.id}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      placeholder.id === activePlaceholder.id
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/8'
                    }`}
                    type="button"
                    onClick={() => {
                      setSessionState((currentSessionState) => ({
                        ...currentSessionState,
                        activePlaceholderByExerciseId: {
                          ...currentSessionState.activePlaceholderByExerciseId,
                          [selectedExercise.id]: placeholder.id,
                        },
                      }));
                    }}
                  >
                    {placeholder.label ?? placeholder.id}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <ExerciseEditor
                  description={activePlaceholder.description}
                  isMobile={isMobile}
                  label={activePlaceholder.label ?? activePlaceholder.id}
                  value={currentValues[activePlaceholder.id] ?? ''}
                  onChange={(value) => {
                    setSessionState((currentSessionState) => ({
                      ...currentSessionState,
                      draftsByExerciseId: {
                        ...currentSessionState.draftsByExerciseId,
                        [selectedExercise.id]: {
                          ...(currentSessionState.draftsByExerciseId[
                            selectedExercise.id
                          ] ?? getInitialPlaceholderValues(selectedExercise)),
                          [activePlaceholder.id]: value,
                        },
                      },
                    }));
                  }}
                />
              </div>

              {showSolution && selectedExercise.solutionCode ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/8 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">
                    Reference solution
                  </h3>
                  <div className="mt-4 grid gap-4">
                    {selectedExercise.placeholders.map((placeholder) => {
                      const solution = selectedExercise.solutionCode?.[placeholder.id];
                      if (!solution) {
                        return null;
                      }

                      return (
                        <div key={placeholder.id}>
                          <p className="text-sm font-semibold text-white">
                            {placeholder.label ?? placeholder.id}
                          </p>
                          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-6 text-emerald-100">
                            {solution}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <RunOutput state={runner.state} />
          </div>
        </div>
      </div>

      <ValidationVisualizerModal
        state={visualizer.state}
        onClose={visualizer.close}
        onSkip={() => {
          void visualizer.skip();
        }}
        onStartPlayback={(speed) => {
          void visualizer.startPlayback(speed);
        }}
      />
    </main>
  );
}
