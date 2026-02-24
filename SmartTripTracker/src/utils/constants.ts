import { AppSettings } from '../models/types';

/** Standaard app-instellingen */
export const DEFAULT_SETTINGS: AppSettings = {
  deviationThresholdPercent: 10,
  useTts: true,
  ttsLanguage: 'nl-NL',
  autoStartOnBluetooth: true,
  defaultCategory: null,
  googleMapsApiKey: '',
};

/** Minimum GPS-nauwkeurigheid (meters) om een punt mee te nemen */
export const MIN_GPS_ACCURACY_METERS = 50;

/** Interval voor GPS-tracking (ms) */
export const GPS_TRACKING_INTERVAL_MS = 5000;

/** Minimale afstand (meters) voor een geldig GPS-punt t.o.v. vorige punt */
export const MIN_DISTANCE_BETWEEN_POINTS_METERS = 10;

/** Bewaarplicht rittenregistratie in jaren (Belastingdienst) */
export const RETENTION_YEARS = 7;

/** Async Storage keys */
export const STORAGE_KEYS = {
  SETTINGS: '@smart_trip_tracker/settings',
  ACTIVE_TRIP: '@smart_trip_tracker/active_trip',
  CAR_PROFILES: '@smart_trip_tracker/car_profiles',
  BLUETOOTH_DEVICES: '@smart_trip_tracker/bluetooth_devices',
  LAST_ODOMETER: '@smart_trip_tracker/last_odometer',
} as const;

/** Google Maps API endpoints */
export const GOOGLE_MAPS = {
  GEOCODE_URL: 'https://maps.googleapis.com/maps/api/geocode/json',
  DIRECTIONS_URL: 'https://maps.googleapis.com/maps/api/directions/json',
  ROADS_URL: 'https://roads.googleapis.com/v1/snapToRoads',
} as const;

/** Aarde-radius in km (Haversine-berekening) */
export const EARTH_RADIUS_KM = 6371;
