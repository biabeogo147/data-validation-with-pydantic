import { getFixtureMounts } from '../../lib/exercise-runner';
import type { ExerciseDefinition } from '../../types/exercise';

interface ExerciseDetailsProps {
  exercise: ExerciseDefinition;
}

export function ExerciseDetails({ exercise }: ExerciseDetailsProps) {
  const fixtures = getFixtureMounts(exercise);

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

      {fixtures.length ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            Repo CSV Fixtures
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {fixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-4"
              >
                <p className="text-sm font-semibold text-white">{fixture.id}</p>
                <p className="mt-2 text-sm text-slate-300">
                  Source: <code>{fixture.fileCsvPath}</code>
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Mounted in Pyodide: <code>{fixture.mountPath}</code>
                </p>
                {fixture.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {fixture.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
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

      {exercise.explanation ? (
        <details className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.22em] text-slate-200">
            Why this works
          </summary>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {exercise.explanation}
          </p>
        </details>
      ) : null}
    </section>
  );
}
