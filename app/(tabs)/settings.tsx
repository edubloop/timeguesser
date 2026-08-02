import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View as RNView,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Radius, Spacing, TypeScale } from '@/constants/theme';
import { useSettings, type MapProvider, type TimerOption } from '@/lib/SettingsContext';
import { useTheme, type ThemePreference } from '@/lib/ThemeContext';
import {
  PUBLIC_CACHE_TARGET,
  type FillPublicCachePhase,
  type PublicImageSource,
} from '@/lib/photos';

type PublicProviderOption = 'wikimedia' | 'loc' | 'europeana';
type CacheFillStatus = 'idle' | 'starting' | 'in_progress' | 'success' | 'partial' | 'failure';

interface CacheFillUiState {
  status: CacheFillStatus;
  phase: FillPublicCachePhase | null;
  targetUnseen: number;
  unseenImagesAvailable: number | null;
}

const themeOptions: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const mapOptions: { label: string; value: MapProvider }[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Google', value: 'google' },
];

const timerOptions: { label: string; value: TimerOption }[] = [
  { label: 'Off', value: 0 },
  { label: '60s', value: 60 },
  { label: '120s', value: 120 },
];

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never updated';
  const elapsedMs = Date.now() - timestamp;
  const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60000));
  if (elapsedMinutes < 60) return `Last updated ${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Last updated ${elapsedHours} hr ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Last updated ${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
}

function derivePublicProviders(source: PublicImageSource): PublicProviderOption[] {
  if (source === 'wikimedia+loc+europeana') return ['wikimedia', 'loc', 'europeana'];
  if (source === 'loc') return ['loc'];
  if (source === 'europeana') return ['europeana'];
  return ['wikimedia'];
}

function toPublicImageSource(providers: PublicProviderOption[]): PublicImageSource {
  if (providers.length > 1) return 'wikimedia+loc+europeana';
  if (providers[0] === 'loc') return 'loc';
  if (providers[0] === 'europeana') return 'europeana';
  return 'wikimedia';
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
      return 'Searching sources';
    case 'downloading':
      return 'Downloading images';
    case 'finalizing':
      return 'Finalizing cache';
    default:
      return 'Preparing cache';
  }
}

function Segmented<T extends string | number>({
  options,
  selected,
  onSelect,
  minItemWidth = 52,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
  minItemWidth?: number;
}) {
  const borderColor = useThemeColor({}, 'border');
  const card = useThemeColor({}, 'card');
  const text = useThemeColor({}, 'text');
  const backgroundTertiary = useThemeColor({}, 'backgroundTertiary');

  return (
    <View style={[styles.segmented, { borderColor, backgroundColor: backgroundTertiary }]}>
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Pressable
            key={String(option.value)}
            style={[
              styles.segmentItem,
              {
                flex: 1,
                backgroundColor: active ? card : 'transparent',
                borderColor: active ? borderColor : 'transparent',
                minWidth: minItemWidth,
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text numberOfLines={1} style={[styles.segmentText, { color: text }]}>
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
    clearPublicCache,
    getPublicCacheSummary,
    fillPublicCache,
    hintsEnabled,
    setHintsEnabled,
  } = useSettings();

  const background = useThemeColor({}, 'backgroundSecondary');
  const card = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const tertiaryText = useThemeColor({}, 'tertiaryText');
  const tint = useThemeColor({}, 'tint');
  const scorePoor = useThemeColor({}, 'scorePoor');

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

  const refreshCacheSummary = useCallback(async () => {
    try {
      const summary = await getPublicCacheSummary();
      setCacheSummary(summary);
    } catch {
      // Ignore transient cache-read failures.
    }
  }, [getPublicCacheSummary]);

  useEffect(() => {
    refreshCacheSummary();
  }, [refreshCacheSummary]);

  const publicProviders = useMemo(
    () => derivePublicProviders(publicImageSource),
    [publicImageSource]
  );
  const myPhotosEnabled = photoSource === 'personal' || photoSource === 'mixed';
  const refillActive =
    cacheFillState.status === 'starting' || cacheFillState.status === 'in_progress';
  const refillMessage = titleForFillState(cacheFillState.status, cacheFillState.phase);
  const showCacheSection = publicProviders.length > 0;
  const usageRatio =
    PUBLIC_CACHE_TARGET > 0 ? Math.min(1, cacheSummary.imagesInCache / PUBLIC_CACHE_TARGET) : 0;

  const setPhotoPreferences = useCallback(
    (nextPublic: PublicProviderOption[], nextMyPhotos: boolean) => {
      const hasPublic = nextPublic.length > 0;
      if (hasPublic) {
        setPublicImageSource(toPublicImageSource(nextPublic));
      }
      if (nextMyPhotos && hasPublic) setPhotoSource('mixed');
      else if (nextMyPhotos) setPhotoSource('personal');
      else setPhotoSource('public');
    },
    [setPhotoSource, setPublicImageSource]
  );

  const togglePublicProvider = (provider: PublicProviderOption) => {
    const enabled = publicProviders.includes(provider);
    const next = enabled
      ? publicProviders.filter((item) => item !== provider)
      : [...publicProviders, provider];
    if (next.length === 0 && !myPhotosEnabled) return;
    setPhotoPreferences(next, myPhotosEnabled);
  };

  const toggleMyPhotos = async () => {
    if (!myPhotosEnabled) {
      if (personalRounds.length === 0) {
        const imported = await importPersonalPhotos();
        if (imported.rounds.length === 0) {
          Alert.alert('No photos imported', 'Grant access and try again to enable My Photos.');
          return;
        }
      }
      setPhotoPreferences(publicProviders, true);
      return;
    }

    if (publicProviders.length === 0) return;
    setPhotoPreferences(publicProviders, false);
  };

  const handleFillCache = async () => {
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
      setCacheFillState((current) => ({ ...current, status: 'failure', phase: null }));
    } finally {
      setCacheActionLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear cache?', 'This removes cached public images and seen history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          setCacheActionLoading(true);
          try {
            await clearPublicCache();
            await refreshCacheSummary();
            setCacheFillState({
              status: 'idle',
              phase: null,
              targetUnseen: PUBLIC_CACHE_TARGET,
              unseenImagesAvailable: null,
            });
          } finally {
            setCacheActionLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: card }]}>
      <RNView style={[styles.header, { borderBottomColor: borderColor, backgroundColor: card }]}>
        <Text style={[styles.title, { color: text }]}>Settings</Text>
      </RNView>

      <ScrollView
        style={[styles.container, { backgroundColor: background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.groupCard, { backgroundColor: card }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconChip, { backgroundColor: '#F0EEFF' }]}>
              <FontAwesome name="home" size={18} color="#7B6CF0" />
            </View>
            <RNView style={styles.rowMain}>
              <Text style={styles.rowTitle}>Theme</Text>
            </RNView>
            <Segmented options={themeOptions} selected={preference} onSelect={setPreference} />
          </View>
        </View>

        <View style={[styles.groupCard, { backgroundColor: card }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconChip, { backgroundColor: '#E8F5F3' }]}>
              <FontAwesome name="map-marker" size={18} color="#1A8A7D" />
            </View>
            <RNView style={styles.rowMain}>
              <Text style={styles.rowTitle}>Map Provider</Text>
            </RNView>
            <Segmented options={mapOptions} selected={mapProvider} onSelect={setMapProvider} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: tertiaryText }]}>Photo Sources</Text>
        <View style={[styles.groupCard, { backgroundColor: card }]}>
          {[
            {
              key: 'wikimedia',
              title: 'Wikimedia Commons',
              subtitle: 'Public domain & Creative Commons',
              icon: 'upload',
              iconBg: '#E8F5F3',
              iconColor: '#1A8A7D',
            },
            {
              key: 'loc',
              title: 'Library of Congress',
              subtitle: 'Historical US photos & records',
              icon: 'clock-o',
              iconBg: '#FFF4E8',
              iconColor: '#C4953A',
            },
            {
              key: 'europeana',
              title: 'Europeana',
              subtitle: 'European cultural heritage collections',
              icon: 'map-marker',
              iconBg: '#FFEEF0',
              iconColor: '#B85A3A',
            },
          ].map((item, index) => {
            const checked = publicProviders.includes(item.key as PublicProviderOption);
            return (
              <View
                key={item.key}
                style={[
                  styles.listRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: borderColor },
                ]}
              >
                <RNView style={[styles.listIconChip, { backgroundColor: item.iconBg }]}>
                  <FontAwesome name={item.icon as never} size={18} color={item.iconColor} />
                </RNView>
                <RNView style={styles.listMeta}>
                  <Text style={[styles.listTitle, { color: text }]}>{item.title}</Text>
                  <Text style={[styles.listSubtitle, { color: tertiaryText }]}>
                    {item.subtitle}
                  </Text>
                </RNView>
                <Pressable
                  style={[
                    styles.checkbox,
                    {
                      borderColor: checked ? tint : borderColor,
                      backgroundColor: checked ? tint : 'transparent',
                    },
                  ]}
                  onPress={() => togglePublicProvider(item.key as PublicProviderOption)}
                >
                  {checked ? <FontAwesome name="check" size={12} color="#fff" /> : null}
                </Pressable>
              </View>
            );
          })}

          <View style={[styles.listRow, { borderTopWidth: 1, borderTopColor: borderColor }]}>
            <RNView style={[styles.listIconChip, { backgroundColor: '#F0EEFF' }]}>
              <FontAwesome name="home" size={18} color="#7B6CF0" />
            </RNView>
            <RNView style={styles.listMeta}>
              <Text style={[styles.listTitle, { color: text }]}>My Photos</Text>
              <Text style={[styles.listSubtitle, { color: tertiaryText }]}>
                From your device library ({personalRounds.length})
              </Text>
            </RNView>
            <Pressable
              style={[
                styles.checkbox,
                {
                  borderColor: myPhotosEnabled ? tint : borderColor,
                  backgroundColor: myPhotosEnabled ? tint : 'transparent',
                },
              ]}
              onPress={() => {
                void toggleMyPhotos();
              }}
            >
              {myPhotosEnabled ? <FontAwesome name="check" size={12} color="#fff" /> : null}
            </Pressable>
          </View>
        </View>

        {showCacheSection ? (
          <>
            <Text style={[styles.sectionLabel, { color: tertiaryText }]}>Image Cache</Text>
            <View style={[styles.groupCard, { backgroundColor: card }]}>
              <RNView style={styles.cacheTopRow}>
                <Text style={styles.cacheTitle}>Cached images</Text>
                <Text style={styles.cacheCount}>
                  {cacheSummary.imagesInCache} / {PUBLIC_CACHE_TARGET}
                </Text>
              </RNView>
              <View style={[styles.progressTrack, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${usageRatio * 100}%`, backgroundColor: tint },
                  ]}
                />
              </View>
              <RNView style={styles.cacheMetaRow}>
                <Text style={[styles.cacheMetaLeft, { color: tertiaryText }]}>
                  {formatRelativeTime(cacheSummary.lastUpdatedAt)}
                </Text>
                <Text style={[styles.cacheMetaRight, { color: tertiaryText }]}>
                  {cacheSummary.imagesInCache === 0
                    ? '0.0 MB'
                    : `${(cacheSummary.imagesInCache * 0.11).toFixed(1)} MB`}
                </Text>
              </RNView>

              <View style={[styles.cacheStatRow, { borderTopColor: borderColor }]}>
                <Text style={styles.cacheStatLabel}>Unseen available</Text>
                <Text style={styles.cacheStatValue}>{cacheSummary.unseenImagesAvailable}</Text>
              </View>
              <View style={[styles.cacheStatRow, { borderTopColor: borderColor }]}>
                <Text style={styles.cacheStatLabel}>Seen / played</Text>
                <Text style={styles.cacheStatValue}>{cacheSummary.seenImagesRecorded}</Text>
              </View>

              {cacheFillState.status !== 'idle' ? (
                <RNView style={styles.cacheStatusRow}>
                  {refillActive ? (
                    <ActivityIndicator size="small" color={tint} />
                  ) : (
                    <FontAwesome
                      name={
                        cacheFillState.status === 'failure' ? 'exclamation-circle' : 'check-circle'
                      }
                      size={15}
                      color={cacheFillState.status === 'failure' ? scorePoor : tint}
                    />
                  )}
                  <Text
                    style={[
                      styles.cacheStatusText,
                      { color: cacheFillState.status === 'failure' ? scorePoor : secondaryText },
                    ]}
                  >
                    {refillMessage}
                  </Text>
                </RNView>
              ) : null}

              <RNView style={[styles.cacheActionsRow, { borderTopColor: borderColor }]}>
                <Pressable
                  style={[
                    styles.cacheActionButton,
                    {
                      borderColor: tint,
                      backgroundColor: 'transparent',
                      opacity: cacheActionLoading ? 0.6 : 1,
                    },
                  ]}
                  disabled={cacheActionLoading}
                  onPress={() => {
                    void handleFillCache();
                  }}
                >
                  <Text style={[styles.cacheActionText, { color: tint }]}>Refill Cache</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.cacheActionButton,
                    {
                      borderColor,
                      backgroundColor: 'transparent',
                      opacity: cacheActionLoading ? 0.6 : 1,
                    },
                  ]}
                  disabled={cacheActionLoading}
                  onPress={handleClearCache}
                >
                  <Text style={[styles.cacheActionText, { color: scorePoor }]}>Clear Cache</Text>
                </Pressable>
              </RNView>
            </View>
          </>
        ) : null}

        <View style={[styles.groupCard, { backgroundColor: card }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconChip, { backgroundColor: '#FFF4E8' }]}>
              <FontAwesome name="lightbulb-o" size={18} color="#C4953A" />
            </View>
            <RNView style={styles.rowMain}>
              <Text style={styles.rowTitle}>Hints</Text>
            </RNView>
            <Switch
              value={hintsEnabled}
              onValueChange={setHintsEnabled}
              trackColor={{ false: borderColor, true: tint }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={borderColor}
            />
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: borderColor }]}>
            <View style={[styles.rowIconChip, { backgroundColor: '#E8F5F3' }]}>
              <FontAwesome name="clock-o" size={18} color="#1A8A7D" />
            </View>
            <RNView style={styles.rowMain}>
              <Text style={styles.rowTitle}>Round Timer</Text>
            </RNView>
            <Segmented
              options={timerOptions}
              selected={roundTimer}
              onSelect={setRoundTimer}
              minItemWidth={42}
            />
          </View>
        </View>

        <Text style={[styles.versionFootnote, { color: tertiaryText }]}>TimeGuesser · v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: 20,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    ...TypeScale.title1,
    fontWeight: '700',
  },
  groupCard: {
    borderRadius: Radius.sheet,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowIconChip: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: {
    flex: 1,
    minWidth: 72,
  },
  rowTitle: {
    ...TypeScale.callout,
    fontWeight: '400',
  },
  sectionLabel: {
    ...TypeScale.caption1,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  listIconChip: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listMeta: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    ...TypeScale.callout,
    fontWeight: '400',
  },
  listSubtitle: {
    ...TypeScale.caption1,
    fontWeight: '400',
  },
  checkbox: {
    height: 22,
    width: 22,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheTopRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheTitle: {
    ...TypeScale.subhead,
    fontWeight: '400',
  },
  cacheCount: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  cacheMetaRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheMetaLeft: {
    ...TypeScale.caption1,
    fontWeight: '400',
  },
  cacheMetaRight: {
    ...TypeScale.caption1,
    fontWeight: '400',
  },
  cacheStatRow: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheStatLabel: {
    ...TypeScale.subhead,
    fontWeight: '400',
  },
  cacheStatValue: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  cacheStatusRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cacheStatusText: {
    ...TypeScale.subhead,
    flex: 1,
  },
  cacheActionsRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  cacheActionButton: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cacheActionText: {
    ...TypeScale.footnote,
    fontWeight: '600',
  },
  segmented: {
    borderWidth: 1,
    borderRadius: Radius.sheet,
    padding: 2,
    flexDirection: 'row',
    gap: 2,
    minWidth: 0,
    maxWidth: 220,
  },
  segmentItem: {
    minHeight: 30,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },
  versionFootnote: {
    ...TypeScale.caption1,
    textAlign: 'center',
    fontWeight: '600',
  },
});
