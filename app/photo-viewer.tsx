import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

export default function PhotoViewerScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [viewerError, setViewerError] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const inverseText = useThemeColor({}, 'inverseText');
  const tertiaryText = useThemeColor({}, 'tertiaryText');

  useEffect(() => {
    ScreenOrientation.unlockAsync();
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleShare = async () => {
    if (!uri) return;
    try {
      await Share.share({ url: uri, message: uri });
    } catch {
      // Ignore share cancellation/errors.
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 8,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.2) {
          handleClose();
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.photoScroll}
        contentContainerStyle={styles.photoContent}
        minimumZoomScale={1}
        maximumZoomScale={4}
        bouncesZoom
        centerContent
      >
        {uri && !viewerError ? (
          <Pressable
            style={{ width, height, alignItems: 'center', justifyContent: 'center' }}
            onLongPress={handleShare}
            delayLongPress={300}
            testID="photo-viewer-image"
          >
            <Image
              source={{ uri }}
              contentFit="contain"
              style={{ width, height }}
              transition={180}
              onError={() => setViewerError(true)}
            />
          </Pressable>
        ) : (
          <View
            style={[
              { width, height, alignItems: 'center', justifyContent: 'center' },
              { backgroundColor: 'transparent' },
            ]}
          >
            <FontAwesome name="picture-o" size={36} color="#888" />
            <Text style={[styles.fallback, { color: inverseText }]}>Image unavailable</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[styles.topBar, { backgroundColor: 'transparent', top: insets.top + Spacing.lg }]}
      >
        <Pressable
          style={styles.iconButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo viewer"
          testID="photo-viewer-close"
        >
          <FontAwesome name="close" size={20} color={inverseText} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share photo"
          testID="photo-viewer-share"
        >
          <FontAwesome name="share-alt" size={18} color={inverseText} />
        </Pressable>
      </View>

      <Text
        testID="photo-viewer-hint"
        style={[styles.hint, { color: tertiaryText, bottom: insets.bottom + Spacing.lg }]}
      >
        Pinch to zoom · swipe down to close · long-press to share
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoScroll: {
    flex: 1,
  },
  photoContent: {
    flexGrow: 1,
  },
  fallback: {
    ...TypeScale.callout,
    fontWeight: '600',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    ...TypeScale.caption1,
  },
});
