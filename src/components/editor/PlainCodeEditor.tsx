interface PlainCodeEditorProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}

export function PlainCodeEditor({
  label,
  description,
  value,
  onChange,
}: PlainCodeEditorProps) {
  return (
    <label className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>

      <textarea
        aria-label={label}
        className="min-h-[320px] w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30"
        spellCheck={false}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </label>
  );
}
