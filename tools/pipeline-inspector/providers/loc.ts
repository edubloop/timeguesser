import type { NormalizedCandidate, PhotoLicense } from '../src/types.js';
import { delay, extractContentYearHint, eraBucket } from '../pipeline.js';

const SEARCH_QUERIES = [
  {
    params: 'q=farm+security+administration+street+photograph&fa=access-restricted:false',
    label: 'fsa_owi',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=detroit+publishing+company+city+street&fa=access-restricted:false',
    label: 'detroit_pub',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=matson+photograph+collection+street&fa=access-restricted:false',
    label: 'matson',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=harbor+waterfront+photograph&fa=access-restricted:false',
    label: 'harbor',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=market+bazaar+photograph&fa=access-restricted:false',
    label: 'market',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=city+street+outdoor+photograph&fa=access-restricted:false',
    label: 'street_general',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=town+square+photograph&fa=access-restricted:false',
    label: 'town_square',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=panoramic+city+view&fa=access-restricted:false',
    label: 'panoramic',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=railroad+station+depot+photograph&fa=access-restricted:false',
    label: 'railroad',
    eraHint: 'pre_1950' as const,
  },
  {
    params: 'q=look+magazine+photograph+street&fa=access-restricted:false',
    label: 'look_magazine',
    eraHint: 'y1950_1979' as const,
  },
  {
    params: 'q=us+news+world+report+photograph+city&fa=access-restricted:false',
    label: 'us_news',
    eraHint: 'y1950_1979' as const,
  },
  {
    params: 'q=civil+rights+march+photograph&fa=access-restricted:false',
    label: 'civil_rights',
    eraHint: 'y1950_1979' as const,
  },
  {
    params: 'q=carol+highsmith+photograph+street&fa=access-restricted:false',
    label: 'highsmith',
    eraHint: 'y2000_2014' as const,
  },
];

function parseLOCDate(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.match(/\b(1[89]\d\d|20[012]\d)\b/);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  return year >= 1800 && year <= new Date().getFullYear() ? year : null;
}

function parseLOCLatLng(raw: string | undefined | null): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && parts.every(Number.isFinite)) {
    const [lat, lng] = parts;
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

function mapLOCRights(rights: string | undefined | null): PhotoLicense | null {
  if (!rights) return null;
  const r = rights.toLowerCase();
  if (r.includes('no known copyright') || r.includes('public domain')) return 'public_domain';
  if (r.includes('cc0')) return 'cc0';
  return null;
}

async function searchLocations(query: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.results) || data.results.length === 0) return null;
    const item = data.results[0];
    const lat = Number(item?.latitude);
    const lng = Number(item?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export async function fetchLOCCandidates(
  queryIndex = 0,
  page = 1,
  limit = 25
): Promise<{ candidates: NormalizedCandidate[]; rejectedByReason: Record<string, number> }> {
  const candidates: NormalizedCandidate[] = [];
  const rejectedByReason: Record<string, number> = {};

  const queryEntry = SEARCH_QUERIES[queryIndex % SEARCH_QUERIES.length];
  const perPage = Math.min(25, limit);

  await delay(500);
  const url = `https://www.loc.gov/photos/?fo=json&${queryEntry.params}&sp=${page}&c=${perPage}`;

  let data: Record<string, unknown> | null = null;
  try {
    const res = await fetch(url);
    if (res.ok) data = await res.json();
  } catch {
    return { candidates, rejectedByReason: { loc_fetch_error: 1 } };
  }

  const results: unknown[] = Array.isArray(data?.results) ? (data!.results as unknown[]) : [];

  for (const raw of results) {
    const item = raw as Record<string, unknown>;

    const imageUrlArr = (Array.isArray(item.image_url) ? item.image_url : []).filter(
      (u: unknown): u is string => typeof u === 'string' && /\.(jpg|jpeg|gif|png|tif)/i.test(u)
    );
    const rawImageUri = imageUrlArr.length > 0 ? imageUrlArr[imageUrlArr.length - 1] : null;
    const imageUri = typeof rawImageUri === 'string' ? rawImageUri.split('#')[0] : null;
    if (!imageUri) {
      rejectedByReason.loc_no_image_url = (rejectedByReason.loc_no_image_url ?? 0) + 1;
      continue;
    }

    const rightsInfoStr =
      typeof item.rights_information === 'string' ? item.rights_information : undefined;
    const license =
      mapLOCRights(rightsInfoStr) ??
      (item.access_restricted === false ? ('public_domain' as const) : null);
    if (!license) {
      rejectedByReason.loc_rejected_license = (rejectedByReason.loc_rejected_license ?? 0) + 1;
      continue;
    }

    const dateStr =
      (typeof item.date === 'string' ? item.date : null) ??
      (Array.isArray(item.created_published) && typeof item.created_published[0] === 'string'
        ? item.created_published[0]
        : null);
    const title = typeof item.title === 'string' ? item.title : 'LOC photo';
    const description =
      Array.isArray(item.description) && typeof item.description[0] === 'string'
        ? item.description[0]
        : undefined;

    let year = parseLOCDate(dateStr);
    let yearSource: NormalizedCandidate['yearSource'] = 'structured_metadata';
    let yearConfidence: NormalizedCandidate['yearConfidence'] = 'medium';

    if (!year) {
      const hint = extractContentYearHint(`${title} ${description ?? ''}`);
      if (!hint) {
        rejectedByReason.loc_no_year = (rejectedByReason.loc_no_year ?? 0) + 1;
        continue;
      }
      year = hint;
      yearSource = 'content_inferred';
      yearConfidence =
        queryEntry.eraHint && eraBucket(hint) === queryEntry.eraHint ? 'medium' : 'low';
    }

    const latlongRaw =
      (typeof item.latlong === 'string' ? item.latlong : null) ??
      (typeof item.coordinates === 'string' ? item.coordinates : null);
    let location = parseLOCLatLng(latlongRaw);
    let locationSource: NormalizedCandidate['locationSource'] = 'structured_metadata';
    let locationConfidence: NormalizedCandidate['locationConfidence'] = 'medium';

    if (!location) {
      const city = Array.isArray(item.location_city) ? item.location_city[0] : null;
      const state = Array.isArray(item.location_state) ? item.location_state[0] : null;
      const locationText =
        (typeof city === 'string' && city.length > 0 ? city : null) ??
        (typeof state === 'string' && state.length > 0 ? state : null) ??
        (Array.isArray(item.location)
          ? item.location.find(
              (s: unknown) => typeof s === 'string' && s.length > 0 && s !== 'united states'
            )
          : null) ??
        '';

      if (locationText) {
        const geo = await searchLocations(locationText as string);
        if (geo) {
          location = geo;
          locationSource = 'content_inferred';
          locationConfidence = 'low';
        }
      }
    }

    if (!location) {
      rejectedByReason.loc_no_location = (rejectedByReason.loc_no_location ?? 0) + 1;
      continue;
    }

    const subjects = Array.isArray(item.subject) ? item.subject.map(String) : [];
    const providerImageId =
      (typeof item.id === 'string' ? item.id : null) ??
      (typeof item.url === 'string' ? item.url : null) ??
      imageUri;

    candidates.push({
      provider: 'loc',
      providerImageId,
      imageUri,
      thumbnailUri: imageUrlArr.length > 1 ? (imageUrlArr[0] as string).split('#')[0] : undefined,
      location,
      locationSource,
      locationConfidence,
      year,
      yearSource,
      yearConfidence,
      title,
      description,
      tags: subjects,
      license,
      author:
        Array.isArray(item.contributor) && typeof item.contributor[0] === 'string'
          ? item.contributor[0]
          : undefined,
      institutionName: 'Library of Congress',
      originalUrl: typeof item.url === 'string' ? item.url : undefined,
    });
  }

  return { candidates, rejectedByReason };
}

export function getLOCQueryCount(): number {
  return SEARCH_QUERIES.length;
}

export function getLOCQueryLabels(): string[] {
  return SEARCH_QUERIES.map((q) => `${q.label} (${q.eraHint})`);
}
