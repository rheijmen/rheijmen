/**
 * FirebaseService – Cloud-opslag voor ritten en autoprofielen.
 *
 * Gebruikt Firebase Firestore om alle ritgegevens veilig op te slaan
 * conform de bewaarplicht van 7 jaar (Belastingdienst).
 *
 * Collecties:
 * - users/{uid}/trips       → Alle ritten
 * - users/{uid}/cars        → Autoprofielen
 * - users/{uid}/settings    → App-instellingen
 */

import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Trip, CarProfile, AppSettings, TripSummary } from '../models/types';

class FirebaseService {
  /** Haal de huidige gebruiker-ID op */
  private get uid(): string {
    const user = auth().currentUser;
    if (!user) throw new Error('Gebruiker niet ingelogd');
    return user.uid;
  }

  /** Referentie naar de trips-collectie van de huidige gebruiker */
  private get tripsRef(): FirebaseFirestoreTypes.CollectionReference {
    return firestore().collection('users').doc(this.uid).collection('trips');
  }

  /** Referentie naar de cars-collectie */
  private get carsRef(): FirebaseFirestoreTypes.CollectionReference {
    return firestore().collection('users').doc(this.uid).collection('cars');
  }

  /** Referentie naar het settings-document */
  private get settingsRef(): FirebaseFirestoreTypes.DocumentReference {
    return firestore().collection('users').doc(this.uid).collection('config').doc('settings');
  }

  // ===================== AUTH =====================

  /** Anoniem inloggen (voor snelle start zonder account) */
  async signInAnonymously(): Promise<string> {
    const result = await auth().signInAnonymously();
    return result.user.uid;
  }

  /** Inloggen met e-mail */
  async signInWithEmail(email: string, password: string): Promise<string> {
    const result = await auth().signInWithEmailAndPassword(email, password);
    return result.user.uid;
  }

  /** Registreren met e-mail */
  async registerWithEmail(email: string, password: string): Promise<string> {
    const result = await auth().createUserWithEmailAndPassword(email, password);
    return result.user.uid;
  }

  /** Uitloggen */
  async signOut(): Promise<void> {
    await auth().signOut();
  }

  // ===================== TRIPS =====================

  /** Sla een nieuwe rit op */
  async saveTrip(trip: Trip): Promise<void> {
    await this.tripsRef.doc(trip.id).set({
      ...trip,
      // Firestore kan geen grote arrays opslaan > 1MB,
      // sla routePoints compact op
      routePoints: trip.routePoints.map((p) => ({
        lat: p.latitude,
        lng: p.longitude,
        t: p.timestamp,
      })),
    });
  }

  /** Werk een bestaande rit bij */
  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    const data: Record<string, unknown> = { ...updates, updatedAt: Date.now() };

    // Compact routePoints als die worden bijgewerkt
    if (updates.routePoints) {
      data.routePoints = updates.routePoints.map((p) => ({
        lat: p.latitude,
        lng: p.longitude,
        t: p.timestamp,
      }));
    }

    await this.tripsRef.doc(tripId).update(data);
  }

  /** Haal een enkele rit op */
  async getTrip(tripId: string): Promise<Trip | null> {
    const doc = await this.tripsRef.doc(tripId).get();
    if (!doc.exists) return null;
    return this.docToTrip(doc);
  }

  /** Haal alle ritten op, gesorteerd op datum (nieuwste eerst) */
  async getTrips(limit: number = 50): Promise<Trip[]> {
    const snapshot = await this.tripsRef
      .orderBy('startTime', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => this.docToTrip(doc));
  }

  /** Haal ritten op voor een specifieke periode */
  async getTripsByPeriod(startDate: number, endDate: number): Promise<Trip[]> {
    const snapshot = await this.tripsRef
      .where('startTime', '>=', startDate)
      .where('startTime', '<=', endDate)
      .orderBy('startTime', 'desc')
      .get();

    return snapshot.docs.map((doc) => this.docToTrip(doc));
  }

  /** Haal ritten op die nog geclassificeerd moeten worden */
  async getPendingTrips(): Promise<Trip[]> {
    const snapshot = await this.tripsRef
      .where('status', '==', 'pending_classification')
      .orderBy('startTime', 'desc')
      .get();

    return snapshot.docs.map((doc) => this.docToTrip(doc));
  }

  /** Verwijder een rit */
  async deleteTrip(tripId: string): Promise<void> {
    await this.tripsRef.doc(tripId).delete();
  }

  /** Bereken samenvatting voor een periode */
  async getTripSummary(startDate: number, endDate: number): Promise<TripSummary> {
    const trips = await this.getTripsByPeriod(startDate, endDate);

    const summary: TripSummary = {
      totalTrips: trips.length,
      totalDistanceKm: 0,
      businessDistanceKm: 0,
      privateDistanceKm: 0,
      mixedDistanceKm: 0,
      periodStart: startDate,
      periodEnd: endDate,
    };

    for (const trip of trips) {
      const distance = trip.distanceKm ?? 0;
      summary.totalDistanceKm += distance;

      switch (trip.category) {
        case 'zakelijk':
          summary.businessDistanceKm += distance;
          break;
        case 'prive':
          summary.privateDistanceKm += distance;
          break;
        case 'gemengd':
          summary.mixedDistanceKm += distance;
          break;
      }
    }

    return summary;
  }

  // ===================== CARS =====================

  /** Sla een autoprofiel op */
  async saveCar(car: CarProfile): Promise<void> {
    await this.carsRef.doc(car.id).set(car);
  }

  /** Werk een autoprofiel bij */
  async updateCar(carId: string, updates: Partial<CarProfile>): Promise<void> {
    await this.carsRef.doc(carId).update(updates);
  }

  /** Haal alle autoprofielen op */
  async getCars(): Promise<CarProfile[]> {
    const snapshot = await this.carsRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as CarProfile);
  }

  /** Verwijder een autoprofiel */
  async deleteCar(carId: string): Promise<void> {
    await this.carsRef.doc(carId).delete();
  }

  // ===================== SETTINGS =====================

  /** Sla instellingen op */
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.settingsRef.set(settings);
  }

  /** Haal instellingen op */
  async getSettings(): Promise<AppSettings | null> {
    const doc = await this.settingsRef.get();
    return doc.exists ? (doc.data() as AppSettings) : null;
  }

  // ===================== HELPERS =====================

  /** Converteer een Firestore-document naar een Trip-object */
  private docToTrip(doc: FirebaseFirestoreTypes.DocumentSnapshot): Trip {
    const data = doc.data()!;

    return {
      ...data,
      id: doc.id,
      // Decompact routePoints
      routePoints: (data.routePoints || []).map(
        (p: { lat: number; lng: number; t: number }) => ({
          latitude: p.lat,
          longitude: p.lng,
          timestamp: p.t,
        }),
      ),
    } as Trip;
  }
}

export const firebaseService = new FirebaseService();
