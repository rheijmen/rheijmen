/**
 * DashboardScreen – Hoofdscherm van de app.
 *
 * Toont:
 * - Actieve rit (als er een loopt)
 * - Knop om handmatig een rit te starten
 * - Overzicht van recente ritten
 * - Samenvatting van de maand
 * - Ritten die nog ingedeeld moeten worden
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTripStore } from '../store/TripStore';
import { TripCard } from '../components/TripCard';
import { CarSelector } from '../components/CarSelector';
import { OdometerInput } from '../components/OdometerInput';
import { TripClassificationModal } from '../components/TripClassificationModal';
import { Trip, TripCategory } from '../models/types';
import { formatDistance } from '../utils/formatters';
import { tripService } from '../services/TripService';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    activeTrip,
    trips,
    pendingTrips,
    cars,
    isLoading,
    startTrip,
    stopTrip,
    classifyTrip,
    loadTrips,
  } = useTripStore();

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [odometerValue, setOdometerValue] = useState<number>(0);
  const [lastOdometer, setLastOdometer] = useState<number | null>(null);
  const [showClassifyModal, setShowClassifyModal] = useState(false);
  const [tripToClassify, setTripToClassify] = useState<Trip | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Laad de laatste kilometerstand
  useEffect(() => {
    (async () => {
      const last = await tripService.getLastOdometer();
      setLastOdometer(last);
    })();
  }, []);

  // Stel standaard auto in
  useEffect(() => {
    if (!selectedCarId && cars.length > 0) {
      const defaultCar = cars.find((c) => c.isDefault) ?? cars[0];
      setSelectedCarId(defaultCar.id);
    }
  }, [cars, selectedCarId]);

  // Toon classificatiemodal als er pending ritten zijn
  useEffect(() => {
    if (pendingTrips.length > 0 && !tripToClassify) {
      setTripToClassify(pendingTrips[0]);
      setShowClassifyModal(true);
    }
  }, [pendingTrips, tripToClassify]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  const handleStartTrip = async () => {
    if (!selectedCarId || odometerValue <= 0) return;
    await startTrip(selectedCarId, odometerValue);
  };

  const handleStopTrip = async () => {
    await stopTrip();
  };

  const handleClassify = async (
    category: TripCategory,
    deviationReason?: string,
    notes?: string,
  ) => {
    if (!tripToClassify) return;
    await classifyTrip(tripToClassify.id, category, deviationReason, notes);
    setShowClassifyModal(false);
    setTripToClassify(null);
  };

  const handleTripPress = (trip: Trip) => {
    if (trip.status === 'pending_classification') {
      setTripToClassify(trip);
      setShowClassifyModal(true);
    } else {
      navigation.navigate('TripDetail', { tripId: trip.id });
    }
  };

  // Bereken maandsamenvatting
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthTrips = trips.filter((t) => t.startTime >= monthStart);
  const businessKm = monthTrips
    .filter((t) => t.category === 'zakelijk')
    .reduce((sum, t) => sum + (t.distanceKm ?? 0), 0);
  const totalKm = monthTrips.reduce((sum, t) => sum + (t.distanceKm ?? 0), 0);

  const recentTrips = trips.slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ritten Tracker</Text>
        <Text style={styles.headerSubtitle}>
          {pendingTrips.length > 0
            ? `${pendingTrips.length} rit${pendingTrips.length > 1 ? 'ten' : ''} nog niet ingedeeld`
            : 'Alles is bijgewerkt'}
        </Text>
      </View>

      {/* Maandsamenvatting */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Deze maand</Text>
          <Text style={styles.summaryValue}>{formatDistance(totalKm)}</Text>
          <Text style={styles.summaryDetail}>{monthTrips.length} ritten</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Zakelijk</Text>
          <Text style={[styles.summaryValue, { color: '#2e7d32' }]}>
            {formatDistance(businessKm)}
          </Text>
          <Text style={styles.summaryDetail}>
            {totalKm > 0 ? `${((businessKm / totalKm) * 100).toFixed(0)}%` : '—'}
          </Text>
        </View>
      </View>

      {/* Actieve rit of start-interface */}
      {activeTrip ? (
        <View style={styles.activeTrip}>
          <View style={styles.activeTripHeader}>
            <View style={styles.liveIndicator} />
            <Text style={styles.activeTripTitle}>Rit actief</Text>
          </View>
          <Text style={styles.activeTripAddress}>
            Vertrek: {activeTrip.startAddress}
          </Text>
          <Text style={styles.activeTripDistance}>
            {activeTrip.routePoints.length > 1
              ? `${activeTrip.routePoints.length} GPS-punten`
              : 'Wachten op GPS...'}
          </Text>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopTrip}
          >
            <Text style={styles.stopButtonText}>Rit stoppen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.startSection}>
          <Text style={styles.sectionTitle}>Nieuwe rit</Text>
          <CarSelector
            cars={cars}
            selectedCarId={selectedCarId}
            onSelect={setSelectedCarId}
          />
          <View style={styles.odometerContainer}>
            <OdometerInput
              label="Kilometerstand"
              suggestedValue={lastOdometer}
              onValueChange={setOdometerValue}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!selectedCarId || odometerValue <= 0) && styles.startButtonDisabled,
            ]}
            onPress={handleStartTrip}
            disabled={!selectedCarId || odometerValue <= 0}
          >
            <Text style={styles.startButtonText}>Rit starten</Text>
          </TouchableOpacity>
          <Text style={styles.startHint}>
            Of verbind met je auto-bluetooth om automatisch te starten
          </Text>
        </View>
      )}

      {/* Recente ritten */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recente ritten</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TripHistory')}
          >
            <Text style={styles.seeAll}>Alles bekijken</Text>
          </TouchableOpacity>
        </View>

        {recentTrips.length === 0 ? (
          <Text style={styles.emptyText}>
            Nog geen ritten. Start je eerste rit hierboven!
          </Text>
        ) : (
          recentTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              car={cars.find((c) => c.id === trip.carId)}
              onPress={handleTripPress}
            />
          ))
        )}
      </View>

      {/* Classificatiemodal */}
      {tripToClassify && (
        <TripClassificationModal
          visible={showClassifyModal}
          trip={tripToClassify}
          onClassify={handleClassify}
          onDismiss={() => {
            setShowClassifyModal(false);
            setTripToClassify(null);
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#1a3a5c',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a3c4e0',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -10,
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3a5c',
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  activeTrip: {
    backgroundColor: '#e8f5e9',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
    marginRight: 8,
  },
  activeTripTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  activeTripAddress: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  activeTripDistance: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  stopButton: {
    backgroundColor: '#c62828',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  startSection: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  odometerContainer: {
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#1a3a5c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  startHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    marginTop: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 13,
    color: '#1565c0',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    padding: 20,
  },
});
