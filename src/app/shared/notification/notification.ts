import { Component, inject } from '@angular/core';
import { INotification, NotificationService } from '../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class Notification {
  private notificationService = inject(NotificationService);
  notifications = this.notificationService.notifications;  // Use the signal directly

  /**
   * Track function for ngFor to optimize change detection
   */
  trackByNotificationId(index: number, notification: INotification): string {
    return notification.id;
  }

  /**
   * Remove notification
   */
  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  /**
   * Get icon for notification type
   */
  getIcon(type: INotification['type']): string {
    const icons = {
      success: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
      error: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
      warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
      info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    };
    return icons[type];
  }

}