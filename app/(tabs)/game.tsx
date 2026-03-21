import { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View, useThemeColor } from '@/components/Themed';
import { useGame } from '@/lib/gameState';
import { Coordinate } from '@/lib/scoring';
import { ROUNDS_PER_GAME, MAX_HINTS } from '@/constants/scoring';
import GameMapView, { MapProviderRef } from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import GuessButton from '@/components/GuessButton';
import YearPicker from '@/components/YearPicker';
import RoundTimer from '@/components/RoundTimer';
import ScoreReveal from '@/components/ScoreReveal';
import { useGameRuntimeSettings } from '@/lib/SettingsContext';
import { generateHint, getHintPreview, HintResult, HintTier } from '@/lib/hints';
import { getReplacementPublicRound } from '@/lib/photos';
import { formatWholeNumber } from '@/lib/numberFormat';
import { Layout, Spacing, Radius, TypeScale } from '@/constants/theme';

interface HeaderPanelProps {
  currentRound: number;
  totalScore: number;
  roundTimer: number;
  timerPaused: boolean;
  showYearPicker: boolean;
  showResult: boolean;
  showHintModal: boolean;
  onTimeUp: () => void;
  cardBg: string;
  borderColor: string;
  secondaryText: string;
}

const HeaderPanel = memo(function HeaderPanel({
  currentRound,
  totalScore,
  roundTimer,
  timerPaused,
  showYearPicker,
  showResult,
  showHintModal,
  onTimeUp,
  cardBg,
  borderColor,
  secondaryText,
}: HeaderPanelProps) {
  return (
    <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
      <View style={[styles.headerLeft, { backgroundColor: 'transparent' }]}>
        <Text style={styles.roundLabel}>
          Round {currentRound + 1}/{ROUNDS_PER_GAME}
        </Text>
        <Text style={[styles.scoreLabel, { color: secondaryText }]}>
          {formatWholeNumber(totalScore)} pts
        </Text>
      </View>

      {roundTimer > 0 && (
        <View style={{ backgroundColor: 'transparent' }}>
          <RoundTimer
            key={`${currentRound}-${roundTimer}`}
            duration={roundTimer}
            paused={timerPaused || showYearPicker || showResult || showHintModal}
            onTimeUp={onTimeUp}
          />
        </View>
      )}
    </View>
  );
});

interface PhotoPanelProps {
  imageUri: string;
  borderColor: string;
  secondaryText: string;
  canRefreshPhoto: boolean;
  refreshLoading: boolean;
  onPhotoTap: () => void;
  onPhotoLongPress: () => void;
  onRefreshPhoto: () => void;
  cardBg: string;
  tint: string;
}

const PhotoPanel = memo(function PhotoPanel({
  imageUri,
  borderColor,
  secondaryText,
  canRefreshPhoto,
  refreshLoading,
  onPhotoTap,
  onPhotoLongPress,
  onRefreshPhoto,
  cardBg,
  tint,
}: PhotoPanelProps) {
  return (
    <View style={[styles.photoArea, { borderBottomColor: borderColor }]}>
      <ScrollView
        style={styles.photoScroll}
        contentContainerStyle={styles.photoContent}
        minimumZoomScale={1}
        maximumZoomScale={3}
        bouncesZoom
      >
        <Pressable
          onPress={onPhotoTap}
          onLongPress={onPhotoLongPress}
          delayLongPress={300}
          style={styles.photoPressable}
          testID="game-photo"
        >
          <Image
            source={{ uri: imageUri }}
            contentFit="cover"
            transition={180}
            style={styles.photoImage}
          />
        </Pressable>
      </ScrollView>
      <View style={[styles.photoFooter, { backgroundColor: 'transparent' }]}>
        <Text style={[styles.photoHint, { color: secondaryText }]}>
          Double tap or hold to open fullscreen
        </Text>
        {canRefreshPhoto && (
          <Pressable
            style={[styles.refreshButton, { borderColor, backgroundColor: cardBg }]}
            disabled={refreshLoading}
            onPress={onRefreshPhoto}
          >
            {refreshLoading ? (
              <ActivityIndicator size="small" color={tint} />
            ) : (
              <FontAwesome name="refresh" size={12} color={tint} />
            )}
            <Text style={[styles.refreshText, { color: tint }]}>
              {refreshLoading ? 'Refreshing...' : 'Refresh (1 left)'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const {
    state,
    currentRoundData,
    submitGuess,
    submitTimeoutRound,
    replaceCurrentRound,
    nextRound,
    totalScore,
  } = useGame();
  const {
    roundTimer,
    hintsEnabled,
    publicImageSource,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
  } = useGameRuntimeSettings();

  const [pinCoordinate, setPinCoordinate] = useState<Coordinate | null>(null);
  const [guessLocked, setGuessLocked] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [revealComplete, setRevealComplete] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintHistory, setHintHistory] = useState<HintResult[]>([]);
  const [revealLocationHint, setRevealLocationHint] = useState(false);
  const [revealedYear, setRevealedYear] = useState<number | null>(null);
  const [lockedGuessPin, setLockedGuessPin] = useState<Coordinate | null>(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [refreshUsed, setRefreshUsed] = useState(0);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [showScoreOverlay, setShowScoreOverlay] = useState(false);

  // Hint UI state
  const [showHintModal, setShowHintModal] = useState(false);
  const [showHintHistory, setShowHintHistory] = useState(false);

  const mapRef = useRef<MapProviderRef | null>(null);
  const lastTapRef = useRef(0);
  const revealOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingGuessPinRef = useRef<Coordinate | null>(null);

  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const bgColor = useThemeColor({}, 'background');
  const overlayColor = useThemeColor({}, 'overlay');
  const scorePoor = useThemeColor({}, 'scorePoor');
  const tintSubtle = useThemeColor({}, 'tintSubtle');
  const inverseText = useThemeColor({}, 'inverseText');

  useEffect(() => {
    if (revealOverlayTimerRef.current) {
      clearTimeout(revealOverlayTimerRef.current);
      revealOverlayTimerRef.current = null;
    }
    setPinCoordinate(null);
    setGuessLocked(false);
    setShowResult(false);
    setShowYearPicker(false);
    setRevealComplete(false);
    setHintsUsed(0);
    setHintHistory([]);
    setRevealLocationHint(false);
    setRevealedYear(null);
    setLockedGuessPin(null);
    setTimerPaused(false);
    setRefreshUsed(0);
    setRefreshLoading(false);
    setShowScoreOverlay(false);
    setShowHintModal(false);
    setShowHintHistory(false);
    pendingGuessPinRef.current = null;
  }, [state.currentRound]);

  useEffect(() => {
    return () => {
      if (revealOverlayTimerRef.current) {
        clearTimeout(revealOverlayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.status === 'finished') {
      router.replace('/(tabs)/results');
    }
  }, [state.status]);

  const isIdle = state.status === 'idle';
  const isFinished = state.status === 'finished';

  const goHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const openPhotoViewer = useCallback(() => {
    if (!currentRoundData) return;
    router.push({ pathname: '/photo-viewer', params: { uri: currentRoundData.imageUri } });
  }, [currentRoundData]);

  const handlePinPlaced = useCallback((coord: Coordinate) => {
    setPinCoordinate(coord);
  }, []);

  const submitRound = useCallback(
    (pin: Coordinate, year: number) => {
      if (!currentRoundData) return;

      submitGuess(pin, year, hintsUsed);
      setShowResult(true);
      setRevealComplete(false);
      setLockedGuessPin(null);

      mapRef.current?.fitToCoordinates([pin, currentRoundData.location]);

      if (revealOverlayTimerRef.current) {
        clearTimeout(revealOverlayTimerRef.current);
      }
      revealOverlayTimerRef.current = setTimeout(() => {
        setShowScoreOverlay(true);
        revealOverlayTimerRef.current = null;
      }, 100);
    },
    [currentRoundData, hintsUsed, submitGuess]
  );

  const handleGuessPress = useCallback(() => {
    if (!pinCoordinate) return;
    pendingGuessPinRef.current = pinCoordinate;
    setLockedGuessPin(pinCoordinate);
    setGuessLocked(true);
    setTimerPaused(true);

    if (revealedYear !== null) {
      submitRound(pinCoordinate, revealedYear);
      return;
    }

    setShowYearPicker(true);
  }, [pinCoordinate, revealedYear, submitRound]);

  const handleYearConfirm = useCallback(
    (year: number) => {
      const finalPin = lockedGuessPin ?? pinCoordinate ?? pendingGuessPinRef.current;
      if (!finalPin) {
        setShowYearPicker(false);
        setGuessLocked(false);
        setTimerPaused(false);
        return;
      }
      setShowYearPicker(false);
      submitRound(finalPin, year);
    },
    [lockedGuessPin, pinCoordinate, submitRound]
  );

  const handleYearCancel = useCallback(() => {
    if (showResult || revealOverlayTimerRef.current) return;
    setShowYearPicker(false);
    setGuessLocked(false);
    setTimerPaused(false);
    setLockedGuessPin(null);
  }, [showResult]);

  const handleNextRound = useCallback(() => {
    setTimerPaused(false);
    nextRound();
  }, [nextRound]);

  const handleSearchLocation = useCallback((lat: number, lng: number, _name: string) => {
    mapRef.current?.flyTo(lat, lng, 6);
  }, []);

  const handleSearchQuery = useCallback(async (query: string) => {
    if (!mapRef.current) return [];
    return mapRef.current.searchLocation(query);
  }, []);

  const handleRefreshPhoto = useCallback(async () => {
    if (
      !currentRoundData ||
      showResult ||
      guessLocked ||
      showYearPicker ||
      refreshUsed >= 1 ||
      refreshLoading ||
      currentRoundData.source !== 'public'
    ) {
      return;
    }

    setRefreshLoading(true);

    const replacement = await getReplacementPublicRound({
      currentRound: currentRoundData,
      usedRoundIds: state.rounds.map((r) => r.id),
      publicImageSource,
      publicSelectionFilters,
      diagnosticsEnabled: photoDiagnosticsEnabled,
    }).finally(() => {
      setRefreshLoading(false);
    });

    if (!replacement) return;

    replaceCurrentRound(replacement);
    setRefreshUsed(1);
    setPinCoordinate(null);
    setGuessLocked(false);
    setHintsUsed(0);
    setHintHistory([]);
    setRevealLocationHint(false);
    setRevealedYear(null);
    setLockedGuessPin(null);
    setShowHintHistory(false);
  }, [
    currentRoundData,
    showResult,
    guessLocked,
    showYearPicker,
    refreshUsed,
    refreshLoading,
    state.rounds,
    publicImageSource,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
    replaceCurrentRound,
  ]);

  const handleHintButtonPress = useCallback(() => {
    if (!hintsEnabled || showResult || guessLocked || hintsUsed >= MAX_HINTS) return;
    setShowHintModal(true);
  }, [hintsEnabled, showResult, guessLocked, hintsUsed]);

  const handleGetHint = useCallback(() => {
    if (!currentRoundData) return;

    const nextTier = (hintsUsed + 1) as HintTier;
    const hint = generateHint(currentRoundData, nextTier);

    setHintsUsed(nextTier);
    setHintHistory((prev) => [...prev, hint]);
    setShowHintModal(false);

    if (hint.regionBounds) {
      const { north, south, west, east } = hint.regionBounds;
      const corners: Coordinate[] = [
        { lat: north, lng: west },
        { lat: south, lng: east },
      ];
      mapRef.current?.fitToCoordinates(corners);
    }

    if (hint.circle) {
      const { center, radiusKm } = hint.circle;
      const degLat = radiusKm / 111;
      const degLng = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
      const corners: Coordinate[] = [
        { lat: center.lat + degLat, lng: center.lng - degLng },
        { lat: center.lat - degLat, lng: center.lng + degLng },
      ];
      mapRef.current?.fitToCoordinates(corners);
    }

    if (nextTier >= 4) {
      setRevealLocationHint(true);
      mapRef.current?.flyTo(currentRoundData.location.lat, currentRoundData.location.lng, 10);
    }

    if (nextTier === 5) {
      setRevealedYear(currentRoundData.year);
    }
  }, [currentRoundData, hintsUsed]);

  const handleTimerUp = useCallback(() => {
    if (!currentRoundData || showResult || showYearPicker || state.status !== 'playing') return;

    setTimerPaused(true);
    setGuessLocked(true);

    if (pinCoordinate) {
      setLockedGuessPin(pinCoordinate);
      if (revealedYear !== null) {
        submitRound(pinCoordinate, revealedYear);
      } else {
        setShowYearPicker(true);
      }
      return;
    }

    submitTimeoutRound(hintsUsed);
    setShowResult(true);
    setRevealComplete(false);
    setShowScoreOverlay(false);
    mapRef.current?.fitToCoordinates([currentRoundData.location]);

    if (revealOverlayTimerRef.current) {
      clearTimeout(revealOverlayTimerRef.current);
    }
    revealOverlayTimerRef.current = setTimeout(() => {
      setShowScoreOverlay(true);
      revealOverlayTimerRef.current = null;
    }, 100);
  }, [
    currentRoundData,
    showResult,
    showYearPicker,
    state.status,
    pinCoordinate,
    revealedYear,
    submitRound,
    submitTimeoutRound,
    hintsUsed,
  ]);

  const handlePhotoTap = useCallback(() => {
    if (!currentRoundData) return;

    const now = Date.now();
    if (now - lastTapRef.current < 500) {
      openPhotoViewer();
    }
    lastTapRef.current = now;
  }, [currentRoundData, openPhotoViewer]);

  const toggleHintHistory = useCallback(() => {
    setShowHintHistory((prev) => !prev);
  }, []);

  const handleMapZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleMapZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleMapResetView = useCallback(() => {
    mapRef.current?.resetView();
  }, []);

  const closeHintModal = useCallback(() => {
    setShowHintModal(false);
  }, []);

  const noopPress = useCallback(() => {}, []);

  const handleRevealComplete = useCallback(() => {
    setRevealComplete(true);
  }, []);

  const lastResult = useMemo(
    () => (showResult ? state.results[state.results.length - 1] : null),
    [showResult, state.results]
  );

  const canRefreshPhoto = useMemo(
    () =>
      Boolean(
        currentRoundData &&
        !showResult &&
        !guessLocked &&
        !showYearPicker &&
        currentRoundData.source === 'public' &&
        refreshUsed < 1 &&
        !refreshLoading
      ),
    [currentRoundData, showResult, guessLocked, showYearPicker, refreshUsed, refreshLoading]
  );

  const answerCoordinate = useMemo(
    () =>
      currentRoundData && (showResult || revealLocationHint) ? currentRoundData.location : null,
    [currentRoundData, showResult, revealLocationHint]
  );

  const nextTier = useMemo(() => Math.min(hintsUsed + 1, MAX_HINTS) as HintTier, [hintsUsed]);
  const hintPreview = useMemo(
    () => (hintsUsed < MAX_HINTS ? getHintPreview(nextTier) : null),
    [hintsUsed, nextTier]
  );

  if (isIdle) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Start a game from the Home screen</Text>
          <Pressable style={[styles.navButton, { backgroundColor: tint }]} onPress={goHome}>
            <Text style={[styles.navButtonText, { color: inverseText }]}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isFinished || !currentRoundData) return null;

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <HeaderPanel
        currentRound={state.currentRound}
        totalScore={totalScore}
        roundTimer={roundTimer}
        timerPaused={timerPaused}
        showYearPicker={showYearPicker}
        showResult={showResult}
        showHintModal={showHintModal}
        onTimeUp={handleTimerUp}
        cardBg={cardBg}
        borderColor={borderColor}
        secondaryText={secondaryText}
      />

      {!showResult && revealedYear !== null && (
        <View style={[styles.yearRevealBanner, { backgroundColor: cardBg, borderColor }]}>
          <Text style={styles.yearRevealTitle}>Year Revealed (Hint Tier 5)</Text>
          <Text style={[styles.yearRevealValue, { color: tint }]}>{revealedYear}</Text>
          <Text style={[styles.yearRevealWarning, { color: scorePoor }]}>
            Round score will be 0
          </Text>
        </View>
      )}

      <PhotoPanel
        imageUri={currentRoundData.imageUri}
        borderColor={borderColor}
        secondaryText={secondaryText}
        canRefreshPhoto={canRefreshPhoto}
        refreshLoading={refreshLoading}
        onPhotoTap={handlePhotoTap}
        onPhotoLongPress={openPhotoViewer}
        onRefreshPhoto={handleRefreshPhoto}
        cardBg={cardBg}
        tint={tint}
      />

      <View style={styles.mapArea}>
        <GameMapView
          onPinPlaced={handlePinPlaced}
          pinCoordinate={pinCoordinate}
          interactive={!guessLocked}
          answerCoordinate={answerCoordinate}
          showLine={showResult}
          mapRef={mapRef}
        />

        {!guessLocked && (
          <View
            style={[
              styles.searchOverlay,
              {
                backgroundColor: 'transparent',
                top: insets.top + Spacing.md,
                left: Layout.safeAreaPadding,
              },
            ]}
          >
            <SearchBar onLocationSelected={handleSearchLocation} onSearch={handleSearchQuery} />
          </View>
        )}

        <View
          style={[
            styles.zoomOverlay,
            {
              backgroundColor: 'transparent',
              right: Layout.safeAreaPadding,
              bottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          <Pressable
            style={[styles.zoomButton, { backgroundColor: cardBg, borderColor }]}
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            onPress={handleMapZoomIn}
          >
            <Text style={styles.zoomSymbol}>+</Text>
          </Pressable>
          <Pressable
            style={[styles.zoomButton, { backgroundColor: cardBg, borderColor }]}
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            onPress={handleMapZoomOut}
          >
            <Text style={styles.zoomSymbol}>-</Text>
          </Pressable>
          <Pressable
            style={[styles.zoomButton, { backgroundColor: cardBg, borderColor }]}
            accessibilityRole="button"
            accessibilityLabel="Reset map view"
            onPress={handleMapResetView}
          >
            <FontAwesome name="globe" size={16} color={tint} />
          </Pressable>
        </View>

        {/* Hint button + optional collapsible history */}
        {!showResult && hintsEnabled && (
          <View
            style={[
              styles.hintOverlay,
              {
                backgroundColor: 'transparent',
                top: insets.top + Spacing.md,
                right: Layout.safeAreaPadding,
              },
            ]}
          >
            <View style={[styles.hintButtonRow, { backgroundColor: 'transparent' }]}>
              {/* Main hint action button */}
              <Pressable
                style={[styles.hintButton, { backgroundColor: cardBg, borderColor }]}
                onPress={handleHintButtonPress}
                accessibilityRole="button"
                accessibilityLabel="Get hint"
                testID="hint-open"
                disabled={hintsUsed >= MAX_HINTS || guessLocked}
              >
                <FontAwesome name="lightbulb-o" size={20} color={tint} />
                <View style={[styles.hintBadge, { backgroundColor: tint }]}>
                  <Text style={[styles.hintBadgeText, { color: inverseText }]}>{hintsUsed}</Text>
                </View>
              </Pressable>

              {/* Toggle history visibility */}
              {hintHistory.length > 0 && (
                <Pressable
                  style={[styles.hintToggle, { backgroundColor: cardBg, borderColor }]}
                  onPress={toggleHintHistory}
                >
                  <FontAwesome
                    name={showHintHistory ? 'chevron-up' : 'chevron-down'}
                    size={10}
                    color={secondaryText}
                  />
                </Pressable>
              )}
            </View>

            {/* Collapsible hint history */}
            {showHintHistory && hintHistory.length > 0 && (
              <View style={[styles.hintCard, { backgroundColor: tintSubtle, borderColor }]}>
                <ScrollView
                  style={styles.hintHistoryScroll}
                  contentContainerStyle={styles.hintHistoryContent}
                >
                  {hintHistory.map((hint) => (
                    <View
                      key={`${hint.tier}-${hint.type}`}
                      style={[styles.hintItem, { borderTopColor: borderColor }]}
                    >
                      <Text style={styles.hintTierLabel}>Tier {hint.tier}</Text>
                      <Text style={[styles.hintText, { color: secondaryText }]}>{hint.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {lastResult && showScoreOverlay && (
          <ScoreReveal
            result={lastResult}
            onRevealComplete={handleRevealComplete}
            bottomInset={insets.bottom}
          />
        )}
      </View>

      {!showResult ? (
        <GuessButton
          disabled={!pinCoordinate || guessLocked}
          onPress={handleGuessPress}
          label={revealedYear !== null ? 'GUESS (year locked)' : undefined}
          testID="guess-button"
          bottomInset={insets.bottom}
        />
      ) : (
        <GuessButton
          disabled={!revealComplete}
          onPress={handleNextRound}
          label={state.currentRound + 1 < ROUNDS_PER_GAME ? 'NEXT ROUND' : 'SEE RESULTS'}
          testID="next-round-button"
          bottomInset={insets.bottom}
        />
      )}

      <YearPicker
        visible={showYearPicker}
        onConfirm={handleYearConfirm}
        onCancel={handleYearCancel}
      />

      {/* ---- Hint confirmation modal ---- */}
      <Modal
        visible={showHintModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeHintModal}
      >
        <Pressable
          testID="hint-modal-backdrop"
          style={[styles.modalBackdrop, { backgroundColor: overlayColor }]}
          onPress={closeHintModal}
        >
          <Pressable
            testID="hint-modal"
            style={[styles.hintModal, { backgroundColor: bgColor, borderColor }]}
            onPress={noopPress}
          >
            {hintPreview && (
              <>
                <Text style={styles.hintModalTitle}>
                  Hint {hintPreview.tier} of {MAX_HINTS}
                </Text>
                <Text style={[styles.hintModalSubtitle, { color: tint }]}>{hintPreview.title}</Text>
                <Text style={[styles.hintModalDesc, { color: secondaryText }]}>
                  {hintPreview.description}
                </Text>
                <View style={[styles.hintModalCostRow, { backgroundColor: 'transparent' }]}>
                  <Text style={styles.hintModalCostLabel}>Cost:</Text>
                  <Text
                    style={[
                      styles.hintModalCostValue,
                      { color: hintPreview.cost === 0 ? tint : scorePoor },
                    ]}
                  >
                    {hintPreview.costLabel}
                  </Text>
                </View>
                {hintPreview.scoringWarning && (
                  <Text style={[styles.hintModalWarning, { color: scorePoor }]}>
                    {hintPreview.scoringWarning}
                  </Text>
                )}
                <View style={[styles.hintModalButtons, { backgroundColor: 'transparent' }]}>
                  <Pressable
                    style={[styles.hintModalCancel, { borderColor }]}
                    onPress={closeHintModal}
                    testID="hint-cancel"
                  >
                    <Text style={styles.hintModalConfirmText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.hintModalConfirm, { backgroundColor: tint }]}
                    onPress={handleGetHint}
                    testID="hint-confirm"
                  >
                    <Text style={[styles.hintModalConfirmText, { color: inverseText }]}>
                      Get Hint
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emptyText: {
    ...TypeScale.callout,
    opacity: 0.5,
    marginBottom: Spacing.xl,
  },
  navButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.buttonY,
    borderRadius: Radius.sheet,
  },
  navButtonText: {
    ...TypeScale.callout,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  roundLabel: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  scoreLabel: {
    ...TypeScale.footnote,
    marginTop: 2,
  },
  photoArea: {
    flex: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  yearRevealBanner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearRevealTitle: {
    ...TypeScale.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  yearRevealValue: {
    ...TypeScale.headline,
    fontWeight: '800',
    marginTop: 2,
  },
  yearRevealWarning: {
    ...TypeScale.caption2,
    fontWeight: '600',
    marginTop: 2,
  },
  photoScroll: {
    flex: 1,
  },
  photoContent: {
    flexGrow: 1,
  },
  photoPressable: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoHint: {
    ...TypeScale.caption1,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  photoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  refreshText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  mapArea: {
    flex: 6,
    position: 'relative',
  },
  searchOverlay: {
    position: 'absolute',
    zIndex: 10,
  },
  hintOverlay: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'flex-end',
    maxWidth: 200,
  },
  hintButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hintButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  hintBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  hintBadgeText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  hintToggle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  hintCard: {
    marginTop: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    maxHeight: 180,
    minWidth: 180,
  },
  hintHistoryScroll: {},
  hintHistoryContent: {
    gap: Spacing.sm,
  },
  hintItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.sm,
  },
  hintTierLabel: {
    ...TypeScale.caption2,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  hintText: {
    ...TypeScale.caption1,
    marginTop: Spacing.xs,
  },
  zoomOverlay: {
    position: 'absolute',
    zIndex: 10,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  zoomSymbol: {
    ...TypeScale.headline,
    fontWeight: '700',
  },

  // ---- Hint Modal ----
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintModal: {
    width: '85%',
    maxWidth: 340,
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  hintModalTitle: {
    ...TypeScale.footnote,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  hintModalSubtitle: {
    ...TypeScale.title3,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  hintModalDesc: {
    ...TypeScale.subhead,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  hintModalCostRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  hintModalCostLabel: {
    ...TypeScale.subhead,
    fontWeight: '600',
  },
  hintModalCostValue: {
    ...TypeScale.callout,
    fontWeight: '800',
  },
  hintModalWarning: {
    ...TypeScale.caption1,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  hintModalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  hintModalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sheet,
    borderWidth: 1,
    alignItems: 'center',
  },
  hintModalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sheet,
    alignItems: 'center',
  },
  hintModalConfirmText: {
    ...TypeScale.subhead,
    fontWeight: '700',
  },
});
