import { CsvPreviewPanel } from './CsvPreviewPanel';
import type { ExerciseDefinition } from '../../types/exercise';

interface ExerciseDetailsProps {
  exercise: ExerciseDefinition;
}

export function ExerciseDetails({ exercise }: ExerciseDetailsProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
          {exercise.shortTitle ?? exercise.id}
        </p>
        {exercise.learningConfig?.estimatedMinutes ? (
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
            {exercise.learningConfig.estimatedMinutes} min
          </span>
        ) : null}
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
        {exercise.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
        {exercise.description}
      </p>

      {exercise.learningConfig?.objectives?.length ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            Learning Goals
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {exercise.learningConfig.objectives.map((objective) => (
              <li key={objective} className="rounded-2xl bg-slate-900/50 px-4 py-3">
                {objective}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {exercise.hints?.length ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            Hints
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
            {exercise.hints.map((hint) => (
              <li key={hint} className="rounded-2xl bg-slate-900/50 px-4 py-3">
                {hint}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <CsvPreviewPanel exercise={exercise} />

      {exercise.example ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            {exercise.example.title ?? 'Example output'}
          </h2>
          {exercise.example.description ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {exercise.example.description}
            </p>
          ) : null}
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-cyan-50">
            {exercise.example.code}
          </pre>
        </div>
      ) : null}

    </section>
  );
}
