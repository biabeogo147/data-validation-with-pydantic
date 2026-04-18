import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ExerciseDetails } from './ExerciseDetails';
import { I18nProvider } from '../../i18n/I18nProvider';
import { appMessages, type AppLocale } from '../../i18n/messages';
import type { ExerciseDefinition } from '../../types/exercise';

const exercise: ExerciseDefinition = {
  id: 'csv-import',
  title: 'Validate CSV rows with a Pydantic model',
  description: 'Read a CSV file and validate each row.',
  templateCode: '{{MODEL}}',
  placeholders: [
    {
      id: 'MODEL',
      defaultCode: 'class User(BaseModel):\n    age: int',
    },
  ],
  runConfig: {},
  checks: [],
  fileCsvConfig: {
    files: [
      {
        id: 'users',
        fileCsvPath: 'fixtures/users.csv',
      },
    ],
  },
  example: {
    title: 'Example output',
    code: '{\n  "valid_count": 2,\n  "invalid_rows": ["Broken"]\n}',
  },
};

function renderDetailsWithLocale(locale: AppLocale) {
  return renderToStaticMarkup(
    createElement(
      I18nProvider,
      { initialLocale: locale },
      createElement(ExerciseDetails, { exercise }),
    ),
  );
}

describe('ExerciseDetails', () => {
  it('renders the example output and always-visible CSV preview section', () => {
    const markup = renderDetailsWithLocale('en');

    expect(markup).toContain(appMessages.en.exerciseDetails.exampleOutput);
    expect(markup).toContain('valid_count');
    expect(markup).toContain('Broken');
    expect(markup).toContain(appMessages.en.csvPreview.title);
    expect(markup).not.toContain('View CSV');
    expect(markup).not.toContain('Hide CSV');
  });

  it('switches app shell labels when a different locale is active', () => {
    const markup = renderDetailsWithLocale('vi');

    expect(markup).toContain(appMessages.vi.csvPreview.title);
    expect(markup).toContain(appMessages.vi.exerciseDetails.exampleOutput);
  });
});
