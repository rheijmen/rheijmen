/**
 * TripService – Kernlogica voor het beheren van ritten.
 *
 * Orkestreert de samenwerking tussen:
 * - BluetoothService (trigger)
 * - LocationService (GPS-tracking)
 * - RouteDeviationService (omrij-checker)
 * - FirebaseService (opslag)
 * - TextToSpeechService (spraakinterface)
 * - NotificationService (push-notificaties)
 */

import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Trip, TripCategory, GpsPoint, BluetoothDevice } from '../models/types';
import { bluetoothService } from './BluetoothService';
import { locationService } from './LocationService';
import { routeDeviationService } from './RouteDeviationService';
import { firebaseService } from './FirebaseService';
import { ttsService } from './TextToSpeechService';
import { notificationService } from './NotificationService';
import { STORAGE_KEYS } from '../utils/constants';

type TripEventCallback = (trip: Trip) => void;

class TripService {
  private activeTrip: Trip | null = null;
  private locationUnsubscribe: (() => void) | null = null;
  private onTripStartCallbacks: TripEventCallback[] = [];
  private onTripEndCallbacks: TripEventCallback[] = [];
  private onTripUpdateCallbacks: TripEventCallback[] = [];

  /** Initialiseer de TripService en koppel Bluetooth-events */
  async initialize(): Promise<void> {
    // Herstel eventuele actieve rit (bijv. na app-crash)
    await this.restoreActiveTrip();

    // Luister naar Bluetooth-verbindingen
    bluetoothService.onDeviceConnected(this.handleBluetoothConnect.bind(this));
    bluetoothService.onDeviceDisconnected(this.handleBluetoothDisconnect.bind(this));

    console.log('[TripService] Geïnitialiseerd');
  }

  /** Is er een actieve rit? */
  get isTracking(): boolean {
    return this.activeTrip !== null;
  }

  /** Haal de actieve rit op */
  get currentTrip(): Trip | null {
    return this.activeTrip;
  }

  /** Start een nieuwe rit */
  async startTrip(options: {
    carId: string;
    odometerStart: number;
    bluetoothDevice?: BluetoothDevice;
  }): Promise<Trip> {
    if (this.activeTrip) {
      throw new Error('Er is al een actieve rit');
    }

    // Haal huidige locatie op
    const currentPosition = await locationService.getCurrentPosition();
    const startAddress = await locationService.reverseGeocode(
      currentPosition.latitude,
      currentPosition.longitude,
    );

    const trip: Trip = {
      id: uuidv4(),
      carId: options.carId,
      category: null,
      status: 'active',
      odometerStart: options.odometerStart,
      odometerEnd: null,
      distanceKm: null,
      startAddress,
      endAddress: null,
      startTime: Date.now(),
      endTime: null,
      routePoints: [currentPosition],
      expectedDistanceKm: null,
      deviationPercent: null,
      hasSignificantDeviation: false,
      deviationReason: null,
      notes: null,
      bluetoothDeviceId: options.bluetoothDevice?.id ?? null,
      bluetoothDeviceName: options.bluetoothDevice?.name ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.activeTrip = trip;
    await this.persistActiveTrip();

    // Start GPS-tracking
    this.locationUnsubscribe = locationService.onLocationUpdate(
      this.handleLocationUpdate.bind(this),
    );
    locationService.startTracking();

    // Spreek de gebruiker toe
    await ttsService.speakTripStart();

    // Notificeer listeners
    this.onTripStartCallbacks.forEach((cb) => cb(trip));

    console.log(`[TripService] Rit gestart: ${trip.id}`);
    return trip;
  }

  /** Stop de actieve rit */
  async stopTrip(): Promise<Trip> {
    if (!this.activeTrip) {
      throw new Error('Geen actieve rit om te stoppen');
    }

    // Stop GPS-tracking
    locationService.stopTracking();
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }

    // Haal eindlocatie op
    const lastPoint =
      this.activeTrip.routePoints[this.activeTrip.routePoints.length - 1];
    const endAddress = await locationService.reverseGeocode(
      lastPoint.latitude,
      lastPoint.longitude,
    );

    // Bereken gereden afstand
    const distanceKm = locationService.calculateRouteDistance(
      this.activeTrip.routePoints,
    );

    // Analyseer route-afwijking
    const deviation = await routeDeviationService.analyzeTrip(this.activeTrip);

    // Werk de rit bij
    this.activeTrip = {
      ...this.activeTrip,
      status: 'pending_classification',
      endAddress,
      endTime: Date.now(),
      distanceKm,
      expectedDistanceKm: deviation.expectedDistanceKm,
      deviationPercent: deviation.deviationPercent,
      hasSignificantDeviation: deviation.hasSignificantDeviation,
      updatedAt: Date.now(),
    };

    // Sla op in Firebase
    await firebaseService.saveTrip(this.activeTrip);

    // Spreek de gebruiker toe
    await ttsService.speakTripEnd(distanceKm);

    // Stuur push-notificatie
    notificationService.sendTripCompletedNotification(
      distanceKm,
      this.activeTrip.id,
    );

    // Waarschuw bij afwijking
    if (deviation.hasSignificantDeviation && deviation.deviationPercent !== null) {
      await ttsService.speakDeviationWarning(deviation.deviationPercent);
    }

    const completedTrip = this.activeTrip;

    // Notificeer listeners
    this.onTripEndCallbacks.forEach((cb) => cb(completedTrip));

    // Reset actieve rit
    this.activeTrip = null;
    await this.clearPersistedTrip();

    console.log(`[TripService] Rit gestopt: ${completedTrip.id}`);
    return completedTrip;
  }

  /** Classificeer een voltooide rit */
  async classifyTrip(
    tripId: string,
    category: TripCategory,
    deviationReason?: string,
    notes?: string,
  ): Promise<void> {
    await firebaseService.updateTrip(tripId, {
      category,
      status: 'completed',
      deviationReason: deviationReason ?? null,
      notes: notes ?? null,
    });

    await ttsService.speakClassificationConfirmed(
      category === 'zakelijk'
        ? 'zakelijk'
        : category === 'prive'
          ? 'privé'
          : 'gemengd',
    );
  }

  /** Werk de kilometerstand bij voor een rit */
  async updateOdometer(
    tripId: string,
    odometerEnd: number,
  ): Promise<void> {
    const trip = await firebaseService.getTrip(tripId);
    if (!trip) return;

    const distanceKm = odometerEnd - trip.odometerStart;
    await firebaseService.updateTrip(tripId, {
      odometerEnd,
      distanceKm,
    });

    // Sla de laatste kilometerstand op als referentie voor de volgende rit
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_ODOMETER,
      String(odometerEnd),
    );
  }

  /** Haal de laatst bekende kilometerstand op */
  async getLastOdometer(): Promise<number | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ODOMETER);
    return stored ? parseFloat(stored) : null;
  }

  // ---- Event callbacks ----

  onTripStarted(callback: TripEventCallback): () => void {
    this.onTripStartCallbacks.push(callback);
    return () => {
      this.onTripStartCallbacks = this.onTripStartCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onTripEnded(callback: TripEventCallback): () => void {
    this.onTripEndCallbacks.push(callback);
    return () => {
      this.onTripEndCallbacks = this.onTripEndCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onTripUpdated(callback: TripEventCallback): () => void {
    this.onTripUpdateCallbacks.push(callback);
    return () => {
      this.onTripUpdateCallbacks = this.onTripUpdateCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  // ---- Private methods ----

  /** Verwerk Bluetooth-verbinding → start rit */
  private async handleBluetoothConnect(device: BluetoothDevice): Promise<void> {
    if (this.activeTrip) return; // Al een actieve rit

    if (device.linkedCarId) {
      const lastOdometer = await this.getLastOdometer();

      await this.startTrip({
        carId: device.linkedCarId,
        odometerStart: lastOdometer ?? 0,
        bluetoothDevice: device,
      });
    }
  }

  /** Verwerk Bluetooth-verbreking → stop rit */
  private async handleBluetoothDisconnect(_device: BluetoothDevice): Promise<void> {
    if (!this.activeTrip) return;

    // Wacht 30 seconden (voorkomt vals alarm bij korte verbrekingen)
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Check of er intussen weer verbinding is
    if (this.activeTrip) {
      await this.stopTrip();
    }
  }

  /** Verwerk een nieuwe GPS-positie */
  private handleLocationUpdate(point: GpsPoint): void {
    if (!this.activeTrip) return;

    this.activeTrip.routePoints.push(point);
    this.activeTrip.updatedAt = Date.now();

    this.onTripUpdateCallbacks.forEach((cb) => cb(this.activeTrip!));
  }

  /** Sla de actieve rit op (voor crash recovery) */
  private async persistActiveTrip(): Promise<void> {
    if (this.activeTrip) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_TRIP,
        JSON.stringify(this.activeTrip),
      );
    }
  }

  /** Herstel een actieve rit na herstart */
  private async restoreActiveTrip(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP);
      if (stored) {
        this.activeTrip = JSON.parse(stored);
        // Herstart GPS-tracking
        this.locationUnsubscribe = locationService.onLocationUpdate(
          this.handleLocationUpdate.bind(this),
        );
        locationService.startTracking();
        console.log('[TripService] Actieve rit hersteld');
      }
    } catch (error) {
      console.error('[TripService] Fout bij herstellen actieve rit:', error);
    }
  }

  /** Verwijder de opgeslagen actieve rit */
  private async clearPersistedTrip(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TRIP);
  }
}

export const tripService = new TripService();
