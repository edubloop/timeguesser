import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { View, useThemeColor } from '@/components/Themed';

interface FullBleedPhotoSurfaceProps {
  imageUri: string;
  onPhotoTap: () => void;
  onPhotoLongPress: () => void;
}

export default function FullBleedPhotoSurface({
  imageUri,
  onPhotoTap,
  onPhotoLongPress,
}: FullBleedPhotoSurfaceProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const tint = useThemeColor({}, 'tint');

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageUri]);

  const handlePhotoPress = useCallback(() => {
    onPhotoTap();
  }, [onPhotoTap]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePhotoPress}
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

        {!imageLoaded && !imageFailed && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={tint} />
          </View>
        )}

        {imageFailed && (
          <View style={styles.imageErrorOverlay}>
            <FontAwesome name="picture-o" size={48} color="#888" />
          </View>
        )}

        {imageLoaded && <View testID="game-photo-loaded" style={styles.qaMarker} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoPressable: {
    flex: 1,
    backgroundColor: '#000',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  imageErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  qaMarker: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
