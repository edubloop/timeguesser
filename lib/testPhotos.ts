import { RoundData } from './gameState';

/** Hardcoded test rounds for development. Real photo pipeline comes in Phase 5. */
export const TEST_ROUNDS: RoundData[] = [
  {
    id: 'test-1',
    source: 'public',
    location: { lat: 48.8584, lng: 2.2945 },
    year: 1989,
    imageUri: 'https://picsum.photos/seed/timeguesser-paris/1600/1000',
    label: 'City crowd scene',
    locationLabel: 'Paris, France',
  },
  {
    id: 'test-2',
    source: 'public',
    location: { lat: 40.7484, lng: -73.9857 },
    year: 1952,
    imageUri: 'https://picsum.photos/seed/timeguesser-nyc/1600/1000',
    label: 'Street architecture',
    locationLabel: 'New York City, USA',
  },
  {
    id: 'test-3',
    source: 'public',
    location: { lat: 35.6762, lng: 139.6503 },
    year: 2003,
    imageUri: 'https://picsum.photos/seed/timeguesser-tokyo/1600/1000',
    label: 'Urban avenue view',
    locationLabel: 'Tokyo, Japan',
  },
  {
    id: 'test-4',
    source: 'public',
    location: { lat: -33.8568, lng: 151.2153 },
    year: 1975,
    imageUri: 'https://picsum.photos/seed/timeguesser-sydney/1600/1000',
    label: 'Harbor district scene',
    locationLabel: 'Sydney, Australia',
  },
  {
    id: 'test-5',
    source: 'public',
    location: { lat: 30.0444, lng: 31.2357 },
    year: 1934,
    imageUri: 'https://picsum.photos/seed/timeguesser-cairo/1600/1000',
    label: 'Historic city street',
    locationLabel: 'Cairo, Egypt',
  },
];
