import { Capacitor, registerPlugin } from '@capacitor/core';

export const NativeAlarmPlugin = registerPlugin('NativeAlarm');

class NativeAlarmService {
  isAndroidNative() {
    try {
      return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    } catch {
      return false;
    }
  }

  async checkPermissions() {
    if (!this.isAndroidNative()) {
      return { exactAlarm: true, notifications: true, batteryOptimization: true };
    }
    try {
      return await NativeAlarmPlugin.checkPermissions();
    } catch (e) {
      console.warn('NativeAlarm.checkPermissions error:', e);
      return { exactAlarm: false, notifications: false, batteryOptimization: false };
    }
  }

  async requestExactAlarmPermission() {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.requestExactAlarmPermission();
    } catch (e) {
      console.warn('requestExactAlarmPermission error:', e);
    }
  }

  async requestNotificationPermission() {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.requestNotificationPermission();
    } catch (e) {
      console.warn('requestNotificationPermission error:', e);
    }
  }

  async requestBatteryOptimization() {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.requestBatteryOptimization();
    } catch (e) {
      console.warn('requestBatteryOptimization error:', e);
    }
  }

  async openAppSettings() {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.openAppSettings();
    } catch (e) {
      console.warn('openAppSettings error:', e);
    }
  }

  /**
   * Schedule exact alarm with AlarmManager.setAlarmClock
   */
  async scheduleAlarm({ id, triggerTime, label, sound, days }) {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.scheduleAlarm({
        id: String(id),
        triggerTime: Number(triggerTime),
        label: label || 'Wake-Up Call',
        sound: sound || 'alarm_chime',
        days: Array.isArray(days) ? days.join(',') : (days || '')
      });
      console.log('✅ [NativeAlarm] Scheduled exact alarm clock for:', id, new Date(triggerTime));
    } catch (e) {
      console.warn('NativeAlarm.scheduleAlarm error:', e);
    }
  }

  /**
   * Cancel exact alarm
   */
  async cancelAlarm(id) {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.cancelAlarm({ id: String(id) });
      console.log('🛑 [NativeAlarm] Cancelled exact alarm:', id);
    } catch (e) {
      console.warn('NativeAlarm.cancelAlarm error:', e);
    }
  }

  /**
   * Cancel all exact alarms
   */
  async cancelAllAlarms() {
    if (!this.isAndroidNative()) return;
    try {
      await NativeAlarmPlugin.cancelAllAlarms();
    } catch (e) {
      console.warn('NativeAlarm.cancelAllAlarms error:', e);
    }
  }

  /**
   * Sync list of all alarms to native AlarmManager
   */
  async syncAlarms(alarmsWithTriggers) {
    if (!this.isAndroidNative()) return;
    try {
      const payload = (alarmsWithTriggers || []).map(a => ({
        id: String(a.id),
        triggerTime: Number(a.triggerTime),
        label: a.label || 'Wake-Up Alarm',
        sound: a.sound || 'alarm_chime',
        days: Array.isArray(a.days) ? a.days.join(',') : (a.days || ''),
        active: Boolean(a.active)
      }));

      const res = await NativeAlarmPlugin.syncAlarms({ alarms: payload });
      console.log('🔄 [NativeAlarm] Synced alarms to native AlarmManager:', res);
      return res;
    } catch (e) {
      console.warn('NativeAlarm.syncAlarms error:', e);
    }
  }
}

export const nativeAlarmService = new NativeAlarmService();
