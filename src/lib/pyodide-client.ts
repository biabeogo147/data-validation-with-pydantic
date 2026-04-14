import type {
  ExerciseExecutionRequest,
  ExerciseExecutionResponse,
  ExerciseFixtureMount,
} from '../types/exercise';

export type PyodideStage =
  | 'booting'
  | 'loading-packages'
  | 'mounting-fixtures'
  | 'running';

interface PyodideFileSystem {
  analyzePath: (path: string) => { exists: boolean };
  mkdir: (path: string) => void;
  unlink: (path: string) => void;
  writeFile: (
    path: string,
    data: string,
    options: {
      encoding: 'utf8';
    },
  ) => void;
}

interface BrowserPyodide {
  FS: PyodideFileSystem;
  loadPackage: (packages: string[] | string) => Promise<void>;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdin: (options: { error: true }) => void;
  setStdout: (options: { batched: (message: string) => void }) => void;
  setStderr: (options: { batched: (message: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<BrowserPyodide>;
  }
}

const PYODIDE_VERSION = '0.29.3';
const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT_URL = `${PYODIDE_INDEX_URL}pyodide.js`;

let scriptPromise: Promise<void> | null = null;
let pyodidePromise: Promise<BrowserPyodide> | null = null;
const loadedPackages = new Set<string>();

function ensurePyodideScript() {
  if (window.loadPyodide) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[data-pyodide-loader="true"]`,
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load the Pyodide runtime script.')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.dataset.pyodideLoader = 'true';
      script.src = PYODIDE_SCRIPT_URL;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener(
        'error',
        () => reject(new Error('Failed to load the Pyodide runtime script.')),
        { once: true },
      );
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

async function ensurePyodide(
  onStageChange?: (stage: PyodideStage) => void,
): Promise<BrowserPyodide> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      onStageChange?.('booting');
      await ensurePyodideScript();

      if (!window.loadPyodide) {
        throw new Error('Pyodide loaded without exposing window.loadPyodide.');
      }

      const pyodide = await window.loadPyodide({
        indexURL: PYODIDE_INDEX_URL,
      });

      pyodide.setStdin({
        error: true,
      });

      return pyodide;
    })();
  }

  return pyodidePromise;
}

async function ensurePackages(
  pyodide: BrowserPyodide,
  packages: string[],
  onStageChange?: (stage: PyodideStage) => void,
) {
  const missingPackages = packages.filter((pkg) => !loadedPackages.has(pkg));

  if (missingPackages.length === 0) {
    return;
  }

  onStageChange?.('loading-packages');

  try {
    await pyodide.loadPackage(missingPackages);
    for (const pkg of missingPackages) {
      loadedPackages.add(pkg);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load Python packages: ${message}`);
  }
}

function ensureMountDirectory(pyodide: BrowserPyodide, mountPath: string) {
  const segments = mountPath.split('/').filter(Boolean).slice(0, -1);
  let currentPath = '';

  for (const segment of segments) {
    currentPath += `/${segment}`;
    try {
      pyodide.FS.mkdir(currentPath);
    } catch {
      // Directory already exists.
    }
  }
}

async function mountFixture(pyodide: BrowserPyodide, fixture: ExerciseFixtureMount) {
  const response = await fetch(fixture.publicUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch CSV fixture "${fixture.fileCsvPath}" (${response.status}).`,
    );
  }

  const contents = await response.text();

  ensureMountDirectory(pyodide, fixture.mountPath);

  try {
    const existingPath = pyodide.FS.analyzePath(fixture.mountPath);
    if (existingPath.exists) {
      pyodide.FS.unlink(fixture.mountPath);
    }
  } catch {
    // Missing file is expected on the first run.
  }

  pyodide.FS.writeFile(fixture.mountPath, contents, {
    encoding: 'utf8',
  });
}

async function mountFixtures(
  pyodide: BrowserPyodide,
  fixtures: ExerciseFixtureMount[],
  onStageChange?: (stage: PyodideStage) => void,
) {
  if (fixtures.length === 0) {
    return;
  }

  onStageChange?.('mounting-fixtures');

  for (const fixture of fixtures) {
    await mountFixture(pyodide, fixture);
  }
}

export async function runExerciseInPyodide(
  request: ExerciseExecutionRequest,
  onStageChange?: (stage: PyodideStage) => void,
): Promise<ExerciseExecutionResponse> {
  const pyodide = await ensurePyodide(onStageChange);
  await ensurePackages(pyodide, request.packages, onStageChange);
  await mountFixtures(pyodide, request.fixtures, onStageChange);

  const stdout: string[] = [];
  const stderr: string[] = [];

  pyodide.setStdout({
    batched: (message: string) => {
      stdout.push(message);
    },
  });

  pyodide.setStderr({
    batched: (message: string) => {
      stderr.push(message);
    },
  });

  onStageChange?.('running');

  try {
    await pyodide.runPythonAsync(request.code);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Python execution failed: ${message}`);
  }

  return {
    stdout: stdout.join('\n').trim(),
    stderr: stderr.join('\n').trim(),
  };
}
