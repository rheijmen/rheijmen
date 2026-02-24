/**
 * RouteDeviationService – Omrij-checker.
 *
 * Vergelijkt de daadwerkelijk gereden afstand (GPS) met de verwachte
 * route (Google Maps). Bij een afwijking > drempel (standaard 10%) wordt
 * de gebruiker verplicht een toelichting te geven (eis Belastingdienst).
 */

import { Trip, AppSettings } from '../models/types';
import { locationService } from './LocationService';
import { DEFAULT_SETTINGS } from '../utils/constants';

export interface DeviationResult {
  /** Werkelijk gereden afstand in km (GPS) */
  actualDistanceKm: number;
  /** Verwachte afstand in km (Google Maps) */
  expectedDistanceKm: number | null;
  /** Afwijking in percentage */
  deviationPercent: number | null;
  /** Of de drempel is overschreden */
  hasSignificantDeviation: boolean;
}

class RouteDeviationService {
  private thresholdPercent: number = DEFAULT_SETTINGS.deviationThresholdPercent;

  /** Pas de drempel aan */
  setThreshold(percent: number): void {
    this.thresholdPercent = percent;
  }

  /** Analyseer de afwijking van een voltooide rit */
  async analyzeTrip(trip: Trip): Promise<DeviationResult> {
    // Bereken werkelijke afstand op basis van GPS-punten
    const actualDistanceKm = locationService.calculateRouteDistance(trip.routePoints);

    // Geen routepunten? Dan kunnen we niet vergelijken.
    if (trip.routePoints.length < 2) {
      return {
        actualDistanceKm,
        expectedDistanceKm: null,
        deviationPercent: null,
        hasSignificantDeviation: false,
      };
    }

    const startPoint = trip.routePoints[0];
    const endPoint = trip.routePoints[trip.routePoints.length - 1];

    // Haal verwachte afstand op via Google Maps Directions
    const expectedDistanceKm = await locationService.getExpectedRouteDistance(
      { latitude: startPoint.latitude, longitude: startPoint.longitude },
      { latitude: endPoint.latitude, longitude: endPoint.longitude },
    );

    if (expectedDistanceKm === null || expectedDistanceKm === 0) {
      return {
        actualDistanceKm,
        expectedDistanceKm: null,
        deviationPercent: null,
        hasSignificantDeviation: false,
      };
    }

    // Bereken afwijking
    const deviationPercent =
      ((actualDistanceKm - expectedDistanceKm) / expectedDistanceKm) * 100;
    const hasSignificantDeviation = Math.abs(deviationPercent) > this.thresholdPercent;

    return {
      actualDistanceKm,
      expectedDistanceKm,
      deviationPercent,
      hasSignificantDeviation,
    };
  }

  /** Genereer een leesbaar bericht over de afwijking */
  formatDeviationMessage(result: DeviationResult): string {
    if (result.expectedDistanceKm === null || result.deviationPercent === null) {
      return `Gereden: ${result.actualDistanceKm.toFixed(1)} km. Geen referentieroute beschikbaar.`;
    }

    const direction = result.deviationPercent > 0 ? 'meer' : 'minder';
    const absDeviation = Math.abs(result.deviationPercent);

    let message =
      `Gereden: ${result.actualDistanceKm.toFixed(1)} km ` +
      `(verwacht: ${result.expectedDistanceKm.toFixed(1)} km, ` +
      `${absDeviation.toFixed(1)}% ${direction}).`;

    if (result.hasSignificantDeviation) {
      message +=
        '\n⚠ Afwijking boven drempel! Geef een reden op ' +
        '(bijv. file, wegomlegging, tussenstop).';
    }

    return message;
  }
}

export const routeDeviationService = new RouteDeviationService();
