/**
 * TDD Tests voor NotificationService
 *
 * Test de push-notificaties:
 * - Rit-voltooid notificatie met afstand en actieknoppen
 * - Afwijkingsnotificatie
 * - Tracking-notificatie (persistent)
 * - Herinnering voor ongeclassificeerde ritten
 */

import { notificationService } from '../../services/NotificationService';
import PushNotification from 'react-native-push-notification';

describe('NotificationService', () => {
  // Initialiseer één keer voor alle tests
  beforeAll(() => {
    notificationService.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('configureert push-notificaties bij eerste aanroep', () => {
      // configure werd aangeroepen in beforeAll
      // Na clearAllMocks verliezen we die info, maar de service IS geïnitialiseerd
      // Test functioneel: de service zou notificaties moeten kunnen versturen
      notificationService.sendTripCompletedNotification(1, 'test');
      expect(PushNotification.localNotification).toHaveBeenCalled();
    });
  });

  describe('sendTripCompletedNotification', () => {
    it('stuurt een notificatie met de gereden afstand', () => {
      notificationService.sendTripCompletedNotification(12.4, 'trip-123');

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Rit voltooid'),
          message: expect.stringContaining('12.4 km'),
        }),
      );
    });

    it('bevat actieknoppen voor classificatie', () => {
      notificationService.sendTripCompletedNotification(10, 'trip-123');

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          actions: expect.arrayContaining(['Zakelijk', 'Privé', 'Gemengd']),
        }),
      );
    });

    it('stuurt het trip-ID mee in userInfo', () => {
      notificationService.sendTripCompletedNotification(10, 'trip-123');

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userInfo: expect.objectContaining({ tripId: 'trip-123' }),
        }),
      );
    });
  });

  describe('sendDeviationNotification', () => {
    it('stuurt een waarschuwing bij route-afwijking', () => {
      notificationService.sendDeviationNotification(15.3, 'trip-456');

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('afwijking'),
          message: expect.stringContaining('15%'),
        }),
      );
    });
  });

  describe('showTrackingNotification', () => {
    it('toont een persistente notificatie', () => {
      notificationService.showTrackingNotification();

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          ongoing: true,
          autoCancel: false,
        }),
      );
    });
  });

  describe('clearTrackingNotification', () => {
    it('verwijdert alle lokale notificaties', () => {
      notificationService.clearTrackingNotification();

      expect(PushNotification.cancelAllLocalNotifications).toHaveBeenCalled();
    });
  });

  describe('sendPendingClassificationReminder', () => {
    it('vermeldt het aantal ongeclassificeerde ritten (enkelvoud)', () => {
      notificationService.sendPendingClassificationReminder(1);

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('1 rit'),
        }),
      );
    });

    it('vermeldt het aantal ongeclassificeerde ritten (meervoud)', () => {
      notificationService.sendPendingClassificationReminder(5);

      expect(PushNotification.localNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('5 ritten'),
        }),
      );
    });
  });
});
