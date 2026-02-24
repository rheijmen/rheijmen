/**
 * CarSelector – Kies een auto bij het starten van een rit.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { CarProfile } from '../models/types';

interface CarSelectorProps {
  cars: CarProfile[];
  selectedCarId: string | null;
  onSelect: (carId: string) => void;
}

export const CarSelector: React.FC<CarSelectorProps> = ({
  cars,
  selectedCarId,
  onSelect,
}) => {
  if (cars.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Nog geen auto's toegevoegd. Ga naar Instellingen om een auto toe te voegen.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={cars}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isSelected = item.id === selectedCarId;
        return (
          <TouchableOpacity
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.plate, isSelected && styles.plateSelected]}>
              {item.licensePlate}
            </Text>
            <Text style={[styles.name, isSelected && styles.nameSelected]}>
              {item.brand} {item.model}
            </Text>
            {item.isDefault && (
              <Text style={styles.defaultBadge}>Standaard</Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 120,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#1a3a5c',
    backgroundColor: '#e8eef4',
  },
  plate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  plateSelected: {
    color: '#1a3a5c',
  },
  name: {
    fontSize: 12,
    color: '#666',
  },
  nameSelected: {
    color: '#1a3a5c',
  },
  defaultBadge: {
    fontSize: 10,
    color: '#2e7d32',
    marginTop: 4,
    fontWeight: '600',
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 13,
  },
});
