import type { NormalizedCandidate, PhotoLicense } from '../src/types.js';
import { delay, extractContentYearHint, eraBucket } from '../pipeline.js';

const SEARCH_QUERIES = [
  {
    q: 'street scene photograph',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1900 TO 1949]'],
    label: 'street_pre1950',
    eraHint: 'pre_1950' as const,
  },
  {
    q: 'street city photograph',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1950 TO 1979]'],
    label: 'street_1950_79',
    eraHint: 'y1950_1979' as const,
  },
  {
    q: 'daily life photograph',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1950 TO 1979]'],
    label: 'daily_1950_79',
    eraHint: 'y1950_1979' as const,
  },
  {
    q: 'city street photograph',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1980 TO 1999]'],
    label: 'street_1980_99',
    eraHint: 'y1980_1999' as const,
  },
  {
    q: 'street photograph',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[2000 TO 2025]'],
    label: 'street_2000plus',
    eraHint: 'y2000_2014' as const,
  },
  {
    q: 'street scene',
    qf: [
      'DATA_PROVIDER:"Deutsche Fotothek"',
      'TYPE:IMAGE',
      'IMAGE_SIZE:large',
      'YEAR:[1900 TO 1949]',
    ],
    label: 'fotothek_pre1950',
    eraHint: 'pre_1950' as const,
  },
  {
    q: 'street scene',
    qf: [
      'DATA_PROVIDER:"Deutsche Fotothek"',
      'TYPE:IMAGE',
      'IMAGE_SIZE:large',
      'YEAR:[1950 TO 1999]',
    ],
    label: 'fotothek_postwar',
    eraHint: 'y1950_1979' as const,
  },
  {
    q: 'photograph city',
    qf: ['DATA_PROVIDER:"Riksantikvarieämbetet"', 'TYPE:IMAGE', 'IMAGE_SIZE:large'],
    label: 'sweden',
    eraHint: 'y1950_1979' as const,
  },
  {
    q: 'photograph street',
    qf: ['DATA_PROVIDER:"Nationaal Archief"', 'TYPE:IMAGE', 'IMAGE_SIZE:large'],
    label: 'netherlands',
    eraHint: 'y1950_1979' as const,
  },
  {
    q: 'harbor port city',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1900 TO 1979]'],
    label: 'harbor_vintage',
    eraHint: 'pre_1950' as const,
  },
  {
    q: 'market bazaar outdoor',
    qf: ['TYPE:IMAGE', 'IMAGE_SIZE:large', 'YEAR:[1900 TO 1979]'],
    label: 'market_vintage',
    eraHint: 'pre_1950' as const,
  },
];

function mapRights(rights: string | undefined | null): PhotoLicense | null {
  if (!rights) return null;
  const r = rights.toLowerCase();
  if (r.includes('creativecommons.org/publicdomain/zero') || r.includes('/cc0')) return 'cc0';
  if (r.includes('creativecommons.org/licenses/by-sa')) return 'cc_by_sa';
  if (r.includes('creativecommons.org/licenses/by/')) return 'cc_by';
  if (r.includes('rightsstatements.org/vocab/noc') || r.includes('publicdomain'))
    return 'public_domain';
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
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

export async function fetchEuropeanaCandidates(
  apiKey: string,
  queryIndex = 0,
  start = 1,
  limit = 25
): Promise<{ candidates: NormalizedCandidate[]; rejectedByReason: Record<string, number> }> {
  const candidates: NormalizedCandidate[] = [];
  const rejectedByReason: Record<string, number> = {};

  if (!apiKey) return { candidates, rejectedByReason: { europeana_no_api_key: 1 } };

  const queryEntry = SEARCH_QUERIES[queryIndex % SEARCH_QUERIES.length];
  const rows = Math.min(25, limit);

  await delay(300);
  const qfParam = queryEntry.qf.map((f) => `qf=${encodeURIComponent(f)}`).join('&');
  const url = `https://api.europeana.eu/record/v2/search.json?wskey=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(queryEntry.q)}&${qfParam}&reusability=open&rows=${rows}&start=${start}&profile=rich`;

  let data: Record<string, unknown> | null = null;
  try {
    const res = await fetch(url);
    if (res.ok) data = await res.json();
    else rejectedByReason.europeana_http_error = 1;
  } catch {
    return { candidates, rejectedByReason: { europeana_fetch_error: 1 } };
  }

  const items: unknown[] = Array.isArray(data?.items) ? (data!.items as unknown[]) : [];

  for (const raw of items) {
    const item = raw as Record<string, unknown>;

    // Image URL
    const rawImageUri =
      (Array.isArray(item.edmIsShownBy) && typeof item.edmIsShownBy[0] === 'string'
        ? item.edmIsShownBy[0]
        : null) ?? (typeof item.edmIsShownBy === 'string' ? item.edmIsShownBy : null);
    const previewUri =
      typeof item.edmPreview === 'string'
        ? item.edmPreview
        : Array.isArray(item.edmPreview) && typeof item.edmPreview[0] === 'string'
          ? item.edmPreview[0]
          : null;
    const imageUri = rawImageUri ? rawImageUri.replace(/^http:\/\//i, 'https://') : previewUri;
    if (!imageUri) {
      rejectedByReason.europeana_no_image_url = (rejectedByReason.europeana_no_image_url ?? 0) + 1;
      continue;
    }

    // License
    const rightsRaw = Array.isArray(item.rights)
      ? (item.rights[0] as string | undefined)
      : ((item['europeanaRights'] as string | undefined) ?? (item.rights as string | undefined));
    const license = mapRights(rightsRaw);
    if (!license) {
      rejectedByReason.europeana_rejected_license =
        (rejectedByReason.europeana_rejected_license ?? 0) + 1;
      continue;
    }

    // Title
    const titleRaw = Array.isArray(item.title) ? item.title[0] : item.title;
    const title =
      typeof titleRaw === 'string' && titleRaw.length > 0 ? titleRaw : 'Europeana photo';

    // Description
    const descRaw = (() => {
      const d = item.dcDescriptionLangAware as Record<string, unknown> | undefined;
      if (d) {
        const en = d.en;
        return Array.isArray(en) ? en[0] : typeof en === 'string' ? en : undefined;
      }
      return undefined;
    })();
    const description = typeof descRaw === 'string' ? descRaw : undefined;

    // Year — try multiple fields
    let year: number | null = null;
    let yearSource: NormalizedCandidate['yearSource'] = 'structured_metadata';
    let yearConfidence: NormalizedCandidate['yearConfidence'] = 'medium';

    const yearRaw = Array.isArray(item.year) ? item.year[0] : item.year;
    if (typeof yearRaw === 'string' || typeof yearRaw === 'number') {
      const parsed = parseInt(String(yearRaw), 10);
      if (!Number.isNaN(parsed) && parsed >= 1800 && parsed <= new Date().getFullYear())
        year = parsed;
    }

    if (!year) {
      const tsBegin = Array.isArray(item.edmTimespanBegin)
        ? item.edmTimespanBegin[0]
        : item.edmTimespanBegin;
      if (typeof tsBegin === 'string') {
        const m = tsBegin.match(/(\d{4})/);
        if (m) {
          const p = parseInt(m[1], 10);
          if (p >= 1800 && p <= new Date().getFullYear()) year = p;
        }
      }
    }

    if (!year) {
      const tsLabel = Array.isArray(item.edmTimespanLabel)
        ? item.edmTimespanLabel[0]
        : item.edmTimespanLabel;
      const tsStr =
        typeof tsLabel === 'string'
          ? tsLabel
          : tsLabel && typeof tsLabel === 'object' && 'def' in (tsLabel as Record<string, unknown>)
            ? String((tsLabel as Record<string, string>).def)
            : null;
      if (tsStr) {
        const m = tsStr.match(/(\d{4})/);
        if (m) {
          const p = parseInt(m[1], 10);
          if (p >= 1800 && p <= new Date().getFullYear()) year = p;
        }
      }
    }

    if (!year) {
      for (const field of ['dctermsCreated', 'dcDate']) {
        const val = Array.isArray(item[field]) ? item[field][0] : item[field];
        if (typeof val === 'string') {
          const m = val.match(/(\d{4})/);
          if (m) {
            const p = parseInt(m[1], 10);
            if (p >= 1800 && p <= new Date().getFullYear()) {
              year = p;
              break;
            }
          }
        }
      }
    }

    if (!year) {
      const hint = extractContentYearHint(`${title} ${description ?? ''}`);
      if (!hint) {
        rejectedByReason.europeana_no_year = (rejectedByReason.europeana_no_year ?? 0) + 1;
        continue;
      }
      year = hint;
      yearSource = 'content_inferred';
      yearConfidence =
        queryEntry.eraHint && eraBucket(hint) === queryEntry.eraHint ? 'medium' : 'low';
    }

    // Location
    let location: { lat: number; lng: number } | null = null;
    let locationSource: NormalizedCandidate['locationSource'] = 'content_inferred';
    let locationConfidence: NormalizedCandidate['locationConfidence'] = 'low';

    const edmLat = Array.isArray(item.edmPlaceLatitude)
      ? item.edmPlaceLatitude[0]
      : item.edmPlaceLatitude;
    const edmLng = Array.isArray(item.edmPlaceLongitude)
      ? item.edmPlaceLongitude[0]
      : item.edmPlaceLongitude;
    const parsedLat = parseFloat(String(edmLat ?? ''));
    const parsedLng = parseFloat(String(edmLng ?? ''));
    if (
      Number.isFinite(parsedLat) &&
      Number.isFinite(parsedLng) &&
      Math.abs(parsedLat) <= 90 &&
      Math.abs(parsedLng) <= 180
    ) {
      location = { lat: parsedLat, lng: parsedLng };
      locationSource = 'structured_metadata';
      locationConfidence = 'medium';
    }

    if (!location) {
      const countryRaw = Array.isArray(item.country) ? item.country[0] : item.country;
      if (typeof countryRaw === 'string') {
        const geo = await searchLocations(countryRaw);
        if (geo) location = geo;
      }
    }

    if (!location) {
      rejectedByReason.europeana_no_location = (rejectedByReason.europeana_no_location ?? 0) + 1;
      continue;
    }

    const providerImageId =
      (typeof item.id === 'string' ? item.id : null) ??
      (typeof item.guid === 'string' ? item.guid : null) ??
      imageUri;
    const authorRaw = Array.isArray(item.dcCreator) ? item.dcCreator[0] : item.dcCreator;
    const dataProviderRaw = Array.isArray(item.dataProvider)
      ? item.dataProvider[0]
      : item.dataProvider;

    candidates.push({
      provider: 'europeana',
      providerImageId,
      imageUri,
      location,
      locationSource,
      locationConfidence,
      year,
      yearSource,
      yearConfidence,
      title,
      description,
      tags: [],
      license,
      author: typeof authorRaw === 'string' ? authorRaw : undefined,
      institutionName: typeof dataProviderRaw === 'string' ? dataProviderRaw : 'Europeana',
      originalUrl: typeof item.guid === 'string' ? item.guid : undefined,
    });
  }

  return { candidates, rejectedByReason };
}

export function getEuropeanaQueryCount(): number {
  return SEARCH_QUERIES.length;
}

export function getEuropeanaQueryLabels(): string[] {
  return SEARCH_QUERIES.map((q) => `${q.label} (${q.eraHint})`);
}
