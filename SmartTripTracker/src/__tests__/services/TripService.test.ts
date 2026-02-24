/**
 * TDD Tests voor TripService
 *
 * Test de complete rit-levenscyclus:
 * 1. Start rit (handmatig of via Bluetooth)
 * 2. GPS-tracking tijdens de rit
 * 3. Stop rit (handmatig of bij Bluetooth-verbreking)
 * 4. Classificatie (zakelijk/privé/gemengd)
 * 5. Kilometerstand bijwerken
 * 6. Crash recovery (actieve rit herstellen)
 */

import { tripService } from '../../services/TripService';
import { locationService } from '../../services/LocationService';
import { firebaseService } from '../../services/FirebaseService';
import { ttsService } from '../../services/TextToSpeechService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';

// Mock de services die TripService intern gebruikt
jest.mock('../../services/LocationService', () => ({
  locationService: {
    getCurrentPosition: jest.fn().mockResolvedValue({
      latitude: 52.3676,
      longitude: 4.9041,
      timestamp: Date.now(),
      accuracy: 10,
    }),
    reverseGeocode: jest.fn().mockResolvedValue('Keizersgracht 100, Amsterdam'),
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
    onLocationUpdate: jest.fn().mockReturnValue(jest.fn()),
    calculateRouteDistance: jest.fn().mockReturnValue(12.4),
    getExpectedRouteDistance: jest.fn().mockResolvedValue(11.5),
    setApiKey: jest.fn(),
    calculateDistanceKm: jest.fn().mockReturnValue(12),
  },
}));

jest.mock('../../services/FirebaseService', () => ({
  firebaseService: {
    saveTrip: jest.fn().mockResolvedValue(undefined),
    updateTrip: jest.fn().mockResolvedValue(undefined),
    getTrip: jest.fn().mockResolvedValue(null),
    getTrips: jest.fn().mockResolvedValue([]),
    signInAnonymously: jest.fn().mockResolvedValue('test-uid'),
  },
}));

jest.mock('../../services/TextToSpeechService', () => ({
  ttsService: {
    speakTripStart: jest.fn().mockResolvedValue(undefined),
    speakTripEnd: jest.fn().mockResolvedValue(undefined),
    speakDeviationWarning: jest.fn().mockResolvedValue(undefined),
    speakClassificationConfirmed: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/NotificationService', () => ({
  notificationService: {
    sendTripCompletedNotification: jest.fn(),
    sendDeviationNotification: jest.fn(),
    initialize: jest.fn(),
  },
}));

jest.mock('../../services/RouteDeviationService', () => ({
  routeDeviationService: {
    analyzeTrip: jest.fn().mockResolvedValue({
      actualDistanceKm: 12.4,
      expectedDistanceKm: 11.5,
      deviationPercent: 7.8,
      hasSignificantDeviation: false,
    }),
    setThreshold: jest.fn(),
  },
}));

jest.mock('../../services/BluetoothService', () => ({
  bluetoothService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    onDeviceConnected: jest.fn().mockReturnValue(jest.fn()),
    onDeviceDisconnected: jest.fn().mockReturnValue(jest.fn()),
    destroy: jest.fn(),
  },
}));

describe('TripService', () => {
  // Zorg dat elke test met een schone state begint
  beforeEach(async () => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    // Stop eventuele actieve rit van een vorige test
    if (tripService.isTracking) {
      try { await tripService.stopTrip(); } catch { /* ignore */ }
    }
    await tripService.initialize();
  });

  describe('isTracking', () => {
    it('is false wanneer er geen actieve rit is', () => {
      expect(tripService.isTracking).toBe(false);
    });
  });

  describe('currentTrip', () => {
    it('is null wanneer er geen actieve rit is', () => {
      expect(tripService.currentTrip).toBeNull();
    });
  });

  describe('startTrip', () => {
    it('maakt een nieuwe rit aan met uniek ID', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(trip.id).toBeDefined();
      expect(trip.id.length).toBeGreaterThan(0);
    });

    it('slaat de auto-ID op', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(trip.carId).toBe('car-1');
    });

    it('slaat de kilometerstand op', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(trip.odometerStart).toBe(45000);
    });

    it('haalt het vertrekadres op via reverse geocoding', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(locationService.reverseGeocode).toHaveBeenCalled();
      expect(trip.startAddress).toBe('Keizersgracht 100, Amsterdam');
    });

    it('start GPS-tracking', async () => {
      await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(locationService.startTracking).toHaveBeenCalled();
    });

    it('spreekt de begroeting uit via TTS', async () => {
      await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(ttsService.speakTripStart).toHaveBeenCalled();
    });

    it('zet de status op "active"', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(trip.status).toBe('active');
    });

    it('heeft geen categorie bij de start (moet nog ingedeeld worden)', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(trip.category).toBeNull();
    });

    it('slaat de Bluetooth-info op als die wordt meegegeven', async () => {
      const trip = await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
        bluetoothDevice: {
          id: 'bt-1',
          name: 'VW Radio',
          linkedCarId: 'car-1',
          lastSeen: Date.now(),
        },
      });

      expect(trip.bluetoothDeviceId).toBe('bt-1');
      expect(trip.bluetoothDeviceName).toBe('VW Radio');
    });

    it('gooit een fout als er al een actieve rit is', async () => {
      await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      await expect(
        tripService.startTrip({
          carId: 'car-1',
          odometerStart: 45050,
        }),
      ).rejects.toThrow('Er is al een actieve rit');
    });

    it('slaat de actieve rit op voor crash recovery', async () => {
      await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACTIVE_TRIP,
        expect.any(String),
      );
    });
  });

  describe('stopTrip', () => {
    // Start een rit voordat we die stoppen
    beforeEach(async () => {
      await tripService.startTrip({
        carId: 'car-1',
        odometerStart: 45000,
      });
      jest.clearAllMocks(); // Reset mocks zodat we alleen stop-calls zien
    });

    it('stopt de GPS-tracking', async () => {
      await tripService.stopTrip();
      expect(locationService.stopTracking).toHaveBeenCalled();
    });

    it('haalt het eindadres op via reverse geocoding', async () => {
      await tripService.stopTrip();
      expect(locationService.reverseGeocode).toHaveBeenCalled();
    });

    it('berekent de gereden afstand', async () => {
      const trip = await tripService.stopTrip();
      expect(trip.distanceKm).toBe(12.4);
    });

    it('slaat de rit op in Firebase', async () => {
      await tripService.stopTrip();
      expect(firebaseService.saveTrip).toHaveBeenCalled();
    });

    it('spreekt het einde-bericht uit via TTS', async () => {
      await tripService.stopTrip();
      expect(ttsService.speakTripEnd).toHaveBeenCalledWith(12.4);
    });

    it('zet de status op "pending_classification"', async () => {
      const trip = await tripService.stopTrip();
      expect(trip.status).toBe('pending_classification');
    });

    it('verwijdert de opgeslagen actieve rit (crash recovery)', async () => {
      await tripService.stopTrip();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        STORAGE_KEYS.ACTIVE_TRIP,
      );
    });

    it('gooit een fout als er geen actieve rit is', async () => {
      await tripService.stopTrip(); // Stop de actieve rit

      await expect(tripService.stopTrip()).rejects.toThrow(
        'Geen actieve rit om te stoppen',
      );
    });
  });

  describe('classifyTrip', () => {
    it('slaat de classificatie op in Firebase', async () => {
      await tripService.classifyTrip('trip-1', 'zakelijk');

      expect(firebaseService.updateTrip).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({
          category: 'zakelijk',
          status: 'completed',
        }),
      );
    });

    it('slaat de afwijkingsreden op als die wordt meegegeven', async () => {
      await tripService.classifyTrip(
        'trip-1',
        'zakelijk',
        'File op de A2',
      );

      expect(firebaseService.updateTrip).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({
          deviationReason: 'File op de A2',
        }),
      );
    });

    it('slaat opmerkingen op als die worden meegegeven', async () => {
      await tripService.classifyTrip(
        'trip-1',
        'zakelijk',
        undefined,
        'Klantbezoek Firma XYZ',
      );

      expect(firebaseService.updateTrip).toHaveBeenCalledWith(
        'trip-1',
        expect.objectContaining({
          notes: 'Klantbezoek Firma XYZ',
        }),
      );
    });

    it('bevestigt de classificatie via TTS', async () => {
      await tripService.classifyTrip('trip-1', 'prive');

      expect(ttsService.speakClassificationConfirmed).toHaveBeenCalledWith('privé');
    });
  });

  describe('getLastOdometer', () => {
    it('retourneert null als er geen opgeslagen kilometerstand is', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await tripService.getLastOdometer();
      expect(result).toBeNull();
    });

    it('retourneert de opgeslagen kilometerstand als getal', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('45230');
      const result = await tripService.getLastOdometer();
      expect(result).toBe(45230);
    });
  });

  describe('event callbacks', () => {
    it('onTripStarted retourneert een unsubscribe functie', () => {
      const unsub = tripService.onTripStarted(jest.fn());
      expect(typeof unsub).toBe('function');
    });

    it('onTripEnded retourneert een unsubscribe functie', () => {
      const unsub = tripService.onTripEnded(jest.fn());
      expect(typeof unsub).toBe('function');
    });

    it('onTripUpdated retourneert een unsubscribe functie', () => {
      const unsub = tripService.onTripUpdated(jest.fn());
      expect(typeof unsub).toBe('function');
    });
  });
});
