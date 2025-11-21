import { AppNotification, NotificationType } from "../types";

type NotificationListener = (notification: AppNotification) => void;

class NotificationService {
  private listeners: NotificationListener[] = [];

  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(type: NotificationType, title: string, message: string) {
    const notification: AppNotification = {
      id: Math.random().toString(36).substring(7),
      type,
      title,
      message,
      timestamp: Date.now(),
    };

    this.listeners.forEach(listener => listener(notification));
  }
}

export const notificationService = new NotificationService();