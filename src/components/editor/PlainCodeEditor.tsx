import { EditorImportsHint } from './EditorImportsHint';
import { useI18n } from '../../i18n/I18nProvider';

interface PlainCodeEditorProps {
  label?: string;
  importLines?: string[];
  value: string;
  onChange: (value: string) => void;
}

export function PlainCodeEditor({
  label,
  importLines,
  value,
  onChange,
}: PlainCodeEditorProps) {
  const { messages } = useI18n();

  return (
    <label className="flex flex-col gap-3">
      <div>
        {label ? <p className="text-sm font-semibold text-slate-100">{label}</p> : null}
        <EditorImportsHint importLines={importLines} />
      </div>

      <textarea
        aria-label={label ?? messages.editor.codeEditorAriaLabel}
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
