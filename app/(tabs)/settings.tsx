import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Spacing, Radius, TypeScale } from '@/constants/theme';
import { useTheme, ThemePreference } from '@/lib/ThemeContext';
import { useSettings, MapProvider, TimerOption } from '@/lib/SettingsContext';
import {
  PhotoSourcePreference,
  PublicSelectionFilters,
  PublicImageSource,
  PUBLIC_CACHE_TARGET,
  FillPublicCachePhase,
} from '@/lib/photos';
import {
  EXPERIMENT_CATEGORY_LABELS,
  EXPERIMENT_DEFINITIONS,
  ExperimentCategory,
} from '@/lib/experiments';

const themeOptions: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const mapOptions: { label: string; value: MapProvider }[] = [
  { label: 'Apple Maps', value: 'apple' },
  { label: 'Google Maps', value: 'google' },
];

const timerOptions: { label: string; value: TimerOption }[] = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '120s', value: 120 },
];

const photoSourceOptions: { label: string; value: PhotoSourcePreference }[] = [
  { label: 'Public', value: 'public' },
  { label: 'Personal', value: 'personal' },
  { label: 'Mixed', value: 'mixed' },
];

const publicFilterOptions: { label: string; key: keyof PublicSelectionFilters }[] = [
  { label: 'Require street/public context', key: 'requireStreetScene' },
  { label: 'Require people context', key: 'requirePeopleContext' },
  { label: 'Require geographic clues', key: 'requireGeoClues' },
  { label: 'Require temporal clues', key: 'requireTemporalClues' },
  { label: 'Reject indoor-only', key: 'rejectIndoorOnly' },
  { label: 'Reject low-signal objects', key: 'rejectLowSignalObjects' },
  { label: 'Enforce guessability >= 70', key: 'enforceGuessabilityThreshold' },
];

const experimentCategoryOrder: ExperimentCategory[] = ['visual', 'interaction', 'data', 'qa'];

const devPublicImageSourceOptions: { label: string; value: PublicImageSource }[] = [
  { label: 'Wikimedia', value: 'wikimedia' },
  { label: 'LOC', value: 'loc' },
  { label: 'Europeana', value: 'europeana' },
  { label: 'All Three', value: 'wikimedia+loc+europeana' },
];

type CacheFillStatus = 'idle' | 'starting' | 'in_progress' | 'success' | 'partial' | 'failure';

interface CacheFillUiState {
  status: CacheFillStatus;
  phase: FillPublicCachePhase | null;
  targetUnseen: number;
  unseenImagesAvailable: number | null;
}

function titleForFillState(status: CacheFillStatus, phase: FillPublicCachePhase | null) {
  if (status === 'success') return 'Cache ready';
  if (status === 'partial') return 'Cache partially filled';
  if (status === 'failure') return 'Fill failed';
  if (status === 'starting') return 'Starting cache fill...';
  switch (phase) {
    case 'cleaning':
      return 'Preparing cache';
    case 'searching':
      return 'Looking for eligible photos';
    case 'downloading':
      return 'Downloading approved photos';
    case 'finalizing':
      return 'Finalizing cache';
    default:
      return 'Preparing cache';
  }
}

function detailForFillState(state: CacheFillUiState) {
  if (state.status === 'success') {
    return `${state.unseenImagesAvailable ?? state.targetUnseen} unseen photos available.`;
  }
  if (state.status === 'partial') {
    const count = state.unseenImagesAvailable ?? 0;
    return `Reached ${count} of ${state.targetUnseen} unseen. Source limits are currently restricting supply.`;
  }
  if (state.status === 'failure') {
    return 'Could not refill the cache right now. Try again in a moment.';
  }
  if (state.unseenImagesAvailable != null) {
    return `${state.unseenImagesAvailable} of ${state.targetUnseen} unseen available`;
  }
  if (state.phase === 'cleaning') {
    return 'Removing stale entries before refill.';
  }
  if (state.phase === 'finalizing') {
    return 'Saving the latest cache state.';
  }
  return 'Working through available public photos.';
}

function OptionRow<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const inverseText = useThemeColor({}, 'inverseText');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.options, { backgroundColor: 'transparent' }]}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={String(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? tint : 'transparent',
                borderColor: isSelected ? tint : borderColor,
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
                { color: isSelected ? inverseText : textColor },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { preference, setPreference } = useTheme();
  const {
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
    getPublicCacheSummary,
    fillPublicCache,
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
  } = useSettings();
  const borderColor = useThemeColor({}, 'border');
  const cardColor = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const inverseText = useThemeColor({}, 'inverseText');
  const tintSubtle = useThemeColor({}, 'tintSubtle');
  const backgroundColor = useThemeColor({}, 'background');
  const scoreGood = useThemeColor({}, 'scoreGood');
  const scoreFair = useThemeColor({}, 'scoreFair');
  const scorePoor = useThemeColor({}, 'scorePoor');

  const [showImageCriteria, setShowImageCriteria] = useState(false);
  const [cacheSummary, setCacheSummary] = useState({
    imagesInCache: 0,
    seenImagesRecorded: 0,
    unseenImagesAvailable: 0,
    lastUpdatedAt: null as number | null,
  });
  const [cacheActionLoading, setCacheActionLoading] = useState(false);
  const [cacheFillState, setCacheFillState] = useState<CacheFillUiState>({
    status: 'idle',
    phase: null,
    targetUnseen: PUBLIC_CACHE_TARGET,
    unseenImagesAvailable: null,
  });

  const experimentsByCategory = experimentCategoryOrder
    .map((category) => ({
      category,
      items: EXPERIMENT_DEFINITIONS.filter((definition) => definition.category === category),
    }))
    .filter((group) => group.items.length > 0);

  const refreshCacheSummary = useCallback(async () => {
    try {
      const summary = await getPublicCacheSummary();
      setCacheSummary(summary);
    } catch {
      // Ignore transient cache-read errors in settings UI.
    }
  }, [getPublicCacheSummary]);

  useEffect(() => {
    refreshCacheSummary();
  }, [refreshCacheSummary]);

  const lastUpdatedLabel = cacheSummary.lastUpdatedAt
    ? new Date(cacheSummary.lastUpdatedAt).toLocaleString('de-DE')
    : 'Never';

  const handleImport = async () => {
    const imported = await importPersonalPhotos();
    if (imported.warnings.length > 0 && imported.rounds.length === 0) {
      Alert.alert('Import complete', imported.warnings.join('\n'));
      return;
    }

    const lines = [
      `${imported.rounds.length} photo${imported.rounds.length === 1 ? '' : 's'} added.`,
      ...imported.warnings,
    ];
    Alert.alert('Import complete', lines.join('\n'));
  };

  const handleClear = () => {
    clearPersonalPhotos();
  };

  const handleClearPublicCache = () => {
    Alert.alert(
      'Clear public cache?',
      'This removes cached public images and seen history. New images will be fetched automatically when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setCacheActionLoading(true);
            try {
              const summary = await clearPublicCache();
              await refreshCacheSummary();
              Alert.alert(
                'Public cache cleared',
                `Removed ${summary.removedImages} cached image${summary.removedImages === 1 ? '' : 's'} and ${summary.removedSeenEntries} seen record${summary.removedSeenEntries === 1 ? '' : 's'}.`
              );
            } catch {
              Alert.alert('Clear failed', 'Could not clear the public cache right now.');
            } finally {
              setCacheActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleFillPublicCache = async () => {
    setCacheActionLoading(true);
    setCacheFillState({
      status: 'starting',
      phase: 'starting',
      targetUnseen: PUBLIC_CACHE_TARGET,
      unseenImagesAvailable: cacheSummary.unseenImagesAvailable,
    });
    try {
      const summary = await fillPublicCache({
        onProgress: (progress) => {
          setCacheFillState({
            status: progress.phase === 'starting' ? 'starting' : 'in_progress',
            phase: progress.phase,
            targetUnseen: progress.targetUnseen,
            unseenImagesAvailable: progress.unseenImagesAvailable,
          });
        },
      });
      await refreshCacheSummary();
      setCacheFillState({
        status: summary.targetReached ? 'success' : 'partial',
        phase: null,
        targetUnseen: summary.targetUnseen,
        unseenImagesAvailable: summary.unseenImagesAvailable,
      });
    } catch {
      setCacheFillState((current) => ({
        ...current,
        status: 'failure',
        phase: null,
      }));
    } finally {
      setCacheActionLoading(false);
    }
  };

  const cacheFillTitle = titleForFillState(cacheFillState.status, cacheFillState.phase);
  const cacheFillDetail = detailForFillState(cacheFillState);
  const fillIsActive =
    cacheFillState.status === 'starting' || cacheFillState.status === 'in_progress';
  const statusAccentColor =
    cacheFillState.status === 'success'
      ? scoreGood
      : cacheFillState.status === 'partial'
        ? scoreFair
        : cacheFillState.status === 'failure'
          ? scorePoor
          : tint;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionHeader}>Photos</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={styles.label}>Photo Source</Text>
        <OptionRow options={photoSourceOptions} selected={photoSource} onSelect={setPhotoSource} />

        {(photoSource === 'public' || photoSource === 'mixed') && (
          <>
            <Text style={[styles.label, styles.subLabel]}>Public Image Source</Text>
            <OptionRow
              options={devPublicImageSourceOptions}
              selected={publicImageSource}
              onSelect={setPublicImageSource}
            />
            <Text style={[styles.helper, { color: secondaryText }]}>
              Public rounds cache up to {PUBLIC_CACHE_TARGET} images from the selected source(s).
            </Text>

            <View style={[styles.cacheStateCard, { borderColor, backgroundColor: tintSubtle }]}>
              <View style={[styles.cacheStateRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.cacheStateLabel, { color: secondaryText }]}>
                  Images in cache
                </Text>
                <Text style={styles.cacheStateValue}>{cacheSummary.imagesInCache}</Text>
              </View>
              <View style={[styles.cacheStateRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.cacheStateLabel, { color: secondaryText }]}>
                  Seen images recorded
                </Text>
                <Text style={styles.cacheStateValue}>{cacheSummary.seenImagesRecorded}</Text>
              </View>
              <View style={[styles.cacheStateRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.cacheStateLabel, { color: secondaryText }]}>
                  Unseen currently available
                </Text>
                <Text style={styles.cacheStateValue}>{cacheSummary.unseenImagesAvailable}</Text>
              </View>
              <View style={[styles.cacheStateRow, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.cacheStateLabel, { color: secondaryText }]}>Last updated</Text>
                <Text style={styles.cacheStateTimestamp}>{lastUpdatedLabel}</Text>
              </View>
            </View>

            <View style={[styles.cacheActions, { backgroundColor: 'transparent' }]}>
              <Pressable
                style={[
                  styles.actionGhost,
                  styles.singleAction,
                  { borderColor, opacity: cacheActionLoading ? 0.6 : 1 },
                ]}
                onPress={handleFillPublicCache}
                disabled={cacheActionLoading}
              >
                <Text style={styles.actionGhostText}>
                  {fillIsActive ? 'Filling...' : `Fill Cache to ${PUBLIC_CACHE_TARGET} Unseen`}
                </Text>
              </Pressable>

              {cacheFillState.status !== 'idle' && (
                <View
                  style={[
                    styles.cacheFillStatus,
                    {
                      borderColor,
                      backgroundColor:
                        cacheFillState.status === 'failure' ? backgroundColor : tintSubtle,
                    },
                  ]}
                >
                  <View
                    style={[styles.cacheFillStatusIconWrap, { backgroundColor: 'transparent' }]}
                  >
                    {fillIsActive ? (
                      <ActivityIndicator size="small" color={statusAccentColor} />
                    ) : (
                      <FontAwesome
                        name={
                          cacheFillState.status === 'success'
                            ? 'check-circle'
                            : cacheFillState.status === 'partial'
                              ? 'exclamation-circle'
                              : 'times-circle'
                        }
                        size={16}
                        color={statusAccentColor}
                      />
                    )}
                  </View>
                  <View style={[styles.cacheFillStatusBody, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.cacheFillStatusTitle}>{cacheFillTitle}</Text>
                    <Text style={[styles.cacheFillStatusDetail, { color: secondaryText }]}>
                      {cacheFillDetail}
                    </Text>
                  </View>
                </View>
              )}

              <Pressable
                style={[
                  styles.actionGhost,
                  styles.singleAction,
                  { borderColor, opacity: cacheActionLoading ? 0.6 : 1 },
                ]}
                onPress={handleClearPublicCache}
                disabled={cacheActionLoading}
              >
                <Text style={styles.actionGhostText}>Clear Public Cache</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.criteriaToggle, { borderColor }]}
              onPress={() => setShowImageCriteria((prev) => !prev)}
            >
              <Text style={styles.criteriaToggleText}>Image Selection Criteria</Text>
              <FontAwesome
                name={showImageCriteria ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={secondaryText}
              />
            </Pressable>

            {showImageCriteria && (
              <>
                <Text style={[styles.helper, { color: secondaryText }]}>
                  Evaluation mode: all filters default OFF.
                </Text>
                <View style={[styles.filterList, { backgroundColor: 'transparent' }]}>
                  {publicFilterOptions.map((filter) => {
                    const enabled = publicSelectionFilters[filter.key];
                    return (
                      <View
                        key={filter.key}
                        style={[styles.filterRow, { backgroundColor: 'transparent' }]}
                      >
                        <Text style={styles.filterLabel}>{filter.label}</Text>
                        <Pressable
                          style={[
                            styles.toggle,
                            {
                              backgroundColor: enabled ? tint : 'transparent',
                              borderColor,
                            },
                          ]}
                          onPress={() => setPublicSelectionFilter(filter.key, !enabled)}
                        >
                          <Text style={[styles.toggleText, enabled && { color: inverseText }]}>
                            {enabled ? 'ON' : 'OFF'}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}

                  <View style={[styles.filterRow, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.filterLabel}>Show diagnostics</Text>
                    <Pressable
                      style={[
                        styles.toggle,
                        {
                          backgroundColor: photoDiagnosticsEnabled ? tint : 'transparent',
                          borderColor,
                        },
                      ]}
                      onPress={() => setPhotoDiagnosticsEnabled(!photoDiagnosticsEnabled)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          photoDiagnosticsEnabled && { color: inverseText },
                        ]}
                      >
                        {photoDiagnosticsEnabled ? 'ON' : 'OFF'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={[styles.resetFiltersButton, { borderColor }]}
                  onPress={resetPublicSelectionFilters}
                >
                  <Text style={styles.resetFiltersText}>Reset Filters (All Off)</Text>
                </Pressable>
              </>
            )}
          </>
        )}

        <View style={[styles.personalSection, { borderColor, backgroundColor: tintSubtle }]}>
          <Text style={styles.personalTitle}>Personal Photos</Text>
          <Text style={[styles.helper, { color: secondaryText }]}>
            Personal photos available: {personalRounds.length}
          </Text>

          <View style={[styles.actionRow, { backgroundColor: 'transparent' }]}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: tint }]}
              onPress={handleImport}
            >
              <Text style={[styles.actionText, { color: inverseText }]}>
                Import Personal Photos
              </Text>
            </Pressable>
            <Pressable style={[styles.actionGhost, { borderColor }]} onPress={handleClear}>
              <Text style={styles.actionGhostText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Gameplay</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={styles.label}>Round Timer</Text>
        <OptionRow options={timerOptions} selected={roundTimer} onSelect={setRoundTimer} />
      </View>

      <Text style={styles.sectionHeader}>Map</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={styles.label}>Map Provider</Text>
        <OptionRow options={mapOptions} selected={mapProvider} onSelect={setMapProvider} />
      </View>

      <Text style={styles.sectionHeader}>Appearance</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={styles.label}>Theme</Text>
        <OptionRow options={themeOptions} selected={preference} onSelect={setPreference} />
      </View>

      <Text style={styles.sectionHeader}>Hints</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={[styles.toggleRow, { backgroundColor: 'transparent' }]}>
          <Text style={styles.label}>Hints Enabled</Text>
          <Pressable
            style={[
              styles.toggle,
              {
                backgroundColor: hintsEnabled ? tint : 'transparent',
                borderColor,
              },
            ]}
            onPress={() => setHintsEnabled(!hintsEnabled)}
          >
            <Text style={[styles.toggleText, hintsEnabled && { color: inverseText }]}>
              {hintsEnabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>
        <Text style={[styles.helper, { color: secondaryText }]}>
          Deterministic map-based hints only: region, radius, exact location, and full answer tiers.
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Labs / Experiments</Text>
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.helper, { color: secondaryText, marginTop: 0 }]}>
          Experimental features are opt-in and can be reset at any time.
        </Text>

        {experimentsByCategory.map((group) => (
          <View
            key={group.category}
            style={[styles.experimentGroup, { backgroundColor: 'transparent' }]}
          >
            <Text style={styles.experimentGroupTitle}>
              {EXPERIMENT_CATEGORY_LABELS[group.category]}
            </Text>
            {group.items.map((experiment) => {
              const enabled = experimentFlags[experiment.id];
              return (
                <View
                  key={experiment.id}
                  style={[styles.experimentRow, { backgroundColor: 'transparent', borderColor }]}
                >
                  <View style={[styles.experimentMeta, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.experimentTitle}>{experiment.title}</Text>
                    <Text style={[styles.experimentDescription, { color: secondaryText }]}>
                      {experiment.description}
                    </Text>
                    <Text style={[styles.experimentTag, { color: secondaryText }]}>
                      Risk: {experiment.risk.toUpperCase()} - Review by {experiment.reviewBy}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: enabled ? tint : 'transparent',
                        borderColor,
                      },
                    ]}
                    onPress={() => setExperimentFlag(experiment.id, !enabled)}
                  >
                    <Text style={[styles.toggleText, enabled && { color: inverseText }]}>
                      {enabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ))}

        <Pressable
          style={[styles.resetFiltersButton, { borderColor }]}
          onPress={resetExperimentFlags}
        >
          <Text style={styles.resetFiltersText}>Reset Experiments</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.md,
  },
  label: {
    ...TypeScale.callout,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  subLabel: {
    marginTop: Spacing.md,
    ...TypeScale.subhead,
    marginBottom: Spacing.xs,
  },
  sourceBadge: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  lockedInfo: {
    gap: 2,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  optionText: {
    ...TypeScale.subhead,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  helper: {
    marginTop: Spacing.xs,
    ...TypeScale.caption1,
  },
  cacheStateCard: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  cacheStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cacheStateLabel: {
    ...TypeScale.caption1,
  },
  cacheStateValue: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
  cacheStateTimestamp: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },
  cacheActions: {
    marginTop: Spacing.sm,
  },
  cacheFillStatus: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cacheFillStatusIconWrap: {
    minHeight: 18,
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  cacheFillStatusBody: {
    flex: 1,
    gap: 2,
  },
  cacheFillStatusTitle: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
  cacheFillStatusDetail: {
    ...TypeScale.caption1,
    lineHeight: 17,
  },
  criteriaToggle: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  criteriaToggleText: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
  actionGhost: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  singleAction: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  actionGhostText: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  toggleRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  toggleText: {
    ...TypeScale.caption1,
    fontWeight: '700',
  },
  filterList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  filterLabel: {
    flex: 1,
    ...TypeScale.footnote,
  },
  resetFiltersButton: {
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  resetFiltersText: {
    ...TypeScale.caption1,
    fontWeight: '700',
  },
  personalSection: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  personalTitle: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
  experimentGroup: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  experimentGroupTitle: {
    ...TypeScale.footnote,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  experimentRow: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  experimentMeta: {
    flex: 1,
    gap: 2,
  },
  experimentTitle: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
  experimentDescription: {
    ...TypeScale.caption1,
  },
  experimentTag: {
    ...TypeScale.caption2,
  },
});
