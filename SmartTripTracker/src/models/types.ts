/**
 * Kernmodellen voor de Slimme Ritten-Tracker.
 * Alle velden zijn afgestemd op de eisen van de Belastingdienst.
 */

/** Autoprofiel – merk, type en kenteken (vereist door fiscus) */
export interface CarProfile {
  id: string;
  /** Merk van de auto, bijv. "Volkswagen" */
  brand: string;
  /** Type/model, bijv. "Golf 8" */
  model: string;
  /** Nederlands kenteken, bijv. "AB-123-CD" */
  licensePlate: string;
  /** Of dit de standaard-auto is */
  isDefault: boolean;
  /** Datum aangemaakt */
  createdAt: number;
}

/** GPS-coördinaat met tijdstempel */
export interface GpsPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
}

/** Type rit – verplicht veld voor Belastingdienst */
export type TripCategory = 'zakelijk' | 'prive' | 'gemengd';

/** Status van een actieve rit */
export type TripStatus = 'active' | 'completed' | 'pending_classification';

/** Rit – kernobject van de app */
export interface Trip {
  id: string;
  /** Gekoppelde auto */
  carId: string;
  /** Categorie: zakelijk, privé of gemengd */
  category: TripCategory | null;
  /** Status van de rit */
  status: TripStatus;

  /** Kilometerstand bij vertrek */
  odometerStart: number;
  /** Kilometerstand bij aankomst */
  odometerEnd: number | null;
  /** Berekende afstand in km */
  distanceKm: number | null;

  /** Vertrekadres (reverse geocoded) */
  startAddress: string;
  /** Aankomstadres (reverse geocoded) */
  endAddress: string | null;

  /** Starttijdstip (Unix ms) */
  startTime: number;
  /** Eindtijdstip (Unix ms) */
  endTime: number | null;

  /** GPS-route opgenomen tijdens de rit */
  routePoints: GpsPoint[];

  /** Afstand volgens Google Maps "gebruikelijke route" in km */
  expectedDistanceKm: number | null;
  /** Afwijking t.o.v. verwachte route in percentage */
  deviationPercent: number | null;
  /** Is de afwijking boven de drempel (>10%)? */
  hasSignificantDeviation: boolean;

  /** Toelichting bij afwijking (verplicht als hasSignificantDeviation) */
  deviationReason: string | null;
  /** Algemene opmerking bij de rit */
  notes: string | null;

  /** Bluetooth device dat de rit heeft getriggerd */
  bluetoothDeviceId: string | null;
  bluetoothDeviceName: string | null;

  /** Tijdstempel aangemaakt / bijgewerkt */
  createdAt: number;
  updatedAt: number;
}

/** Gekoppeld Bluetooth-apparaat (autoradio / handsfree) */
export interface BluetoothDevice {
  id: string;
  name: string;
  /** Gekoppelde auto (optioneel) */
  linkedCarId: string | null;
  /** Laatste keer verbonden */
  lastSeen: number;
}

/** App-instellingen */
export interface AppSettings {
  /** Drempelpercentage voor route-afwijking (standaard 10%) */
  deviationThresholdPercent: number;
  /** Gebruik tekst-naar-spraak */
  useTts: boolean;
  /** Taal voor spraak */
  ttsLanguage: 'nl-NL' | 'en-US';
  /** Automatisch starten bij Bluetooth-verbinding */
  autoStartOnBluetooth: boolean;
  /** Standaard ritcategorie (null = altijd vragen) */
  defaultCategory: TripCategory | null;
  /** Google Maps API key */
  googleMapsApiKey: string;
}

/** Samenvatting voor export / dashboard */
export interface TripSummary {
  totalTrips: number;
  totalDistanceKm: number;
  businessDistanceKm: number;
  privateDistanceKm: number;
  mixedDistanceKm: number;
  periodStart: number;
  periodEnd: number;
}

/** Een rij in de Belastingdienst-export */
export interface TaxExportRow {
  datum: string;
  beginKilometerstand: number;
  eindKilometerstand: number;
  geredenKilometers: number;
  vertrekAdres: string;
  aankomstAdres: string;
  ritType: string;
  kenteken: string;
  autoOmschrijving: string;
  omrijReden: string;
  opmerkingen: string;
}
