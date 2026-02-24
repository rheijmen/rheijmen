/**
 * TDD Tests voor LocationService
 *
 * Test de pure berekeningsfuncties:
 * - Haversine-afstand tussen twee GPS-punten
 * - Totale route-afstand van meerdere punten
 * - Reverse geocoding (gemockt)
 */

import { locationService } from '../../services/LocationService';
import { GpsPoint } from '../../models/types';

describe('LocationService', () => {
  describe('calculateDistanceKm (Haversine)', () => {
    it('berekent de afstand Amsterdam → Rotterdam (~58 km)', () => {
      const amsterdam = { latitude: 52.3676, longitude: 4.9041 };
      const rotterdam = { latitude: 51.9225, longitude: 4.4792 };

      const distance = locationService.calculateDistanceKm(amsterdam, rotterdam);

      // Werkelijke hemelsbreed-afstand is ~57-58 km
      expect(distance).toBeGreaterThan(55);
      expect(distance).toBeLessThan(62);
    });

    it('berekent de afstand Amsterdam → Utrecht (~35 km)', () => {
      const amsterdam = { latitude: 52.3676, longitude: 4.9041 };
      const utrecht = { latitude: 52.0907, longitude: 5.1214 };

      const distance = locationService.calculateDistanceKm(amsterdam, utrecht);

      expect(distance).toBeGreaterThan(33);
      expect(distance).toBeLessThan(38);
    });

    it('geeft 0 terug als start en eind hetzelfde zijn', () => {
      const point = { latitude: 52.3676, longitude: 4.9041 };
      const distance = locationService.calculateDistanceKm(point, point);
      expect(distance).toBe(0);
    });

    it('werkt met negatieve breedtegraden (zuidelijk halfrond)', () => {
      const capeTown = { latitude: -33.9249, longitude: 18.4241 };
      const johannesburg = { latitude: -26.2041, longitude: 28.0473 };

      const distance = locationService.calculateDistanceKm(capeTown, johannesburg);
      expect(distance).toBeGreaterThan(1200);
      expect(distance).toBeLessThan(1300);
    });

    it('werkt met de datumgrens (±180° lengtegraad)', () => {
      const westOfLine = { latitude: 0, longitude: 179 };
      const eastOfLine = { latitude: 0, longitude: -179 };

      const distance = locationService.calculateDistanceKm(westOfLine, eastOfLine);

      // ~222 km (2 graden op de evenaar)
      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(250);
    });
  });

  describe('calculateRouteDistance', () => {
    it('berekent de totale afstand van een route met meerdere punten', () => {
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 }, // Amsterdam
        { latitude: 52.0907, longitude: 5.1214, timestamp: 2000 }, // Utrecht
        { latitude: 51.9225, longitude: 4.4792, timestamp: 3000 }, // Rotterdam
      ];

      const distance = locationService.calculateRouteDistance(route);

      // Amsterdam→Utrecht (~35km) + Utrecht→Rotterdam (~50km) ≈ 85km
      expect(distance).toBeGreaterThan(80);
      expect(distance).toBeLessThan(95);
    });

    it('geeft 0 terug bij een leeg array', () => {
      expect(locationService.calculateRouteDistance([])).toBe(0);
    });

    it('geeft 0 terug bij een enkel punt', () => {
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 },
      ];
      expect(locationService.calculateRouteDistance(route)).toBe(0);
    });

    it('berekent de afstand correct bij twee punten', () => {
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 }, // Amsterdam
        { latitude: 51.9225, longitude: 4.4792, timestamp: 2000 }, // Rotterdam
      ];

      const distance = locationService.calculateRouteDistance(route);
      const directDistance = locationService.calculateDistanceKm(
        { latitude: 52.3676, longitude: 4.9041 },
        { latitude: 51.9225, longitude: 4.4792 },
      );

      expect(distance).toBeCloseTo(directDistance, 5);
    });

    it('de route-afstand is altijd >= directe afstand (driehoeksongelijkheid)', () => {
      const route: GpsPoint[] = [
        { latitude: 52.3676, longitude: 4.9041, timestamp: 1000 }, // Amsterdam
        { latitude: 52.0907, longitude: 5.1214, timestamp: 2000 }, // Utrecht (omweg)
        { latitude: 51.9225, longitude: 4.4792, timestamp: 3000 }, // Rotterdam
      ];

      const routeDistance = locationService.calculateRouteDistance(route);
      const directDistance = locationService.calculateDistanceKm(
        { latitude: 52.3676, longitude: 4.9041 },
        { latitude: 51.9225, longitude: 4.4792 },
      );

      expect(routeDistance).toBeGreaterThanOrEqual(directDistance);
    });
  });

  describe('reverseGeocode', () => {
    it('geeft coördinaten als string terug als er geen API key is', async () => {
      // Geen API key ingesteld → fallback naar coördinaten
      locationService.setApiKey('');
      const result = await locationService.reverseGeocode(52.3676, 4.9041);
      expect(result).toContain('52.36760');
      expect(result).toContain('4.90410');
    });
  });

  describe('getExpectedRouteDistance', () => {
    it('geeft null terug als er geen API key is', async () => {
      locationService.setApiKey('');
      const result = await locationService.getExpectedRouteDistance(
        { latitude: 52.3676, longitude: 4.9041 },
        { latitude: 51.9225, longitude: 4.4792 },
      );
      expect(result).toBeNull();
    });
  });
});
