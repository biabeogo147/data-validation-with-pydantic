/// <reference types="node" />

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import {
  buildVisualizationRequest,
  parseVisualizationStdout,
} from './validation-visualizer';
import type { ExerciseDefinition } from '../types/exercise';

const execFileAsync = promisify(execFile);
const LOCAL_PYTHON_PATH = 'D:/Anaconda/python.exe';
const TEMP_ROOT = path.join(process.cwd(), '.tmp', 'validation-visualizer-tests');

async function runVisualizationPython(
  pythonSource: string,
  mountPath: string,
  csvContents: string,
) {
  await mkdir(TEMP_ROOT, { recursive: true });
  const tempDir = await mkdtemp(path.join(TEMP_ROOT, 'run-'));

  try {
    const mountedPath = path.join(
      tempDir,
      ...mountPath.split('/').filter(Boolean),
    );
    const executableCode = pythonSource.split(mountPath).join(
      mountedPath.replaceAll('\\', '/'),
    );

    await mkdir(path.dirname(mountedPath), { recursive: true });
    await writeFile(mountedPath, csvContents, 'utf8');
    await writeFile(path.join(tempDir, 'visualizer.py'), executableCode, 'utf8');

    try {
      const execution = await execFileAsync(LOCAL_PYTHON_PATH, ['visualizer.py'], {
        cwd: tempDir,
        maxBuffer: 8 * 1024 * 1024,
      });

      return execution.stdout;
    } catch (error) {
      const executionError = error as {
        stdout?: string;
        stderr?: string;
        message?: string;
      };

      throw new Error(
        [executionError.stderr, executionError.stdout, executionError.message]
          .filter(Boolean)
          .join('\n\n'),
      );
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

describe('visualization runtime parity', () => {
  it('keeps field-validator steps aligned with the real model when model validators are also present', async () => {
    const exercise: ExerciseDefinition = {
      id: 'visualizer-runtime-parity',
      title: 'Visualizer runtime parity',
      description: 'Ensures field walkthrough matches real validation.',
      templateCode: [
        'from pydantic import BaseModel, field_validator, model_validator',
        '',
        '{{MODEL_SCHEMA}}',
        '',
        'print("ready")',
      ].join('\n'),
      placeholders: [
        {
          id: 'MODEL_SCHEMA',
          defaultCode: [
            'class PricingRow(BaseModel):',
            '    discounted_price: float',
            '    actual_price: float',
            '    rating_count: int',
            '',
            '    @field_validator("rating_count", mode="before")',
            '    @classmethod',
            '    def parse_rating_count(cls, value: str) -> int:',
            '        cleaned = "".join(char for char in str(value) if char.isdigit())',
            '        return int(cleaned)',
            '',
            '    @model_validator(mode="after")',
            '    def check_price_order(self):',
            '        if self.actual_price < self.discounted_price:',
            '            raise ValueError("actual_price must be >= discounted_price")',
            '        return self',
          ].join('\n'),
        },
      ],
      checks: [],
      fileCsvConfig: {
        files: [
          {
            id: 'rows',
            fileCsvPath: 'fixtures/runtime-parity.csv',
          },
        ],
      },
      visualizationConfig: {
        modelClassName: 'PricingRow',
        modelPlaceholderId: 'MODEL_SCHEMA',
        fieldOrder: ['rating_count'],
        visibleColumns: ['rating_count'],
        maxVisualizedRows: 1,
      },
    };

    const request = buildVisualizationRequest(exercise, {
      MODEL_SCHEMA: exercise.placeholders[0].defaultCode,
    });
    const stdout = await runVisualizationPython(
      request.pythonSource,
      request.csvMountPath,
      [
        'discounted_price,actual_price,rating_count',
        '399,1099,"1,234"',
      ].join('\n'),
    );
    const parsed = parseVisualizationStdout(stdout);

    expect(parsed.rowResults).toEqual([
      {
        rowIndex: 0,
        passed: true,
        validatedRow: {
          discounted_price: 399,
          actual_price: 1099,
          rating_count: 1234,
        },
        errors: [],
      },
    ]);
    expect(parsed.steps).toEqual([
      {
        rowIndex: 0,
        fieldName: 'rating_count',
        passed: true,
        rawValue: '1,234',
        validatedValue: 1234,
        message: 'Accepted as int',
      },
    ]);
  });
});
