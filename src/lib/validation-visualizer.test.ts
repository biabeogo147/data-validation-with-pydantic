import { describe, expect, it } from 'vitest';

import {
  buildVisualizationRequest,
  findModelFieldHighlights,
  getVisibleRowResults,
  parseVisualizationStdout,
} from './validation-visualizer';
import type { ExerciseDefinition } from '../types/exercise';

const exercise: ExerciseDefinition = {
  id: 'visualize-base-model',
  title: 'Visualize model validation',
  description: 'Shows field-by-field validation.',
  templateCode: [
    'from pydantic import BaseModel',
    '',
    '{{MODEL_A}}',
    '',
    'obj = A.model_validate({"name": "An", "age": "20"})',
    'print(obj.model_dump())',
  ].join('\n'),
  placeholders: [
    {
      id: 'MODEL_A',
      defaultCode: ['class A(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  checks: [],
  fileCsvConfig: {
    files: [
      {
        id: 'people',
        fileCsvPath: 'fixtures/people.csv',
      },
    ],
  },
  visualizationConfig: {
    modelClassName: 'A',
    modelPlaceholderId: 'MODEL_A',
    csvFileId: 'people',
    fieldOrder: ['name', 'age'],
  },
};

describe('findModelFieldHighlights', () => {
  it('maps field names to code line highlights inside the model placeholder', () => {
    expect(
      findModelFieldHighlights(
        ['class A(BaseModel):', '    name: str', '    age: int'].join('\n'),
        ['name', 'age'],
      ),
    ).toEqual({
      name: {
        fieldName: 'name',
        startLine: 2,
        endLine: 2,
      },
      age: {
        fieldName: 'age',
        startLine: 3,
        endLine: 3,
      },
    });
  });
});

describe('buildVisualizationRequest', () => {
  it('builds a visualization request with field sequence, raw input, and highlight data', () => {
    const request = buildVisualizationRequest(exercise, {
      MODEL_A: ['class A(BaseModel):', '    name: str', '    age: int'].join('\n'),
    });

    expect(request.modelClassName).toBe('A');
    expect(request.csvMountPath).toBe('/data/people.csv');
    expect(request.fieldSequence).toEqual(['name', 'age']);
    expect(request.highlights.age).toEqual({
      fieldName: 'age',
      startLine: 3,
      endLine: 3,
    });
    expect(request.pythonSource).toContain('csv.DictReader');
    expect(request.pythonSource).toContain('/data/people.csv');
    expect(request.pythonSource).toContain('"age"');
  });

  it('fails when the requested model placeholder does not exist', () => {
    expect(() =>
      buildVisualizationRequest(
        {
          ...exercise,
          visualizationConfig: {
            ...exercise.visualizationConfig!,
            modelPlaceholderId: 'MISSING',
          },
        },
        {
          MODEL_A: 'class A(BaseModel):\n    name: str',
        },
      ),
    ).toThrow(/MISSING/);
  });

  it('fails when the exercise does not provide a CSV file for visualization', () => {
    expect(() =>
      buildVisualizationRequest(
        {
          ...exercise,
          fileCsvConfig: {
            files: [],
          },
        },
        {
          MODEL_A: 'class A(BaseModel):\n    name: str',
        },
      ),
    ).toThrow(/CSV/i);
  });
});

describe('parseVisualizationStdout', () => {
  it('extracts structured visualization steps, raw rows, and row summaries', () => {
    expect(
      parseVisualizationStdout(
        [
          '__PYDANTIC_VISUALIZER_ROWS__[{"name":"An","age":"20"},{"name":"Binh","age":"21"}]',
          '__PYDANTIC_VISUALIZER_STEP__{"rowIndex":0,"fieldName":"name","passed":true,"rawValue":"An","validatedValue":"An","message":"Accepted as str"}',
          '__PYDANTIC_VISUALIZER_STEP__{"rowIndex":0,"fieldName":"age","passed":true,"rawValue":"20","validatedValue":20,"message":"Accepted as int"}',
          '__PYDANTIC_VISUALIZER_ROW_RESULT__{"rowIndex":0,"passed":true,"validatedRow":{"name":"An","age":20},"errors":[]}',
        ].join('\n'),
      ),
    ).toEqual({
      rawRows: [
        {
          name: 'An',
          age: '20',
        },
        {
          name: 'Binh',
          age: '21',
        },
      ],
      steps: [
        {
          rowIndex: 0,
          fieldName: 'name',
          passed: true,
          rawValue: 'An',
          validatedValue: 'An',
          message: 'Accepted as str',
        },
        {
          rowIndex: 0,
          fieldName: 'age',
          passed: true,
          rawValue: '20',
          validatedValue: 20,
          message: 'Accepted as int',
        },
      ],
      rowResults: [
        {
          rowIndex: 0,
          passed: true,
          validatedRow: {
            name: 'An',
            age: 20,
          },
          errors: [],
        },
      ],
    });
  });
});

describe('getVisibleRowResults', () => {
  const rowResults = [
    {
      rowIndex: 0,
      passed: true,
      validatedRow: {
        name: 'An',
        age: 20,
      },
      errors: [],
    },
    {
      rowIndex: 1,
      passed: false,
      validatedRow: null,
      errors: ['Input should be a valid integer'],
    },
  ];

  const steps = [
    {
      rowIndex: 0,
      fieldName: 'name',
      passed: true,
      rawValue: 'An',
      validatedValue: 'An',
      message: 'Accepted as str',
    },
    {
      rowIndex: 0,
      fieldName: 'age',
      passed: true,
      rawValue: '20',
      validatedValue: 20,
      message: 'Accepted as int',
    },
    {
      rowIndex: 1,
      fieldName: 'name',
      passed: true,
      rawValue: 'Binh',
      validatedValue: 'Binh',
      message: 'Accepted as str',
    },
    {
      rowIndex: 1,
      fieldName: 'age',
      passed: false,
      rawValue: 'oops',
      validatedValue: null,
      message: 'Input should be a valid integer',
    },
  ];

  it('reveals row results only after the row finishes playback', () => {
    expect(getVisibleRowResults(rowResults, steps, -1, 'playing')).toEqual([]);
    expect(getVisibleRowResults(rowResults, steps, 0, 'playing')).toEqual([]);
    expect(getVisibleRowResults(rowResults, steps, 1, 'playing')).toEqual([
      rowResults[0],
    ]);
    expect(getVisibleRowResults(rowResults, steps, 2, 'playing')).toEqual([
      rowResults[0],
    ]);
    expect(getVisibleRowResults(rowResults, steps, 3, 'playing')).toEqual(
      rowResults,
    );
  });

  it('returns every row result once playback is complete', () => {
    expect(getVisibleRowResults(rowResults, steps, 0, 'complete')).toEqual(
      rowResults,
    );
  });
});
