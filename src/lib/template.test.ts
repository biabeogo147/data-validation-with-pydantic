import { describe, expect, it } from 'vitest';

import { assembleExerciseCode, getInitialPlaceholderValues } from './template';

const exercise = {
  templateCode: [
    'from pydantic import BaseModel',
    '',
    '{{MODEL_A}}',
    '',
    '{{VALIDATION_SCRIPT}}',
  ].join('\n'),
  placeholders: [
    {
      id: 'MODEL_A',
      defaultCode: ['class A(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
    },
    {
      id: 'VALIDATION_SCRIPT',
      defaultCode: [
        'obj = A.model_validate({"name": "An", "age": "20"})',
        'print(obj.model_dump())',
      ].join('\n'),
    },
  ],
};

describe('template helpers', () => {
  it('returns starter values keyed by placeholder id', () => {
    expect(getInitialPlaceholderValues(exercise)).toEqual({
      MODEL_A: ['class A(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
      VALIDATION_SCRIPT: [
        'obj = A.model_validate({"name": "An", "age": "20"})',
        'print(obj.model_dump())',
      ].join('\n'),
    });
  });

  it('replaces each placeholder while preserving other template content', () => {
    const assembled = assembleExerciseCode(exercise, {
      MODEL_A: ['class A(BaseModel):', '    name: str', '    age: int'].join(
        '\n',
      ),
      VALIDATION_SCRIPT: 'print("done")',
    });

    expect(assembled).toContain('from pydantic import BaseModel');
    expect(assembled).toContain('class A(BaseModel):');
    expect(assembled).toContain('print("done")');
    expect(assembled).not.toContain('{{MODEL_A}}');
    expect(assembled).not.toContain('{{VALIDATION_SCRIPT}}');
  });

  it('supports deterministic replacement for multiple placeholders', () => {
    const assembled = assembleExerciseCode(
      {
        templateCode: '{{FIRST}}\n{{SECOND}}\n{{FIRST}}',
        placeholders: [
          { id: 'FIRST', defaultCode: 'alpha' },
          { id: 'SECOND', defaultCode: 'beta' },
        ],
      },
      {
        FIRST: 'one',
        SECOND: 'two',
      },
    );

    expect(assembled).toBe('one\ntwo\none');
  });

  it('fails when a required placeholder value is missing', () => {
    expect(() =>
      assembleExerciseCode(
        {
          templateCode: '{{REQUIRED}}',
          placeholders: [{ id: 'REQUIRED', defaultCode: '' }],
        },
        {},
      ),
    ).toThrow(/REQUIRED/);
  });
});
