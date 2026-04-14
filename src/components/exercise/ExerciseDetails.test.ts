import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ExerciseDetails } from './ExerciseDetails';
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

describe('ExerciseDetails', () => {
  it('renders the example output and CSV preview entry point', () => {
    const markup = renderToStaticMarkup(ExerciseDetails({ exercise }));

    expect(markup).toContain('Example output');
    expect(markup).toContain('valid_count');
    expect(markup).toContain('Broken');
    expect(markup).toContain('View CSV');
  });
});
