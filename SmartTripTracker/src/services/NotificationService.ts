/**
 * NotificationService – Push-notificaties na afloop van een rit.
 *
 * Stuurt een notificatie zodra de motor uit gaat (Bluetooth verbreekt)
 * met de vraag: "Was dit zakelijk, privé of gemengd?"
 */

import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationService {
  private isInitialized = false;

  /** Configureer push-notificaties */
  initialize(): void {
    if (this.isInitialized) return;

    PushNotification.configure({
      onNotification: (notification) => {
        console.log('[Notification] Ontvangen:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Maak een notificatiekanaal aan (Android)
    PushNotification.createChannel(
      {
        channelId: 'trip-tracker',
        channelName: 'Ritten Tracker',
        channelDescription: 'Meldingen over je ritten',
        importance: 4, // HIGH
        vibrate: true,
      },
      () => {},
    );

    // Kanaal voor actieve tracking (foreground service)
    PushNotification.createChannel(
      {
        channelId: 'trip-tracking-active',
        channelName: 'Actieve Rit',
        channelDescription: 'Wordt getoond terwijl een rit wordt gevolgd',
        importance: 2, // LOW – stil, maar zichtbaar
        vibrate: false,
      },
      () => {},
    );

    this.isInitialized = true;
    console.log('[NotificationService] Geïnitialiseerd');
  }

  /** Stuur notificatie dat een rit is voltooid */
  sendTripCompletedNotification(distanceKm: number, tripId: string): void {
    PushNotification.localNotification({
      channelId: 'trip-tracker',
      title: 'Rit voltooid',
      message: `${distanceKm.toFixed(1)} km gereden. Was dit zakelijk, privé of gemengd?`,
      userInfo: { tripId, action: 'classify' },
      playSound: true,
      soundName: 'default',
      actions: ['Zakelijk', 'Privé', 'Gemengd'],
    });
  }

  /** Stuur notificatie bij route-afwijking */
  sendDeviationNotification(deviationPercent: number, tripId: string): void {
    PushNotification.localNotification({
      channelId: 'trip-tracker',
      title: '⚠ Route-afwijking gedetecteerd',
      message: `De gereden route wijkt ${Math.abs(deviationPercent).toFixed(0)}% af. Geef een toelichting.`,
      userInfo: { tripId, action: 'deviation' },
      playSound: true,
      soundName: 'default',
    });
  }

  /** Toon een persistente notificatie tijdens actieve tracking */
  showTrackingNotification(): void {
    PushNotification.localNotification({
      channelId: 'trip-tracking-active',
      title: 'Rit wordt gevolgd',
      message: 'GPS-tracking is actief',
      ongoing: true,
      autoCancel: false,
      vibrate: false,
      playSound: false,
    });
  }

  /** Verwijder de tracking-notificatie */
  clearTrackingNotification(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  /** Stuur herinnering als er ongeclassificeerde ritten zijn */
  sendPendingClassificationReminder(count: number): void {
    PushNotification.localNotification({
      channelId: 'trip-tracker',
      title: 'Ritten nog niet ingedeeld',
      message: `Je hebt ${count} rit${count > 1 ? 'ten' : ''} die nog ingedeeld moet${count > 1 ? 'en' : ''} worden.`,
      userInfo: { action: 'pending' },
      playSound: true,
      soundName: 'default',
    });
  }
}

export const notificationService = new NotificationService();
