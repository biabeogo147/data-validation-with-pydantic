export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExercisePlaceholder {
  id: string;
  label?: string;
  description?: string;
  defaultCode: string;
  required?: boolean;
  placeholderHint?: string;
}

export interface ExerciseRunConfig {
  pythonPackages?: string[];
  bootstrapCode?: string;
  timeoutMs?: number;
}

export interface ExercisePythonAssertCheck {
  id: string;
  kind: 'python_assert';
  label: string;
  code: string;
  successMessage: string;
  failureMessage?: string;
}

export interface ExerciseStdoutContainsCheck {
  id: string;
  kind: 'stdout_contains';
  label: string;
  text: string;
  successMessage: string;
  failureMessage: string;
}

export type ExerciseCheckDefinition =
  | ExercisePythonAssertCheck
  | ExerciseStdoutContainsCheck;

export interface ExerciseCsvFile {
  id: string;
  fileCsvPath: string;
  mountPath?: string;
  description?: string;
}

export interface ExerciseFileCsvConfig {
  files: ExerciseCsvFile[];
}

export interface ExerciseUiConfig {
  runButtonLabel?: string;
  editorLayout?: 'single' | 'split';
  outputMode?: 'stacked' | 'inline';
}

export interface ExerciseLearningConfig {
  estimatedMinutes?: number;
  objectives?: string[];
  prerequisites?: string[];
}

export interface ExerciseDefinition {
  id: string;
  title: string;
  shortTitle?: string;
  description: string;
  difficulty?: ExerciseDifficulty;
  tags?: string[];
  templateCode: string;
  placeholders: ExercisePlaceholder[];
  runConfig: ExerciseRunConfig;
  checks: ExerciseCheckDefinition[];
  fileCsvConfig?: ExerciseFileCsvConfig;
  hints?: string[];
  explanation?: string;
  solutionCode?: Record<string, string>;
  visible?: boolean;
  uiConfig?: ExerciseUiConfig;
  learningConfig?: ExerciseLearningConfig;
}

export type ExercisePlaceholderValues = Record<string, string>;

export interface ExerciseFixtureMount {
  id: string;
  fileCsvPath: string;
  publicUrl: string;
  mountPath: string;
  description?: string;
}

export interface ExerciseExecutionRequest {
  code: string;
  packages: string[];
  fixtures: ExerciseFixtureMount[];
}

export interface ExerciseExecutionResponse {
  stdout: string;
  stderr: string;
}

export type ExerciseExecutionAdapter = (
  request: ExerciseExecutionRequest,
) => Promise<ExerciseExecutionResponse>;

export interface ExerciseCheckResult {
  id: string;
  label: string;
  passed: boolean;
  message: string;
  detail?: string;
}

export interface ExerciseRunResult {
  status: 'pass' | 'fail' | 'error';
  stdout: string;
  stderr: string;
  assembledCode: string;
  checks: ExerciseCheckResult[];
}
