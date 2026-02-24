/**
 * TDD Tests voor ExportService
 *
 * Test de Belastingdienst-conforme export:
 * - Excel-export met alle verplichte kolommen
 * - PDF-export via HTML-template
 * - Correcte vertaling van trips naar exportrijen
 * - Sortering op datum (chronologisch)
 * - Alleen voltooide ritten worden geëxporteerd
 */

import { exportService } from '../../services/ExportService';
import { Trip, CarProfile, TripSummary } from '../../models/types';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

// Helper: maak een voltooide trip
function createCompletedTrip(overrides?: Partial<Trip>): Trip {
  return {
    id: 'trip-1',
    carId: 'car-1',
    category: 'zakelijk',
    status: 'completed',
    odometerStart: 45000,
    odometerEnd: 45050,
    distanceKm: 50.0,
    startAddress: 'Keizersgracht 100, Amsterdam',
    endAddress: 'Coolsingel 40, Rotterdam',
    startTime: new Date(2024, 0, 15, 8, 0).getTime(),
    endTime: new Date(2024, 0, 15, 9, 0).getTime(),
    routePoints: [],
    expectedDistanceKm: 48,
    deviationPercent: 4.2,
    hasSignificantDeviation: false,
    deviationReason: null,
    notes: 'Klantbezoek',
    bluetoothDeviceId: null,
    bluetoothDeviceName: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

const mockCars: CarProfile[] = [
  {
    id: 'car-1',
    brand: 'Volkswagen',
    model: 'Golf 8',
    licensePlate: 'AB-123-CD',
    isDefault: true,
    createdAt: Date.now(),
  },
  {
    id: 'car-2',
    brand: 'Tesla',
    model: 'Model 3',
    licensePlate: 'EF-456-GH',
    isDefault: false,
    createdAt: Date.now(),
  },
];

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('schrijft een XLSX-bestand naar het documenten-pad', async () => {
      const trips = [createCompletedTrip()];

      const filePath = await exportService.exportToExcel(trips, mockCars);

      expect(filePath).toContain(RNFS.DocumentDirectoryPath);
      expect(filePath).toContain('.xlsx');
    });

    it('maakt een werkblad aan met de juiste header', async () => {
      const trips = [createCompletedTrip()];

      await exportService.exportToExcel(trips, mockCars);

      // Verifieer dat json_to_sheet werd aangeroepen met de juiste kolommen
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            datum: expect.any(String),
            beginKilometerstand: expect.any(Number),
            eindKilometerstand: expect.any(Number),
            geredenKilometers: expect.any(Number),
            vertrekAdres: expect.any(String),
            aankomstAdres: expect.any(String),
            ritType: expect.any(String),
            kenteken: expect.any(String),
            autoOmschrijving: expect.any(String),
          }),
        ]),
        expect.objectContaining({
          header: expect.arrayContaining([
            'datum',
            'beginKilometerstand',
            'eindKilometerstand',
            'geredenKilometers',
            'vertrekAdres',
            'aankomstAdres',
            'ritType',
            'kenteken',
            'autoOmschrijving',
            'omrijReden',
            'opmerkingen',
          ]),
        }),
      );
    });

    it('filtert niet-voltooide ritten uit de export', async () => {
      const trips = [
        createCompletedTrip({ id: 'trip-1', status: 'completed' }),
        createCompletedTrip({ id: 'trip-2', status: 'pending_classification' }),
        createCompletedTrip({ id: 'trip-3', status: 'active' }),
      ];

      await exportService.exportToExcel(trips, mockCars);

      // Alleen de voltooide trip zou in de sheet moeten zitten
      const sheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      expect(sheetCall[0]).toHaveLength(1);
    });

    it('sorteert ritten chronologisch (oudste eerst)', async () => {
      const trips = [
        createCompletedTrip({
          id: 'trip-later',
          startTime: new Date(2024, 1, 1).getTime(),
        }),
        createCompletedTrip({
          id: 'trip-earlier',
          startTime: new Date(2024, 0, 1).getTime(),
        }),
      ];

      await exportService.exportToExcel(trips, mockCars);

      const sheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      const rows = sheetCall[0];
      // Eerste rij zou de vroegste datum moeten hebben
      expect(rows[0].datum).toBe('01-01-2024');
      expect(rows[1].datum).toBe('01-02-2024');
    });

    it('koppelt het kenteken aan de juiste auto', async () => {
      const trips = [
        createCompletedTrip({ carId: 'car-1' }),
        createCompletedTrip({
          id: 'trip-2',
          carId: 'car-2',
          startTime: new Date(2024, 0, 16).getTime(),
        }),
      ];

      await exportService.exportToExcel(trips, mockCars);

      const sheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      const rows = sheetCall[0];
      expect(rows[0].kenteken).toBe('AB-123-CD');
      expect(rows[0].autoOmschrijving).toBe('Volkswagen Golf 8');
      expect(rows[1].kenteken).toBe('EF-456-GH');
      expect(rows[1].autoOmschrijving).toBe('Tesla Model 3');
    });

    it('vertaalt de categorie naar het juiste Nederlandse label', async () => {
      const trips = [
        createCompletedTrip({ category: 'zakelijk' }),
        createCompletedTrip({
          id: 'trip-2',
          category: 'prive',
          startTime: new Date(2024, 0, 16).getTime(),
        }),
        createCompletedTrip({
          id: 'trip-3',
          category: 'gemengd',
          startTime: new Date(2024, 0, 17).getTime(),
        }),
      ];

      await exportService.exportToExcel(trips, mockCars);

      const sheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      const rows = sheetCall[0];
      expect(rows[0].ritType).toBe('Zakelijk');
      expect(rows[1].ritType).toBe('Privé');
      expect(rows[2].ritType).toBe('Gemengd');
    });

    it('neemt de omrijreden op als die er is', async () => {
      const trips = [
        createCompletedTrip({
          hasSignificantDeviation: true,
          deviationReason: 'File op de A2',
        }),
      ];

      await exportService.exportToExcel(trips, mockCars);

      const sheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      expect(sheetCall[0][0].omrijReden).toBe('File op de A2');
    });

    it('gebruikt een aangepaste bestandsnaam als die wordt meegegeven', async () => {
      const trips = [createCompletedTrip()];

      const filePath = await exportService.exportToExcel(
        trips,
        mockCars,
        'mijn_export.xlsx',
      );

      expect(filePath).toContain('mijn_export.xlsx');
    });

    it('verwerkt een lege triplijst zonder fouten', async () => {
      const filePath = await exportService.exportToExcel([], mockCars);

      expect(filePath).toContain('.xlsx');
      expect(RNFS.writeFile).toHaveBeenCalled();
    });
  });

  describe('exportToPdf', () => {
    const mockSummary: TripSummary = {
      totalTrips: 1,
      totalDistanceKm: 50,
      businessDistanceKm: 50,
      privateDistanceKm: 0,
      mixedDistanceKm: 0,
      periodStart: new Date(2024, 0, 1).getTime(),
      periodEnd: new Date(2024, 11, 31).getTime(),
    };

    it('genereert een PDF-bestand', async () => {
      const trips = [createCompletedTrip()];

      const filePath = await exportService.exportToPdf(
        trips,
        mockCars,
        mockSummary,
      );

      expect(filePath).toContain('.pdf');
      expect(RNHTMLtoPDF.convert).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Rittenregistratie'),
          directory: 'Documents',
        }),
      );
    });

    it('stuurt HTML naar de PDF-converter die alle Belastingdienst-velden bevat', async () => {
      const trips = [createCompletedTrip()];

      await exportService.exportToPdf(trips, mockCars, mockSummary);

      const convertCall = (RNHTMLtoPDF.convert as jest.Mock).mock.calls[0][0];
      const html = convertCall.html;

      expect(html).toContain('Datum');
      expect(html).toContain('Begin km');
      expect(html).toContain('Eind km');
      expect(html).toContain('Vertrekadres');
      expect(html).toContain('Aankomstadres');
      expect(html).toContain('Kenteken');
    });

    it('genereert de PDF in A4 landscape formaat', async () => {
      const trips = [createCompletedTrip()];

      await exportService.exportToPdf(trips, mockCars, mockSummary);

      const convertCall = (RNHTMLtoPDF.convert as jest.Mock).mock.calls[0][0];
      expect(convertCall.width).toBe(842);  // A4 landscape breedte
      expect(convertCall.height).toBe(595); // A4 landscape hoogte
    });
  });
});
