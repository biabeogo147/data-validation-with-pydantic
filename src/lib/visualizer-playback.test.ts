import { describe, expect, it } from 'vitest';

import {
  getInitialPlaybackStepIndex,
  getNextPlaybackStepIndex,
  getPlaybackAdvance,
  getPlaybackControlsState,
  getPreviousPlaybackStepIndex,
} from './visualizer-playback';

describe('visualizer playback helpers', () => {
  it('starts at the first step when playback has work to show', () => {
    expect(getInitialPlaybackStepIndex(3)).toBe(0);
    expect(getInitialPlaybackStepIndex(0)).toBe(-1);
  });

  it('clamps previous and next step navigation inside the valid step range', () => {
    expect(getPreviousPlaybackStepIndex(0, 4)).toBe(0);
    expect(getPreviousPlaybackStepIndex(2, 4)).toBe(1);
    expect(getNextPlaybackStepIndex(0, 4)).toBe(1);
    expect(getNextPlaybackStepIndex(3, 4)).toBe(3);
  });

  it('advances to the next step until the walkthrough reaches the final step', () => {
    expect(getPlaybackAdvance(0, 3)).toEqual({
      kind: 'step',
      stepIndex: 1,
    });
    expect(getPlaybackAdvance(2, 3)).toEqual({
      kind: 'finalize',
    });
    expect(getPlaybackAdvance(-1, 0)).toEqual({
      kind: 'idle',
    });
  });

  it('derives the correct playback control states for the current step', () => {
    expect(
      getPlaybackControlsState({
        currentStepIndex: 0,
        totalSteps: 4,
        isPlaybackPaused: false,
      }),
    ).toEqual({
      canPauseToggle: true,
      canPrevious: false,
      canNext: true,
      isPlaybackPaused: false,
    });

    expect(
      getPlaybackControlsState({
        currentStepIndex: 3,
        totalSteps: 4,
        isPlaybackPaused: true,
      }),
    ).toEqual({
      canPauseToggle: true,
      canPrevious: true,
      canNext: false,
      isPlaybackPaused: true,
    });
  });
});
