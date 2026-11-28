// Service for tracking alarm trigger logs, audio state, and user dismiss/snooze actions in localStorage

const STORAGE_KEY = 'aura_alarm_history_log';
const MAX_LOGS = 10;

class AlarmLogService {
  getLogs() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveLogs(logs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_LOGS)));
    } catch (e) {
      console.warn('Could not save alarm log to localStorage:', e);
    }
  }

  // Called when an alarm triggers
  logTrigger({ alarmId, scheduledTime, label, soundStatus = 'playing' }) {
    const logs = this.getLogs();
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alarmId,
      label: label || 'Alarm',
      scheduledTime,
      firedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      firedDate: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      soundStatus, // 'playing' | 'blocked' | 'error'
      action: 'ringing', // 'ringing' | 'dismissed' | 'snoozed'
      actionTime: null,
      timestamp: Date.now()
    };
    logs.unshift(entry);
    this.saveLogs(logs);
    return entry.id;
  }

  // Update latest log entry when dismissed or snoozed
  logAction(action = 'dismissed') {
    const logs = this.getLogs();
    if (logs.length > 0) {
      logs[0].action = action;
      logs[0].actionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      this.saveLogs(logs);
    }
  }

  // Update sound status if it changes (e.g. from blocked to playing via tap)
  updateSoundStatus(status) {
    const logs = this.getLogs();
    if (logs.length > 0) {
      logs[0].soundStatus = status;
      this.saveLogs(logs);
    }
  }

  clearLogs() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

export const alarmLogService = new AlarmLogService();
