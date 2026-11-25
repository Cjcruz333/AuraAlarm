import React from 'react';
import { Volume2, Heart, Play, Edit3, Trash2, Globe, Clock, Sun, Moon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { notificationService } from '../services/notificationService.js';

export const AlarmCard = ({ alarm, onToggle, onEdit, onDelete, onTest, onToggleAmPm }) => {
  const { t, formatTime } = useSettings();
  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const hourNumber = parseInt(String(alarm.time || '00:00').split(':')[0], 10) || 0;
  const isPM = hourNumber >= 12;

  // Compute friendly countdown to next trigger
  const countdownText = (() => {
    if (!alarm.active) return t('Alarm is disabled');
    const nextDate = notificationService.getNextTriggerDate(alarm);
    if (!nextDate) return t('No scheduled days');
    const diffMs = nextDate.getTime() - Date.now();
    if (diffMs <= 0) return t('Rings in less than a minute');
    const totalMinutes = Math.round(diffMs / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const isToday = nextDate.getDate() === new Date().getDate();

    if (hours === 0) {
      return `⏰ Rings ${isToday ? 'today' : 'tomorrow'} in ${mins}m`;
    }
    return `⏰ Rings ${isToday ? 'today' : 'tomorrow'} in ${hours}h ${mins}m`;
  })();

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
      alarm.active 
        ? 'glass-card border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
        : 'bg-slate-900/40 border-slate-800/60 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-4">
        
        {/* Left: Time & Information */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              {formatTime(alarm.time)}
            </span>

            {/* Quick 1-Click AM / PM Switcher Button */}
            {onToggleAmPm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAmPm(alarm.id);
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all border shadow-sm ${
                  isPM
                    ? 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                }`}
                title={`Currently ${isPM ? 'PM (Afternoon/Night)' : 'AM (Early Morning)'}. Click to switch to ${isPM ? 'AM' : 'PM'}`}
              >
                {isPM ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-amber-400" />}
                <span>{isPM ? 'PM' : 'AM'}</span>
                <span className="text-[10px] opacity-75 font-normal ml-0.5">⇄ Switch</span>
              </button>
            )}
          </div>

          {/* Next Ring Countdown Badge */}
          <p className="text-xs font-semibold text-amber-300/90 mb-2 flex items-center gap-1.5">
            <span>{countdownText}</span>
          </p>

          <h3 className="text-base font-semibold text-slate-200 truncate mb-2">
            {alarm.label || t('Alarm')}
          </h3>

          {/* Days tags */}
          <div className="flex flex-wrap gap-1 mb-3.5">
            {allDays.map(day => {
              const isSelected = (alarm.days || []).includes(day);
              return (
                <span
                  key={day}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-800/40 text-slate-500'
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>

          {/* Meta badges: Sound & Loved One */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[140px]">{alarm.soundName || t('Gentle Dawn Chimes')}</span>
            </span>

            {alarm.timezone && alarm.timezone !== 'Local' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate max-w-[140px]">{alarm.timezone}</span>
              </span>
            )}

            {alarm.photoUrl && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300">
                <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                <span>{alarm.lovedOneName || t('Custom Photo')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Toggle Switch & Actions */}
        <div className="flex flex-col items-end gap-3">
          
          {/* Active Toggle Switch */}
          <button
            onClick={() => onToggle(alarm.id)}
            className={`w-13 h-7 flex items-center rounded-full p-1 transition-colors duration-200 ${
              alarm.active ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
            title={t(alarm.active ? 'Disable alarm' : 'Enable alarm')}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${
                alarm.active ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-2">
            {/* Test Alarm Preview Button */}
            <button
              onClick={() => onTest(alarm)}
              className="p-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 transition-colors"
              title={t('Test Alarm Screen Preview')}
            >
              <Play className="w-3.5 h-3.5" />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(alarm)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={t('Edit Alarm')}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(alarm.id)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
              title={t('Delete Alarm')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
