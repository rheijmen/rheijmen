/**
 * LocationService – GPS-tracking en reverse geocoding.
 *
 * Verantwoordelijkheden:
 * - GPS-positie volgen tijdens een rit
 * - Adressen opzoeken via reverse geocoding (Google Maps)
 * - Afstand berekenen tussen GPS-punten (Haversine)
 */

import Geolocation, {
  GeoPosition,
  GeoError,
} from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { GpsPoint } from '../models/types';
import {
  EARTH_RADIUS_KM,
  GPS_TRACKING_INTERVAL_MS,
  MIN_GPS_ACCURACY_METERS,
  MIN_DISTANCE_BETWEEN_POINTS_METERS,
  GOOGLE_MAPS,
} from '../utils/constants';

type LocationCallback = (point: GpsPoint) => void;

class LocationService {
  private watchId: number | null = null;
  private callbacks: LocationCallback[] = [];
  private lastPoint: GpsPoint | null = null;
  private googleMapsApiKey: string = '';

  /** Stel de Google Maps API key in */
  setApiKey(key: string): void {
    this.googleMapsApiKey = key;
  }

  /** Vraag locatietoestemming aan */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const fineLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Locatietoegang',
          message:
            'De Ritten Tracker heeft toegang tot je locatie nodig om ritten automatisch bij te houden.',
          buttonPositive: 'Toestaan',
          buttonNegative: 'Weigeren',
        },
      );

      if (fineLocation !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }

      // Achtergrondlocatie (nodig voor tracking terwijl app op achtergrond draait)
      const backgroundLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Achtergrondlocatie',
          message:
            'Om ritten te volgen terwijl je rijdt, heeft de app achtergrondtoegang tot je locatie nodig.',
          buttonPositive: 'Toestaan',
          buttonNegative: 'Weigeren',
        },
      );

      return backgroundLocation === PermissionsAndroid.RESULTS.GRANTED;
    }

    // iOS: wordt afgehandeld via Info.plist configuratie
    return true;
  }

  /** Haal de huidige locatie op (eenmalig) */
  async getCurrentPosition(): Promise<GpsPoint> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeoPosition) => {
          resolve(this.positionToGpsPoint(position));
        },
        (error: GeoError) => {
          console.error('[LocationService] Fout bij huidige positie:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );
    });
  }

  /** Start continue GPS-tracking */
  startTracking(): void {
    if (this.watchId !== null) {
      console.warn('[LocationService] Tracking is al actief');
      return;
    }

    this.watchId = Geolocation.watchPosition(
      (position: GeoPosition) => {
        const point = this.positionToGpsPoint(position);

        // Filter op nauwkeurigheid
        if (point.accuracy && point.accuracy > MIN_GPS_ACCURACY_METERS) {
          return;
        }

        // Filter op minimale afstand
        if (this.lastPoint) {
          const distance = this.calculateDistanceMeters(this.lastPoint, point);
          if (distance < MIN_DISTANCE_BETWEEN_POINTS_METERS) {
            return;
          }
        }

        this.lastPoint = point;
        this.callbacks.forEach((cb) => cb(point));
      },
      (error: GeoError) => {
        console.error('[LocationService] Tracking fout:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: MIN_DISTANCE_BETWEEN_POINTS_METERS,
        interval: GPS_TRACKING_INTERVAL_MS,
        fastestInterval: GPS_TRACKING_INTERVAL_MS / 2,
        showsBackgroundLocationIndicator: true,
        // iOS: sta tracking op achtergrond toe
        ...(Platform.OS === 'ios' && {
          activityType: 'automotiveNavigation',
          pausesLocationUpdatesAutomatically: false,
        }),
      },
    );

    console.log('[LocationService] GPS-tracking gestart');
  }

  /** Stop GPS-tracking */
  stopTracking(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.lastPoint = null;
      console.log('[LocationService] GPS-tracking gestopt');
    }
  }

  /** Registreer callback voor locatie-updates */
  onLocationUpdate(callback: LocationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  /** Reverse geocoding: coördinaten → adres via Google Maps */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    if (!this.googleMapsApiKey) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    try {
      const url =
        `${GOOGLE_MAPS.GEOCODE_URL}?latlng=${latitude},${longitude}` +
        `&key=${this.googleMapsApiKey}&language=nl&result_type=street_address`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    } catch (error) {
      console.error('[LocationService] Reverse geocoding fout:', error);
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }
  }

  /** Haal de verwachte route-afstand op via Google Directions API */
  async getExpectedRouteDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): Promise<number | null> {
    if (!this.googleMapsApiKey) {
      return null;
    }

    try {
      const url =
        `${GOOGLE_MAPS.DIRECTIONS_URL}?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&key=${this.googleMapsApiKey}&language=nl`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        // Afstand in meters → km
        const distanceMeters = data.routes[0].legs[0].distance.value;
        return distanceMeters / 1000;
      }

      return null;
    } catch (error) {
      console.error('[LocationService] Directions API fout:', error);
      return null;
    }
  }

  /** Bereken totale afstand van een array GPS-punten in km */
  calculateRouteDistance(points: GpsPoint[]): number {
    if (points.length < 2) return 0;

    let totalKm = 0;
    for (let i = 1; i < points.length; i++) {
      totalKm += this.calculateDistanceKm(points[i - 1], points[i]);
    }
    return totalKm;
  }

  /** Haversine-afstand tussen twee punten in km */
  calculateDistanceKm(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number },
  ): number {
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }

  /** Afstand in meters */
  private calculateDistanceMeters(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number },
  ): number {
    return this.calculateDistanceKm(point1, point2) * 1000;
  }

  /** Graden naar radialen */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /** GeoPosition → GpsPoint */
  private positionToGpsPoint(position: GeoPosition): GpsPoint {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ?? undefined,
    };
  }
}

export const locationService = new LocationService();
