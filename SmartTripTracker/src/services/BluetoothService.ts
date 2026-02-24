/**
 * BluetoothService – Detecteert verbinding met auto-bluetooth.
 *
 * Werking:
 * 1. Luistert naar Bluetooth-verbindingen op de achtergrond
 * 2. Bij verbinding met een gekoppeld apparaat → start rit automatisch
 * 3. Bij verbreken verbinding → stopt rit automatisch
 */

import BleManager from 'react-native-ble-manager';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { BluetoothDevice } from '../models/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

type BluetoothEventCallback = (device: BluetoothDevice) => void;

class BluetoothService {
  private isInitialized = false;
  private eventEmitter: NativeEventEmitter | null = null;
  private knownDevices: BluetoothDevice[] = [];
  private onConnectCallbacks: BluetoothEventCallback[] = [];
  private onDisconnectCallbacks: BluetoothEventCallback[] = [];

  /** Initialiseer BLE Manager en start luisteren */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await BleManager.start({ showAlert: false });

      this.eventEmitter = new NativeEventEmitter(NativeModules.BleManager);

      // Luister naar verbindingsgebeurtenissen
      this.eventEmitter.addListener(
        'BleManagerConnectPeripheral',
        this.handleConnect.bind(this),
      );
      this.eventEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        this.handleDisconnect.bind(this),
      );

      // Laad eerder gekoppelde apparaten
      await this.loadKnownDevices();

      this.isInitialized = true;
      console.log('[BluetoothService] Geïnitialiseerd');
    } catch (error) {
      console.error('[BluetoothService] Initialisatie mislukt:', error);
      throw error;
    }
  }

  /** Zoek naar beschikbare Bluetooth-apparaten */
  async scanForDevices(durationSeconds: number = 10): Promise<BluetoothDevice[]> {
    await BleManager.scan([], durationSeconds, true);

    // Wacht tot de scan klaar is
    return new Promise((resolve) => {
      setTimeout(async () => {
        const peripherals = await BleManager.getDiscoveredPeripherals();
        const devices: BluetoothDevice[] = peripherals
          .filter((p) => p.name)
          .map((p) => ({
            id: p.id,
            name: p.name || 'Onbekend apparaat',
            linkedCarId: null,
            lastSeen: Date.now(),
          }));
        resolve(devices);
      }, durationSeconds * 1000);
    });
  }

  /** Haal reeds verbonden apparaten op (bijv. auto-bluetooth via classic) */
  async getConnectedDevices(): Promise<BluetoothDevice[]> {
    try {
      // Op Android: check bonded (paired) devices
      if (Platform.OS === 'android') {
        const bonded = await BleManager.getBondedPeripherals();
        return bonded
          .filter((p) => p.name)
          .map((p) => ({
            id: p.id,
            name: p.name || 'Onbekend',
            linkedCarId: this.findLinkedCar(p.id),
            lastSeen: Date.now(),
          }));
      }
      return [];
    } catch (error) {
      console.error('[BluetoothService] Fout bij ophalen verbonden apparaten:', error);
      return [];
    }
  }

  /** Koppel een Bluetooth-apparaat aan een auto */
  async linkDeviceToCar(deviceId: string, carId: string): Promise<void> {
    const device = this.knownDevices.find((d) => d.id === deviceId);
    if (device) {
      device.linkedCarId = carId;
    } else {
      this.knownDevices.push({
        id: deviceId,
        name: 'Gekoppeld apparaat',
        linkedCarId: carId,
        lastSeen: Date.now(),
      });
    }
    await this.saveKnownDevices();
  }

  /** Ontkoppel een Bluetooth-apparaat van een auto */
  async unlinkDevice(deviceId: string): Promise<void> {
    const device = this.knownDevices.find((d) => d.id === deviceId);
    if (device) {
      device.linkedCarId = null;
      await this.saveKnownDevices();
    }
  }

  /** Registreer callback voor wanneer een gekoppeld apparaat verbindt */
  onDeviceConnected(callback: BluetoothEventCallback): () => void {
    this.onConnectCallbacks.push(callback);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Registreer callback voor wanneer een gekoppeld apparaat verbreekt */
  onDeviceDisconnected(callback: BluetoothEventCallback): () => void {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  /** Interne handler voor verbindingsgebeurtenis */
  private handleConnect(data: { peripheral: string }): void {
    const deviceId = data.peripheral;
    const knownDevice = this.knownDevices.find((d) => d.id === deviceId);

    if (knownDevice) {
      knownDevice.lastSeen = Date.now();
      console.log(`[BluetoothService] Gekoppeld apparaat verbonden: ${knownDevice.name}`);
      this.onConnectCallbacks.forEach((cb) => cb(knownDevice));
    }
  }

  /** Interne handler voor verbreking */
  private handleDisconnect(data: { peripheral: string }): void {
    const deviceId = data.peripheral;
    const knownDevice = this.knownDevices.find((d) => d.id === deviceId);

    if (knownDevice) {
      console.log(`[BluetoothService] Gekoppeld apparaat verbroken: ${knownDevice.name}`);
      this.onDisconnectCallbacks.forEach((cb) => cb(knownDevice));
    }
  }

  /** Zoek de gekoppelde auto-ID voor een apparaat */
  private findLinkedCar(deviceId: string): string | null {
    const device = this.knownDevices.find((d) => d.id === deviceId);
    return device?.linkedCarId ?? null;
  }

  /** Laad bekende apparaten uit opslag */
  private async loadKnownDevices(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BLUETOOTH_DEVICES);
      if (stored) {
        this.knownDevices = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[BluetoothService] Fout bij laden apparaten:', error);
    }
  }

  /** Sla bekende apparaten op */
  private async saveKnownDevices(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.BLUETOOTH_DEVICES,
        JSON.stringify(this.knownDevices),
      );
    } catch (error) {
      console.error('[BluetoothService] Fout bij opslaan apparaten:', error);
    }
  }

  /** Ruim event listeners op */
  destroy(): void {
    this.eventEmitter?.removeAllListeners('BleManagerConnectPeripheral');
    this.eventEmitter?.removeAllListeners('BleManagerDisconnectPeripheral');
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.isInitialized = false;
  }
}

export const bluetoothService = new BluetoothService();
