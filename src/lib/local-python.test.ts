import { describe, expect, it, vi } from 'vitest';

import {
  createLocalPythonErrorMessage,
  execLocalPythonFile,
  getLocalPythonCommands,
} from './local-python';

describe('getLocalPythonCommands', () => {
  it('prioritizes an explicit environment override before fallback commands', () => {
    expect(
      getLocalPythonCommands({
        PYDANTIC_PLAYGROUND_PYTHON: '/custom/python',
      }),
    ).toEqual([
      {
        command: '/custom/python',
        args: [],
      },
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
    ]);
  });
});

describe('execLocalPythonFile', () => {
  it('falls back to the next python command when the first one is missing', async () => {
    const execFileAsync = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('missing'), { code: 'ENOENT' }))
      .mockResolvedValueOnce({
        stdout: 'ok',
        stderr: '',
      });

    await expect(
      execLocalPythonFile(
        {
          cwd: '/tmp/example',
          scriptPath: '/tmp/example/script.py',
        },
        {
          commands: [
            {
              command: '/missing/python',
              args: [],
            },
            {
              command: 'py',
              args: ['-3'],
            },
          ],
          execFileAsync,
        },
      ),
    ).resolves.toEqual({
      stdout: 'ok',
      stderr: '',
    });

    expect(execFileAsync).toHaveBeenNthCalledWith(
      1,
      '/missing/python',
      ['/tmp/example/script.py'],
      {
        cwd: '/tmp/example',
        maxBuffer: 8 * 1024 * 1024,
      },
    );
    expect(execFileAsync).toHaveBeenNthCalledWith(
      2,
      'py',
      ['-3', '/tmp/example/script.py'],
      {
        cwd: '/tmp/example',
        maxBuffer: 8 * 1024 * 1024,
      },
    );
  });

  it('throws a readable error when every local python command is missing', async () => {
    const execFileAsync = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));

    await expect(
      execLocalPythonFile(
        {
          cwd: '/tmp/example',
          scriptPath: '/tmp/example/script.py',
        },
        {
          commands: [
            {
              command: '/missing/python',
              args: [],
            },
            {
              command: 'python3',
              args: [],
            },
          ],
          execFileAsync,
        },
      ),
    ).rejects.toThrow(
      createLocalPythonErrorMessage([
        '/missing/python',
        'python3',
      ]),
    );
  });

  it('treats a broken py launcher like a missing candidate and keeps falling back', async () => {
    const execFileAsync = vi
      .fn()
      .mockRejectedValueOnce(
        Object.assign(
          new Error(
            "Unable to create process using 'C:\\Python313\\python.exe script.py': The system cannot find the file specified.",
          ),
          {
            code: 1,
            stderr:
              "Unable to create process using 'C:\\Python313\\python.exe script.py': The system cannot find the file specified.",
          },
        ),
      )
      .mockResolvedValueOnce({
        stdout: 'ok',
        stderr: '',
      });

    await expect(
      execLocalPythonFile(
        {
          cwd: '/tmp/example',
          scriptPath: '/tmp/example/script.py',
        },
        {
          commands: [
            {
              command: 'py',
              args: ['-3'],
            },
            {
              command: '/working/python',
              args: [],
            },
          ],
          execFileAsync,
        },
      ),
    ).resolves.toEqual({
      stdout: 'ok',
      stderr: '',
    });
  });
});
