import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { TripCategory } from '../models/types';

/** Formatteer een datum naar Nederlands formaat */
export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'dd-MM-yyyy', { locale: nl });
}

/** Formatteer een datum met tijd */
export function formatDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'dd-MM-yyyy HH:mm', { locale: nl });
}

/** Formatteer een tijd */
export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'HH:mm', { locale: nl });
}

/** Formatteer een afstand in km (1 decimaal) */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

/** Formatteer een kilometerstand */
export function formatOdometer(km: number): string {
  return `${Math.round(km).toLocaleString('nl-NL')} km`;
}

/** Vertaal TripCategory naar Nederlands label */
export function formatTripCategory(category: TripCategory | null): string {
  switch (category) {
    case 'zakelijk':
      return 'Zakelijk';
    case 'prive':
      return 'Privé';
    case 'gemengd':
      return 'Gemengd';
    default:
      return 'Niet ingedeeld';
  }
}

/** Formatteer een kenteken naar standaard NL-formaat */
export function formatLicensePlate(plate: string): string {
  // Verwijder spaties en streepjes, maak hoofdletters
  const clean = plate.replace(/[\s-]/g, '').toUpperCase();

  // Nederlands kenteken: XX-999-X, 99-XXX-9, etc.
  if (clean.length === 6) {
    return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
  }

  return plate.toUpperCase();
}

/** Formatteer duur in minuten naar leesbare tekst */
export function formatDuration(startTime: number, endTime: number): string {
  const diffMs = endTime - startTime;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}u ${remainingMinutes}min`;
}

/** Formatteer een percentage */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
