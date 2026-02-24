/**
 * OdometerInput – Invoerveld voor de kilometerstand.
 *
 * Toont de laatst bekende stand als suggestie en laat de gebruiker
 * handmatig corrigeren.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { formatOdometer } from '../utils/formatters';

interface OdometerInputProps {
  label: string;
  suggestedValue: number | null;
  onValueChange: (value: number) => void;
}

export const OdometerInput: React.FC<OdometerInputProps> = ({
  label,
  suggestedValue,
  onValueChange,
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (suggestedValue !== null) {
      setInputValue(String(Math.round(suggestedValue)));
      onValueChange(suggestedValue);
    }
  }, [suggestedValue]);

  const handleChange = (text: string) => {
    // Alleen cijfers toestaan
    const cleaned = text.replace(/[^0-9]/g, '');
    setInputValue(cleaned);

    const numValue = parseInt(cleaned, 10);
    if (!isNaN(numValue)) {
      onValueChange(numValue);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder="bijv. 45230"
          placeholderTextColor="#bbb"
        />
        <Text style={styles.unit}>km</Text>
      </View>
      {suggestedValue !== null && (
        <Text style={styles.suggestion}>
          Suggestie op basis van vorige rit: {formatOdometer(suggestedValue)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3a5c',
  },
  unit: {
    fontSize: 16,
    color: '#999',
    marginLeft: 10,
  },
  suggestion: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
});
