export type PresentationMode = 'photo' | 'map';

export type PresentationEvent = 'round-changed' | 'public-refresh' | 'enter-map' | 'return-photo';

export type PrimaryCtaActionKind = 'enter-map' | 'guess' | 'next-round' | 'results';

export interface PrimaryCtaState {
  label: string;
  disabled: boolean;
  actionKind: PrimaryCtaActionKind;
}

export interface MapOverlayState {
  mapInteractive: boolean;
  searchVisible: boolean;
  hintsVisible: boolean;
  zoomVisible: boolean;
}

export interface GameScreenPresentationDerivedState {
  primaryCta: PrimaryCtaState;
  map: MapOverlayState;
  showModeChip: boolean;
  modeChipLabel: 'Map' | 'Photo' | null;
  modeChipAction: 'enter-map' | 'return-photo' | null;
}

export interface DeriveGameScreenPresentationOptions {
  mode: PresentationMode;
  hasPin: boolean;
  guessLocked: boolean;
  showYearPicker: boolean;
  showResult: boolean;
  showHintModal: boolean;
  revealComplete: boolean;
  isLastRound: boolean;
}

export function reducePresentationMode(
  currentMode: PresentationMode,
  event: PresentationEvent
): PresentationMode {
  switch (event) {
    case 'round-changed':
    case 'public-refresh':
    case 'return-photo':
      return 'photo';
    case 'enter-map':
      return 'map';
    default:
      return currentMode;
  }
}

export function deriveGameScreenPresentation({
  mode,
  hasPin,
  guessLocked,
  showYearPicker,
  showResult,
  showHintModal,
  revealComplete,
  isLastRound,
}: DeriveGameScreenPresentationOptions): GameScreenPresentationDerivedState {
  const suppressNonEssentialOverlays = showResult || showYearPicker || showHintModal;
  const activeMapMode = mode === 'map' && !suppressNonEssentialOverlays;
  const mapInteractive = activeMapMode && !guessLocked;
  const mapToolsVisible = activeMapMode && !guessLocked;

  let primaryCta: PrimaryCtaState;

  if (showResult) {
    primaryCta = {
      label: isLastRound ? 'See Results' : 'Next Round',
      disabled: !revealComplete,
      actionKind: isLastRound ? 'results' : 'next-round',
    };
  } else if (mode === 'photo') {
    primaryCta = {
      label: 'Place Pin on Map',
      disabled: false,
      actionKind: 'enter-map',
    };
  } else if (guessLocked || showYearPicker) {
    primaryCta = {
      label: 'Guess',
      disabled: true,
      actionKind: 'guess',
    };
  } else if (!hasPin) {
    primaryCta = {
      label: 'Place a pin to continue',
      disabled: true,
      actionKind: 'guess',
    };
  } else {
    primaryCta = {
      label: 'Guess',
      disabled: false,
      actionKind: 'guess',
    };
  }

  const showModeChip = !suppressNonEssentialOverlays;
  const modeChipLabel = showModeChip ? (mode === 'photo' ? 'Map' : 'Photo') : null;
  const modeChipAction = showModeChip ? (mode === 'photo' ? 'enter-map' : 'return-photo') : null;

  return {
    primaryCta,
    map: {
      mapInteractive,
      searchVisible: mapToolsVisible,
      hintsVisible: mapToolsVisible,
      zoomVisible: mapToolsVisible,
    },
    showModeChip,
    modeChipLabel,
    modeChipAction,
  };
}
