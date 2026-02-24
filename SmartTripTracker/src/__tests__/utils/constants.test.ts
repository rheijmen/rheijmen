/**
 * TDD Tests voor constants.ts
 *
 * Verifiëert dat alle constanten de juiste waarden hebben,
 * met name de Belastingdienst-gerelateerde instellingen.
 */

import { DEFAULT_SETTINGS, RETENTION_YEARS, STORAGE_KEYS, EARTH_RADIUS_KM, MIN_GPS_ACCURACY_METERS, GPS_TRACKING_INTERVAL_MS } from '../../utils/constants';

describe('DEFAULT_SETTINGS', () => {
  it('heeft een afwijkingsdrempel van 10% (Belastingdienst-eis)', () => {
    expect(DEFAULT_SETTINGS.deviationThresholdPercent).toBe(10);
  });

  it('heeft tekst-naar-spraak standaard aan', () => {
    expect(DEFAULT_SETTINGS.useTts).toBe(true);
  });

  it('spreekt standaard Nederlands', () => {
    expect(DEFAULT_SETTINGS.ttsLanguage).toBe('nl-NL');
  });

  it('start standaard automatisch bij Bluetooth', () => {
    expect(DEFAULT_SETTINGS.autoStartOnBluetooth).toBe(true);
  });

  it('heeft geen standaard ritcategorie (altijd vragen)', () => {
    expect(DEFAULT_SETTINGS.defaultCategory).toBeNull();
  });

  it('heeft geen Google Maps API key ingesteld', () => {
    expect(DEFAULT_SETTINGS.googleMapsApiKey).toBe('');
  });
});

describe('RETENTION_YEARS', () => {
  it('is 7 jaar (wettelijke bewaarplicht Belastingdienst)', () => {
    expect(RETENTION_YEARS).toBe(7);
  });
});

describe('GPS constants', () => {
  it('heeft een minimale GPS-nauwkeurigheid van 50 meter', () => {
    expect(MIN_GPS_ACCURACY_METERS).toBe(50);
  });

  it('trakt elke 5 seconden', () => {
    expect(GPS_TRACKING_INTERVAL_MS).toBe(5000);
  });
});

describe('EARTH_RADIUS_KM', () => {
  it('is 6371 km (gemiddelde aarde-radius)', () => {
    expect(EARTH_RADIUS_KM).toBe(6371);
  });
});

describe('STORAGE_KEYS', () => {
  it('heeft unieke keys voor alle opslagelementen', () => {
    const keys = Object.values(STORAGE_KEYS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('heeft keys die beginnen met @smart_trip_tracker/', () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      expect(key).toMatch(/^@smart_trip_tracker\//);
    });
  });

  it('bevat een key voor actieve rit (crash recovery)', () => {
    expect(STORAGE_KEYS.ACTIVE_TRIP).toBeDefined();
  });

  it('bevat een key voor de laatste kilometerstand', () => {
    expect(STORAGE_KEYS.LAST_ODOMETER).toBeDefined();
  });
});
