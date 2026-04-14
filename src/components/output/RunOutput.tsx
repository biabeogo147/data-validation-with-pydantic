import type { ExerciseRunnerState } from '../../hooks/useExerciseRunner';

interface RunOutputProps {
  state: ExerciseRunnerState;
}

function getStatusBadgeClasses(phase: ExerciseRunnerState['phase']) {
  switch (phase) {
    case 'pass':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
    case 'fail':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-200';
    case 'error':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-200';
    case 'booting':
    case 'running':
      return 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100';
    default:
      return 'border-white/10 bg-white/5 text-slate-300';
  }
}

export function RunOutput({ state }: RunOutputProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
            Output
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Run result
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${getStatusBadgeClasses(
            state.phase,
          )}`}
        >
          {state.phase}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{state.detail}</p>

      {state.result?.checks.length ? (
        <div className="mt-6 grid gap-3">
          {state.result.checks.map((check) => (
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
                <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950/80 p-3 text-xs leading-6 text-rose-200">
                  {check.detail}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {state.result?.stdout ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            Stdout
          </h3>
          <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-xs leading-6 text-cyan-100">
            {state.result.stdout}
          </pre>
        </div>
      ) : null}

      {state.result?.stderr ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
            Stderr / Error
          </h3>
          <pre className="mt-3 overflow-x-auto rounded-2xl border border-rose-400/20 bg-rose-950/40 p-4 text-xs leading-6 text-rose-100">
            {state.result.stderr}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
