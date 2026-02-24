/**
 * ExportService – Genereer Excel- en PDF-exports voor de Belastingdienst.
 *
 * Vereiste velden per rit (volgens Belastingdienst):
 * - Datum
 * - Begin- en eindkilometerstand
 * - Gereden kilometers
 * - Vertrek- en aankomstadres
 * - Route (indien afwijkend: reden)
 * - Zakelijk of privé
 * - Kenteken + auto-omschrijving
 */

import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Trip, CarProfile, TaxExportRow, TripSummary } from '../models/types';
import { formatDate, formatTripCategory, formatOdometer } from '../utils/formatters';
import { belastingdienstHtml } from '../utils/belastingdienst';

class ExportService {
  /** Genereer Excel-bestand met rittenregistratie */
  async exportToExcel(
    trips: Trip[],
    cars: CarProfile[],
    filename?: string,
  ): Promise<string> {
    const rows = this.tripsToExportRows(trips, cars);

    // Maak werkblad
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
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
      ],
    });

    // Kolomkoppen in het Nederlands
    const headerLabels: Record<string, string> = {
      datum: 'Datum',
      beginKilometerstand: 'Begin km-stand',
      eindKilometerstand: 'Eind km-stand',
      geredenKilometers: 'Gereden km',
      vertrekAdres: 'Vertrekadres',
      aankomstAdres: 'Aankomstadres',
      ritType: 'Zakelijk/Privé',
      kenteken: 'Kenteken',
      autoOmschrijving: 'Auto',
      omrijReden: 'Reden omrijden',
      opmerkingen: 'Opmerkingen',
    };

    // Overschrijf de header-rij
    const headerKeys = Object.keys(headerLabels);
    headerKeys.forEach((key, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      worksheet[cellRef] = { v: headerLabels[key], t: 's' };
    });

    // Stel kolombreedte in
    worksheet['!cols'] = [
      { wch: 12 }, // Datum
      { wch: 14 }, // Begin km
      { wch: 14 }, // Eind km
      { wch: 12 }, // Gereden km
      { wch: 30 }, // Vertrekadres
      { wch: 30 }, // Aankomstadres
      { wch: 14 }, // Type
      { wch: 12 }, // Kenteken
      { wch: 20 }, // Auto
      { wch: 25 }, // Omrijreden
      { wch: 25 }, // Opmerkingen
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rittenregistratie');

    // Schrijf naar bestand
    const xlsxData = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const defaultFilename = `rittenregistratie_${formatDate(Date.now()).replace(/-/g, '')}.xlsx`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${filename ?? defaultFilename}`;

    await RNFS.writeFile(filePath, xlsxData, 'base64');

    console.log(`[ExportService] Excel geëxporteerd: ${filePath}`);
    return filePath;
  }

  /** Genereer PDF-bestand met rittenregistratie */
  async exportToPdf(
    trips: Trip[],
    cars: CarProfile[],
    summary: TripSummary,
    filename?: string,
  ): Promise<string> {
    const rows = this.tripsToExportRows(trips, cars);
    const html = belastingdienstHtml(rows, summary);

    const defaultFilename = `rittenregistratie_${formatDate(Date.now()).replace(/-/g, '')}`;

    const pdf = await RNHTMLtoPDF.convert({
      html,
      fileName: filename ?? defaultFilename,
      directory: 'Documents',
      width: 842, // A4 landscape
      height: 595,
    });

    console.log(`[ExportService] PDF geëxporteerd: ${pdf.filePath}`);
    return pdf.filePath!;
  }

  /** Converteer trips naar rijen voor de export */
  private tripsToExportRows(trips: Trip[], cars: CarProfile[]): TaxExportRow[] {
    return trips
      .filter((trip) => trip.status === 'completed')
      .sort((a, b) => a.startTime - b.startTime)
      .map((trip) => {
        const car = cars.find((c) => c.id === trip.carId);

        return {
          datum: formatDate(trip.startTime),
          beginKilometerstand: trip.odometerStart,
          eindKilometerstand: trip.odometerEnd ?? trip.odometerStart,
          geredenKilometers: trip.distanceKm ?? 0,
          vertrekAdres: trip.startAddress,
          aankomstAdres: trip.endAddress ?? '',
          ritType: formatTripCategory(trip.category),
          kenteken: car?.licensePlate ?? '',
          autoOmschrijving: car ? `${car.brand} ${car.model}` : '',
          omrijReden: trip.deviationReason ?? '',
          opmerkingen: trip.notes ?? '',
        };
      });
  }
}

export const exportService = new ExportService();
