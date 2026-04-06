import { describe, expect, it } from 'vitest';

import {
  deriveGameScreenPresentation,
  reducePresentationMode,
  type DeriveGameScreenPresentationOptions,
} from '@/lib/gameScreenPresentation';

function makeOptions(
  overrides: Partial<DeriveGameScreenPresentationOptions> = {}
): DeriveGameScreenPresentationOptions {
  return {
    mode: 'photo',
    hasPin: false,
    guessLocked: false,
    showYearPicker: false,
    showResult: false,
    showHintModal: false,
    revealComplete: false,
    isLastRound: false,
    ...overrides,
  };
}

describe('game screen presentation state', () => {
  it('resets back to photo mode on round changes and public refreshes', () => {
    expect(reducePresentationMode('map', 'round-changed')).toBe('photo');
    expect(reducePresentationMode('map', 'public-refresh')).toBe('photo');
  });

  it('returns to photo mode from the compact Photo chip path', () => {
    expect(reducePresentationMode('map', 'return-photo')).toBe('photo');
    expect(reducePresentationMode('photo', 'enter-map')).toBe('map');
  });

  it('keeps the photo-first CTA contract on round entry', () => {
    const presentation = deriveGameScreenPresentation(makeOptions());

    expect(presentation.primaryCta).toEqual({
      label: 'Place Pin on Map',
      disabled: false,
      actionKind: 'enter-map',
    });
    expect(presentation.map).toEqual({
      mapInteractive: false,
      searchVisible: false,
      hintsVisible: false,
      zoomVisible: false,
    });
    expect(presentation.showModeChip).toBe(true);
    expect(presentation.modeChipLabel).toBe('Map');
    expect(presentation.modeChipAction).toBe('enter-map');
  });

  it('disables the CTA in map mode until a pin is placed', () => {
    const presentation = deriveGameScreenPresentation(makeOptions({ mode: 'map' }));

    expect(presentation.primaryCta).toEqual({
      label: 'Place a pin to continue',
      disabled: true,
      actionKind: 'guess',
    });
    expect(presentation.map).toEqual({
      mapInteractive: true,
      searchVisible: true,
      hintsVisible: true,
      zoomVisible: true,
    });
    expect(presentation.modeChipLabel).toBe('Photo');
    expect(presentation.modeChipAction).toBe('return-photo');
  });

  it('restores Guess once a pin exists in map mode', () => {
    const presentation = deriveGameScreenPresentation(makeOptions({ mode: 'map', hasPin: true }));

    expect(presentation.primaryCta).toEqual({
      label: 'Guess',
      disabled: false,
      actionKind: 'guess',
    });
  });

  it('hides non-essential overlays while the year picker is active without changing the mode model', () => {
    const presentation = deriveGameScreenPresentation(
      makeOptions({ mode: 'map', hasPin: true, guessLocked: true, showYearPicker: true })
    );

    expect(presentation.primaryCta).toEqual({
      label: 'Guess',
      disabled: true,
      actionKind: 'guess',
    });
    expect(presentation.map).toEqual({
      mapInteractive: false,
      searchVisible: false,
      hintsVisible: false,
      zoomVisible: false,
    });
    expect(presentation.showModeChip).toBe(false);
  });

  it('preserves result CTA behavior while suppressing mode chrome', () => {
    const presentation = deriveGameScreenPresentation(
      makeOptions({ mode: 'photo', showResult: true, revealComplete: true })
    );

    expect(presentation.primaryCta).toEqual({
      label: 'Next Round',
      disabled: false,
      actionKind: 'next-round',
    });
    expect(presentation.map).toEqual({
      mapInteractive: false,
      searchVisible: false,
      hintsVisible: false,
      zoomVisible: false,
    });
    expect(presentation.showModeChip).toBe(false);
  });

  it('uses See Results on the final round result state', () => {
    const presentation = deriveGameScreenPresentation(
      makeOptions({ mode: 'map', showResult: true, isLastRound: true })
    );

    expect(presentation.primaryCta).toEqual({
      label: 'See Results',
      disabled: true,
      actionKind: 'results',
    });
  });
});
