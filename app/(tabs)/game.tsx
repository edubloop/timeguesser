import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { setStatusBarStyle, StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ModeChip from '@/components/GameScreen/ModeChip';
import FullBleedPhotoSurface from '@/components/GameScreen/FullBleedPhotoSurface';
import RoundMediaStage from '@/components/GameScreen/RoundMediaStage';
import FloatingControlRail from '@/components/GameScreen/FloatingControlRail';
import EphemeralContext from '@/components/GameScreen/EphemeralContext';
import FloatingCTABar, { FLOATING_CTA_HEIGHT } from '@/components/GameScreen/FloatingCTABar';
import GameMapView, { MapProviderRef } from '@/components/MapView';
import ScoreReveal from '@/components/ScoreReveal';
import SearchBar from '@/components/SearchBar';
import { Text, View, useThemeColor } from '@/components/Themed';
import YearPicker from '@/components/YearPicker';
import { MAX_HINTS, ROUNDS_PER_GAME } from '@/constants/scoring';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';
import { useGameRuntimeSettings } from '@/lib/SettingsContext';
import {
  deriveGameScreenPresentation,
  reducePresentationMode,
  type PresentationMode,
} from '@/lib/gameScreenPresentation';
import { useGame } from '@/lib/gameState';
import { generateHint, getHintPreview, type HintResult, type HintTier } from '@/lib/hints';
import { getReplacementPublicRound } from '@/lib/photos';
import type { Coordinate } from '@/lib/scoring';

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
    roundTimer: _roundTimer,
    hintsEnabled,
    publicImageSource,
    publicSelectionFilters,
    photoDiagnosticsEnabled,
  } = useGameRuntimeSettings();

  const [presentationMode, setPresentationMode] = useState<PresentationMode>('photo');
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
  const [, setTimerPaused] = useState(false);
  const [refreshUsed, setRefreshUsed] = useState(0);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [showScoreOverlay, setShowScoreOverlay] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showHintHistory, setShowHintHistory] = useState(false);
  const [ephemeralContextVisible, setEphemeralContextVisible] = useState(true);

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
  const inverseText = useThemeColor({}, 'inverseText');

  const clearRevealOverlayTimer = useCallback(() => {
    if (revealOverlayTimerRef.current) {
      clearTimeout(revealOverlayTimerRef.current);
      revealOverlayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearRevealOverlayTimer();
    setPresentationMode((currentMode) => reducePresentationMode(currentMode, 'round-changed'));
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
    setEphemeralContextVisible(true);
    pendingGuessPinRef.current = null;
    mapRef.current?.resetView();
  }, [clearRevealOverlayTimer, state.currentRound]);

  useEffect(() => clearRevealOverlayTimer, [clearRevealOverlayTimer]);

  useEffect(() => {
    setStatusBarStyle('light', true);
    return () => setStatusBarStyle('auto', true);
  }, []);

  useEffect(() => {
    if (state.status === 'finished') {
      router.replace('/(tabs)/results');
    }
  }, [state.status]);

  const isIdle = state.status === 'idle';
  const isStarting = state.status === 'starting';
  const isFinished = state.status === 'finished';
  const isLastRound = state.currentRound + 1 >= ROUNDS_PER_GAME;

  const presentation = useMemo(
    () =>
      deriveGameScreenPresentation({
        mode: presentationMode,
        hasPin: Boolean(pinCoordinate ?? lockedGuessPin),
        guessLocked,
        showYearPicker,
        showResult,
        showHintModal,
        revealComplete,
        isLastRound,
      }),
    [
      guessLocked,
      isLastRound,
      lockedGuessPin,
      pinCoordinate,
      presentationMode,
      revealComplete,
      showHintModal,
      showResult,
      showYearPicker,
    ]
  );

  const goHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const openPhotoViewer = useCallback(() => {
    if (!currentRoundData) return;
    router.push({ pathname: '/photo-viewer', params: { uri: currentRoundData.imageUri } });
  }, [currentRoundData]);

  const enterMapMode = useCallback(() => {
    setPresentationMode((currentMode) => reducePresentationMode(currentMode, 'enter-map'));
  }, []);

  const returnPhotoMode = useCallback(() => {
    setPresentationMode((currentMode) => reducePresentationMode(currentMode, 'return-photo'));
  }, []);

  const handleToggleMapMode = useCallback(() => {
    if (presentationMode === 'photo') {
      enterMapMode();
    } else {
      returnPhotoMode();
    }
  }, [presentationMode, enterMapMode, returnPhotoMode]);

  const handlePinPlaced = useCallback((coord: Coordinate) => {
    setPinCoordinate(coord);
  }, []);

  const submitRound = useCallback(
    (pin: Coordinate, year: number) => {
      if (!currentRoundData) return;

      pendingGuessPinRef.current = null;
      submitGuess(pin, year, hintsUsed);
      setShowResult(true);
      setRevealComplete(false);
      setLockedGuessPin(null);

      setTimeout(() => {
        mapRef.current?.fitToCoordinates([pin, currentRoundData.location], {
          top: 80,
          right: 60,
          bottom: 320,
          left: 60,
        });
      }, 150);

      clearRevealOverlayTimer();
      revealOverlayTimerRef.current = setTimeout(() => {
        setShowScoreOverlay(true);
        revealOverlayTimerRef.current = null;
      }, 100);
    },
    [clearRevealOverlayTimer, currentRoundData, hintsUsed, submitGuess]
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
        pendingGuessPinRef.current = null;
        return;
      }

      setShowYearPicker(false);
      submitRound(finalPin, year);
    },
    [lockedGuessPin, pinCoordinate, submitRound]
  );

  const handleYearCancel = useCallback(() => {
    if (showResult || revealOverlayTimerRef.current) return;
    pendingGuessPinRef.current = null;
    setShowYearPicker(false);
    setGuessLocked(false);
    setTimerPaused(false);
    setLockedGuessPin(null);
  }, [showResult]);

  const handleNextRound = useCallback(() => {
    setTimerPaused(false);
    nextRound();
  }, [nextRound]);

  const handlePrimaryCtaPress = useCallback(() => {
    switch (presentation.primaryCta.actionKind) {
      case 'enter-map':
        enterMapMode();
        return;
      case 'guess':
        handleGuessPress();
        return;
      case 'next-round':
      case 'results':
        handleNextRound();
        return;
    }
  }, [enterMapMode, handleGuessPress, handleNextRound, presentation.primaryCta.actionKind]);

  const handleSearchLocation = useCallback((lat: number, lng: number, _name: string) => {
    mapRef.current?.flyTo(lat, lng, 6);
  }, []);

  const handleSearchQuery = useCallback(async (query: string) => {
    if (!mapRef.current) return [];
    return mapRef.current.searchLocation(query);
  }, []);

  const _handleRefreshPhoto = useCallback(async () => {
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
      usedRoundIds: state.rounds.map((round) => round.id),
      publicImageSource,
      publicSelectionFilters,
      diagnosticsEnabled: photoDiagnosticsEnabled,
    }).finally(() => {
      setRefreshLoading(false);
    });

    if (!replacement) return;

    clearRevealOverlayTimer();
    replaceCurrentRound(replacement);
    setPresentationMode((currentMode) => reducePresentationMode(currentMode, 'public-refresh'));
    setRefreshUsed(1);
    setPinCoordinate(null);
    setGuessLocked(false);
    setShowYearPicker(false);
    setShowResult(false);
    setRevealComplete(false);
    setHintsUsed(0);
    setHintHistory([]);
    setRevealLocationHint(false);
    setRevealedYear(null);
    setLockedGuessPin(null);
    setTimerPaused(false);
    setShowScoreOverlay(false);
    setShowHintModal(false);
    setShowHintHistory(false);
    setEphemeralContextVisible(true);
    pendingGuessPinRef.current = null;
    mapRef.current?.resetView();
  }, [
    clearRevealOverlayTimer,
    currentRoundData,
    guessLocked,
    photoDiagnosticsEnabled,
    publicImageSource,
    publicSelectionFilters,
    refreshLoading,
    refreshUsed,
    replaceCurrentRound,
    showResult,
    showYearPicker,
    state.rounds,
  ]);

  const handleHintButtonPress = useCallback(() => {
    if (
      presentationMode !== 'map' ||
      !hintsEnabled ||
      showResult ||
      guessLocked ||
      hintsUsed >= MAX_HINTS
    ) {
      return;
    }
    setShowHintModal(true);
  }, [guessLocked, hintsEnabled, hintsUsed, presentationMode, showResult]);

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

  const _handleTimerUp = useCallback(() => {
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

    clearRevealOverlayTimer();
    revealOverlayTimerRef.current = setTimeout(() => {
      setShowScoreOverlay(true);
      revealOverlayTimerRef.current = null;
    }, 100);
  }, [
    clearRevealOverlayTimer,
    currentRoundData,
    hintsUsed,
    pinCoordinate,
    revealedYear,
    showResult,
    showYearPicker,
    state.status,
    submitRound,
    submitTimeoutRound,
  ]);

  const _handlePhotoTap = useCallback(() => {
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

  const _canRefreshPhoto = useMemo(
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
    [currentRoundData, guessLocked, refreshLoading, refreshUsed, showResult, showYearPicker]
  );

  const answerCoordinate = useMemo(
    () =>
      currentRoundData && (showResult || revealLocationHint) ? currentRoundData.location : null,
    [currentRoundData, revealLocationHint, showResult]
  );

  const nextTier = useMemo(() => Math.min(hintsUsed + 1, MAX_HINTS) as HintTier, [hintsUsed]);
  const hintPreview = useMemo(
    () => (hintsUsed < MAX_HINTS ? getHintPreview(nextTier) : null),
    [hintsUsed, nextTier]
  );

  const _modeChip =
    presentation.showModeChip && presentation.modeChipLabel && presentation.modeChipAction ? (
      <ModeChip
        label={presentation.modeChipLabel}
        onPress={presentation.modeChipAction === 'enter-map' ? enterMapMode : returnPhotoMode}
        testID={presentation.modeChipLabel === 'Map' ? 'map-mode-chip' : 'photo-mode-chip'}
      />
    ) : null;

  const _yearRevealBanner =
    !showResult && revealedYear !== null ? (
      <View style={[styles.yearRevealBanner, { backgroundColor: cardBg, borderColor }]}>
        <Text style={styles.yearRevealTitle}>Year Revealed (Hint Tier 5)</Text>
        <Text style={[styles.yearRevealValue, { color: tint }]}>{revealedYear}</Text>
        <Text style={[styles.yearRevealWarning, { color: scorePoor }]}>Round score will be 0</Text>
      </View>
    ) : null;

  const mapOverlayTop = insets.top + Spacing.xxxl + Spacing.md;
  const railLeftEdge = Layout.safeAreaPadding + Layout.minTouchTarget;
  const resultCtaClearance = FLOATING_CTA_HEIGHT + Spacing.lg + Spacing.md;

  const mapOverlays = (
    <>
      {presentation.map.searchVisible && (
        <View
          style={[
            styles.searchOverlay,
            {
              backgroundColor: 'transparent',
              top: mapOverlayTop,
              left: Layout.safeAreaPadding,
            },
          ]}
        >
          <SearchBar onLocationSelected={handleSearchLocation} onSearch={handleSearchQuery} />
        </View>
      )}

      {presentation.map.hintsVisible && showHintHistory && hintHistory.length > 0 && (
        <View
          style={[
            styles.hintHistoryOverlay,
            {
              top: mapOverlayTop,
              right: railLeftEdge + Spacing.md,
            },
          ]}
        >
          <View
            style={[
              styles.hintCard,
              {
                backgroundColor: 'rgba(8, 11, 16, 0.58)',
                borderColor: 'rgba(255, 255, 255, 0.24)',
              },
            ]}
          >
            <ScrollView
              style={styles.hintHistoryScroll}
              contentContainerStyle={styles.hintHistoryContent}
            >
              {hintHistory.map((hint) => (
                <View
                  key={`${hint.tier}-${hint.type}`}
                  style={[styles.hintItem, { borderTopColor: 'rgba(255, 255, 255, 0.16)' }]}
                >
                  <Text style={styles.hintTierLabel}>Tier {hint.tier}</Text>
                  <Text style={[styles.hintText, { color: 'rgba(241, 245, 249, 0.86)' }]}>
                    {hint.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );

  const resultOverlay =
    lastResult && showScoreOverlay ? (
      <ScoreReveal
        result={lastResult}
        onRevealComplete={handleRevealComplete}
        bottomInset={insets.bottom}
        ctaClearance={resultCtaClearance}
      />
    ) : null;

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

  if (isStarting) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={tint} />
          <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>Loading a fresh game...</Text>
        </View>
      </View>
    );
  }

  if (isFinished || !currentRoundData) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={tint} />
          <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>Preparing the round...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <RoundMediaStage
        mode={presentationMode}
        topInset={insets.top}
        photoSurface={
          <FullBleedPhotoSurface
            imageUri={currentRoundData.imageUri}
            onPhotoTap={openPhotoViewer}
            onPhotoLongPress={openPhotoViewer}
          />
        }
        mapSurface={
          <GameMapView
            onPinPlaced={handlePinPlaced}
            pinCoordinate={pinCoordinate}
            interactive={presentation.map.mapInteractive}
            gestureEnabled={presentation.map.mapInteractive}
            answerCoordinate={answerCoordinate}
            showLine={showResult}
            mapRef={mapRef}
          />
        }
        floatingControlRail={
          <FloatingControlRail
            mode={presentationMode}
            mapToolsVisible={presentation.map.zoomVisible}
            hintsEnabled={hintsEnabled}
            hintsUsed={hintsUsed}
            maxHints={MAX_HINTS}
            hintHistoryAvailable={hintHistory.length > 0}
            hintHistoryVisible={showHintHistory}
            showResult={showResult}
            guessLocked={guessLocked}
            onMapToggle={handleToggleMapMode}
            onHintPress={handleHintButtonPress}
            onToggleHintHistory={toggleHintHistory}
            onZoomIn={handleMapZoomIn}
            onZoomOut={handleMapZoomOut}
            onResetView={handleMapResetView}
            topInset={insets.top}
          />
        }
        ephemeralContext={
          <EphemeralContext
            currentRound={state.currentRound}
            totalRounds={ROUNDS_PER_GAME}
            totalScore={totalScore}
            topInset={insets.top}
            visible={ephemeralContextVisible}
            onDismiss={() => setEphemeralContextVisible(false)}
            onRestore={() => setEphemeralContextVisible(true)}
          />
        }
        floatingCTA={
          <FloatingCTABar
            disabled={presentation.primaryCta.disabled}
            onPress={handlePrimaryCtaPress}
            label={presentation.primaryCta.label}
            testID={showResult ? 'next-round-button' : 'guess-button'}
            bottomInset={insets.bottom}
          />
        }
        mapOverlays={mapOverlays}
        resultOverlay={resultOverlay}
        prioritizeMapSurface={showResult}
      />

      <YearPicker
        visible={showYearPicker}
        onConfirm={handleYearConfirm}
        onCancel={handleYearCancel}
      />

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
    backgroundColor: '#000',
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
  yearRevealBanner: {
    borderWidth: 1,
    borderRadius: Radius.sheet,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  yearRevealTitle: {
    ...TypeScale.caption2,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.7,
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
  searchOverlay: {
    position: 'absolute',
    zIndex: 12,
  },
  hintHistoryOverlay: {
    position: 'absolute',
    zIndex: 12,
    alignItems: 'flex-end',
    maxWidth: 232,
  },
  hintCard: {
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
    color: '#F8FAFC',
  },
  hintText: {
    ...TypeScale.caption1,
    marginTop: Spacing.xs,
  },
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
