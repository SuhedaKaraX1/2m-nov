export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

export class NotificationService {
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  static get permission(): NotificationPermission {
    return this.isSupported() ? Notification.permission : 'denied';
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  static async show(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported');
      return null;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? false,
        data: options.data,
        badge: '/icon-192.png',
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  static async showChallengeNotification(
    challengeTitle: string,
    scheduledChallengeId: string
  ): Promise<Notification | null> {
    return this.show({
      title: '⏰ Challenge in 2 Minutes!',
      body: `Get ready: ${challengeTitle}`,
      tag: `challenge-${scheduledChallengeId}`,
      requireInteraction: true,
      data: { scheduledChallengeId, type: 'challenge-reminder' },
    });
  }

  static async showChallengeStartNotification(
    challengeTitle: string,
    scheduledChallengeId: string
  ): Promise<Notification | null> {
    return this.show({
      title: '🎯 Challenge Time!',
      body: `Start now: ${challengeTitle}`,
      tag: `challenge-start-${scheduledChallengeId}`,
      requireInteraction: true,
      data: { scheduledChallengeId, type: 'challenge-start' },
    });
  }
}
