export interface GeocodingResult {
  lat: number;
  lng: number;
  name: string;
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
      .map((item: any) => {
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
