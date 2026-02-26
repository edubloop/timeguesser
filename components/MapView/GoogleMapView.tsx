import React, { useRef, useImperativeHandle, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, {
  Marker,
  Polyline,
  MapPressEvent,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { MapViewProps, MapProviderRef } from './MapProvider';
import { Coordinate } from '@/lib/scoring';
import { searchLocations } from '@/lib/geocoding';
import { useThemeColor } from '@/components/Themed';

const DEFAULT_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 120,
  longitudeDelta: 120,
};

function zoomRegion(region: Region, factor: number): Region {
  const latitudeDelta = Math.max(0.0008, Math.min(170, region.latitudeDelta * factor));
  const longitudeDelta = Math.max(0.0008, Math.min(350, region.longitudeDelta * factor));
  return {
    ...region,
    latitudeDelta,
    longitudeDelta,
  };
}

function calculateDistance(a: Coordinate, b: Coordinate): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export default function GoogleMapView({
  onPinPlaced,
  pinCoordinate,
  interactive,
  answerCoordinate,
  showLine,
  mapRef,
}: MapViewProps) {
  const internalRef = useRef<RNMapView>(null);
  const latestRegionRef = useRef<Region>(DEFAULT_REGION);
  const playerPinColor = useThemeColor({}, 'mapPinPlayer');
  const answerPinColor = useThemeColor({}, 'mapPinAnswer');
  const distanceLineColor = useThemeColor({}, 'mapDistanceLine');

  useImperativeHandle(
    mapRef,
    () => ({
      flyTo: (lat: number, lng: number, zoom = 10) => {
        internalRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 180 / Math.pow(2, zoom),
            longitudeDelta: 360 / Math.pow(2, zoom),
          },
          800
        );
      },
      fitToCoordinates: (coords) => {
        if (coords.length === 0) return;
        internalRef.current?.fitToCoordinates(
          coords.map((c) => ({ latitude: c.lat, longitude: c.lng })),
          {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: false,
          }
        );
      },
      zoomIn: () => {
        const nextRegion = zoomRegion(latestRegionRef.current, 0.6);
        internalRef.current?.animateToRegion(nextRegion, 250);
      },
      zoomOut: () => {
        const nextRegion = zoomRegion(latestRegionRef.current, 1.7);
        internalRef.current?.animateToRegion(nextRegion, 250);
      },
      resetView: () => {
        internalRef.current?.animateToRegion(DEFAULT_REGION, 350);
      },
      removePin: () => {
        // Pin state is controlled by parent component.
      },
      drawLine: () => {
        // Line rendering is controlled by parent component props.
      },
      calculateDistance,
      searchLocation: async (query: string) => searchLocations(query),
    }),
    []
  );

  const handlePress = useCallback(
    (e: MapPressEvent) => {
      if (!interactive) return;
      const { latitude, longitude } = e.nativeEvent.coordinate;
      onPinPlaced({ lat: latitude, lng: longitude });
    },
    [interactive, onPinPlaced]
  );

  return (
    <RNMapView
      ref={internalRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      onPress={handlePress}
      initialRegion={DEFAULT_REGION}
      onRegionChangeComplete={(region) => {
        latestRegionRef.current = region;
      }}
      showsUserLocation={false}
      showsCompass={false}
      rotateEnabled={false}
      pitchEnabled={false}>
      {pinCoordinate && (
        <Marker
          coordinate={{
            latitude: pinCoordinate.lat,
            longitude: pinCoordinate.lng,
          }}
          pinColor={playerPinColor}
          title="Your guess"
        />
      )}
      {answerCoordinate && (
        <Marker
          coordinate={{
            latitude: answerCoordinate.lat,
            longitude: answerCoordinate.lng,
          }}
          pinColor={answerPinColor}
          title="Answer"
        />
      )}
      {showLine && pinCoordinate && answerCoordinate && (
        <Polyline
          coordinates={[
            { latitude: pinCoordinate.lat, longitude: pinCoordinate.lng },
            { latitude: answerCoordinate.lat, longitude: answerCoordinate.lng },
          ]}
          strokeColor={distanceLineColor}
          strokeWidth={2}
          lineDashPattern={[8, 4]}
        />
      )}
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
