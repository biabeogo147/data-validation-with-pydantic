import type { ExercisePlaceholder } from '../../types/exercise';

interface PlaceholderTabsProps {
  placeholders: ExercisePlaceholder[];
  activePlaceholderId: string;
  onSelect: (placeholderId: string) => void;
}

export function PlaceholderTabs({
  placeholders,
  activePlaceholderId,
  onSelect,
}: PlaceholderTabsProps) {
  if (placeholders.length <= 1) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {placeholders.map((placeholder) => (
        <button
          key={placeholder.id}
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            placeholder.id === activePlaceholderId
              ? 'border-cyan-400 bg-cyan-500/10 text-cyan-100'
              : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/8'
          }`}
          type="button"
          onClick={() => {
            onSelect(placeholder.id);
          }}
        >
          {placeholder.label ?? placeholder.id}
        </button>
      ))}
    </div>
  );
}
