import { describe, expect, it, vi } from 'vitest';

import { executeExercise, getFixtureMounts } from './exercise-runner';
import type { ExerciseDefinition } from '../types/exercise';

const exercise: ExerciseDefinition = {
  id: 'csv-users',
  title: 'Validate users from CSV rows',
  description: 'Uses a CSV fixture to validate row-based imports.',
  templateCode: ['{{MODEL_CODE}}', '', 'print("loaded")'].join('\n'),
  placeholders: [
    {
      id: 'MODEL_CODE',
      defaultCode: ['class User:', '    pass'].join('\n'),
    },
  ],
  checks: [
    {
      id: 'stdout-check',
      kind: 'stdout_contains',
      label: 'prints a success message',
      text: 'loaded',
      successMessage: 'Output contains the expected marker.',
      failureMessage: 'Output should contain the expected marker.',
    },
  ],
  runConfig: {
    pythonPackages: ['pydantic'],
  },
  fileCsvConfig: {
    files: [
      {
        id: 'users',
        fileCsvPath: 'fixtures/users.csv',
      },
    ],
  },
};

describe('exercise runner orchestration', () => {
  it('derives predictable fixture mount metadata from config', () => {
    expect(getFixtureMounts(exercise)).toEqual([
      {
        id: 'users',
        fileCsvPath: 'fixtures/users.csv',
        publicUrl: '/fixtures/users.csv',
        mountPath: '/data/users.csv',
      },
    ]);
  });

  it('assembles code and reports a passing run result', async () => {
    const adapter = vi.fn().mockResolvedValue({
      stdout: 'loaded',
      stderr: '',
    });

    const result = await executeExercise(exercise, { MODEL_CODE: 'class User: pass' }, adapter);

    expect(adapter).toHaveBeenCalledWith({
      code: ['class User: pass', '', 'print("loaded")'].join('\n'),
      packages: ['pydantic'],
      fixtures: [
        {
          id: 'users',
          fileCsvPath: 'fixtures/users.csv',
          publicUrl: '/fixtures/users.csv',
          mountPath: '/data/users.csv',
        },
      ],
    });
    expect(result.status).toBe('pass');
    expect(result.stdout).toBe('loaded');
    expect(result.stderr).toBe('');
    expect(result.checks).toEqual([
      {
        id: 'stdout-check',
        label: 'prints a success message',
        passed: true,
        message: 'Output contains the expected marker.',
      },
    ]);
  });

  it('defaults to the built-in pydantic runtime when runConfig is omitted', async () => {
    const adapter = vi.fn().mockResolvedValue({
      stdout: 'loaded',
      stderr: '',
    });

    const result = await executeExercise(
      {
        ...exercise,
        runConfig: undefined,
      },
      { MODEL_CODE: 'class User: pass' },
      adapter,
    );

    expect(adapter).toHaveBeenCalledWith({
      code: ['class User: pass', '', 'print("loaded")'].join('\n'),
      packages: ['pydantic'],
      fixtures: [
        {
          id: 'users',
          fileCsvPath: 'fixtures/users.csv',
          publicUrl: '/fixtures/users.csv',
          mountPath: '/data/users.csv',
        },
      ],
    });
    expect(result.status).toBe('pass');
  });

  it('reports a failing run result when a check fails', async () => {
    const adapter = vi.fn().mockResolvedValue({
      stdout: 'missing-marker',
      stderr: '',
    });

    const result = await executeExercise(exercise, { MODEL_CODE: 'class User: pass' }, adapter);

    expect(result.status).toBe('fail');
    expect(result.checks[0]).toEqual({
      id: 'stdout-check',
      label: 'prints a success message',
      passed: false,
      message: 'Output should contain the expected marker.',
    });
  });

  it('normalizes thrown execution errors into learner-visible output', async () => {
    const adapter = vi.fn().mockRejectedValue(new Error('Pyodide boot failed'));

    const result = await executeExercise(exercise, { MODEL_CODE: 'class User: pass' }, adapter);

    expect(result.status).toBe('error');
    expect(result.stderr).toContain('Pyodide boot failed');
    expect(result.checks).toEqual([]);
  });
});
