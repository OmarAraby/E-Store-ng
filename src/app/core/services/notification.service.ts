import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface INotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Use signals for better reactivity in Angular 20
  private notificationsSignal = signal<INotification[]>([]);
  
  // Keep the observable for backwards compatibility
  public notifications$ = new Observable<INotification[]>(subscriber => {
    // Subscribe to signal changes
    const unsubscribe = () => {};
    subscriber.next(this.notificationsSignal());
    return unsubscribe;
  });

  // Expose signal as read-only
  public notifications = this.notificationsSignal.asReadonly();

  private defaultDuration = 5000; 

  showSuccess(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  showError(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  showWarning(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  showInfo(title: string, message?: string, duration?: number): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSignal.set(updatedNotifications);
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }

  private addNotification(notification: INotification): void {
    const currentNotifications = this.notificationsSignal();
    const updatedNotifications = [...currentNotifications, notification];
    this.notificationsSignal.set(updatedNotifications);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}