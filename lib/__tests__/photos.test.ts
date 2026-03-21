import { describe, expect, it } from 'vitest';
import {
  mapEuropeanaRights,
  mapLOCRights,
  parseLOCDate,
  parseLOCLatLng,
  classifyRegion,
} from '@/lib/locHelpers';

describe('parseLOCDate', () => {
  it('parses a plain 4-digit year', () => {
    expect(parseLOCDate('1937')).toBe(1937);
  });

  it('parses "ca." prefix', () => {
    expect(parseLOCDate('ca. 1920')).toBe(1920);
  });

  it('parses a year range and returns the earliest', () => {
    expect(parseLOCDate('1930-1940')).toBe(1930);
  });

  it('parses years with surrounding text', () => {
    expect(parseLOCDate('photograph, 1945 March')).toBe(1945);
  });

  it('returns null for undefined', () => {
    expect(parseLOCDate(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseLOCDate(null)).toBeNull();
  });

  it('returns null for strings with no year', () => {
    expect(parseLOCDate('undated')).toBeNull();
  });

  it('returns null for out-of-range years', () => {
    expect(parseLOCDate('1799')).toBeNull();
  });

  it('returns null for future years', () => {
    expect(parseLOCDate('2999')).toBeNull();
  });
});

describe('parseLOCLatLng', () => {
  it('parses a valid lat/lng string', () => {
    expect(parseLOCLatLng('38.8921, -77.0241')).toEqual({ lat: 38.8921, lng: -77.0241 });
  });

  it('handles no space after comma', () => {
    expect(parseLOCLatLng('38.8921,-77.0241')).toEqual({ lat: 38.8921, lng: -77.0241 });
  });

  it('returns null for undefined', () => {
    expect(parseLOCLatLng(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseLOCLatLng(null)).toBeNull();
  });

  it('returns null for a non-coordinate string', () => {
    expect(parseLOCLatLng('Washington D.C.')).toBeNull();
  });

  it('returns null when lat exceeds 90', () => {
    expect(parseLOCLatLng('91.0, -77.0')).toBeNull();
  });

  it('returns null when lng exceeds 180', () => {
    expect(parseLOCLatLng('38.0, 181.0')).toBeNull();
  });
});

describe('mapLOCRights', () => {
  it('maps "No known copyright restrictions" to public_domain', () => {
    expect(mapLOCRights('No known copyright restrictions')).toBe('public_domain');
  });

  it('is case-insensitive', () => {
    expect(mapLOCRights('NO KNOWN COPYRIGHT RESTRICTIONS')).toBe('public_domain');
  });

  it('maps "public domain" to public_domain', () => {
    expect(mapLOCRights('This image is in the public domain.')).toBe('public_domain');
  });

  it('maps CC0 to cc0', () => {
    expect(mapLOCRights('CC0 1.0')).toBe('cc0');
  });

  it('returns null for rights-managed text', () => {
    expect(mapLOCRights('Rights may apply. Contact the Library.')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(mapLOCRights(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(mapLOCRights(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(mapLOCRights('')).toBeNull();
  });
});

describe('mapEuropeanaRights', () => {
  it('maps CC0 URI to cc0', () => {
    expect(mapEuropeanaRights('http://creativecommons.org/publicdomain/zero/1.0/')).toBe('cc0');
  });

  it('maps CC BY-SA URI to cc_by_sa', () => {
    expect(mapEuropeanaRights('http://creativecommons.org/licenses/by-sa/4.0/')).toBe('cc_by_sa');
  });

  it('maps CC BY URI to cc_by', () => {
    expect(mapEuropeanaRights('http://creativecommons.org/licenses/by/4.0/')).toBe('cc_by');
  });

  it('maps RightsStatements NoC to public_domain', () => {
    expect(mapEuropeanaRights('http://rightsstatements.org/vocab/NoC-NC/1.0/')).toBe(
      'public_domain'
    );
  });

  it('maps publicdomain string to public_domain', () => {
    expect(mapEuropeanaRights('http://creativecommons.org/publicdomain/mark/1.0/')).toBe(
      'public_domain'
    );
  });

  it('is case-insensitive', () => {
    expect(mapEuropeanaRights('HTTP://CREATIVECOMMONS.ORG/PUBLICDOMAIN/ZERO/1.0/')).toBe('cc0');
  });

  it('returns null for a restricted rights URI', () => {
    expect(mapEuropeanaRights('http://rightsstatements.org/vocab/InC/1.0/')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(mapEuropeanaRights(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(mapEuropeanaRights(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(mapEuropeanaRights('')).toBeNull();
  });
});

describe('classifyRegion', () => {
  it('classifies Paris as western_europe', () => {
    expect(classifyRegion(48.85, 2.35)).toBe('western_europe');
  });

  it('classifies London as western_europe', () => {
    expect(classifyRegion(51.5, -0.12)).toBe('western_europe');
  });

  it('classifies New York as north_america', () => {
    expect(classifyRegion(40.71, -74.0)).toBe('north_america');
  });

  it('classifies Los Angeles as north_america', () => {
    expect(classifyRegion(34.05, -118.24)).toBe('north_america');
  });

  it('classifies Tokyo as east_asia', () => {
    expect(classifyRegion(35.69, 139.69)).toBe('east_asia');
  });

  it('classifies Beijing as east_asia', () => {
    expect(classifyRegion(39.9, 116.4)).toBe('east_asia');
  });

  it('classifies Sydney as oceania', () => {
    expect(classifyRegion(-33.87, 151.21)).toBe('oceania');
  });

  it('classifies São Paulo as latin_america', () => {
    expect(classifyRegion(-23.55, -46.63)).toBe('latin_america');
  });

  it('classifies Nairobi as africa', () => {
    expect(classifyRegion(-1.29, 36.82)).toBe('africa');
  });

  it('classifies Mumbai as south_asia', () => {
    expect(classifyRegion(19.07, 72.87)).toBe('south_asia');
  });

  it('classifies Bangkok as southeast_asia', () => {
    expect(classifyRegion(13.75, 100.52)).toBe('southeast_asia');
  });

  it('classifies Warsaw as eastern_europe', () => {
    expect(classifyRegion(52.23, 21.01)).toBe('eastern_europe');
  });

  it('classifies Dubai as middle_east', () => {
    expect(classifyRegion(25.2, 55.27)).toBe('middle_east');
  });

  it('returns unknown for mid-Pacific coordinates', () => {
    expect(classifyRegion(0, -140)).toBe('unknown');
  });

  it('returns unknown for Arctic coordinates', () => {
    expect(classifyRegion(85, 0)).toBe('unknown');
  });

  it('returns unknown for Antarctic coordinates', () => {
    expect(classifyRegion(-80, 0)).toBe('unknown');
  });
});
