import { Suspense, lazy } from 'react';

import { PlainCodeEditor } from './PlainCodeEditor';

const DesktopCodeEditor = lazy(() => import('./DesktopCodeEditor'));

interface ExerciseEditorProps {
  label?: string;
  importLines?: string[];
  isMobile: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ExerciseEditor({
  label,
  importLines,
  isMobile,
  value,
  onChange,
}: ExerciseEditorProps) {
  if (isMobile) {
    return (
      <PlainCodeEditor
        importLines={importLines}
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <PlainCodeEditor
          importLines={importLines}
          label={label}
          value={value}
          onChange={onChange}
        />
      }
    >
      <DesktopCodeEditor
        importLines={importLines}
        label={label}
        value={value}
        onChange={onChange}
      />
    </Suspense>
  );
}
