import { withBasePath } from './github-pages';
import { assembleExerciseCode } from './template';
import type {
  ExerciseCheckDefinition,
  ExerciseCheckResult,
  ExerciseDefinition,
  ExerciseExecutionAdapter,
  ExerciseFixtureMount,
  ExercisePlaceholderValues,
  ExerciseRunResult,
} from '../types/exercise';

const PYTHON_CHECK_MARKER = '__PYDANTIC_PLAYGROUND_CHECK__';

function getFileName(fileCsvPath: string): string {
  const segments = fileCsvPath.split('/').filter(Boolean);
  return segments.at(-1) ?? 'fixture.csv';
}

function uniquePackages(packages: string[]): string[] {
  return Array.from(new Set(packages.filter(Boolean)));
}

function indentLines(source: string, spaces: number): string {
  const padding = ' '.repeat(spaces);
  return source
    .split('\n')
    .map((line) => `${padding}${line}`)
    .join('\n');
}

function buildPythonAssertCheckBlock(
  checks: ExerciseCheckDefinition[],
): string | null {
  const pythonChecks = checks.filter(
    (check): check is Extract<ExerciseCheckDefinition, { kind: 'python_assert' }> =>
      check.kind === 'python_assert',
  );

  if (pythonChecks.length === 0) {
    return null;
  }

  const blocks = pythonChecks.map((check) =>
    [
      'try:',
      indentLines(check.code.trim() || 'pass', 4),
      `    print(${JSON.stringify(PYTHON_CHECK_MARKER)} + __playground_json.dumps({"id": ${JSON.stringify(check.id)}, "label": ${JSON.stringify(check.label)}, "passed": True, "message": ${JSON.stringify(check.successMessage)}}))`,
      'except Exception as __playground_error:',
      `    print(${JSON.stringify(PYTHON_CHECK_MARKER)} + __playground_json.dumps({"id": ${JSON.stringify(check.id)}, "label": ${JSON.stringify(check.label)}, "passed": False, "message": ${JSON.stringify(check.failureMessage ?? check.successMessage)}, "detail": str(__playground_error)}))`,
    ].join('\n'),
  );

  return ['import json as __playground_json', ...blocks].join('\n\n');
}

function parsePythonCheckLines(stdout: string): {
  visibleStdout: string;
  checks: ExerciseCheckResult[];
} {
  const checks: ExerciseCheckResult[] = [];
  const visibleLines: string[] = [];

  for (const line of stdout.split('\n')) {
    if (!line.startsWith(PYTHON_CHECK_MARKER)) {
      visibleLines.push(line);
      continue;
    }

    const payload = line.slice(PYTHON_CHECK_MARKER.length);
    const parsed = JSON.parse(payload) as ExerciseCheckResult;
    checks.push(parsed);
  }

  return {
    visibleStdout: visibleLines.join('\n').trim(),
    checks,
  };
}

function evaluateStdoutChecks(
  checks: ExerciseCheckDefinition[],
  stdout: string,
): ExerciseCheckResult[] {
  return checks
    .filter(
      (check): check is Extract<ExerciseCheckDefinition, { kind: 'stdout_contains' }> =>
        check.kind === 'stdout_contains',
    )
    .map((check) => {
      const passed = stdout.includes(check.text);
      return {
        id: check.id,
        label: check.label,
        passed,
        message: passed ? check.successMessage : check.failureMessage,
      };
    });
}

function buildExecutableCode(
  exercise: ExerciseDefinition,
  values: ExercisePlaceholderValues,
): string {
  const parts = [
    exercise.runConfig?.bootstrapCode?.trim(),
    assembleExerciseCode(exercise, values).trim(),
    buildPythonAssertCheckBlock(exercise.checks)?.trim(),
  ].filter((part): part is string => Boolean(part));

  return parts.join('\n\n');
}

export function getFixtureMounts(
  exercise: Pick<ExerciseDefinition, 'fileCsvConfig'>,
  basePath: string = '/',
): ExerciseFixtureMount[] {
  return exercise.fileCsvConfig.files.map((file) => {
    const fileName = getFileName(file.fileCsvPath);

    return {
      id: file.id,
      fileCsvPath: file.fileCsvPath,
      publicUrl: withBasePath(file.fileCsvPath, basePath),
      mountPath: file.mountPath ?? `/data/${fileName}`,
    };
  });
}

export async function executeExercise(
  exercise: ExerciseDefinition,
  values: ExercisePlaceholderValues,
  adapter: ExerciseExecutionAdapter,
  basePath: string = '/',
): Promise<ExerciseRunResult> {
  const executableCode = buildExecutableCode(exercise, values);
  const fixtures = getFixtureMounts(exercise, basePath);
  const packages = uniquePackages([
    'pydantic',
    ...(exercise.runConfig?.pythonPackages ?? []),
  ]);

  try {
    const execution = await adapter({
      code: executableCode,
      packages,
      fixtures,
    });
    const { visibleStdout, checks: pythonChecks } = parsePythonCheckLines(
      execution.stdout,
    );
    const stdoutChecks = evaluateStdoutChecks(exercise.checks, visibleStdout);
    const checks = [...pythonChecks, ...stdoutChecks];
    const hasFailedCheck = checks.some((check) => !check.passed);

    return {
      status: hasFailedCheck ? 'fail' : 'pass',
      stdout: visibleStdout,
      stderr: execution.stderr.trim(),
      checks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      status: 'error',
      stdout: '',
      stderr: message,
      checks: [],
    };
  }
}
