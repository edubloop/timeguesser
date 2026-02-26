import { Coordinate } from '@/lib/scoring';
import { GeocodingResult } from '@/lib/geocoding';

/** Unified interface for map providers */
export interface MapProviderRef {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  fitToCoordinates: (coords: Coordinate[]) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  removePin: () => void;
  drawLine: (from: Coordinate, to: Coordinate) => void;
  calculateDistance: (from: Coordinate, to: Coordinate) => number;
  searchLocation: (query: string) => Promise<GeocodingResult[]>;
}

export interface MapViewProps {
  /** Called when user taps to place/move pin */
  onPinPlaced: (coordinate: Coordinate) => void;
  /** Current pin position, null = no pin */
  pinCoordinate: Coordinate | null;
  /** Whether pin can be moved (false after guess locked) */
  interactive: boolean;
  /** Answer pin to show during reveal */
  answerCoordinate?: Coordinate | null;
  /** Whether to show distance line between guess and answer */
  showLine?: boolean;
  /** Ref for imperative map controls */
  mapRef?: React.RefObject<MapProviderRef | null>;
}
