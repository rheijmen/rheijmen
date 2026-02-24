/**
 * TDD Tests voor belastingdienst.ts (HTML export template)
 *
 * De Belastingdienst stelt specifieke eisen aan de rittenregistratie.
 * Deze tests verifiëren dat de gegenereerde HTML alle verplichte
 * velden bevat en correct is opgemaakt.
 */

import { belastingdienstHtml } from '../../utils/belastingdienst';
import { TaxExportRow, TripSummary } from '../../models/types';

describe('belastingdienstHtml', () => {
  const mockSummary: TripSummary = {
    totalTrips: 3,
    totalDistanceKm: 150.5,
    businessDistanceKm: 100.0,
    privateDistanceKm: 40.5,
    mixedDistanceKm: 10.0,
    periodStart: new Date(2024, 0, 1).getTime(),
    periodEnd: new Date(2024, 11, 31).getTime(),
  };

  const mockRows: TaxExportRow[] = [
    {
      datum: '15-01-2024',
      beginKilometerstand: 45000,
      eindKilometerstand: 45050,
      geredenKilometers: 50.0,
      vertrekAdres: 'Keizersgracht 100, Amsterdam',
      aankomstAdres: 'Coolsingel 40, Rotterdam',
      ritType: 'Zakelijk',
      kenteken: 'AB-123-CD',
      autoOmschrijving: 'Volkswagen Golf',
      omrijReden: '',
      opmerkingen: 'Klantbezoek',
    },
    {
      datum: '16-01-2024',
      beginKilometerstand: 45050,
      eindKilometerstand: 45090,
      geredenKilometers: 40.5,
      vertrekAdres: 'Coolsingel 40, Rotterdam',
      aankomstAdres: 'Thuis, Utrecht',
      ritType: 'Privé',
      kenteken: 'AB-123-CD',
      autoOmschrijving: 'Volkswagen Golf',
      omrijReden: '',
      opmerkingen: '',
    },
  ];

  let html: string;

  beforeAll(() => {
    html = belastingdienstHtml(mockRows, mockSummary);
  });

  // ---- Structurele vereisten ----

  it('genereert een valide HTML-document', () => {
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="nl">');
    expect(html).toContain('</html>');
  });

  it('bevat de titel "Rittenregistratie"', () => {
    expect(html).toContain('<title>Rittenregistratie</title>');
    expect(html).toContain('<h1>Rittenregistratie</h1>');
  });

  // ---- Belastingdienst-verplichte kolomkoppen ----

  it('bevat de kolom "Datum"', () => {
    expect(html).toContain('<th>Datum</th>');
  });

  it('bevat de kolom "Begin km"', () => {
    expect(html).toContain('<th>Begin km</th>');
  });

  it('bevat de kolom "Eind km"', () => {
    expect(html).toContain('<th>Eind km</th>');
  });

  it('bevat de kolom "Gereden"', () => {
    expect(html).toContain('<th>Gereden</th>');
  });

  it('bevat de kolom "Vertrekadres"', () => {
    expect(html).toContain('<th>Vertrekadres</th>');
  });

  it('bevat de kolom "Aankomstadres"', () => {
    expect(html).toContain('<th>Aankomstadres</th>');
  });

  it('bevat de kolom "Type" (zakelijk/privé)', () => {
    expect(html).toContain('<th>Type</th>');
  });

  it('bevat de kolom "Kenteken"', () => {
    expect(html).toContain('<th>Kenteken</th>');
  });

  it('bevat de kolom "Auto"', () => {
    expect(html).toContain('<th>Auto</th>');
  });

  it('bevat de kolom "Reden omrijden"', () => {
    expect(html).toContain('<th>Reden omrijden</th>');
  });

  // ---- Data-inhoud ----

  it('toont de ritgegevens in de tabelrijen', () => {
    expect(html).toContain('15-01-2024');
    expect(html).toContain('16-01-2024');
  });

  it('toont de kilometerstand', () => {
    // toLocaleString output verschilt per systeem-locale
    // Controleer dat de getallen er staan (met of zonder scheidingsteken)
    expect(html).toContain('45');
    expect(html).toMatch(/45[,.]?000/);
    expect(html).toMatch(/45[,.]?050/);
  });

  it('toont de gereden afstand met 1 decimaal', () => {
    expect(html).toContain('50.0');
    expect(html).toContain('40.5');
  });

  it('toont de adressen', () => {
    expect(html).toContain('Keizersgracht 100, Amsterdam');
    expect(html).toContain('Coolsingel 40, Rotterdam');
  });

  it('toont het kenteken', () => {
    expect(html).toContain('AB-123-CD');
  });

  it('toont de auto-omschrijving', () => {
    expect(html).toContain('Volkswagen Golf');
  });

  it('toont het rittype', () => {
    expect(html).toContain('Zakelijk');
    expect(html).toContain('Privé');
  });

  // ---- Samenvatting ----

  it('toont het totaal aantal ritten', () => {
    expect(html).toContain('3');
  });

  it('toont de totale afstand', () => {
    expect(html).toContain('150.5');
  });

  it('toont de zakelijke kilometers', () => {
    expect(html).toContain('100.0');
  });

  it('toont de privékilometers', () => {
    expect(html).toContain('40.5');
  });

  // ---- Bewaarplicht ----

  it('vermeldt de wettelijke bewaarplicht van 7 jaar', () => {
    expect(html).toContain('7 jaar');
    expect(html).toContain('Belastingdienst');
  });

  // ---- XSS-preventie ----

  it('escaped HTML-tekens in adressen', () => {
    const xssRows: TaxExportRow[] = [
      {
        datum: '01-01-2024',
        beginKilometerstand: 0,
        eindKilometerstand: 10,
        geredenKilometers: 10,
        vertrekAdres: '<script>alert("xss")</script>',
        aankomstAdres: 'Normaal adres',
        ritType: 'Zakelijk',
        kenteken: 'AA-111-BB',
        autoOmschrijving: 'Test & Auto "model"',
        omrijReden: '',
        opmerkingen: '',
      },
    ];

    const xssHtml = belastingdienstHtml(xssRows, mockSummary);
    expect(xssHtml).not.toContain('<script>');
    expect(xssHtml).toContain('&lt;script&gt;');
    expect(xssHtml).toContain('Test &amp; Auto &quot;model&quot;');
  });

  // ---- Lege lijst ----

  it('genereert een geldige tabel bij een lege rittenlijst', () => {
    const emptyHtml = belastingdienstHtml([], mockSummary);
    expect(emptyHtml).toContain('<table>');
    expect(emptyHtml).toContain('<thead>');
    expect(emptyHtml).toContain('<tbody>');
    expect(emptyHtml).toContain('</table>');
  });
});
