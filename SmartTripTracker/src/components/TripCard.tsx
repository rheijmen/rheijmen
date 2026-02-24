/**
 * TripCard – Compacte weergave van een rit in de lijst.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trip, CarProfile } from '../models/types';
import {
  formatDate,
  formatTime,
  formatDistance,
  formatTripCategory,
  formatDuration,
} from '../utils/formatters';

interface TripCardProps {
  trip: Trip;
  car: CarProfile | undefined;
  onPress: (trip: Trip) => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, car, onPress }) => {
  const isPending = trip.status === 'pending_classification';

  const categoryColor =
    trip.category === 'zakelijk'
      ? '#2e7d32'
      : trip.category === 'prive'
        ? '#1565c0'
        : trip.category === 'gemengd'
          ? '#ef6c00'
          : '#999';

  return (
    <TouchableOpacity
      style={[styles.card, isPending && styles.cardPending]}
      onPress={() => onPress(trip)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(trip.startTime)}</Text>
        <View style={[styles.badge, { backgroundColor: categoryColor }]}>
          <Text style={styles.badgeText}>{formatTripCategory(trip.category)}</Text>
        </View>
      </View>

      <View style={styles.route}>
        <View style={styles.routePoint}>
          <View style={[styles.dot, styles.dotStart]} />
          <Text style={styles.address} numberOfLines={1}>
            {trip.startAddress}
          </Text>
          <Text style={styles.time}>{formatTime(trip.startTime)}</Text>
        </View>
        {trip.endAddress && (
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.dotEnd]} />
            <Text style={styles.address} numberOfLines={1}>
              {trip.endAddress}
            </Text>
            {trip.endTime && (
              <Text style={styles.time}>{formatTime(trip.endTime)}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.distance}>
          {trip.distanceKm !== null ? formatDistance(trip.distanceKm) : '—'}
        </Text>
        {trip.endTime && (
          <Text style={styles.duration}>
            {formatDuration(trip.startTime, trip.endTime)}
          </Text>
        )}
        {car && (
          <Text style={styles.car}>{car.licensePlate}</Text>
        )}
        {trip.hasSignificantDeviation && (
          <Text style={styles.deviation}>Afwijking</Text>
        )}
      </View>

      {isPending && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>Nog niet ingedeeld</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPending: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  route: {
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotStart: {
    backgroundColor: '#4caf50',
  },
  dotEnd: {
    backgroundColor: '#f44336',
  },
  address: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  duration: {
    fontSize: 12,
    color: '#999',
  },
  car: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deviation: {
    fontSize: 11,
    color: '#ff9800',
    fontWeight: '600',
  },
  pendingBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  pendingText: {
    color: '#e65100',
    fontSize: 12,
    fontWeight: '600',
  },
});
