/**
 * TDD Tests voor formatters.ts
 *
 * Deze tests beschrijven EERST het gewenste gedrag:
 * - Datums in Nederlands formaat (dd-MM-yyyy)
 * - Afstanden met 1 decimaal + " km"
 * - Kentekens in standaard NL-formaat (XX-999-XX)
 * - Rijtypes in het Nederlands
 * - Duur in leesbaar formaat
 */

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDistance,
  formatOdometer,
  formatTripCategory,
  formatLicensePlate,
  formatDuration,
  formatPercent,
} from '../../utils/formatters';

describe('formatDate', () => {
  it('formatteert een timestamp naar dd-MM-yyyy', () => {
    // 15 maart 2024 12:00 UTC+1
    const timestamp = new Date(2024, 2, 15, 12, 0, 0).getTime();
    expect(formatDate(timestamp)).toBe('15-03-2024');
  });

  it('formatteert 1 januari correct (met voorloopnullen)', () => {
    const timestamp = new Date(2024, 0, 1).getTime();
    expect(formatDate(timestamp)).toBe('01-01-2024');
  });

  it('formatteert 31 december correct', () => {
    const timestamp = new Date(2024, 11, 31).getTime();
    expect(formatDate(timestamp)).toBe('31-12-2024');
  });
});

describe('formatDateTime', () => {
  it('formatteert datum en tijd als dd-MM-yyyy HH:mm', () => {
    const timestamp = new Date(2024, 2, 15, 14, 30).getTime();
    expect(formatDateTime(timestamp)).toBe('15-03-2024 14:30');
  });

  it('toont voorloopnullen bij uren en minuten', () => {
    const timestamp = new Date(2024, 0, 5, 8, 5).getTime();
    expect(formatDateTime(timestamp)).toBe('05-01-2024 08:05');
  });
});

describe('formatTime', () => {
  it('formatteert alleen de tijd als HH:mm', () => {
    const timestamp = new Date(2024, 0, 1, 9, 15).getTime();
    expect(formatTime(timestamp)).toBe('09:15');
  });

  it('toont middernacht als 00:00', () => {
    const timestamp = new Date(2024, 0, 1, 0, 0).getTime();
    expect(formatTime(timestamp)).toBe('00:00');
  });
});

describe('formatDistance', () => {
  it('formatteert een afstand met 1 decimaal en " km"', () => {
    expect(formatDistance(12.4)).toBe('12.4 km');
  });

  it('formatteert een hele afstand met .0', () => {
    expect(formatDistance(5)).toBe('5.0 km');
  });

  it('rondt af op 1 decimaal', () => {
    expect(formatDistance(7.86)).toBe('7.9 km');
    expect(formatDistance(7.84)).toBe('7.8 km');
  });

  it('verwerkt 0 km correct', () => {
    expect(formatDistance(0)).toBe('0.0 km');
  });

  it('verwerkt grote afstanden', () => {
    expect(formatDistance(1234.5)).toBe('1234.5 km');
  });
});

describe('formatOdometer', () => {
  it('formatteert een kilometerstand met " km" suffix', () => {
    const result = formatOdometer(45230);
    expect(result).toContain('45');
    expect(result).toContain('230');
    expect(result).toContain('km');
  });

  it('rondt af naar gehele kilometers', () => {
    const result = formatOdometer(45230.7);
    expect(result).toContain('45');
    expect(result).toContain('231');
    expect(result).toContain('km');
  });
});

describe('formatTripCategory', () => {
  it('vertaalt "zakelijk" naar "Zakelijk"', () => {
    expect(formatTripCategory('zakelijk')).toBe('Zakelijk');
  });

  it('vertaalt "prive" naar "Privé"', () => {
    expect(formatTripCategory('prive')).toBe('Privé');
  });

  it('vertaalt "gemengd" naar "Gemengd"', () => {
    expect(formatTripCategory('gemengd')).toBe('Gemengd');
  });

  it('geeft "Niet ingedeeld" bij null', () => {
    expect(formatTripCategory(null)).toBe('Niet ingedeeld');
  });
});

describe('formatLicensePlate', () => {
  it('formatteert een 6-teken kenteken naar XX-XXX-X formaat', () => {
    expect(formatLicensePlate('AB123C')).toBe('AB-123-C');
  });

  it('verwijdert bestaande streepjes en herformatteert', () => {
    expect(formatLicensePlate('AB-123-C')).toBe('AB-123-C');
  });

  it('maakt kleine letters hoofdletters', () => {
    expect(formatLicensePlate('ab123c')).toBe('AB-123-C');
  });

  it('verwijdert spaties', () => {
    expect(formatLicensePlate('AB 123 C')).toBe('AB-123-C');
  });

  it('laat kentekens met andere lengtes ongewijzigd (maar uppercase)', () => {
    expect(formatLicensePlate('abcdefgh')).toBe('ABCDEFGH');
  });
});

describe('formatDuration', () => {
  it('toont korte ritten in minuten', () => {
    const start = Date.now();
    const end = start + 25 * 60 * 1000; // 25 minuten
    expect(formatDuration(start, end)).toBe('25 min');
  });

  it('toont ritten van precies 1 uur correct', () => {
    const start = Date.now();
    const end = start + 60 * 60 * 1000; // 60 minuten
    expect(formatDuration(start, end)).toBe('1u 0min');
  });

  it('toont ritten langer dan een uur als Xu Ymin', () => {
    const start = Date.now();
    const end = start + 90 * 60 * 1000; // 90 minuten
    expect(formatDuration(start, end)).toBe('1u 30min');
  });

  it('verwerkt ritten van 0 minuten', () => {
    const start = Date.now();
    expect(formatDuration(start, start)).toBe('0 min');
  });
});

describe('formatPercent', () => {
  it('formatteert een percentage met 1 decimaal', () => {
    expect(formatPercent(15.3)).toBe('15.3%');
  });

  it('formatteert 0% correct', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formatteert negatieve percentages', () => {
    expect(formatPercent(-5.7)).toBe('-5.7%');
  });
});
