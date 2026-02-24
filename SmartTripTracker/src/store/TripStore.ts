/**
 * TripStore – Centrale state management met Zustand.
 *
 * Beheert de app-state voor:
 * - Actieve rit
 * - Rittenlijst
 * - Autoprofielen
 * - App-instellingen
 */

import { create } from 'zustand';
import {
  Trip,
  CarProfile,
  AppSettings,
  TripCategory,
  TripSummary,
} from '../models/types';
import { tripService } from '../services/TripService';
import { firebaseService } from '../services/FirebaseService';
import { exportService } from '../services/ExportService';
import { DEFAULT_SETTINGS } from '../utils/constants';

interface TripState {
  // State
  activeTrip: Trip | null;
  trips: Trip[];
  pendingTrips: Trip[];
  cars: CarProfile[];
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  // Acties – Initialisatie
  initialize: () => Promise<void>;
  loadTrips: () => Promise<void>;
  loadCars: () => Promise<void>;

  // Acties – Ritten
  startTrip: (carId: string, odometerStart: number) => Promise<void>;
  stopTrip: () => Promise<void>;
  classifyTrip: (
    tripId: string,
    category: TripCategory,
    deviationReason?: string,
    notes?: string,
  ) => Promise<void>;
  updateOdometer: (tripId: string, odometerEnd: number) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;

  // Acties – Auto's
  addCar: (car: CarProfile) => Promise<void>;
  updateCar: (carId: string, updates: Partial<CarProfile>) => Promise<void>;
  deleteCar: (carId: string) => Promise<void>;

  // Acties – Instellingen
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Acties – Export
  exportToExcel: (startDate: number, endDate: number) => Promise<string>;
  exportToPdf: (startDate: number, endDate: number) => Promise<string>;
}

export const useTripStore = create<TripState>((set, get) => ({
  // Initiële state
  activeTrip: null,
  trips: [],
  pendingTrips: [],
  cars: [],
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  // ---- Initialisatie ----

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      // Laad instellingen
      const savedSettings = await firebaseService.getSettings();
      if (savedSettings) {
        set({ settings: savedSettings });
      }

      // Laad auto's en ritten
      await get().loadCars();
      await get().loadTrips();

      // Initialiseer trip service
      await tripService.initialize();

      // Luister naar trip-events
      tripService.onTripStarted((trip) => set({ activeTrip: trip }));
      tripService.onTripEnded((trip) => {
        set({ activeTrip: null });
        get().loadTrips();
      });
      tripService.onTripUpdated((trip) => set({ activeTrip: trip }));

      // Herstel actieve rit
      if (tripService.currentTrip) {
        set({ activeTrip: tripService.currentTrip });
      }

      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialisatie mislukt',
      });
    }
  },

  loadTrips: async () => {
    try {
      const trips = await firebaseService.getTrips();
      const pendingTrips = trips.filter(
        (t) => t.status === 'pending_classification',
      );
      set({ trips, pendingTrips });
    } catch (error) {
      console.error('[TripStore] Fout bij laden ritten:', error);
    }
  },

  loadCars: async () => {
    try {
      const cars = await firebaseService.getCars();
      set({ cars });
    } catch (error) {
      console.error('[TripStore] Fout bij laden auto\'s:', error);
    }
  },

  // ---- Ritten ----

  startTrip: async (carId, odometerStart) => {
    set({ error: null });
    try {
      const trip = await tripService.startTrip({ carId, odometerStart });
      set({ activeTrip: trip });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Kan rit niet starten',
      });
    }
  },

  stopTrip: async () => {
    set({ error: null });
    try {
      await tripService.stopTrip();
      set({ activeTrip: null });
      await get().loadTrips();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Kan rit niet stoppen',
      });
    }
  },

  classifyTrip: async (tripId, category, deviationReason, notes) => {
    try {
      await tripService.classifyTrip(tripId, category, deviationReason, notes);
      await get().loadTrips();
    } catch (error) {
      console.error('[TripStore] Fout bij classificeren:', error);
    }
  },

  updateOdometer: async (tripId, odometerEnd) => {
    try {
      await tripService.updateOdometer(tripId, odometerEnd);
      await get().loadTrips();
    } catch (error) {
      console.error('[TripStore] Fout bij bijwerken km-stand:', error);
    }
  },

  deleteTrip: async (tripId) => {
    try {
      await firebaseService.deleteTrip(tripId);
      await get().loadTrips();
    } catch (error) {
      console.error('[TripStore] Fout bij verwijderen rit:', error);
    }
  },

  // ---- Auto's ----

  addCar: async (car) => {
    try {
      await firebaseService.saveCar(car);
      await get().loadCars();
    } catch (error) {
      console.error('[TripStore] Fout bij toevoegen auto:', error);
    }
  },

  updateCar: async (carId, updates) => {
    try {
      await firebaseService.updateCar(carId, updates);
      await get().loadCars();
    } catch (error) {
      console.error('[TripStore] Fout bij bijwerken auto:', error);
    }
  },

  deleteCar: async (carId) => {
    try {
      await firebaseService.deleteCar(carId);
      await get().loadCars();
    } catch (error) {
      console.error('[TripStore] Fout bij verwijderen auto:', error);
    }
  },

  // ---- Instellingen ----

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    set({ settings: newSettings });
    try {
      await firebaseService.saveSettings(newSettings);
    } catch (error) {
      console.error('[TripStore] Fout bij opslaan instellingen:', error);
    }
  },

  // ---- Export ----

  exportToExcel: async (startDate, endDate) => {
    const trips = await firebaseService.getTripsByPeriod(startDate, endDate);
    const { cars } = get();
    return exportService.exportToExcel(trips, cars);
  },

  exportToPdf: async (startDate, endDate) => {
    const trips = await firebaseService.getTripsByPeriod(startDate, endDate);
    const { cars } = get();
    const summary = await firebaseService.getTripSummary(startDate, endDate);
    return exportService.exportToPdf(trips, cars, summary);
  },
}));
