/// <reference types="node" />

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const DEFAULT_MAX_BUFFER = 8 * 1024 * 1024;

export interface LocalPythonCommand {
  command: string;
  args: string[];
}

type PythonExecutionError = NodeJS.ErrnoException & {
  stderr?: string;
};

type ExecLocalPythonAsync = (
  file: string,
  args: string[],
  options: {
    cwd: string;
    maxBuffer: number;
  },
) => Promise<{
  stdout: string;
  stderr: string;
}>;

function dedupeCommands(commands: LocalPythonCommand[]) {
  const seen = new Set<string>();

  return commands.filter((command) => {
    const key = `${command.command}::${command.args.join(' ')}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function getLocalPythonCommands(
  environment: Record<string, string | undefined> = process.env,
) {
  const override = environment.PYDANTIC_PLAYGROUND_PYTHON?.trim();
  const commands: LocalPythonCommand[] = [];

  if (override) {
    commands.push({
      command: override,
      args: [],
    });
  }

  commands.push(
    {
      command: 'D:/Anaconda/python.exe',
      args: [],
    },
    {
      command: 'python3',
      args: [],
    },
    {
      command: 'python',
      args: [],
    },
    {
      command: 'py',
      args: ['-3'],
    },
  );

  return dedupeCommands(commands);
}

function formatCommandForDisplay(command: LocalPythonCommand) {
  return [command.command, ...command.args].join(' ');
}

export function createLocalPythonErrorMessage(triedCommands: string[]) {
  return `Could not find a usable local Python executable. Tried: ${triedCommands.join(', ')}`;
}

function shouldTreatAsMissingPython(error: PythonExecutionError) {
  const diagnostics = [error.message, error.stderr]
    .filter((value): value is string => Boolean(value))
    .join('\n');

  return (
    error.code === 'ENOENT' ||
    diagnostics.includes('Unable to create process using') ||
    diagnostics.includes('The system cannot find the file specified')
  );
}

export async function execLocalPythonFile(
  {
    cwd,
    scriptPath,
    maxBuffer = DEFAULT_MAX_BUFFER,
  }: {
    cwd: string;
    scriptPath: string;
    maxBuffer?: number;
  },
  {
    commands = getLocalPythonCommands(),
    execFileAsync: runner = execFileAsync,
  }: {
    commands?: LocalPythonCommand[];
    execFileAsync?: ExecLocalPythonAsync;
  } = {},
) {
  for (const command of commands) {
    try {
      return await runner(
        command.command,
        [...command.args, scriptPath],
        {
          cwd,
          maxBuffer,
        },
      );
    } catch (error) {
      const executionError = error as PythonExecutionError;

      if (shouldTreatAsMissingPython(executionError)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    createLocalPythonErrorMessage(commands.map(formatCommandForDisplay)),
  );
}
