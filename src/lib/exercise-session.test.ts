import { describe, expect, it } from 'vitest';

import { createInitialExerciseSessionState } from './exercise-session';
import type { ExerciseDefinition } from '../types/exercise';

const exercises: ExerciseDefinition[] = [
  {
    id: 'intro',
    title: 'Intro',
    description: 'Intro exercise',
    templateCode: '{{MODEL}}',
    placeholders: [
      {
        id: 'MODEL',
        defaultCode: 'class Intro: pass',
      },
    ],
    runConfig: {},
    checks: [],
    fileCsvConfig: {
      files: [],
    },
  },
  {
    id: 'advanced',
    title: 'Advanced',
    description: 'Advanced exercise',
    templateCode: '{{MODEL}}\n{{SCRIPT}}',
    placeholders: [
      {
        id: 'MODEL',
        defaultCode: 'class Advanced: pass',
      },
      {
        id: 'SCRIPT',
        defaultCode: 'print("ready")',
      },
    ],
    runConfig: {},
    checks: [],
    fileCsvConfig: {
      files: [],
    },
  },
];

describe('createInitialExerciseSessionState', () => {
  it('creates a fresh session state for the selected exercise', () => {
    expect(
      createInitialExerciseSessionState(exercises, 'advanced'),
    ).toEqual({
      selectedExerciseId: 'advanced',
      draftsByExerciseId: {
        intro: {
          MODEL: 'class Intro: pass',
        },
        advanced: {
          MODEL: 'class Advanced: pass',
          SCRIPT: 'print("ready")',
        },
      },
      activePlaceholderByExerciseId: {
        intro: 'MODEL',
        advanced: 'MODEL',
      },
      showSolutionByExerciseId: {},
    });
  });

  it('falls back to the first exercise when no selection is provided', () => {
    expect(createInitialExerciseSessionState(exercises).selectedExerciseId).toBe(
      'intro',
    );
  });

  it('resets all drafts and ui flags instead of preserving previous edits', () => {
    const nextState = createInitialExerciseSessionState(exercises, 'intro');

    expect(nextState.draftsByExerciseId.advanced.SCRIPT).toBe('print("ready")');
    expect(nextState.activePlaceholderByExerciseId.advanced).toBe('MODEL');
    expect(nextState.showSolutionByExerciseId).toEqual({});
  });
});
