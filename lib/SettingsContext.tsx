import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RoundData } from '@/lib/gameState';
import {
  PhotoSourcePreference,
  PublicImageSource,
  PublicSelectionFilters,
  DEFAULT_PUBLIC_SELECTION_FILTERS,
  PersonalImportSummary,
  ClearPublicCacheSummary,
  PublicCacheSummary,
  FillPublicCacheSummary,
  FillPublicCacheProgress,
  importPersonalPhotosFromLibrary,
  clearPublicImageCache,
  getPublicCacheSummary,
  fillPublicImageCacheToTarget,
  PUBLIC_CACHE_TARGET,
} from '@/lib/photos';
import { LlmProvider, PROVIDER_MODELS } from '@/lib/hints';
import {
  DEFAULT_EXPERIMENT_FLAGS,
  ExperimentFlagId,
  ExperimentFlagsState,
  normalizeExperimentFlags,
} from '@/lib/experiments';

export type MapProvider = 'apple' | 'google';
export type TimerOption = 0 | 30 | 60 | 90 | 120;

const SETTINGS_STORAGE_KEY = 'timeguesser.settings.v1';
const DEV_USE_TEST_PUBLIC_SOURCE =
  __DEV__ && process.env.EXPO_PUBLIC_USE_TEST_PUBLIC_SOURCE === '1';

interface PersistedSettings {
  mapProvider: MapProvider;
  roundTimer: TimerOption;
  photoSource: PhotoSourcePreference;
  publicImageSource: PublicImageSource;
  personalRounds: RoundData[];
  hintProvider: LlmProvider;
  hintModel: string;
  autoHintFallback: boolean;
  hintsEnabled: boolean;
  publicSelectionFilters: PublicSelectionFilters;
  photoDiagnosticsEnabled: boolean;
  experimentFlags: ExperimentFlagsState;
}

interface SettingsContextValue {
  mapProvider: MapProvider;
  setMapProvider: (p: MapProvider) => void;
  roundTimer: TimerOption;
  setRoundTimer: (t: TimerOption) => void;
  photoSource: PhotoSourcePreference;
  setPhotoSource: (source: PhotoSourcePreference) => void;
  publicImageSource: PublicImageSource;
  setPublicImageSource: (source: PublicImageSource) => void;
  personalRounds: RoundData[];
  importPersonalPhotos: () => Promise<PersonalImportSummary>;
  clearPersonalPhotos: () => void;
  clearPublicCache: () => Promise<ClearPublicCacheSummary>;
  getPublicCacheSummary: () => Promise<PublicCacheSummary>;
  fillPublicCache: (options?: {
    onProgress?: (progress: FillPublicCacheProgress) => void;
  }) => Promise<FillPublicCacheSummary>;
  hintProvider: LlmProvider;
  setHintProvider: (provider: LlmProvider) => void;
  hintModel: string;
  setHintModel: (model: string) => void;
  autoHintFallback: boolean;
  setAutoHintFallback: (enabled: boolean) => void;
  hintsEnabled: boolean;
  setHintsEnabled: (enabled: boolean) => void;
  publicSelectionFilters: PublicSelectionFilters;
  setPublicSelectionFilter: (key: keyof PublicSelectionFilters, enabled: boolean) => void;
  resetPublicSelectionFilters: () => void;
  photoDiagnosticsEnabled: boolean;
  setPhotoDiagnosticsEnabled: (enabled: boolean) => void;
  experimentFlags: ExperimentFlagsState;
  setExperimentFlag: (flagId: ExperimentFlagId, enabled: boolean) => void;
  resetExperimentFlags: () => void;
  allowAiRuntimeSwitching: boolean;
}

interface RoundBuildSettingsValue {
  photoSource: PhotoSourcePreference;
  publicImageSource: PublicImageSource;
  personalRounds: RoundData[];
  publicSelectionFilters: PublicSelectionFilters;
  photoDiagnosticsEnabled: boolean;
}

interface ExperimentFlagsContextValue {
  experimentFlags: ExperimentFlagsState;
  setExperimentFlag: (flagId: ExperimentFlagId, enabled: boolean) => void;
  resetExperimentFlags: () => void;
}

interface GameRuntimeSettingsValue {
  roundTimer: TimerOption;
  hintsEnabled: boolean;
  publicImageSource: PublicImageSource;
  publicSelectionFilters: PublicSelectionFilters;
  photoDiagnosticsEnabled: boolean;
}

const DEFAULTS: PersistedSettings = {
  mapProvider: 'apple',
  roundTimer: 0,
  photoSource: 'public',
  publicImageSource: DEV_USE_TEST_PUBLIC_SOURCE ? 'test' : 'wikimedia',
  personalRounds: [],
  hintProvider: 'google',
  hintModel: PROVIDER_MODELS.google[0],
  autoHintFallback: true,
  hintsEnabled: true,
  publicSelectionFilters: { ...DEFAULT_PUBLIC_SELECTION_FILTERS },
  photoDiagnosticsEnabled: false,
  experimentFlags: { ...DEFAULT_EXPERIMENT_FLAGS },
};

const envProvider = String(process.env.EXPO_PUBLIC_LLM_PROVIDER ?? 'google').toLowerCase();
const ENV_PROVIDER: LlmProvider =
  envProvider === 'anthropic' || envProvider === 'openai' || envProvider === 'google'
    ? envProvider
    : 'mock';
const ENV_MODEL =
  process.env.EXPO_PUBLIC_LLM_MODEL &&
  PROVIDER_MODELS[ENV_PROVIDER].includes(process.env.EXPO_PUBLIC_LLM_MODEL)
    ? process.env.EXPO_PUBLIC_LLM_MODEL
    : PROVIDER_MODELS[ENV_PROVIDER][0];
const ALLOW_AI_RUNTIME_SWITCHING =
  __DEV__ || process.env.EXPO_PUBLIC_ALLOW_AI_RUNTIME_SWITCHING === '1';

const SettingsContext = createContext<SettingsContextValue>({
  mapProvider: DEFAULTS.mapProvider,
  setMapProvider: () => {},
  roundTimer: DEFAULTS.roundTimer,
  setRoundTimer: () => {},
  photoSource: DEFAULTS.photoSource,
  setPhotoSource: () => {},
  publicImageSource: DEFAULTS.publicImageSource,
  setPublicImageSource: () => {},
  personalRounds: DEFAULTS.personalRounds,
  importPersonalPhotos: async () => ({ rounds: [], warnings: [] }),
  clearPersonalPhotos: () => {},
  clearPublicCache: async () => ({ removedImages: 0, removedSeenEntries: 0 }),
  getPublicCacheSummary: async () => ({
    imagesInCache: 0,
    seenImagesRecorded: 0,
    unseenImagesAvailable: 0,
    lastUpdatedAt: null,
  }),
  fillPublicCache: async () => ({
    imagesInCache: 0,
    seenImagesRecorded: 0,
    unseenImagesAvailable: 0,
    lastUpdatedAt: null,
    targetUnseen: PUBLIC_CACHE_TARGET,
    targetReached: false,
  }),
  hintProvider: DEFAULTS.hintProvider,
  setHintProvider: () => {},
  hintModel: DEFAULTS.hintModel,
  setHintModel: () => {},
  autoHintFallback: DEFAULTS.autoHintFallback,
  setAutoHintFallback: () => {},
  hintsEnabled: DEFAULTS.hintsEnabled,
  setHintsEnabled: () => {},
  publicSelectionFilters: DEFAULTS.publicSelectionFilters,
  setPublicSelectionFilter: () => {},
  resetPublicSelectionFilters: () => {},
  photoDiagnosticsEnabled: DEFAULTS.photoDiagnosticsEnabled,
  setPhotoDiagnosticsEnabled: () => {},
  experimentFlags: DEFAULTS.experimentFlags,
  setExperimentFlag: () => {},
  resetExperimentFlags: () => {},
  allowAiRuntimeSwitching: ALLOW_AI_RUNTIME_SWITCHING,
});

const MapProviderContext = createContext<MapProvider>(DEFAULTS.mapProvider);

const RoundBuildSettingsContext = createContext<RoundBuildSettingsValue>({
  photoSource: DEFAULTS.photoSource,
  publicImageSource: DEFAULTS.publicImageSource,
  personalRounds: DEFAULTS.personalRounds,
  publicSelectionFilters: DEFAULTS.publicSelectionFilters,
  photoDiagnosticsEnabled: DEFAULTS.photoDiagnosticsEnabled,
});

const GameRuntimeSettingsContext = createContext<GameRuntimeSettingsValue>({
  roundTimer: DEFAULTS.roundTimer,
  hintsEnabled: DEFAULTS.hintsEnabled,
  publicImageSource: DEFAULTS.publicImageSource,
  publicSelectionFilters: DEFAULTS.publicSelectionFilters,
  photoDiagnosticsEnabled: DEFAULTS.photoDiagnosticsEnabled,
});

const ExperimentFlagsContext = createContext<ExperimentFlagsContextValue>({
  experimentFlags: DEFAULTS.experimentFlags,
  setExperimentFlag: () => {},
  resetExperimentFlags: () => {},
});

function normalizeLoadedSettings(value: unknown): PersistedSettings {
  if (!value || typeof value !== 'object') return DEFAULTS;
  const raw = value as Partial<PersistedSettings>;

  // Force-migrate: existing users on 'mock' provider move to 'google'
  const rawProvider =
    raw.hintProvider && PROVIDER_MODELS[raw.hintProvider]
      ? raw.hintProvider
      : DEFAULTS.hintProvider;
  const hintProvider: LlmProvider = rawProvider === 'mock' ? 'google' : rawProvider;
  const allowedModels = PROVIDER_MODELS[hintProvider];
  const hintModel =
    raw.hintModel && allowedModels.includes(raw.hintModel) ? raw.hintModel : allowedModels[0];

  const personalRounds = Array.isArray(raw.personalRounds)
    ? raw.personalRounds
        .filter((round): round is RoundData => {
          return Boolean(
            round &&
            typeof round.id === 'string' &&
            typeof round.imageUri === 'string' &&
            typeof round.year === 'number' &&
            typeof round.location?.lat === 'number' &&
            typeof round.location?.lng === 'number'
          );
        })
        .map((round) => ({ ...round, source: 'personal' as const }))
    : [];

  return {
    mapProvider: raw.mapProvider === 'google' ? 'google' : 'apple',
    roundTimer:
      raw.roundTimer === 30 ||
      raw.roundTimer === 60 ||
      raw.roundTimer === 90 ||
      raw.roundTimer === 120
        ? raw.roundTimer
        : 0,
    photoSource:
      raw.photoSource === 'personal' || raw.photoSource === 'mixed' ? raw.photoSource : 'public',
    publicImageSource:
      raw.publicImageSource === 'test' && DEV_USE_TEST_PUBLIC_SOURCE
        ? 'test'
        : raw.publicImageSource === 'wikimedia+loc+europeana' && __DEV__
          ? 'wikimedia+loc+europeana'
          : 'wikimedia',
    personalRounds,
    hintProvider: ALLOW_AI_RUNTIME_SWITCHING ? hintProvider : ENV_PROVIDER,
    hintModel: ALLOW_AI_RUNTIME_SWITCHING ? hintModel : ENV_MODEL,
    autoHintFallback: raw.autoHintFallback ?? true,
    hintsEnabled: raw.hintsEnabled ?? true,
    publicSelectionFilters: {
      requireStreetScene: raw.publicSelectionFilters?.requireStreetScene ?? false,
      requirePeopleContext: raw.publicSelectionFilters?.requirePeopleContext ?? false,
      requireGeoClues: raw.publicSelectionFilters?.requireGeoClues ?? false,
      requireTemporalClues: raw.publicSelectionFilters?.requireTemporalClues ?? false,
      rejectIndoorOnly: raw.publicSelectionFilters?.rejectIndoorOnly ?? false,
      rejectLowSignalObjects: raw.publicSelectionFilters?.rejectLowSignalObjects ?? false,
      enforceGuessabilityThreshold:
        raw.publicSelectionFilters?.enforceGuessabilityThreshold ?? false,
    },
    photoDiagnosticsEnabled: raw.photoDiagnosticsEnabled ?? false,
    experimentFlags: normalizeExperimentFlags(raw.experimentFlags),
  };
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [mapProvider, setMapProviderState] = useState<MapProvider>(DEFAULTS.mapProvider);
  const [roundTimer, setRoundTimerState] = useState<TimerOption>(DEFAULTS.roundTimer);
  const [photoSource, setPhotoSourceState] = useState<PhotoSourcePreference>(DEFAULTS.photoSource);
  const [publicImageSource, setPublicImageSourceState] = useState<PublicImageSource>(
    DEFAULTS.publicImageSource
  );
  const [personalRounds, setPersonalRounds] = useState<RoundData[]>(DEFAULTS.personalRounds);
  const [hintProvider, setHintProviderState] = useState<LlmProvider>(DEFAULTS.hintProvider);
  const [hintModel, setHintModelState] = useState<string>(DEFAULTS.hintModel);
  const [autoHintFallback, setAutoHintFallbackState] = useState<boolean>(DEFAULTS.autoHintFallback);
  const [hintsEnabled, setHintsEnabledState] = useState<boolean>(DEFAULTS.hintsEnabled);
  const [publicSelectionFilters, setPublicSelectionFilters] = useState<PublicSelectionFilters>(
    DEFAULTS.publicSelectionFilters
  );
  const [photoDiagnosticsEnabled, setPhotoDiagnosticsEnabledState] = useState<boolean>(
    DEFAULTS.photoDiagnosticsEnabled
  );
  const [experimentFlags, setExperimentFlagsState] = useState<ExperimentFlagsState>(
    DEFAULTS.experimentFlags
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const normalized = normalizeLoadedSettings(parsed);
        setMapProviderState(normalized.mapProvider);
        setRoundTimerState(normalized.roundTimer);
        setPhotoSourceState(normalized.photoSource);
        setPublicImageSourceState(normalized.publicImageSource);
        setPersonalRounds(normalized.personalRounds);
        setHintProviderState(normalized.hintProvider);
        setHintModelState(normalized.hintModel);
        setAutoHintFallbackState(normalized.autoHintFallback);
        setHintsEnabledState(normalized.hintsEnabled);
        setPublicSelectionFilters(normalized.publicSelectionFilters);
        setPhotoDiagnosticsEnabledState(normalized.photoDiagnosticsEnabled);
        setExperimentFlagsState(normalized.experimentFlags);
      })
      .catch(() => {
        // Ignore storage read errors.
      })
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedSettings = {
      mapProvider,
      roundTimer,
      photoSource,
      publicImageSource,
      personalRounds,
      hintProvider,
      hintModel,
      autoHintFallback,
      hintsEnabled,
      publicSelectionFilters,
      photoDiagnosticsEnabled,
      experimentFlags,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload)).catch(() => {
      // Ignore storage write errors.
    });
  }, [
    hydrated,
    mapProvider,
    roundTimer,
    photoSource,
    publicImageSource,
    personalRounds,
    hintProvider,
    hintModel,
    autoHintFallback,
    hintsEnabled,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
    experimentFlags,
  ]);

  const setMapProvider = useCallback((p: MapProvider) => setMapProviderState(p), []);
  const setRoundTimer = useCallback((t: TimerOption) => setRoundTimerState(t), []);
  const setPhotoSource = useCallback(
    (source: PhotoSourcePreference) => setPhotoSourceState(source),
    []
  );

  const setPublicImageSource = useCallback(
    (source: PublicImageSource) => setPublicImageSourceState(source),
    []
  );

  const setHintProvider = useCallback((provider: LlmProvider) => {
    if (!ALLOW_AI_RUNTIME_SWITCHING) return;
    setHintProviderState(provider);
    setHintModelState(PROVIDER_MODELS[provider][0]);
  }, []);

  const setHintModel = useCallback(
    (model: string) => {
      if (!ALLOW_AI_RUNTIME_SWITCHING) return;
      if (PROVIDER_MODELS[hintProvider].includes(model)) {
        setHintModelState(model);
      }
    },
    [hintProvider]
  );

  const setAutoHintFallback = useCallback((enabled: boolean) => {
    setAutoHintFallbackState(enabled);
  }, []);

  const setHintsEnabled = useCallback((enabled: boolean) => {
    setHintsEnabledState(enabled);
  }, []);

  const setPublicSelectionFilter = useCallback(
    (key: keyof PublicSelectionFilters, enabled: boolean) => {
      setPublicSelectionFilters((prev) => ({ ...prev, [key]: enabled }));
    },
    []
  );

  const resetPublicSelectionFilters = useCallback(() => {
    setPublicSelectionFilters({ ...DEFAULT_PUBLIC_SELECTION_FILTERS });
  }, []);

  const setPhotoDiagnosticsEnabled = useCallback((enabled: boolean) => {
    setPhotoDiagnosticsEnabledState(enabled);
  }, []);

  const setExperimentFlag = useCallback((flagId: ExperimentFlagId, enabled: boolean) => {
    setExperimentFlagsState((prev) => ({ ...prev, [flagId]: enabled }));
  }, []);

  const resetExperimentFlags = useCallback(() => {
    setExperimentFlagsState({ ...DEFAULT_EXPERIMENT_FLAGS });
  }, []);

  useEffect(() => {
    if (!ALLOW_AI_RUNTIME_SWITCHING) {
      setHintProviderState(ENV_PROVIDER);
      setHintModelState(ENV_MODEL);
    }
  }, []);

  const importPersonalPhotos = useCallback(async () => {
    const imported = await importPersonalPhotosFromLibrary();
    if (imported.rounds.length > 0) {
      setPersonalRounds((prev) => {
        const merged = [...prev, ...imported.rounds];
        const seen = new Set<string>();
        return merged.filter((round) => {
          if (seen.has(round.id)) return false;
          seen.add(round.id);
          return true;
        });
      });
    }
    return imported;
  }, []);

  const clearPersonalPhotos = useCallback(() => {
    setPersonalRounds([]);
  }, []);

  const clearPublicCache = useCallback(async () => {
    return clearPublicImageCache();
  }, []);

  const fetchPublicCacheSummary = useCallback(async () => {
    return getPublicCacheSummary();
  }, []);

  const fillPublicCache = useCallback(
    async (options?: { onProgress?: (progress: FillPublicCacheProgress) => void }) => {
      return fillPublicImageCacheToTarget({
        publicImageSource,
        publicSelectionFilters,
        diagnosticsEnabled: photoDiagnosticsEnabled,
        targetUnseen: PUBLIC_CACHE_TARGET,
        onProgress: options?.onProgress,
      });
    },
    [publicImageSource, publicSelectionFilters, photoDiagnosticsEnabled]
  );

  const settingsValue = useMemo<SettingsContextValue>(
    () => ({
      mapProvider,
      setMapProvider,
      roundTimer,
      setRoundTimer,
      photoSource,
      setPhotoSource,
      publicImageSource,
      setPublicImageSource,
      personalRounds,
      importPersonalPhotos,
      clearPersonalPhotos,
      clearPublicCache,
      getPublicCacheSummary: fetchPublicCacheSummary,
      fillPublicCache,
      hintProvider,
      setHintProvider,
      hintModel,
      setHintModel,
      autoHintFallback,
      setAutoHintFallback,
      hintsEnabled,
      setHintsEnabled,
      publicSelectionFilters,
      setPublicSelectionFilter,
      resetPublicSelectionFilters,
      photoDiagnosticsEnabled,
      setPhotoDiagnosticsEnabled,
      experimentFlags,
      setExperimentFlag,
      resetExperimentFlags,
      allowAiRuntimeSwitching: ALLOW_AI_RUNTIME_SWITCHING,
    }),
    [
      mapProvider,
      setMapProvider,
      roundTimer,
      setRoundTimer,
      photoSource,
      setPhotoSource,
      publicImageSource,
      setPublicImageSource,
      personalRounds,
      importPersonalPhotos,
      clearPersonalPhotos,
      clearPublicCache,
      fetchPublicCacheSummary,
      fillPublicCache,
      hintProvider,
      setHintProvider,
      hintModel,
      setHintModel,
      autoHintFallback,
      setAutoHintFallback,
      hintsEnabled,
      setHintsEnabled,
      publicSelectionFilters,
      setPublicSelectionFilter,
      resetPublicSelectionFilters,
      photoDiagnosticsEnabled,
      setPhotoDiagnosticsEnabled,
      experimentFlags,
      setExperimentFlag,
      resetExperimentFlags,
    ]
  );

  const experimentFlagsValue = useMemo<ExperimentFlagsContextValue>(
    () => ({
      experimentFlags,
      setExperimentFlag,
      resetExperimentFlags,
    }),
    [experimentFlags, setExperimentFlag, resetExperimentFlags]
  );

  const roundBuildSettingsValue = useMemo<RoundBuildSettingsValue>(
    () => ({
      photoSource,
      publicImageSource,
      personalRounds,
      publicSelectionFilters,
      photoDiagnosticsEnabled,
    }),
    [
      photoSource,
      publicImageSource,
      personalRounds,
      publicSelectionFilters,
      photoDiagnosticsEnabled,
    ]
  );

  const gameRuntimeSettingsValue = useMemo<GameRuntimeSettingsValue>(
    () => ({
      roundTimer,
      hintsEnabled,
      publicImageSource,
      publicSelectionFilters,
      photoDiagnosticsEnabled,
    }),
    [roundTimer, hintsEnabled, publicImageSource, publicSelectionFilters, photoDiagnosticsEnabled]
  );

  return (
    <SettingsContext.Provider value={settingsValue}>
      <MapProviderContext.Provider value={mapProvider}>
        <RoundBuildSettingsContext.Provider value={roundBuildSettingsValue}>
          <ExperimentFlagsContext.Provider value={experimentFlagsValue}>
            <GameRuntimeSettingsContext.Provider value={gameRuntimeSettingsValue}>
              {children}
            </GameRuntimeSettingsContext.Provider>
          </ExperimentFlagsContext.Provider>
        </RoundBuildSettingsContext.Provider>
      </MapProviderContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useMapProviderSetting() {
  return useContext(MapProviderContext);
}

export function useRoundBuildSettings() {
  return useContext(RoundBuildSettingsContext);
}

export function useGameRuntimeSettings() {
  return useContext(GameRuntimeSettingsContext);
}

export function useExperimentFlags() {
  return useContext(ExperimentFlagsContext);
}

export function useExperimentFlag(flagId: ExperimentFlagId) {
  const { experimentFlags } = useContext(ExperimentFlagsContext);
  return experimentFlags[flagId];
}
