import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ALARM_CHANNEL_ID = 'aura-alarms';
const REMINDER_CHANNEL_ID = 'aura-reminders';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.webTimers = [];
    this.channelsInitialized = false;
    this.listenersRegistered = false;
  }

  registerListeners(onAlarmTrigger) {
    if (!this.isNative() || this.listenersRegistered) return;
    this.listenersRegistered = true;

    try {
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        const extra = notification?.extra;
        if (extra?.type === 'alarm' && extra?.alarmId && typeof onAlarmTrigger === 'function') {
          onAlarmTrigger(extra.alarmId);
        }
      });

      LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const extra = action?.notification?.extra;
        if (extra?.type === 'alarm' && extra?.alarmId && typeof onAlarmTrigger === 'function') {
          onAlarmTrigger(extra.alarmId);
        }
      });
    } catch (err) {
      console.warn('Could not register native notification listeners:', err);
    }
  }

  isNative() {
    try {
      return typeof Capacitor?.isNativePlatform === 'function' && Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  isIOSBrowser() {
    if (this.isNative() || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isStandalonePWA() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true;
  }

  isSupported() {
    if (this.isNative()) return true;
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async registerServiceWorker() {
    if (this.isNative() || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      }
      return this.swRegistration;
    } catch (err) {
      console.warn('Service Worker registration failed:', err);
      return null;
    }
  }

  async ensureNativeChannels() {
    if (!this.isNative() || this.channelsInitialized) return;
    try {
      await LocalNotifications.createChannel({
        id: ALARM_CHANNEL_ID,
        name: 'AuraAlarm Wake-Up Calls',
        description: 'High-priority alarm ring alerts and wake-up calls',
        importance: 5,
        visibility: 1,
        sound: 'alarm_chime.wav',
        vibration: true,
        lights: true
      });
      await LocalNotifications.createChannel({
        id: REMINDER_CHANNEL_ID,
        name: 'AuraAlarm Reminders',
        description: 'Upcoming alarm reminders and daily wellness alerts',
        importance: 4,
        visibility: 1,
        vibration: true
      });
      this.channelsInitialized = true;
    } catch (err) {
      console.warn('Could not create Android notification channels:', err);
    }
  }

  async getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';

    if (this.isNative()) {
      try {
        const res = await LocalNotifications.checkPermissions();
        if (res.display === 'granted') return 'granted';
        if (res.display === 'denied') return 'denied';
        return 'default';
      } catch {
        return 'default';
      }
    }

    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';

    if (this.isNative()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        if (res.display === 'granted') {
          await this.ensureNativeChannels();
          return 'granted';
        }
        return res.display === 'denied' ? 'denied' : 'default';
      } catch (err) {
        console.warn('Native notification permission request failed:', err);
        return 'denied';
      }
    }

    try {
      await this.registerServiceWorker();
      const result = await Notification.requestPermission();
      return result;
    } catch (err) {
      console.warn('Web notification permission request failed:', err);
      return 'denied';
    }
  }

  /**
   * Compute the next Date an active alarm should trigger.
   */
  getNextTriggerDate(alarm, now = new Date()) {
    if (!alarm?.active || !alarm?.time) return null;
    const [hourStr, minStr] = String(alarm.time).split(':');
    const targetHour = Number(hourStr);
    const targetMin = Number(minStr);
    if (!Number.isInteger(targetHour) || !Number.isInteger(targetMin)) return null;

    const allowedDays = Array.isArray(alarm.days) && alarm.days.length > 0 ? alarm.days : null;

    // Search up to 8 days ahead for the next matching day & time
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(targetHour, targetMin, 0, 0);

      if (candidate.getTime() <= now.getTime()) continue;

      if (!allowedDays) {
        return candidate;
      }

      let dayAbbr = DAY_NAMES[candidate.getDay()];
      if (alarm.timezone && alarm.timezone !== 'Local') {
        try {
          dayAbbr = new Intl.DateTimeFormat('en-GB', {
            timeZone: alarm.timezone,
            weekday: 'short'
          }).format(candidate);
        } catch {
          // fallback to local day
        }
      }

      if (allowedDays.includes(dayAbbr)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Generate a stable positive 32-bit integer ID from an alarm ID string.
   */
  toNumericId(str, salt = 0) {
    let hash = 2166136261 ^ salt;
    const input = String(str || 'alarm');
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash % 2000000000) + 1;
  }

  clearWebTimers() {
    for (const timerId of this.webTimers) {
      clearTimeout(timerId);
    }
    this.webTimers = [];
  }

  /**
   * Schedule active alarms and 10-minute advance reminders on the phone/browser.
   */
  async syncAlarmsToDevice(alarms = []) {
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') return;

    const activeAlarms = (alarms || []).filter(a => a && a.active);
    const now = new Date();

    if (this.isNative()) {
      try {
        await this.ensureNativeChannels();
        const pending = await LocalNotifications.getPending();
        if (pending?.notifications?.length) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const toSchedule = [];
        for (const alarm of activeAlarms) {
          const triggerAt = this.getNextTriggerDate(alarm, now);
          if (!triggerAt) continue;

          toSchedule.push({
            id: this.toNumericId(alarm.id, 1),
            title: `⏰ ${alarm.label || 'AuraAlarm Wake-Up'}`,
            body: alarm.customMessage || `Scheduled for ${alarm.time}. Tap to open AuraAlarm.`,
            channelId: ALARM_CHANNEL_ID,
            sound: 'alarm_chime.wav',
            schedule: { at: triggerAt, allowWhileIdle: true },
            extra: { alarmId: alarm.id, type: 'alarm' }
          });

          // 10-minute advance reminder
          const reminderAt = new Date(triggerAt.getTime() - 10 * 60 * 1000);
          if (reminderAt.getTime() > now.getTime() + 15000) {
            toSchedule.push({
              id: this.toNumericId(alarm.id, 2),
              title: `🔔 Upcoming Alarm in 10 mins`,
              body: `${alarm.label || 'Wake-Up Alarm'} is set for ${alarm.time}.`,
              channelId: REMINDER_CHANNEL_ID,
              schedule: { at: reminderAt, allowWhileIdle: true },
              extra: { alarmId: alarm.id, type: 'reminder' }
            });
          }
        }

        if (toSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: toSchedule });
        }
      } catch (err) {
        console.warn('Failed to schedule native local notifications:', err);
      }
      return;
    }

    // Web / PWA: schedule in-page advance reminders and sync with Service Worker
    this.clearWebTimers();
    const reg = await this.registerServiceWorker();
    if (reg?.active) {
      reg.active.postMessage({ type: 'SYNC_ALARMS', alarms: activeAlarms });
    }

    const maxDelayMs = 24 * 60 * 60 * 1000;
    for (const alarm of activeAlarms) {
      const triggerAt = this.getNextTriggerDate(alarm, now);
      if (!triggerAt) continue;

      const reminderAt = new Date(triggerAt.getTime() - 10 * 60 * 1000);
      const reminderDelay = reminderAt.getTime() - now.getTime();
      if (reminderDelay > 15000 && reminderDelay <= maxDelayMs) {
        const tId = setTimeout(() => {
          this.showReminderNotification(
            '🔔 Upcoming Alarm in 10 mins',
            `${alarm.label || 'Wake-Up Alarm'} is scheduled for ${alarm.time}.`,
            `reminder-${alarm.id}`
          );
        }, reminderDelay);
        this.webTimers.push(tId);
      }
    }
  }

  /**
   * Immediately fire a ringing phone notification + vibration when an alarm triggers.
   */
  async showAlarmNotification(alarm) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([500, 200, 500, 200, 800]);
      } catch {
        // ignore vibration errors
      }
    }

    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') return;

    const title = `⏰ ${alarm?.label || 'AuraAlarm Wake-Up Call'} (${alarm?.time || 'Now'})`;
    const currentHour = new Date().getHours();
    const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
    let body = alarm?.customMessage || `${timeGreeting}! Time to rise and shine.`;
    if (/good morning/i.test(body) && currentHour >= 12) {
      body = body.replace(/good morning/i, timeGreeting);
    }

    if (this.isNative()) {
      try {
        await this.ensureNativeChannels();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: this.toNumericId(alarm?.id || 'now', 9),
              title,
              body,
              channelId: ALARM_CHANNEL_ID,
              sound: 'alarm_chime.wav',
              schedule: { at: new Date(Date.now() + 250), allowWhileIdle: true },
              extra: { alarmId: alarm?.id, type: 'alarm_ring' }
            }
          ]
        });
      } catch (err) {
        console.warn('Native alarm notification failed:', err);
      }
      return;
    }

    const options = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `aura-alarm-${alarm?.id || 'active'}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 800],
      actions: [
        { action: 'snooze', title: 'Snooze' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: { url: `/?ringingAlarmId=${alarm?.id || ''}`, alarmId: alarm?.id }
    };

    try {
      const reg = await this.registerServiceWorker();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    } catch (err) {
      console.warn('SW showNotification failed, falling back to Notification API:', err);
    }

    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: options.tag,
        requireInteraction: true
      });
    } catch (err) {
      console.warn('Web Notification fallback failed:', err);
    }
  }

  /**
   * Show a system reminder notification on the phone/desktop.
   */
  async showReminderNotification(title, body, tag = 'aura-reminder') {
    const permission = await this.getPermissionStatus();
    if (permission !== 'granted') return;

    if (this.isNative()) {
      try {
        await this.ensureNativeChannels();
        await LocalNotifications.schedule({
          notifications: [
            {
              id: this.toNumericId(tag, 5),
              title,
              body,
              channelId: REMINDER_CHANNEL_ID,
              schedule: { at: new Date(Date.now() + 250), allowWhileIdle: true }
            }
          ]
        });
      } catch (err) {
        console.warn('Native reminder notification failed:', err);
      }
      return;
    }

    const options = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    };

    try {
      const reg = await this.registerServiceWorker();
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return;
      }
    } catch {
      // fallback
    }

    try {
      new Notification(title, { body, icon: '/icons/icon-192.png', tag });
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();
