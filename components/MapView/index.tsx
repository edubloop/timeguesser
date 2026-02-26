import React from 'react';
import { useSettings } from '@/lib/SettingsContext';
import AppleMapView from './AppleMapView';
import GoogleMapView from './GoogleMapView';
import { MapViewProps } from './MapProvider';

export { MapProviderRef } from './MapProvider';

export default function GameMapView(props: MapViewProps) {
  const { mapProvider } = useSettings();

  if (mapProvider === 'google') {
    return <GoogleMapView {...props} />;
  }
  return <AppleMapView {...props} />;
}
