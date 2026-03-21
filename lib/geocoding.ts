export interface GeocodingResult {
  lat: number;
  lng: number;
  name: string;
}

interface OpenMeteoGeoItem {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
  feature_code?: string;
}

/**
 * Reverse-geocode coordinates to a place name using OpenStreetMap Nominatim.
 * Returns a short label like "Algiers, Algeria" or null on failure.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=en`,
      { headers: { 'User-Agent': 'TimeGuesserApp/1.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const addr = data?.address;
    if (!addr) return null;
    const city = addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.county ?? '';
    const country = addr.country ?? '';
    const parts = [city, country].filter((p: string) => p.length > 0);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

export async function searchLocations(query: string, limit = 5): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const encoded = encodeURIComponent(trimmed);
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=${limit}&language=en&format=json`
    );
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data?.results)) return [];

    return data.results
      .map((item: OpenMeteoGeoItem) => {
        const lat = Number(item?.latitude);
        const lng = Number(item?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const parts = [item?.name, item?.admin1, item?.country]
          .filter((part: unknown) => typeof part === 'string' && part.length > 0)
          .slice(0, 3);

        return {
          lat,
          lng,
          name: parts.join(', '),
        };
      })
      .filter((item: GeocodingResult | null): item is GeocodingResult => item !== null);
  } catch {
    return [];
  }
}
