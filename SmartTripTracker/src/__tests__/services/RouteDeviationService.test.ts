/**
 * TDD Tests voor RouteDeviationService (Omrij-checker)
 *
 * De Belastingdienst vereist dat bij een afwijking van >10% t.o.v.
 * de gebruikelijke route, een verklaring wordt gegeven.
 *
 * Deze tests beschrijven het gewenste gedrag van de omrij-checker:
 * - Detectie van significante afwijkingen
 * - Berekening van het afwijkingspercentage
 * - Generatie van waarschuwingsberichten
 */

import { routeDeviationService, DeviationResult } from '../../services/RouteDeviationService';
import { Trip, GpsPoint } from '../../models/types';

// Helper: maak een trip met routepunten
function createMockTrip(routePoints: GpsPoint[], overrides?: Partial<Trip>): Trip {
  return {
    id: 'test-trip',
    carId: 'test-car',
    category: null,
    status: 'active',
    odometerStart: 45000,
    odometerEnd: null,
    distanceKm: null,
    startAddress: 'Amsterdam',
    endAddress: null,
    startTime: Date.now(),
    endTime: null,
    routePoints,
    expectedDistanceKm: null,
    deviationPercent: null,
    hasSignificantDeviation: false,
    deviationReason: null,
    notes: null,
    bluetoothDeviceId: null,
    bluetoothDeviceName: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('RouteDeviationService', () => {
  describe('analyzeTrip', () => {
    it('geeft geen significante afwijking bij een trip met < 2 routepunten', async () => {
      const trip = createMockTrip([
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 },
      ]);

      const result = await routeDeviationService.analyzeTrip(trip);

      expect(result.hasSignificantDeviation).toBe(false);
      expect(result.expectedDistanceKm).toBeNull();
      expect(result.deviationPercent).toBeNull();
    });

    it('berekent de werkelijke afstand op basis van GPS-punten', async () => {
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 }, // Amsterdam
        { latitude: 52.0907, longitude: 5.1214, timestamp: 2000 }, // Utrecht
      ];
      const trip = createMockTrip(route);

      const result = await routeDeviationService.analyzeTrip(trip);

      // Amsterdam → Utrecht ≈ 35 km hemelsbreed
      expect(result.actualDistanceKm).toBeGreaterThan(30);
      expect(result.actualDistanceKm).toBeLessThan(40);
    });

    it('geeft geen afwijking als er geen Google Maps API key is', async () => {
      // Zonder API key kan expectedDistance niet worden berekend
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 },
        { latitude: 51.9225, longitude: 4.4792, timestamp: 2000 },
      ];
      const trip = createMockTrip(route);

      const result = await routeDeviationService.analyzeTrip(trip);

      expect(result.hasSignificantDeviation).toBe(false);
      expect(result.expectedDistanceKm).toBeNull();
    });
  });

  describe('setThreshold', () => {
    it('accepteert een aangepaste drempel', () => {
      // Dit zou geen fout moeten geven
      expect(() => routeDeviationService.setThreshold(15)).not.toThrow();
    });
  });

  describe('formatDeviationMessage', () => {
    it('toont een bericht zonder referentieroute als expected null is', () => {
      const result: DeviationResult = {
        actualDistanceKm: 25.3,
        expectedDistanceKm: null,
        deviationPercent: null,
        hasSignificantDeviation: false,
      };

      const message = routeDeviationService.formatDeviationMessage(result);

      expect(message).toContain('25.3 km');
      expect(message).toContain('Geen referentieroute');
    });

    it('toont "meer" bij een positieve afwijking (langer gereden)', () => {
      const result: DeviationResult = {
        actualDistanceKm: 30,
        expectedDistanceKm: 25,
        deviationPercent: 20,
        hasSignificantDeviation: true,
      };

      const message = routeDeviationService.formatDeviationMessage(result);

      expect(message).toContain('30.0 km');
      expect(message).toContain('25.0 km');
      expect(message).toContain('meer');
      expect(message).toContain('20.0%');
    });

    it('toont "minder" bij een negatieve afwijking (korter gereden)', () => {
      const result: DeviationResult = {
        actualDistanceKm: 20,
        expectedDistanceKm: 25,
        deviationPercent: -20,
        hasSignificantDeviation: true,
      };

      const message = routeDeviationService.formatDeviationMessage(result);

      expect(message).toContain('minder');
    });

    it('toont een waarschuwing bij significante afwijking', () => {
      const result: DeviationResult = {
        actualDistanceKm: 30,
        expectedDistanceKm: 25,
        deviationPercent: 20,
        hasSignificantDeviation: true,
      };

      const message = routeDeviationService.formatDeviationMessage(result);

      expect(message).toContain('Afwijking boven drempel');
      expect(message).toContain('reden');
    });

    it('toont geen waarschuwing als de afwijking binnen de drempel valt', () => {
      const result: DeviationResult = {
        actualDistanceKm: 26,
        expectedDistanceKm: 25,
        deviationPercent: 4,
        hasSignificantDeviation: false,
      };

      const message = routeDeviationService.formatDeviationMessage(result);

      expect(message).not.toContain('Afwijking boven drempel');
    });
  });
});
