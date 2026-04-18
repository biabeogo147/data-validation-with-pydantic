import { startTransition, useState } from 'react';

import { ExerciseEditor } from './components/editor/ExerciseEditor';
import { PlaceholderTabs } from './components/editor/PlaceholderTabs';
import { ExerciseDetails } from './components/exercise/ExerciseDetails';
import { ExerciseList } from './components/exercise/ExerciseList';
import { ValidationVisualizerModal } from './components/output/ValidationVisualizerModal';
import { exerciseCatalog } from './data/exercises';
import { useExerciseRunner } from './hooks/useExerciseRunner';
import { useIsMobile } from './hooks/useIsMobile';
import { useValidationVisualizer } from './hooks/useValidationVisualizer';
import { I18nProvider, useI18n } from './i18n/I18nProvider';
import { createInitialExerciseSessionState } from './lib/exercise-session';
import { getInitialPlaceholderValues } from './lib/template';

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { locale, setLocale, messages } = useI18n();
  const exercises = exerciseCatalog;
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
            {messages.shell.noExercisesTitle}
          </h1>
          <p className="mt-4 text-slate-300">
            {messages.shell.noExercisesDescription}
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
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="w-full max-w-4xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                {messages.shell.eyebrow}
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {messages.shell.title}
              </h1>

              <p className="mt-4 text-base leading-8 text-slate-300">
                {messages.shell.description}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                {messages.shell.languageLabel}
              </p>
              <div className="flex gap-2" data-language-toggle="true">
                {(['en', 'vi'] as const).map((option) => {
                  const isActive = locale === option;

                  return (
                    <button
                      key={option}
                      aria-pressed={isActive}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                      type="button"
                      onClick={() => {
                        setLocale(option);
                      }}
                    >
                      {option.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
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
                    {messages.shell.editorTitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                <button
                  className="text-sm text-slate-400 transition hover:text-slate-200"
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
                  {messages.shell.reset}
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
                  {selectedExercise.uiConfig?.runButtonLabel ?? messages.shell.defaultRun}
                </button>
                </div>
              </div>

              <PlaceholderTabs
                activePlaceholderId={activePlaceholder.id}
                placeholders={selectedExercise.placeholders}
                onSelect={(placeholderId) => {
                  setSessionState((currentSessionState) => ({
                    ...currentSessionState,
                    activePlaceholderByExerciseId: {
                      ...currentSessionState.activePlaceholderByExerciseId,
                      [selectedExercise.id]: placeholderId,
                    },
                  }));
                }}
              />

              <div className="mt-5">
                <ExerciseEditor
                  importLines={selectedExercise.editorImports}
                  isMobile={isMobile}
                  label={
                    selectedExercise.placeholders.length > 1
                      ? activePlaceholder.label ?? activePlaceholder.id
                      : undefined
                  }
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

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    className="text-sm text-emerald-200 transition hover:text-emerald-100 hover:underline"
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
                    {showSolution
                      ? messages.shell.hideReferenceSolution
                      : messages.shell.showReferenceSolution}
                  </button>
                </div>
              </div>

              {showSolution && selectedExercise.solutionCode ? (
                <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/8 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-100">
                    {messages.shell.referenceSolution}
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
          </div>
        </div>
      </div>

      <ValidationVisualizerModal
        state={visualizer.state}
        onClose={visualizer.close}
        onSkip={() => {
          void visualizer.skip();
        }}
        onVisualize={() => {
          void visualizer.visualize();
        }}
        onPauseToggle={visualizer.togglePausePlayback}
        onPreviousStep={visualizer.previousStep}
        onNextStep={visualizer.nextStep}
        onStartPlayback={visualizer.setPlaybackSpeed}
      />
    </main>
  );
}
