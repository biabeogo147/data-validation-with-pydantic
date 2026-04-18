export type PlaybackAdvance =
  | {
      kind: 'idle';
    }
  | {
      kind: 'step';
      stepIndex: number;
    }
  | {
      kind: 'finalize';
    };

export function getInitialPlaybackStepIndex(totalSteps: number) {
  return totalSteps > 0 ? 0 : -1;
}

export function getPreviousPlaybackStepIndex(
  currentStepIndex: number,
  totalSteps: number,
) {
  if (totalSteps <= 0) {
    return -1;
  }

  return Math.max(0, Math.min(currentStepIndex - 1, totalSteps - 1));
}

export function getNextPlaybackStepIndex(
  currentStepIndex: number,
  totalSteps: number,
) {
  if (totalSteps <= 0) {
    return -1;
  }

  if (currentStepIndex < 0) {
    return 0;
  }

  return Math.max(0, Math.min(currentStepIndex + 1, totalSteps - 1));
}

export function getPlaybackAdvance(
  currentStepIndex: number,
  totalSteps: number,
): PlaybackAdvance {
  if (totalSteps <= 0) {
    return {
      kind: 'idle',
    };
  }

  if (currentStepIndex >= totalSteps - 1) {
    return {
      kind: 'finalize',
    };
  }

  return {
    kind: 'step',
    stepIndex: getNextPlaybackStepIndex(currentStepIndex, totalSteps),
  };
}

export function getPlaybackControlsState({
  currentStepIndex,
  totalSteps,
  isPlaybackPaused,
}: {
  currentStepIndex: number;
  totalSteps: number;
  isPlaybackPaused: boolean;
}) {
  return {
    canPauseToggle: totalSteps > 0,
    canPrevious: totalSteps > 0 && currentStepIndex > 0,
    canNext: totalSteps > 0 && currentStepIndex >= 0 && currentStepIndex < totalSteps - 1,
    isPlaybackPaused,
  };
}

export function getPlaybackStepDetail(stepIndex: number, totalSteps: number) {
  if (stepIndex < 0 || totalSteps <= 0) {
    return 'Preparing the field-by-field visualization...';
  }

  return `Validating step ${stepIndex + 1} of ${totalSteps} across the CSV file...`;
}
