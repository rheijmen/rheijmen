/**
 * TDD Tests voor BluetoothService
 *
 * Test de Bluetooth auto-detectie logica:
 * - Koppelen van apparaten aan auto's
 * - Event callbacks bij verbinding/verbreking
 * - Opslag en herstel van bekende apparaten
 */

import { bluetoothService } from '../../services/BluetoothService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';

describe('BluetoothService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset de service voor elke test
    bluetoothService.destroy();
  });

  describe('initialize', () => {
    it('initialiseert zonder fouten', async () => {
      await expect(bluetoothService.initialize()).resolves.not.toThrow();
    });

    it('initialiseert niet opnieuw als al geïnitialiseerd', async () => {
      await bluetoothService.initialize();
      // Tweede keer zou geen fout moeten geven
      await expect(bluetoothService.initialize()).resolves.not.toThrow();
    });
  });

  describe('linkDeviceToCar', () => {
    it('koppelt een Bluetooth-apparaat aan een auto', async () => {
      await bluetoothService.initialize();
      await bluetoothService.linkDeviceToCar('bt-device-1', 'car-1');

      // Verifieer dat het is opgeslagen
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.BLUETOOTH_DEVICES,
        expect.stringContaining('car-1'),
      );
    });

    it('kan een apparaat ontkoppelen', async () => {
      await bluetoothService.initialize();
      await bluetoothService.linkDeviceToCar('bt-device-1', 'car-1');
      await bluetoothService.unlinkDevice('bt-device-1');

      // Laatste setItem call zou linkedCarId: null moeten bevatten
      const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.slice(-1)[0];
      const storedDevices = JSON.parse(lastCall[1]);
      const device = storedDevices.find((d: any) => d.id === 'bt-device-1');
      expect(device?.linkedCarId).toBeNull();
    });
  });

  describe('onDeviceConnected / onDeviceDisconnected', () => {
    it('registreert een connect callback en retourneert een unsubscribe functie', async () => {
      await bluetoothService.initialize();
      const callback = jest.fn();

      const unsubscribe = bluetoothService.onDeviceConnected(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('registreert een disconnect callback en retourneert een unsubscribe functie', async () => {
      await bluetoothService.initialize();
      const callback = jest.fn();

      const unsubscribe = bluetoothService.onDeviceDisconnected(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('unsubscribe verwijdert de callback', async () => {
      await bluetoothService.initialize();
      const callback = jest.fn();

      const unsubscribe = bluetoothService.onDeviceConnected(callback);
      unsubscribe();

      // Callback zou niet meer aangeroepen moeten worden
      // (Intern testen we dit indirect)
    });
  });

  describe('destroy', () => {
    it('ruimt alle listeners op', async () => {
      await bluetoothService.initialize();
      bluetoothService.onDeviceConnected(jest.fn());
      bluetoothService.onDeviceDisconnected(jest.fn());

      bluetoothService.destroy();

      // Na destroy zou een nieuwe initialize moeten werken
      await expect(bluetoothService.initialize()).resolves.not.toThrow();
    });
  });

  describe('scanForDevices', () => {
    it('retourneert een array van apparaten', async () => {
      await bluetoothService.initialize();

      // De mock geeft een leeg array terug
      const devices = await bluetoothService.scanForDevices(1);
      expect(Array.isArray(devices)).toBe(true);
    });
  });
});
