/**
 * Type declarations for native modules without bundled types.
 */

declare module 'react-native-html-to-pdf' {
  interface PDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    width?: number;
    height?: number;
    padding?: number;
  }

  interface PDFResult {
    filePath: string | null;
    numberOfPages: number;
  }

  const RNHTMLtoPDF: {
    convert(options: PDFOptions): Promise<PDFResult>;
  };

  export default RNHTMLtoPDF;
}

declare module 'react-native-push-notification' {
  interface Notification {
    id?: string;
    title?: string;
    message: string;
    userInfo?: Record<string, unknown>;
    action?: string;
  }

  interface ConfigureOptions {
    onNotification?: (notification: Notification) => void;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  interface ChannelOptions {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    importance?: number;
    vibrate?: boolean;
    playSound?: boolean;
  }

  interface LocalNotificationOptions {
    channelId?: string;
    title?: string;
    message: string;
    userInfo?: Record<string, unknown>;
    playSound?: boolean;
    soundName?: string;
    actions?: string[];
    ongoing?: boolean;
    autoCancel?: boolean;
    vibrate?: boolean;
  }

  const PushNotification: {
    configure(options: ConfigureOptions): void;
    createChannel(options: ChannelOptions, callback: (created: boolean) => void): void;
    localNotification(options: LocalNotificationOptions): void;
    cancelAllLocalNotifications(): void;
  };

  export default PushNotification;
}
