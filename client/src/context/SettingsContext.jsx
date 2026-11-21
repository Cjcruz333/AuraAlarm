import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_BY_LANGUAGE, SUPPORTED_LANGUAGES, translate } from '../i18n.js';

const SettingsContext = createContext(null);

const getStoredValue = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const SOUND_OPTIONS = [
  { id: 'gentle_chimes', label: 'Gentle Dawn Chimes' },
  { id: 'zen_bell', label: 'Zen Temple Bell' },
  { id: 'energy_pulsar', label: 'Metabolic Dawn Spark' }
];
const SOUND_IDS = SOUND_OPTIONS.map(sound => sound.id);

const getStoredPreference = (key, fallback, validValues) => {
  const value = getStoredValue(key, fallback);
  return validValues.includes(value) ? value : fallback;
};

export const SettingsProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() =>
    getStoredPreference('aura_language', 'en', SUPPORTED_LANGUAGES.map(item => item.code))
  );
  const [clockFormat, setClockFormatState] = useState(() =>
    getStoredPreference('aura_clock_format', '12h', ['12h', '24h'])
  );
  const [defaultAlarmSound, setDefaultAlarmSoundState] = useState(() =>
    getStoredPreference('aura_default_alarm_sound', 'gentle_chimes', SOUND_IDS)
  );
  const [snoozeDurationMinutes, setSnoozeDurationState] = useState(() => {
    const stored = Number(getStoredValue('aura_snooze_duration', '5'));
    return [5, 10, 15].includes(stored) ? stored : 5;
  });

  const persist = (key, value) => {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (err) {
      console.error(`Could not save setting "${key}":`, err);
    }
  };

  const setLanguage = value => {
    setLanguageState(value);
    persist('aura_language', value);
  };

  const setClockFormat = value => {
    setClockFormatState(value);
    persist('aura_clock_format', value);
  };

  const setDefaultAlarmSound = value => {
    setDefaultAlarmSoundState(value);
    persist('aura_default_alarm_sound', value);
  };

  const setSnoozeDurationMinutes = value => {
    const minutes = Number(value);
    if (![5, 10, 15].includes(minutes)) {
      throw new RangeError('Snooze duration must be 5, 10, or 15 minutes.');
    }
    setSnoozeDurationState(minutes);
    persist('aura_snooze_duration', minutes);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const settings = useMemo(() => ({
    language,
    locale: LOCALE_BY_LANGUAGE[language] || LOCALE_BY_LANGUAGE.en,
    clockFormat,
    defaultAlarmSound,
    snoozeDurationMinutes,
    soundOptions: SOUND_OPTIONS,
    setLanguage,
    setClockFormat,
    setDefaultAlarmSound,
    setSnoozeDurationMinutes,
    t: (key, values) => translate(language, key, values),
    formatTime: value => {
      let date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
        const [hours, minutes] = value.split(':').map(Number);
        date = new Date();
        date.setHours(hours, minutes, 0, 0);
      } else {
        date = new Date(value);
      }

      if (Number.isNaN(date.getTime())) return String(value);
      return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language] || LOCALE_BY_LANGUAGE.en, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: clockFormat === '12h'
      }).format(date);
    }
  }), [language, clockFormat, defaultAlarmSound, snoozeDurationMinutes]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used within SettingsProvider.');
  return settings;
};
