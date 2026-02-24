/**
 * Slimme Ritten-Tracker – Hoofd-app component.
 *
 * Initialiseert alle services bij het opstarten:
 * 1. Firebase authenticatie (anoniem)
 * 2. Bluetooth-service (luistert naar auto-verbindingen)
 * 3. Locatietoestemming
 * 4. Push-notificaties
 * 5. Tekst-naar-spraak
 * 6. Trip-service (orkestreert alles)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useTripStore } from './src/store/TripStore';
import { bluetoothService } from './src/services/BluetoothService';
import { locationService } from './src/services/LocationService';
import { ttsService } from './src/services/TextToSpeechService';
import { notificationService } from './src/services/NotificationService';
import { firebaseService } from './src/services/FirebaseService';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { initialize, settings } = useTripStore();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Firebase – log anoniem in als er nog geen sessie is
      await firebaseService.signInAnonymously();

      // 2. Laad de store (instellingen, auto's, ritten)
      await initialize();

      // 3. Locatietoestemming
      await locationService.requestPermission();

      // 4. Google Maps API key instellen
      const { settings: currentSettings } = useTripStore.getState();
      if (currentSettings.googleMapsApiKey) {
        locationService.setApiKey(currentSettings.googleMapsApiKey);
      }

      // 5. Bluetooth
      if (currentSettings.autoStartOnBluetooth) {
        await bluetoothService.initialize();
      }

      // 6. TTS
      if (currentSettings.useTts) {
        await ttsService.initialize();
        await ttsService.setLanguage(currentSettings.ttsLanguage);
      }

      // 7. Push-notificaties
      notificationService.initialize();

      setIsReady(true);
    } catch (error) {
      console.error('[App] Initialisatie mislukt:', error);
      setInitError(
        error instanceof Error ? error.message : 'App kon niet worden gestart',
      );
    }
  };

  // Laadscherm
  if (!isReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>Ritten Tracker</Text>
        <Text style={styles.splashSubtitle}>
          Slimme rittenregistratie voor ondernemers
        </Text>
        {initError ? (
          <Text style={styles.error}>{initError}</Text>
        ) : (
          <ActivityIndicator
            size="large"
            color="#fff"
            style={styles.spinner}
          />
        )}
      </View>
    );
  }

  return <AppNavigator />;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#1a3a5c',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  splashTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#a3c4e0',
    textAlign: 'center',
  },
  spinner: {
    marginTop: 30,
  },
  error: {
    color: '#ff8a80',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default App;
