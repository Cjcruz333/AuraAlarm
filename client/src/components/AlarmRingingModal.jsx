import React, { useEffect, useState } from 'react';
import { Volume2, Moon, Sun, Sunrise, Heart, BellOff, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAlarm } from '../context/AlarmContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { speechService } from '../services/speechService.js';
import { api } from '../services/api.js';

export const AlarmRingingModal = () => {
  const { ringingAlarm, snoozeAlarm, dismissAlarm } = useAlarm();
  const { user } = useAuth();
  const { t, formatTime, snoozeDurationMinutes } = useSettings();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (ringingAlarm) {
      const timeGreeting = speechService.getTimeBasedGreeting();
      setGreeting(timeGreeting);
    }
  }, [ringingAlarm]);

  if (!ringingAlarm) return null;

  // Priority: alarm specific photo > user loved one photo > default serene portrait
  const displayPhoto = api.resolveAssetUrl(ringingAlarm.photoUrl || 
    user?.lovedOne?.photoUrl || 
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80');

  const lovedOneName = ringingAlarm.lovedOneName || user?.lovedOne?.name || 'Someone Special';
  const customMessage = ringingAlarm.customMessage || user?.lovedOne?.message || 'Rise and shine! Today holds limitless possibilities.';

  const handleSpeakAgain = () => {
    speechService.speakGreeting(user?.name || '', lovedOneName, customMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      {/* Dynamic ambient pulsing aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-violet-500/15 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative w-full max-w-md glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center">
        
        {/* Dynamic Time Greeting Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-sm font-semibold mb-6 animate-bounce">
          {greeting.includes('morning') ? (
            <Sunrise className="w-4 h-4 text-amber-400" />
          ) : greeting.includes('afternoon') ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
          <span>{greeting}, {user?.name?.split(' ')[0] || 'Champion'}!</span>
        </div>

        {/* Current Alarm Time Display */}
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-2 font-mono">
          {formatTime(ringingAlarm.time)}
        </h1>
        <p className="text-sm font-medium text-slate-300 mb-6 flex items-center gap-1.5 justify-center">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>{ringingAlarm.label || 'Scheduled Wake Call'}</span>
        </p>

        {/* Loved One Photo Frame */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-purple-500 rounded-3xl blur-md opacity-75 animate-pulse" />
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900">
            <img
              src={displayPhoto}
              alt={lovedOneName}
              className="w-full h-full object-cover object-center transform transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-left">
              <span className="text-xs font-semibold text-pink-300 flex items-center gap-1">
                <Heart className="w-3 h-3 fill-pink-400 text-pink-400" />
                {lovedOneName}
              </span>
            </div>
          </div>
        </div>

        {/* Loved One Personalized Message */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 w-full mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
            Morning Wish from {lovedOneName}
          </p>
          <p className="text-sm sm:text-base text-slate-200 italic font-medium">
            "{customMessage}"
          </p>
        </div>

        {/* Replay Voice Greeting Button */}
        <button
          onClick={handleSpeakAgain}
          className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 mb-6 transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Replay Spoken Greeting</span>
        </button>

        {/* Action Controls: Snooze & Dismiss */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          <button
            onClick={snoozeAlarm}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-semibold border border-slate-700 transition duration-200 active:scale-95 shadow-lg"
          >
            <Moon className="w-4 h-4 text-slate-400" />
            <span>{t('Snooze (+{{minutes}}m)', { minutes: snoozeDurationMinutes })}</span>
          </button>

          <button
            onClick={dismissAlarm}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition duration-200 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Dismiss & Rise</span>
          </button>
        </div>

        {/* Peace of Mind notification note */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dismissing logs wake time & safely notifies {lovedOneName}</span>
        </div>

      </div>
    </div>
  );
};
