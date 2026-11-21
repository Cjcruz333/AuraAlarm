import React, { useState, useEffect } from 'react';
import { X, Clock, Volume2, Upload, Heart, Lock, Sparkles, Check, Globe, ChevronUp, ChevronDown, Sun, Moon } from 'lucide-react';
import { api } from '../services/api.js';
import { cryptoService } from '../services/cryptoService.js';
import { WORLD_COUNTRIES } from './WorldClock.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export const AlarmEditModal = ({ isOpen, onClose, alarmToEdit, onSave }) => {
  const { clockFormat, defaultAlarmSound, formatTime } = useSettings();
  const [time, setTime] = useState('06:30');
  const [label, setLabel] = useState('Morning Rise & Shine');
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [timezone, setTimezone] = useState('Local');
  const [soundId, setSoundId] = useState('gentle_chimes');
  const [soundName, setSoundName] = useState('Gentle Dawn Chimes');
  const [customSoundUrl, setCustomSoundUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [lovedOneName, setLovedOneName] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [greetingEnabled, setGreetingEnabled] = useState(true);
  const [speechGreeting, setSpeechGreeting] = useState(true);
  const [secretNote, setSecretNote] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const builtInSounds = [
    { id: 'gentle_chimes', name: 'Gentle Dawn Chimes (Soothing)' },
    { id: 'zen_bell', name: 'Zen Temple Bell (Meditative)' },
    { id: 'energy_pulsar', name: 'Metabolic Dawn Spark (Energizing)' }
  ];

  useEffect(() => {
    if (alarmToEdit) {
      setTime(alarmToEdit.time || '06:30');
      setLabel(alarmToEdit.label || '');
      setDays(alarmToEdit.days || []);
      setTimezone(alarmToEdit.timezone || 'Local');
      setSoundId(alarmToEdit.soundId || 'gentle_chimes');
      setSoundName(alarmToEdit.soundName || 'Gentle Dawn Chimes');
      setCustomSoundUrl(alarmToEdit.customSoundUrl || '');
      setPhotoUrl(alarmToEdit.photoUrl || '');
      setLovedOneName(alarmToEdit.lovedOneName || '');
      setCustomMessage(alarmToEdit.customMessage || '');
      setGreetingEnabled(alarmToEdit.greetingEnabled !== false);
      setSpeechGreeting(alarmToEdit.speechGreeting !== false);

      // Decrypt secret note if present
      if (alarmToEdit.e2eeEncryptedNotes) {
        cryptoService.decrypt(alarmToEdit.e2eeEncryptedNotes).then(decrypted => {
          setSecretNote(decrypted);
        });
      } else {
        setSecretNote('');
      }
    } else {
      setTime('07:00');
      setLabel('Rise & Conquer');
      setDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      const selectedSound = builtInSounds.find(sound => sound.id === defaultAlarmSound) || builtInSounds[0];
      setSoundId(selectedSound.id);
      setSoundName(selectedSound.name);
      setCustomSoundUrl('');
      setPhotoUrl('');
      setLovedOneName('');
      setCustomMessage('Rise and shine, champion!');
      setGreetingEnabled(true);
      setSpeechGreeting(true);
      setSecretNote('');
    }
  }, [alarmToEdit, isOpen, defaultAlarmSound]);

  if (!isOpen) return null;

  // Convert 24h string ('14:30') to 12h representation
  const parseTime = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) {
      return { hour24: 7, hour12: 7, minute: 0, period: 'AM' };
    }
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 7;
    let m = parseInt(mStr, 10);
    if (isNaN(m)) m = 0;
    const period = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour24: h, hour12, minute: m, period };
  };

  const parsed = parseTime(time);

  // Convert 12h representation back to 24h string ('HH:MM')
  const setTimeFrom12h = (newHour12, newMinute, newPeriod) => {
    let h = parseInt(newHour12, 10) % 12;
    if (newPeriod === 'PM') h += 12;
    let m = parseInt(newMinute, 10);
    if (isNaN(m)) m = 0;
    if (m < 0) m = 0;
    if (m > 59) m = 59;
    const hFormatted = String(h).padStart(2, '0');
    const mFormatted = String(m).padStart(2, '0');
    setTime(`${hFormatted}:${mFormatted}`);
  };

  const stepHour = (delta) => {
    let next = parsed.hour12 + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    setTimeFrom12h(next, parsed.minute, parsed.period);
  };

  const stepMinute = (delta) => {
    let next = (parsed.minute + delta) % 60;
    if (next < 0) next += 60;
    setTimeFrom12h(parsed.hour12, next, parsed.period);
  };

  const togglePeriod = (newPeriod) => {
    if (parsed.period !== newPeriod) {
      setTimeFrom12h(parsed.hour12, parsed.minute, newPeriod);
    }
  };

  const adjustMinutes = (deltaMinutes) => {
    let totalMin = parsed.hour24 * 60 + parsed.minute + deltaMinutes;
    totalMin = (totalMin % 1440 + 1440) % 1440;
    const newH = Math.floor(totalMin / 60);
    const newM = totalMin % 60;
    setTime(`${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const quickPresets = [
    { label: '5:30 AM', time: '05:30', icon: '🌅' },
    { label: '6:00 AM', time: '06:00', icon: '⏰' },
    { label: '6:30 AM', time: '06:30', icon: '☀️' },
    { label: '7:00 AM', time: '07:00', icon: '🎯' },
    { label: '7:30 AM', time: '07:30', icon: '⚡' },
    { label: '8:00 AM', time: '08:00', icon: '☕' },
    { label: '9:00 PM', time: '21:00', icon: '🌙' },
  ];

  const toggleDay = (day) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadPhoto(file);
      setPhotoUrl(res.photoUrl);
    } catch (err) {
      console.error('Photo upload error:', err);
      // Fallback local object URL
      setPhotoUrl(URL.createObjectURL(file));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const res = await api.uploadAlarmSound(file);
      setCustomSoundUrl(res.soundUrl);
      setSoundName(res.soundName || file.name);
      setSoundId('custom_uploaded');
    } catch (err) {
      console.error('Audio upload error:', err);
      // Fallback local object URL
      setCustomSoundUrl(URL.createObjectURL(file));
      setSoundName(file.name);
      setSoundId('custom_uploaded');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side encrypt note if present
    let encryptedNotes = '';
    if (secretNote) {
      encryptedNotes = await cryptoService.encrypt(secretNote);
    }

    const payload = {
      ...(alarmToEdit?.id ? { id: alarmToEdit.id } : {}),
      time,
      timezone,
      label,
      days,
      soundId,
      soundName,
      customSoundUrl,
      photoUrl,
      lovedOneName,
      customMessage,
      greetingEnabled,
      speechGreeting,
      e2eeEncryptedNotes: encryptedNotes,
      active: true
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col glass-panel border border-slate-700/80 rounded-3xl shadow-2xl bg-slate-950/95 overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {alarmToEdit ? 'Customize Alarm' : 'Set New Alarm'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Choose wake-up time, sound, repeating days & personalization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Scrollable Form Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

            {/* ULTRA PROMINENT DIGITAL TIME CONSOLE */}
            {clockFormat === '12h' ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900/95 border-2 border-amber-500/50 shadow-xl shadow-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Wake Up Time</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono font-bold">
                  {parsed.hour12}:{String(parsed.minute).padStart(2, '0')} {parsed.period}
                </span>
              </div>

              {/* Big Interactive Time Dials */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 my-2">
                {/* Hour Stepper Box */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => stepHour(1)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Hour Up"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <div className="w-20 sm:w-24 h-18 sm:h-20 bg-slate-950 border-2 border-indigo-500/40 rounded-2xl flex flex-col items-center justify-center shadow-inner relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={String(parsed.hour12).padStart(2, '0')}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        if (!isNaN(val)) {
                          let clamped = val;
                          if (clamped > 12) clamped = 12;
                          if (clamped < 1) clamped = 1;
                          setTimeFrom12h(clamped, parsed.minute, parsed.period);
                        }
                      }}
                      className="w-full text-center text-4xl sm:text-5xl font-black font-mono text-amber-300 bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-xl"
                    />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider -mt-1">
                      Hour
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => stepHour(-1)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Hour Down"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>

                {/* Separator */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 animate-pulse">:</span>
                </div>

                {/* Minute Stepper Box */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => stepMinute(1)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Minute Up"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                  <div className="w-20 sm:w-24 h-18 sm:h-20 bg-slate-950 border-2 border-indigo-500/40 rounded-2xl flex flex-col items-center justify-center shadow-inner relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={String(parsed.minute).padStart(2, '0')}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                        if (!isNaN(val)) {
                          let clamped = val;
                          if (clamped > 59) clamped = 59;
                          if (clamped < 0) clamped = 0;
                          setTimeFrom12h(parsed.hour12, clamped, parsed.period);
                        }
                      }}
                      className="w-full text-center text-4xl sm:text-5xl font-black font-mono text-amber-300 bg-transparent focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-xl"
                    />
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider -mt-1">
                      Min
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => stepMinute(-1)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Minute Down"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </div>

                {/* AM / PM Toggle Pills */}
                <div className="flex flex-col gap-2 ml-1 sm:ml-2">
                  <button
                    type="button"
                    onClick={() => togglePeriod('AM')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                      parsed.period === 'AM'
                        ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30 scale-105'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePeriod('PM')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                      parsed.period === 'PM'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>PM</span>
                  </button>
                </div>
              </div>

              {/* Quick Minutes Fine-Tuning */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => adjustMinutes(-15)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  -15m
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(-5)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  -5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(5)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  +5m
                </button>
                <button
                  type="button"
                  onClick={() => adjustMinutes(15)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  +15m
                </button>
              </div>

              {/* Quick Presets */}
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Quick Wake Presets</span>
                  <span className="text-slate-500">1-Tap Set</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {quickPresets.map((preset) => {
                    const isSelected = time === preset.time;
                    return (
                      <button
                        key={preset.time}
                        type="button"
                        onClick={() => setTime(preset.time)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/30 scale-105'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direct Native Keyboard Input Fallback */}
              <div className="mt-3 flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400">Direct Time Input (24-Hour / System):</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

            </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <label htmlFor="alarm-time-24h" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Wake Up Time (24-hour)
                </label>
                <input
                  id="alarm-time-24h"
                  type="time"
                  value={time}
                  onChange={event => setTime(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="mt-2 text-xs text-slate-400">Current selection: {formatTime(time)}</p>
              </div>
            )}

            {/* Worldwide Country / Timezone Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Country / Timezone</span>
                </span>
                <span className="text-[10px] text-indigo-300 font-normal">Works in all 24 global timezones</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Local">🌐 Local Device Time (Auto-detects country)</option>
                {WORLD_COUNTRIES.map((c) => (
                  <option key={c.timezone} value={c.timezone}>
                    {c.flag} {c.country} - {c.city} ({c.utc})
                  </option>
                ))}
              </select>
            </div>

            {/* Alarm Label */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Morning Rise & Radiant Energy"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Recurring Days */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Repeat Days
              </label>
              <div className="flex flex-wrap gap-2">
                {allDays.map(day => {
                  const isSelected = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound Notification & Media Library Sync */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span>Alarm Sound & Personal Media</span>
                </label>
                <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAudio ? 'Uploading...' : 'Sync Audio File'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <select
                value={soundId}
                onChange={(e) => {
                  const s = builtInSounds.find(b => b.id === e.target.value);
                  setSoundId(e.target.value);
                  if (s) setSoundName(s.name);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {builtInSounds.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                {customSoundUrl && (
                  <option value="custom_uploaded">🎵 Custom Synced: {soundName}</option>
                )}
              </select>
              {customSoundUrl && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Personal media track synced: {soundName}
                </p>
              )}
            </div>

            {/* Photo Customization Section */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>Alarm Screen Photo Customization</span>
                </label>
                <label className="cursor-pointer text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                {/* Photo Preview Thumbnail */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Custom Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Heart className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                {/* Name & Custom Photo URL */}
                <div className="sm:col-span-2 space-y-2">
                  <input
                    type="text"
                    value={lovedOneName}
                    onChange={(e) => setLovedOneName(e.target.value)}
                    placeholder="Person's Name (e.g. Sarah / My Love)"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Or paste photo image URL..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              {/* Custom Wake Message */}
              <div className="mt-3">
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Message to display on alarm screen (e.g. Rise and shine, my love!)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Voice Greeting & Dynamic Greeting Toggles */}
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={greetingEnabled}
                  onChange={(e) => setGreetingEnabled(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <span>Time Greeting ("Good morning/afternoon/evening")</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={speechGreeting}
                  onChange={(e) => setSpeechGreeting(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-slate-900 border-slate-700"
                />
                <span>Spoken Voice Greeting (Web Speech API)</span>
              </label>
            </div>

            {/* End-to-End Encrypted Personal Note */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Encrypted Vault Note (AES-256-GCM)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">E2EE Protected</span>
              </div>
              <textarea
                rows="2"
                value={secretNote}
                onChange={(e) => setSecretNote(e.target.value)}
                placeholder="Private personal goals or reminders only visible to you..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

          </div>

          {/* Sticky Footer Submit with Live Confirmation */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Alarm configured for:</span>
              <strong className="text-amber-300 font-mono font-bold text-sm bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                {parsed.hour12}:{String(parsed.minute).padStart(2, '0')} {parsed.period}
              </strong>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Save Alarm</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
