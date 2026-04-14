import { Suspense, lazy } from 'react';

import { PlainCodeEditor } from './PlainCodeEditor';

const DesktopCodeEditor = lazy(() => import('./DesktopCodeEditor'));

interface ExerciseEditorProps {
  label: string;
  description?: string;
  isMobile: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ExerciseEditor({
  label,
  description,
  isMobile,
  value,
  onChange,
}: ExerciseEditorProps) {
  if (isMobile) {
    return (
      <PlainCodeEditor
        description={description}
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
          description={description}
          label={label}
          value={value}
          onChange={onChange}
        />
      }
    >
      <DesktopCodeEditor
        description={description}
        label={label}
        value={value}
        onChange={onChange}
      />
    </Suspense>
  );
}
