import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text, View, useThemeColor } from '@/components/Themed';
import { Radius, Spacing, TypeScale } from '@/constants/theme';

interface PhotoSurfaceProps {
  imageUri: string;
  canRefreshPhoto: boolean;
  refreshLoading: boolean;
  isPersonalPhoto?: boolean;
  onPhotoTap: () => void;
  onPhotoLongPress: () => void;
  onRefreshPhoto: () => void;
}

type ZoomScrollEvent = NativeSyntheticEvent<NativeScrollEvent & { zoomScale?: number }>;

export default function PhotoSurface({
  imageUri,
  canRefreshPhoto,
  refreshLoading,
  isPersonalPhoto = false,
  onPhotoTap,
  onPhotoLongPress,
  onRefreshPhoto,
}: PhotoSurfaceProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomResetVersion, setZoomResetVersion] = useState(0);

  const secondaryText = useThemeColor({}, 'secondaryText');
  const tertiaryText = useThemeColor({}, 'tertiaryText');
  const cardBg = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
    setIsZoomed(false);
    setZoomResetVersion(0);
  }, [imageUri]);

  const handleZoomChange = useCallback((event: ZoomScrollEvent) => {
    const zoomScale = event.nativeEvent.zoomScale;
    if (typeof zoomScale === 'number') {
      setIsZoomed(zoomScale > 1.02);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomResetVersion((prev) => prev + 1);
    setIsZoomed(false);
  }, []);

  const showRefreshAction = canRefreshPhoto || refreshLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        key={`${imageUri}-${zoomResetVersion}`}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        minimumZoomScale={1}
        maximumZoomScale={3}
        bouncesZoom
        scrollEventThrottle={16}
        onScroll={handleZoomChange}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
          {imageFailed && (
            <View style={styles.imageErrorOverlay}>
              <FontAwesome name="picture-o" size={36} color="#888" />
              <Text style={styles.imageErrorText}>Image unavailable</Text>
              {isPersonalPhoto ? (
                <Text style={styles.imageErrorHint}>Re-import photos in Settings</Text>
              ) : (
                showRefreshAction && <Text style={styles.imageErrorHint}>Tap refresh below</Text>
              )}
            </View>
          )}
          {imageLoaded && <View testID="game-photo-loaded" style={styles.qaMarker} />}
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={[styles.photoHint, { color: tertiaryText }]}>
          Double tap or hold to open fullscreen
        </Text>
        <View style={styles.actionsRow}>
          {isZoomed && (
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: cardBg, borderColor }]}
              onPress={handleResetZoom}
            >
              <Text style={[styles.secondaryButtonText, { color: secondaryText }]}>Reset zoom</Text>
            </Pressable>
          )}
          {showRefreshAction && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoPressable: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: 'transparent',
    gap: Spacing.sm,
  },
  photoHint: {
    ...TypeScale.caption1,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  secondaryButtonText: {
    ...TypeScale.caption1,
    fontWeight: '600',
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  refreshText: {
    ...TypeScale.caption2,
    fontWeight: '700',
  },
  qaMarker: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  imageErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: Spacing.sm,
  },
  imageErrorText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  imageErrorHint: {
    color: '#777',
    fontSize: 12,
  },
});
