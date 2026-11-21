import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { audioEngine } from '../services/audioService.js';
import { speechService } from '../services/speechService.js';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext.jsx';

const AlarmContext = createContext(null);

export const AlarmProvider = ({ children }) => {
  const { user } = useAuth();
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

  const lastTriggeredMinuteRef = useRef('');

  // Load private alarm data only after the account has an active subscription.
  useEffect(() => {
    const expiresAt = Date.parse(user?.proExpiresAt || '');
    const hasActiveSubscription = user?.isPro &&
      user.username !== 'demo' &&
      user.subscriptionStatus === 'active' &&
      (
        (user.proPlan === 'pro_lifetime' && !user.proExpiresAt) ||
        (Number.isFinite(expiresAt) && expiresAt > Date.now())
      );

    if (hasActiveSubscription) {
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
  }, [user?.id, user?.isPro, user?.subscriptionStatus, user?.proPlan, user?.proExpiresAt]);

  const loadAlarms = async () => {
    try {
      const res = await api.getAlarms();
      setAlarms(res.alarms || []);
    } catch (err) {
      console.warn('Could not load alarms from server, using local defaults:', err);
    }
  };

  // Clock tick & Alarm Checker (runs every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
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

          if (a.time !== alarmTimeStr) return false;
          if (a.days && a.days.length > 0 && !a.days.includes(alarmDay)) return false;
          return true;
        });

        if (matching) {
          lastTriggeredMinuteRef.current = timeStr;
          triggerAlarm(matching);
        }
      }

      // Check habit milestone reminders (e.g. 10:00, 14:00 hydration, 21:30 wind-down)
      if (timeStr === '10:00' && now.getSeconds() === 0) {
        showMilestoneToast('💧 Hydration Checkpoint: Drink a glass of water to fuel peak focus!');
      } else if (timeStr === '14:30' && now.getSeconds() === 0) {
        showMilestoneToast('⚡ Posture & Mobility: Take a 2-minute stretch break!');
      } else if (timeStr === '21:30' && now.getSeconds() === 0) {
        showMilestoneToast('🌙 Twilight Wind-Down: Dim ambient lights and prepare for deep sleep.');
      }
    }, 1000);

    return () => clearInterval(timer);
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

  const showMilestoneToast = (msg) => {
    setMilestoneToast(msg);
    setTimeout(() => setMilestoneToast(null), 8000);
  };

  // Trigger Alarm
  const triggerAlarm = (alarm) => {
    setRingingAlarm(alarm);
    // 1. Play sound
    audioEngine.playAlarmSound(alarm.soundId || 'gentle_chimes', alarm.customSoundUrl);

    // 2. Play dynamic voice greeting if enabled
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

  // Snooze Alarm (+5 minutes)
  const snoozeAlarm = () => {
    audioEngine.stopAlarmSound();
    speechService.stop();
    setRingingAlarm(null);

    showMilestoneToast('⏰ Alarm snoozed for 5 minutes. Take a gentle breath.');
    setTimeout(() => {
      if (ringingAlarm) {
        triggerAlarm(ringingAlarm);
      }
    }, 5 * 60 * 1000);
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
        setMilestoneToast
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarm = () => useContext(AlarmContext);
