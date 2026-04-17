/// <reference types="node" />

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { executeExercise } from '../../lib/exercise-runner';
import { exerciseCatalog } from './index';
import type {
  ExerciseDefinition,
  ExerciseExecutionAdapter,
  ExercisePlaceholderValues,
} from '../../types/exercise';

const execFileAsync = promisify(execFile);
const LOCAL_PYTHON_PATH = 'D:/Anaconda/python.exe';
const TEMP_ROOT = path.join(process.cwd(), '.tmp', 'exercise-solution-tests');

function getSolutionValues(exercise: ExerciseDefinition): ExercisePlaceholderValues {
  return Object.fromEntries(
    exercise.placeholders.map((placeholder) => [
      placeholder.id,
      exercise.solutionCode?.[placeholder.id] ?? placeholder.defaultCode,
    ]),
  );
}

const localPythonAdapter: ExerciseExecutionAdapter = async (request) => {
  await mkdir(TEMP_ROOT, { recursive: true });
  const tempDir = await mkdtemp(path.join(TEMP_ROOT, 'run-'));

  try {
    let executableCode = request.code;

    for (const fixture of request.fixtures) {
      const sourcePath = path.join(process.cwd(), 'public', fixture.fileCsvPath);
      const sourceContents = await readFile(sourcePath, 'utf8');
      const mountedPath = path.join(tempDir, ...fixture.mountPath.split('/').filter(Boolean));

      await mkdir(path.dirname(mountedPath), { recursive: true });
      await writeFile(mountedPath, sourceContents, 'utf8');

      executableCode = executableCode.split(fixture.mountPath).join(
        mountedPath.replaceAll('\\', '/'),
      );
    }

    const scriptPath = path.join(tempDir, 'exercise.py');
    await writeFile(scriptPath, executableCode, 'utf8');

    try {
      const execution = await execFileAsync(LOCAL_PYTHON_PATH, [scriptPath], {
        cwd: process.cwd(),
        maxBuffer: 8 * 1024 * 1024,
      });

      return {
        stdout: execution.stdout,
        stderr: execution.stderr,
      };
    } catch (error) {
      const executionError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      const diagnostics = [
        executionError.stderr,
        executionError.stdout,
        executionError.message,
      ]
        .filter(Boolean)
        .join('\n\n');
      throw new Error(diagnostics);
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

describe('exercise solutions', () => {
  it.each(exerciseCatalog)('passes the shipped solution for $id', async (exercise) => {
    const result = await executeExercise(
      exercise,
      getSolutionValues(exercise),
      localPythonAdapter,
    );

    expect(
      result.status,
      [
        `exercise: ${exercise.id}`,
        result.stderr ? `stderr:\n${result.stderr}` : null,
        result.stdout ? `stdout:\n${result.stdout}` : null,
      ]
        .filter(Boolean)
        .join('\n\n'),
    ).toBe('pass');
    expect(result.stderr, exercise.id).toBe('');
    expect(result.checks).not.toHaveLength(0);
    expect(
      result.checks.every((check) => check.passed),
      JSON.stringify(result.checks, null, 2),
    ).toBe(true);
  });
});
