import { useEffect, useRef } from 'react';
import { StyleSheet, Pressable, Animated, PanResponder, ScrollView, Share } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Spacing, Radius, TypeScale } from '@/constants/theme';

export default function PhotoViewerScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const translateY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const overlayColor = useThemeColor({}, 'overlay');
  const inverseText = useThemeColor({}, 'inverseText');
  const tertiaryText = useThemeColor({}, 'tertiaryText');

  useEffect(() => {
    ScreenOrientation.unlockAsync();

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
        style={styles.photoScroll}
        contentContainerStyle={styles.photoContent}
        minimumZoomScale={1}
        maximumZoomScale={4}
        bouncesZoom
      >
        {uri ? (
          <Pressable style={styles.photoFrame} onLongPress={handleShare} delayLongPress={300}>
            <Image source={{ uri }} contentFit="contain" style={styles.photo} transition={180} />
          </Pressable>
        ) : (
          <View style={[styles.photoFrame, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.fallback, { color: inverseText }]}>No photo available.</Text>
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
        >
          <FontAwesome name="close" size={20} color={inverseText} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share photo"
        >
          <FontAwesome name="share-alt" size={18} color={inverseText} />
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: tertiaryText, bottom: insets.bottom + Spacing.lg }]}>
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
  photoFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
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
