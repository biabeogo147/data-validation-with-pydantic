import type { ExerciseDefinition } from '../../types/exercise';

interface ExerciseListProps {
  exercises: ExerciseDefinition[];
  selectedExerciseId: string;
  onSelect: (exerciseId: string) => void;
}

export function ExerciseList({
  exercises,
  selectedExerciseId,
  onSelect,
}: ExerciseListProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur">
      <div className="border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
          Exercises
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {exercises.map((exercise) => {
          const isSelected = exercise.id === selectedExerciseId;

          return (
            <button
              key={exercise.id}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-950/30'
                  : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/8'
              }`}
              type="button"
              onClick={() => {
                onSelect(exercise.id);
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  {exercise.shortTitle ?? exercise.title}
                </span>
                {exercise.difficulty ? (
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                    {exercise.difficulty}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {exercise.description}
              </p>

              {exercise.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {exercise.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
