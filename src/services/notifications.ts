type NotificationPermission = 'granted' | 'denied' | 'default';

class NotificationService {
  private static instance: NotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;
    if (this.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  public async scheduleAssessmentReminder(preferredTime?: string) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    const time = preferredTime || '20:00'; // Default to 8 PM
    const [hours, minutes] = time.split(':').map(Number);

    // Schedule notification
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime.getTime() < now.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showNotification(
        'Daily Assessment Reminder',
        'Time to complete your relationship wellness assessment!'
      );
      // Schedule next reminder
      this.scheduleAssessmentReminder(preferredTime);
    }, delay);
  }

  public async showNotification(
    title: string,
    body: string,
    options: NotificationOptions = {}
  ) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/path-to-your-icon.png', // TODO: Add your app icon
        badge: '/path-to-your-badge.png', // TODO: Add your app badge
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  public async showAssessmentComplete(partnerName: string) {
    await this.showNotification(
      'Assessment Complete',
      `${partnerName} has completed their daily assessment!`
    );
  }

  public async showFeedbackAvailable() {
    await this.showNotification(
      'New Feedback Available',
      'Your relationship wellness feedback is ready to view.'
    );
  }

  public async showPartnerRequest(partnerEmail: string) {
    await this.showNotification(
      'Partner Connection Request',
      `${partnerEmail} wants to connect with you!`
    );
  }

  public async showWeeklySummary() {
    await this.showNotification(
      'Weekly Summary Available',
      'Your weekly relationship wellness summary is ready to view.'
    );
  }

  public async showMilestone(message: string) {
    await this.showNotification('Milestone Achieved', message);
  }
}

// Create and export a singleton instance
export const notificationService = NotificationService.getInstance(); 