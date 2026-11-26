import React, { useEffect, useState } from 'react';
import { Bell, Clock3, Globe2, LogOut, Settings2, Volume2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { SUPPORTED_LANGUAGES } from '../i18n.js';
import { api } from '../services/api.js';

const getNotificationPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

const SettingCard = ({ icon: Icon, title, children }) => (
  <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300"><Icon className="h-5 w-5" /></span>
      <h2 className="font-bold text-white">{title}</h2>
    </div>
    {children}
  </section>
);

const selectClassName = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const {
    t,
    language,
    setLanguage,
    clockFormat,
    setClockFormat,
    defaultAlarmSound,
    setDefaultAlarmSound,
    snoozeDurationMinutes,
    setSnoozeDurationMinutes,
    soundOptions
  } = useSettings();
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [notificationError, setNotificationError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This will erase your account, all alarms, location reminders, and uploaded photos from our database. This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.deleteAccount();
      alert('Your account and associated data have been deleted successfully.');
      logout();
    } catch (err) {
      alert(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const refreshPermission = () => setNotificationPermission(getNotificationPermission());
    window.addEventListener('focus', refreshPermission);
    return () => window.removeEventListener('focus', refreshPermission);
  }, []);

  const requestNotificationPermission = async () => {
    if (getNotificationPermission() === 'unsupported') return;
    setNotificationError('');
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.error('Notification permission request failed:', err);
      setNotificationError(err.message || 'Could not request notification permission.');
    }
  };

  const permissionLabel = {
    unsupported: 'Not supported in this browser',
    granted: 'Permission granted',
    denied: 'Permission denied',
    default: 'Permission not requested'
  }[notificationPermission];

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fadeIn">
      <header className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 sm:p-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">{t('Settings')}</p>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t('Settings & Preferences')}</h1>
        <p className="mt-2 text-sm text-slate-300">{t('Choose your language and alarm defaults.')}</p>
      </header>

      <SettingCard icon={LogOut} title={t('Account')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">{t('Signed in as')}</p>
            <p className="mt-1 text-sm font-semibold text-white">{user?.username || user?.email || 'AuraAlarm account'}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-200 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            {t('Sign Out')}
          </button>
        </div>
      </SettingCard>

      <SettingCard icon={Globe2} title={t('Language')}>
        <label htmlFor="app-language" className="mb-2 block text-xs font-semibold text-slate-300">{t('Language')}</label>
        <select
          id="app-language"
          value={language}
          onChange={event => setLanguage(event.target.value)}
          className={selectClassName}
        >
          {SUPPORTED_LANGUAGES.map(item => (
            <option key={item.code} value={item.code}>{item.name}</option>
          ))}
        </select>
      </SettingCard>

      <SettingCard icon={Clock3} title={t('Clock format')}>
        <label htmlFor="clock-format" className="mb-2 block text-xs font-semibold text-slate-300">{t('Clock format')}</label>
        <select
          id="clock-format"
          value={clockFormat}
          onChange={event => setClockFormat(event.target.value)}
          className={selectClassName}
        >
          <option value="12h">{t('12-hour')}</option>
          <option value="24h">{t('24-hour')}</option>
        </select>
      </SettingCard>

      <SettingCard icon={Bell} title={t('Notifications')}>
        <p className="text-sm text-slate-300">{t('Notification permission')}: <span className="font-semibold text-white">{t(permissionLabel)}</span></p>
        {notificationPermission === 'default' && (
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
          >
            {t('Allow notifications')}
          </button>
        )}
        {notificationPermission === 'denied' && (
          <p className="mt-3 text-xs text-amber-200">{t("Change this site's notification permission in your browser settings.")}</p>
        )}
        {notificationError && <p role="alert" className="mt-3 text-xs text-rose-300">{notificationError}</p>}
      </SettingCard>

      <SettingCard icon={Volume2} title={t('Default alarm sound')}>
        <label htmlFor="default-alarm-sound" className="mb-2 block text-xs font-semibold text-slate-300">{t('Default alarm sound')}</label>
        <select
          id="default-alarm-sound"
          value={defaultAlarmSound}
          onChange={event => setDefaultAlarmSound(event.target.value)}
          className={selectClassName}
        >
          {soundOptions.map(sound => (
            <option key={sound.id} value={sound.id}>{t(sound.label)}</option>
          ))}
        </select>
      </SettingCard>

      <SettingCard icon={Settings2} title={t('Snooze duration')}>
        <label htmlFor="snooze-duration" className="mb-2 block text-xs font-semibold text-slate-300">{t('Snooze duration')}</label>
        <select
          id="snooze-duration"
          value={snoozeDurationMinutes}
          onChange={event => setSnoozeDurationMinutes(event.target.value)}
          className={selectClassName}
        >
          {[5, 10, 15].map(minutes => {
            const label = `${minutes} minutes`;
            return <option key={minutes} value={minutes}>{t(label)}</option>;
          })}
        </select>
      </SettingCard>

      {user && (
        <SettingCard icon={Trash2} title={t('Account & Data')}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Permanently delete your account, alarms, location reminders, and uploaded photos from our database.
            </p>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600/20 border border-rose-500/40 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting account...' : 'Delete my account'}
            </button>
          </div>
        </SettingCard>
      )}
    </div>
  );
};
