import Editor from '@monaco-editor/react';

interface DesktopCodeEditorProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function DesktopCodeEditor({
  label,
  description,
  value,
  onChange,
}: DesktopCodeEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 shadow-lg shadow-slate-950/40">
        <Editor
          defaultLanguage="python"
          height="380px"
          options={{
            automaticLayout: true,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            fontSize: 14,
            lineNumbersMinChars: 3,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            tabSize: 4,
            wordWrap: 'on',
          }}
          theme="vs-dark"
          value={value}
          onChange={(nextValue) => {
            onChange(nextValue ?? '');
          }}
        />
      </div>
    </div>
  );
}
