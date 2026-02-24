/**
 * SettingsScreen – App-instellingen en export.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useTripStore } from '../store/TripStore';
import { formatDate } from '../utils/formatters';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, exportToExcel, exportToPdf } = useTripStore();

  const [exportYear, setExportYear] = useState(
    String(new Date().getFullYear()),
  );

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const year = parseInt(exportYear, 10);
      if (isNaN(year) || year < 2000 || year > 2100) {
        Alert.alert('Ongeldig jaar', 'Voer een geldig jaar in.');
        return;
      }

      const startDate = new Date(year, 0, 1).getTime(); // 1 jan
      const endDate = new Date(year, 11, 31, 23, 59, 59).getTime(); // 31 dec

      const filePath =
        format === 'excel'
          ? await exportToExcel(startDate, endDate)
          : await exportToPdf(startDate, endDate);

      // Deel het bestand
      await Share.share({
        url: filePath,
        title: `Rittenregistratie ${year}`,
        message: `Rittenregistratie ${year} geëxporteerd op ${formatDate(Date.now())}`,
      });
    } catch (error) {
      Alert.alert(
        'Export mislukt',
        error instanceof Error ? error.message : 'Onbekende fout',
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Instellingen</Text>

      {/* Bluetooth & Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bluetooth & Tracking</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-start bij Bluetooth</Text>
            <Text style={styles.settingDesc}>
              Start automatisch een rit wanneer je telefoon verbindt met de
              auto-bluetooth
            </Text>
          </View>
          <Switch
            value={settings.autoStartOnBluetooth}
            onValueChange={(value) =>
              updateSettings({ autoStartOnBluetooth: value })
            }
            trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
            thumbColor={settings.autoStartOnBluetooth ? '#2e7d32' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Spraak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spraakinterface</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Tekst-naar-spraak</Text>
            <Text style={styles.settingDesc}>
              Spreek je toe bij het starten en stoppen van ritten
            </Text>
          </View>
          <Switch
            value={settings.useTts}
            onValueChange={(value) => updateSettings({ useTts: value })}
            trackColor={{ false: '#e0e0e0', true: '#a5d6a7' }}
            thumbColor={settings.useTts ? '#2e7d32' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Taal</Text>
          </View>
          <View style={styles.langSelector}>
            <TouchableOpacity
              style={[
                styles.langOption,
                settings.ttsLanguage === 'nl-NL' && styles.langOptionActive,
              ]}
              onPress={() => updateSettings({ ttsLanguage: 'nl-NL' })}
            >
              <Text
                style={[
                  styles.langText,
                  settings.ttsLanguage === 'nl-NL' && styles.langTextActive,
                ]}
              >
                NL
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langOption,
                settings.ttsLanguage === 'en-US' && styles.langOptionActive,
              ]}
              onPress={() => updateSettings({ ttsLanguage: 'en-US' })}
            >
              <Text
                style={[
                  styles.langText,
                  settings.ttsLanguage === 'en-US' && styles.langTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Route-afwijking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Omrij-checker</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Afwijkingsdrempel</Text>
            <Text style={styles.settingDesc}>
              Bij een afwijking boven dit percentage moet je een reden opgeven
              (Belastingdienst-eis)
            </Text>
          </View>
          <View style={styles.thresholdInput}>
            <TextInput
              style={styles.thresholdValue}
              value={String(settings.deviationThresholdPercent)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                  updateSettings({ deviationThresholdPercent: num });
                }
              }}
              keyboardType="numeric"
            />
            <Text style={styles.thresholdUnit}>%</Text>
          </View>
        </View>
      </View>

      {/* Google Maps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Maps</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>API Key</Text>
            <Text style={styles.settingDesc}>
              Nodig voor reverse geocoding en route-vergelijking
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.apiKeyInput}
          value={settings.googleMapsApiKey}
          onChangeText={(text) => updateSettings({ googleMapsApiKey: text })}
          placeholder="Plak je Google Maps API key"
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      {/* Export */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export (Belastingdienst)</Text>
        <Text style={styles.exportDesc}>
          Exporteer je rittenregistratie als Excel of PDF.
          Het format voldoet aan de eisen van de Belastingdienst.
          Bewaarplicht: 7 jaar.
        </Text>

        <View style={styles.exportYearRow}>
          <Text style={styles.settingLabel}>Jaar:</Text>
          <TextInput
            style={styles.yearInput}
            value={exportYear}
            onChangeText={setExportYear}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.exportButtons}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => handleExport('excel')}
          >
            <Text style={styles.exportButtonText}>Excel downloaden</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, styles.exportButtonPdf]}
            onPress={() => handleExport('pdf')}
          >
            <Text style={styles.exportButtonText}>PDF downloaden</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Over</Text>
        <Text style={styles.aboutText}>
          Slimme Ritten-Tracker v1.0.0{'\n'}
          Rittenregistratie voor ZZP'ers en ondernemers.{'\n'}
          Voldoet aan de eisen van de Belastingdienst.
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 20,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a3a5c',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  langSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  langOptionActive: {
    backgroundColor: '#1a3a5c',
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  langTextActive: {
    color: '#fff',
  },
  thresholdInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdValue: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  thresholdUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    marginTop: 4,
  },
  exportDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  exportYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  yearInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: '600',
    width: 70,
    textAlign: 'center',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  exportButtonPdf: {
    backgroundColor: '#c62828',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
});
