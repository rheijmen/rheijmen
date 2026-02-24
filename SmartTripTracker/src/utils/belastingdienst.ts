/**
 * Belastingdienst-conforme HTML-template voor PDF-export.
 *
 * Voldoet aan de eisen van de rittenregistratie:
 * - Datum van de rit
 * - Begin- en eindkilometerstand
 * - Gereden kilometers
 * - Vertrek- en aankomstadres
 * - Zakelijk of privé
 * - Kenteken en auto-omschrijving
 * - Reden bij omrijden (indien >10% afwijking)
 */

import { TaxExportRow, TripSummary } from '../models/types';
import { formatDate } from './formatters';

/** Genereer een HTML-document voor de rittenregistratie (PDF-export) */
export function belastingdienstHtml(
  rows: TaxExportRow[],
  summary: TripSummary,
): string {
  const tableRows = rows
    .map(
      (row) => `
    <tr>
      <td>${row.datum}</td>
      <td class="num">${row.beginKilometerstand.toLocaleString('nl-NL')}</td>
      <td class="num">${row.eindKilometerstand.toLocaleString('nl-NL')}</td>
      <td class="num">${row.geredenKilometers.toFixed(1)}</td>
      <td>${escapeHtml(row.vertrekAdres)}</td>
      <td>${escapeHtml(row.aankomstAdres)}</td>
      <td>${row.ritType}</td>
      <td>${row.kenteken}</td>
      <td>${escapeHtml(row.autoOmschrijving)}</td>
      <td>${escapeHtml(row.omrijReden)}</td>
      <td>${escapeHtml(row.opmerkingen)}</td>
    </tr>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Rittenregistratie</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 9px;
      color: #333;
      margin: 20px;
    }
    h1 {
      font-size: 16px;
      color: #1a3a5c;
      border-bottom: 2px solid #1a3a5c;
      padding-bottom: 5px;
    }
    .meta {
      margin-bottom: 15px;
      font-size: 10px;
    }
    .meta span {
      margin-right: 20px;
    }
    .summary {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
    }
    .summary-box {
      background: #f4f6f8;
      border-radius: 4px;
      padding: 8px 12px;
      flex: 1;
    }
    .summary-box .label {
      font-size: 8px;
      color: #666;
      text-transform: uppercase;
    }
    .summary-box .value {
      font-size: 14px;
      font-weight: bold;
      color: #1a3a5c;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #1a3a5c;
      color: white;
      padding: 6px 4px;
      text-align: left;
      font-size: 8px;
      text-transform: uppercase;
    }
    td {
      padding: 5px 4px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 8px;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      margin-top: 20px;
      font-size: 8px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Rittenregistratie</h1>

  <div class="meta">
    <span><strong>Periode:</strong> ${formatDate(summary.periodStart)} t/m ${formatDate(summary.periodEnd)}</span>
    <span><strong>Exportdatum:</strong> ${formatDate(Date.now())}</span>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Totaal ritten</div>
      <div class="value">${summary.totalTrips}</div>
    </div>
    <div class="summary-box">
      <div class="label">Totaal km</div>
      <div class="value">${summary.totalDistanceKm.toFixed(1)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Zakelijk km</div>
      <div class="value">${summary.businessDistanceKm.toFixed(1)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Privé km</div>
      <div class="value">${summary.privateDistanceKm.toFixed(1)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Datum</th>
        <th>Begin km</th>
        <th>Eind km</th>
        <th>Gereden</th>
        <th>Vertrekadres</th>
        <th>Aankomstadres</th>
        <th>Type</th>
        <th>Kenteken</th>
        <th>Auto</th>
        <th>Reden omrijden</th>
        <th>Opmerkingen</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    Gegenereerd door Slimme Ritten-Tracker &bull;
    Bewaarplicht: 7 jaar (Belastingdienst)
  </div>
</body>
</html>`;
}

/** Escape HTML-tekens om XSS te voorkomen */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
