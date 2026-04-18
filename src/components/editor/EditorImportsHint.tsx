import { useI18n } from '../../i18n/I18nProvider';

interface EditorImportsHintProps {
  importLines?: string[];
}

export function EditorImportsHint({ importLines }: EditorImportsHintProps) {
  const { messages } = useI18n();

  if (!importLines?.length) {
    return null;
  }

  const hasSingleImportLine = importLines.length === 1;

  return (
    <div className="mt-3 rounded-2xl border border-cyan-400/15 bg-cyan-500/8 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
        {messages.editor.availableImports}
      </p>

      {hasSingleImportLine ? (
        <code className="mt-3 inline-flex rounded-full border border-cyan-400/15 bg-slate-950/70 px-3 py-1 font-mono text-xs text-cyan-100">
          {importLines[0]}
        </code>
      ) : (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/70 p-3 font-mono text-xs leading-6 text-cyan-50">
          {importLines.join('\n')}
        </pre>
      )}
    </div>
  );
}
