/**
 * CarProfilesScreen – Beheer autoprofielen.
 *
 * Belastingdienst vereist per auto: merk, type en kenteken.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useTripStore } from '../store/TripStore';
import { CarProfile } from '../models/types';
import { formatLicensePlate } from '../utils/formatters';

export const CarProfilesScreen: React.FC = () => {
  const { cars, addCar, updateCar, deleteCar } = useTripStore();

  const [showForm, setShowForm] = useState(false);
  const [editingCar, setEditingCar] = useState<CarProfile | null>(null);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const resetForm = () => {
    setBrand('');
    setModel('');
    setLicensePlate('');
    setEditingCar(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!brand.trim() || !model.trim() || !licensePlate.trim()) {
      Alert.alert('Vul alle velden in', 'Merk, type en kenteken zijn verplicht.');
      return;
    }

    const formattedPlate = formatLicensePlate(licensePlate);

    if (editingCar) {
      await updateCar(editingCar.id, {
        brand: brand.trim(),
        model: model.trim(),
        licensePlate: formattedPlate,
      });
    } else {
      const newCar: CarProfile = {
        id: uuidv4(),
        brand: brand.trim(),
        model: model.trim(),
        licensePlate: formattedPlate,
        isDefault: cars.length === 0, // Eerste auto = standaard
        createdAt: Date.now(),
      };
      await addCar(newCar);
    }

    resetForm();
  };

  const handleEdit = (car: CarProfile) => {
    setEditingCar(car);
    setBrand(car.brand);
    setModel(car.model);
    setLicensePlate(car.licensePlate);
    setShowForm(true);
  };

  const handleDelete = (car: CarProfile) => {
    Alert.alert(
      'Auto verwijderen',
      `Weet je zeker dat je ${car.brand} ${car.model} (${car.licensePlate}) wilt verwijderen?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => deleteCar(car.id),
        },
      ],
    );
  };

  const handleSetDefault = async (carId: string) => {
    // Verwijder standaard van alle andere auto's
    for (const car of cars) {
      if (car.isDefault && car.id !== carId) {
        await updateCar(car.id, { isDefault: false });
      }
    }
    await updateCar(carId, { isDefault: true });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Mijn auto's</Text>
            <Text style={styles.subtitle}>
              De Belastingdienst vereist merk, type en kenteken per auto.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.carCard}>
            <View style={styles.carInfo}>
              <Text style={styles.carPlate}>{item.licensePlate}</Text>
              <Text style={styles.carName}>
                {item.brand} {item.model}
              </Text>
              {item.isDefault && (
                <Text style={styles.defaultLabel}>Standaard auto</Text>
              )}
            </View>
            <View style={styles.carActions}>
              {!item.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(item.id)}
                >
                  <Text style={styles.actionText}>Standaard</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.actionText}>Bewerken</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(item)}
              >
                <Text style={[styles.actionText, { color: '#c62828' }]}>
                  Verwijder
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nog geen auto's. Voeg je eerste auto toe.
          </Text>
        }
        ListFooterComponent={
          <>
            {showForm ? (
              <View style={styles.form}>
                <Text style={styles.formTitle}>
                  {editingCar ? 'Auto bewerken' : 'Nieuwe auto'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Merk (bijv. Volkswagen)"
                  value={brand}
                  onChangeText={setBrand}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Type (bijv. Golf 8)"
                  value={model}
                  onChangeText={setModel}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Kenteken (bijv. AB-123-CD)"
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  autoCapitalize="characters"
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={resetForm}
                  >
                    <Text style={styles.cancelText}>Annuleren</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveText}>Opslaan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowForm(true)}
              >
                <Text style={styles.addText}>+ Auto toevoegen</Text>
              </TouchableOpacity>
            )}
          </>
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
  list: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  carCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  carInfo: {
    marginBottom: 10,
  },
  carPlate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a5c',
  },
  carName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  defaultLabel: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    marginTop: 4,
  },
  carActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 13,
    color: '#1565c0',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#e8eef4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c8d8e8',
    borderStyle: 'dashed',
  },
  addText: {
    color: '#1a3a5c',
    fontSize: 15,
    fontWeight: '600',
  },
});
