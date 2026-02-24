/**
 * TripHistoryScreen – Overzicht van alle ritten met filters.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTripStore } from '../store/TripStore';
import { TripCard } from '../components/TripCard';
import { Trip, TripCategory } from '../models/types';

type FilterType = 'all' | TripCategory | 'pending';

export const TripHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { trips, cars, loadTrips } = useTripStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Alles' },
    { value: 'zakelijk', label: 'Zakelijk' },
    { value: 'prive', label: 'Privé' },
    { value: 'gemengd', label: 'Gemengd' },
    { value: 'pending', label: 'Nog indelen' },
  ];

  const filteredTrips = trips.filter((trip) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return trip.status === 'pending_classification';
    return trip.category === filter;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, [loadTrips]);

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              filter === f.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.value && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resultaat-telling */}
      <Text style={styles.count}>
        {filteredTrips.length} rit{filteredTrips.length !== 1 ? 'ten' : ''}
      </Text>

      {/* Lijst */}
      <FlatList
        data={filteredTrips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard
            trip={item}
            car={cars.find((c) => c.id === item.carId)}
            onPress={handleTripPress}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Geen ritten gevonden met dit filter.
          </Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e8eef4',
  },
  filterChipActive: {
    backgroundColor: '#1a3a5c',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  count: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  list: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 40,
  },
});
