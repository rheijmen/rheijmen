/**
 * TripDetailScreen – Detailweergave van een enkele rit.
 *
 * Toont alle Belastingdienst-relevante gegevens en de kaart met de route.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { Trip } from '../models/types';
import { useTripStore } from '../store/TripStore';
import {
  formatDate,
  formatTime,
  formatDistance,
  formatOdometer,
  formatTripCategory,
  formatDuration,
  formatPercent,
} from '../utils/formatters';
import { firebaseService } from '../services/FirebaseService';

export const TripDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { tripId } = route.params;
  const { cars, deleteTrip } = useTripStore();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    (async () => {
      const loaded = await firebaseService.getTrip(tripId);
      setTrip(loaded);
    })();
  }, [tripId]);

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text>Laden...</Text>
      </View>
    );
  }

  const car = cars.find((c) => c.id === trip.carId);
  const hasRoute = trip.routePoints.length > 1;

  const handleDelete = () => {
    Alert.alert(
      'Rit verwijderen',
      'Weet je zeker dat je deze rit wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            await deleteTrip(trip.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Kaart met route */}
      {hasRoute && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: trip.routePoints[0].latitude,
            longitude: trip.routePoints[0].longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Polyline
            coordinates={trip.routePoints.map((p) => ({
              latitude: p.latitude,
              longitude: p.longitude,
            }))}
            strokeColor="#1a3a5c"
            strokeWidth={3}
          />
          <Marker
            coordinate={{
              latitude: trip.routePoints[0].latitude,
              longitude: trip.routePoints[0].longitude,
            }}
            pinColor="green"
            title="Vertrek"
          />
          <Marker
            coordinate={{
              latitude: trip.routePoints[trip.routePoints.length - 1].latitude,
              longitude: trip.routePoints[trip.routePoints.length - 1].longitude,
            }}
            pinColor="red"
            title="Aankomst"
          />
        </MapView>
      )}

      {/* Details */}
      <View style={styles.content}>
        {/* Status badge */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  trip.category === 'zakelijk'
                    ? '#2e7d32'
                    : trip.category === 'prive'
                      ? '#1565c0'
                      : trip.category === 'gemengd'
                        ? '#ef6c00'
                        : '#999',
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {formatTripCategory(trip.category)}
            </Text>
          </View>
          <Text style={styles.date}>{formatDate(trip.startTime)}</Text>
        </View>

        {/* Afstand & duur */}
        <View style={styles.mainStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {trip.distanceKm !== null ? formatDistance(trip.distanceKm) : '—'}
            </Text>
            <Text style={styles.statLabel}>Afstand</Text>
          </View>
          {trip.endTime && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {formatDuration(trip.startTime, trip.endTime)}
              </Text>
              <Text style={styles.statLabel}>Duur</Text>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <DetailRow label="Vertrekadres" value={trip.startAddress} />
          <DetailRow label="Aankomstadres" value={trip.endAddress ?? '—'} />
          <DetailRow label="Vertrektijd" value={formatTime(trip.startTime)} />
          {trip.endTime && (
            <DetailRow label="Aankomsttijd" value={formatTime(trip.endTime)} />
          )}
        </View>

        {/* Kilometerstand */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kilometerstand</Text>
          <DetailRow label="Begin" value={formatOdometer(trip.odometerStart)} />
          <DetailRow
            label="Eind"
            value={
              trip.odometerEnd !== null ? formatOdometer(trip.odometerEnd) : '—'
            }
          />
        </View>

        {/* Auto */}
        {car && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Auto</Text>
            <DetailRow label="Auto" value={`${car.brand} ${car.model}`} />
            <DetailRow label="Kenteken" value={car.licensePlate} />
          </View>
        )}

        {/* Route-afwijking */}
        {trip.expectedDistanceKm !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route-analyse</Text>
            <DetailRow
              label="Verwachte afstand"
              value={formatDistance(trip.expectedDistanceKm)}
            />
            {trip.deviationPercent !== null && (
              <DetailRow
                label="Afwijking"
                value={formatPercent(trip.deviationPercent)}
                highlight={trip.hasSignificantDeviation}
              />
            )}
            {trip.deviationReason && (
              <DetailRow label="Reden omrijden" value={trip.deviationReason} />
            )}
          </View>
        )}

        {/* Opmerkingen */}
        {trip.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opmerkingen</Text>
            <Text style={styles.notes}>{trip.notes}</Text>
          </View>
        )}

        {/* Bluetooth info */}
        {trip.bluetoothDeviceName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verbinding</Text>
            <DetailRow
              label="Bluetooth"
              value={trip.bluetoothDeviceName}
            />
          </View>
        )}

        {/* Verwijder-knop */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Rit verwijderen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

/** Hulpcomponent voor een label-waarde rij */
const DetailRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, highlight && styles.detailHighlight]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 200,
  },
  content: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  mainStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 13,
    color: '#999',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailHighlight: {
    color: '#e65100',
    fontWeight: '700',
  },
  notes: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c62828',
  },
  deleteText: {
    color: '#c62828',
    fontSize: 15,
    fontWeight: '500',
  },
});
