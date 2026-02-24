/**
 * TripClassificationModal – Pop-up na afloop van een rit.
 *
 * Vraagt de gebruiker:
 * 1. Was dit zakelijk, privé of gemengd?
 * 2. (Optioneel) Wat is de reden voor omrijden?
 * 3. (Optioneel) Opmerkingen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Trip, TripCategory } from '../models/types';
import { formatDistance } from '../utils/formatters';

interface TripClassificationModalProps {
  visible: boolean;
  trip: Trip;
  onClassify: (
    category: TripCategory,
    deviationReason?: string,
    notes?: string,
  ) => void;
  onDismiss: () => void;
}

export const TripClassificationModal: React.FC<TripClassificationModalProps> = ({
  visible,
  trip,
  onClassify,
  onDismiss,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TripCategory | null>(null);
  const [deviationReason, setDeviationReason] = useState('');
  const [notes, setNotes] = useState('');

  const categories: { value: TripCategory; label: string; color: string }[] = [
    { value: 'zakelijk', label: 'Zakelijk', color: '#2e7d32' },
    { value: 'prive', label: 'Privé', color: '#1565c0' },
    { value: 'gemengd', label: 'Gemengd', color: '#ef6c00' },
  ];

  const canSubmit =
    selectedCategory !== null &&
    (!trip.hasSignificantDeviation || deviationReason.trim().length > 0);

  const handleSubmit = () => {
    if (!selectedCategory) return;
    onClassify(
      selectedCategory,
      deviationReason.trim() || undefined,
      notes.trim() || undefined,
    );
    // Reset
    setSelectedCategory(null);
    setDeviationReason('');
    setNotes('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Rit indelen</Text>

            <Text style={styles.subtitle}>
              {trip.distanceKm !== null
                ? `${formatDistance(trip.distanceKm)} gereden`
                : 'Rit voltooid'}
            </Text>

            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>Van: {trip.startAddress}</Text>
              {trip.endAddress && (
                <Text style={styles.routeText}>Naar: {trip.endAddress}</Text>
              )}
            </View>

            {/* Categorie-keuze */}
            <Text style={styles.label}>Type rit</Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.value && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat.value && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Afwijkingsreden (verplicht als >10%) */}
            {trip.hasSignificantDeviation && (
              <>
                <Text style={styles.label}>
                  Reden omrijden (verplicht)
                </Text>
                <Text style={styles.deviationWarning}>
                  De route wijkt meer dan 10% af van de gebruikelijke route.
                  Geef een reden op (bijv. file, wegomlegging, tussenstop).
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bijv. omleiding vanwege wegwerkzaamheden"
                  value={deviationReason}
                  onChangeText={setDeviationReason}
                  multiline
                />
              </>
            )}

            {/* Opmerkingen */}
            <Text style={styles.label}>Opmerkingen (optioneel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Bijv. klantbezoek bij Firma XYZ"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Knoppen */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
                <Text style={styles.cancelText}>Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text style={styles.submitText}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  routeInfo: {
    backgroundColor: '#f4f6f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  routeText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  deviationWarning: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 12,
    color: '#e65100',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 48,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#1a3a5c',
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
