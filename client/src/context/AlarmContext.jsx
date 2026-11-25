import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { audioEngine } from '../services/audioService.js';
import { speechService } from '../services/speechService.js';
import { notificationService } from '../services/notificationService.js';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext.jsx';
import { useSettings } from './SettingsContext.jsx';

const AlarmContext = createContext(null);

export const AlarmProvider = ({ children }) => {
  const { user } = useAuth();
  const { snoozeDurationMinutes, t } = useSettings();
  const [alarms, setAlarms] = useState([]);
  const [ringingAlarm, setRingingAlarm] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Sleep Aid State
  const [sleepTrack, setSleepTrack] = useState(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(null);
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState(0);
  const [sleepVolume, setSleepVolume] = useState(0.7);

  // Milestone alerts / Habit toast
  const [milestoneToast, setMilestoneToast] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const lastTriggeredMinuteRef = useRef('');

  useEffect(() => {
    notificationService.registerServiceWorker();
    notificationService.getPermissionStatus().then(setNotificationPermission);
  }, []);

  const requestNotificationPermission = async () => {
    audioEngine.init();
    const activeList = alarms.filter(a => a && a.active);
    if (activeList.length > 0) {
      audioEngine.startKeepAlive(`Next alarm: ${activeList[0].time}`);
    }
    const status = await notificationService.requestPermission();
    setNotificationPermission(status);
    if (status === 'granted') {
      notificationService.syncAlarmsToDevice(alarms);
      showMilestoneToast('🔔 Phone alarm alerts & reminders enabled!');
    }
    return status;
  };

  // Keep background audio session alive on mobile (iOS PWA / Web) when any alarm is active
  useEffect(() => {
    const activeList = alarms.filter(a => a && a.active);
    if (activeList.length > 0 && !ringingAlarm) {
      audioEngine.startKeepAlive(`Next alarm: ${activeList[0].time}`);
    } else if (activeList.length === 0) {
      audioEngine.stopKeepAlive();
    }
  }, [alarms, ringingAlarm]);

  // Load private alarm data when account has an active subscription or 7-day free trial.
  useEffect(() => {
    const trialEndsAt = Date.parse(user?.trialEndsAt || '');
    const isTrialActive = !!user && user.username !== 'demo' && !(user.isPro && user.subscriptionStatus === 'active') && Number.isFinite(trialEndsAt) && trialEndsAt > Date.now();
    const expiresAt = Date.parse(user?.proExpiresAt || '');
    const hasPaidSubscription = user?.isPro &&
      user.username !== 'demo' &&
      user.subscriptionStatus === 'active' &&
      (
        (user.proPlan === 'pro_lifetime' && !user.proExpiresAt) ||
        (Number.isFinite(expiresAt) && expiresAt > Date.now())
      );

    if (isTrialActive || hasPaidSubscription) {
      loadAlarms();
    } else {
      setAlarms([{
        id: 'preview-alarm',
        time: '06:30',
        label: 'Sample Wake-Up Alarm',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        active: false,
        soundName: 'Gentle Chimes',
        timezone: 'Local',
        lovedOneName: 'Your Loved One',
        customMessage: 'Rise and shine! Today is yours.'
      }]);
    }
  }, [user?.id, user?.isPro, user?.subscriptionStatus, user?.proPlan, user?.proExpiresAt, user?.trialEndsAt]);

  // Sync active alarms and 10-min reminders to phone/device whenever alarms or permission change
  useEffect(() => {
    if (notificationPermission === 'granted') {
      notificationService.syncAlarmsToDevice(alarms);
    }
  }, [alarms, notificationPermission]);

  const loadAlarms = async () => {
    try {
      const res = await api.getAlarms();
      setAlarms(res.alarms || []);
    } catch (err) {
      console.warn('Could not load alarms from server, using local defaults:', err);
    }
  };

  // Clock tick & Alarm Checker (runs every 1 second + on screen unlock / focus)
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      setCurrentTime(now);

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      // Check current day abbreviation (e.g., 'Mon', 'Tue')
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = days[now.getDay()];

      // Avoid double-triggering in the same minute
      if (lastTriggeredMinuteRef.current !== timeStr && !ringingAlarm) {
        const matching = alarms.find(a => {
          if (!a.active) return false;

          let alarmTimeStr = timeStr;
          let alarmDay = currentDay;

          // If alarm is set for a specific international country / timezone
          if (a.timezone && a.timezone !== 'Local') {
            try {
              const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: a.timezone,
                hour: '2-digit',
                minute: '2-digit',
                weekday: 'short',
                hour12: false
              }).formatToParts(now);

              const h = parts.find(p => p.type === 'hour')?.value || hours;
              const m = parts.find(p => p.type === 'minute')?.value || minutes;
              alarmTimeStr = `${h}:${m}`;
              alarmDay = parts.find(p => p.type === 'weekday')?.value || currentDay;
            } catch {}
          }

          const normalize = (t) => {
            if (!t) return '';
            const p = String(t).trim().split(':');
            return p.length >= 2 ? `${p[0].padStart(2, '0')}:${p[1].padStart(2, '0')}` : String(t);
          };

          if (normalize(a.time) !== normalize(alarmTimeStr)) return false;
          if (a.days && a.days.length > 0 && !a.days.includes(alarmDay)) return false;
          return true;
        });

        if (matching) {
          lastTriggeredMinuteRef.current = timeStr;
          triggerAlarm(matching);
        }
      }

      // Check habit milestone reminders (e.g. 10:00, 14:30 hydration, 21:30 wind-down)
      if (timeStr === '10:00' && now.getSeconds() === 0) {
        showMilestoneToast('💧 Hydration Checkpoint: Drink a glass of water to fuel peak focus!', true);
      } else if (timeStr === '14:30' && now.getSeconds() === 0) {
        showMilestoneToast('⚡ Posture & Mobility: Take a 2-minute stretch break!', true);
      } else if (timeStr === '21:30' && now.getSeconds() === 0) {
        showMilestoneToast('🌙 Twilight Wind-Down: Dim ambient lights and prepare for deep sleep.', true);
      }
    };

    const timer = setInterval(checkAlarms, 1000);
    const onResume = () => {
      if (document.visibilityState === 'visible') {
        checkAlarms();
      }
    };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', checkAlarms);

    notificationService.registerListeners((alarmId) => {
      const found = alarms.find(a => a.id === alarmId);
      if (found) {
        triggerAlarm(found);
      }
    });

    // Listen for Service Worker messages (from lock screen notification taps / actions)
    const handleSwMessage = (event) => {
      const { type, action, alarmId } = event.data || {};
      if (type === 'TRIGGER_ALARM' && alarmId) {
        const found = alarms.find(a => a.id === alarmId);
        if (found) triggerAlarm(found);
      } else if (type === 'ALARM_ACTION') {
        if (action === 'snooze') snoozeAlarm();
        if (action === 'dismiss') dismissAlarm();
      }
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    // Check if launched with ?ringingAlarmId= parameter
    try {
      const params = new URLSearchParams(window.location.search);
      const ringingParam = params.get('ringingAlarmId');
      if (ringingParam && alarms.length > 0) {
        const match = alarms.find(a => a.id === ringingParam);
        if (match) {
          triggerAlarm(match);
          const cleanUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch {}

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', checkAlarms);
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [alarms, ringingAlarm]);

  // Sleep Aid Timer Countdown
  useEffect(() => {
    let interval = null;
    if (sleepRemainingSeconds > 0) {
      interval = setInterval(() => {
        setSleepRemainingSeconds(prev => {
          if (prev <= 1) {
            audioEngine.stopSleepSound();
            setSleepTrack(null);
            setSleepTimerMinutes(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sleepRemainingSeconds]);

  const showMilestoneToast = (msg, notifyPhone = false) => {
    setMilestoneToast(msg);
    setTimeout(() => setMilestoneToast(null), 8000);
    if (notifyPhone) {
      notificationService.showReminderNotification('AuraAlarm Reminder', msg);
    }
  };

  // Trigger Alarm
  const triggerAlarm = (alarm) => {
    setRingingAlarm(alarm);
    // 1. Play sound
    audioEngine.playAlarmSound(alarm.soundId || 'gentle_chimes', api.resolveAssetUrl(alarm.customSoundUrl));

    // 2. Ring/vibrate & show system notification on phone
    notificationService.showAlarmNotification(alarm);

    // 3. Play dynamic voice greeting if enabled
    if (alarm.speechGreeting !== false) {
      setTimeout(() => {
        speechService.speakGreeting(
          '',
          alarm.lovedOneName || 'Your Loved One',
          alarm.customMessage || 'Rise and shine, champion! You are capable of amazing things.'
        );
      }, 1000);
    }
  };

  // Snooze Alarm
  const snoozeAlarm = () => {
    const current = ringingAlarm;
    audioEngine.stopAlarmSound();
    speechService.stop();
    setRingingAlarm(null);

    showMilestoneToast(t('Alarm snoozed for {{minutes}} minutes. Take a gentle breath.', {
      minutes: snoozeDurationMinutes
    }));
    setTimeout(() => {
      if (current) {
        triggerAlarm(current);
      }
    }, snoozeDurationMinutes * 60 * 1000);
  };

  // Dismiss Alarm
  const dismissAlarm = async () => {
    audioEngine.stopAlarmSound();
    speechService.stop();
    const current = ringingAlarm;
    setRingingAlarm(null);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Call server to record dismissal & ping loved one
    if (current?.id) {
      try {
        await api.dismissAlarm(current.id, { locationName: 'Home Base' });
      } catch (err) {
        console.warn('Dismissal sync notice:', err);
      }
    }

    showMilestoneToast('✨ Rise & Conquer! Daily streak updated and loved one notified.');
  };

  // Sleep Aid controls
  const startSleepSound = (soundId, durationMinutes = 45) => {
    setSleepTrack(soundId);
    setSleepTimerMinutes(durationMinutes);
    setSleepRemainingSeconds(durationMinutes * 60);
    audioEngine.playSleepSound(soundId, sleepVolume);
  };

  const stopSleepSound = () => {
    audioEngine.stopSleepSound();
    setSleepTrack(null);
    setSleepTimerMinutes(null);
    setSleepRemainingSeconds(0);
  };

  const adjustSleepVolume = (vol) => {
    setSleepVolume(vol);
    audioEngine.setVolume(vol);
  };

  // Manual Alarm testing trigger
  const testAlarm = (alarm) => {
    triggerAlarm(alarm);
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        setAlarms,
        ringingAlarm,
        currentTime,
        loadAlarms,
        triggerAlarm,
        testAlarm,
        snoozeAlarm,
        dismissAlarm,
        sleepTrack,
        sleepTimerMinutes,
        sleepRemainingSeconds,
        sleepVolume,
        startSleepSound,
        stopSleepSound,
        adjustSleepVolume,
        milestoneToast,
        setMilestoneToast,
        notificationPermission,
        requestNotificationPermission
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => useContext(AlarmContext);
