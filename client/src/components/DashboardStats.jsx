import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  TrendingUp, 
  Award, 
  Moon, 
  Sun, 
  Share2, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api.js';

export const DashboardStats = ({ onOpenShare }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setStats(res);
    } catch (err) {
      console.warn('Dashboard stats notice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-400">Loading historical metrics...</div>;
  }

  const weeklyData = stats?.weeklyData || [
    { day: 'Mon', wakeTime: '06:30', varianceMinutes: 0, consistencyScore: 98, sleepHours: 7.8 },
    { day: 'Tue', wakeTime: '06:32', varianceMinutes: 2, consistencyScore: 95, sleepHours: 7.5 },
    { day: 'Wed', wakeTime: '06:30', varianceMinutes: 0, consistencyScore: 99, sleepHours: 8.0 },
    { day: 'Thu', wakeTime: '06:35', varianceMinutes: 5, consistencyScore: 92, sleepHours: 7.2 },
    { day: 'Fri', wakeTime: '06:31', varianceMinutes: 1, consistencyScore: 96, sleepHours: 7.6 },
    { day: 'Sat', wakeTime: '08:00', varianceMinutes: 0, consistencyScore: 97, sleepHours: 8.4 },
    { day: 'Sun', wakeTime: '08:05', varianceMinutes: 5, consistencyScore: 94, sleepHours: 8.1 }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Circadian Mastery & Consistency
            </span>
            <span className="text-xs text-indigo-400 flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              Level 4: Master of Dawn
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Historical Usage & Engagement Stats
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Track your sleep cycles, wake-time adherence, and milestones. Small daily habits create monumental compound returns.
          </p>
        </div>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Streak Achievement</span>
        </button>
      </div>

      {/* METRIC HIGHLIGHT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Streak */}
        <div className="rounded-2xl glass-card border border-amber-500/20 p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Streak</span>
            <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">
            {stats?.streak || 7} <span className="text-base font-sans font-medium text-slate-300">Days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Best streak: <span className="text-white font-semibold">{stats?.bestStreak || 14} days</span>
          </p>
        </div>

        {/* Consistency */}
        <div className="rounded-2xl glass-card border border-indigo-500/20 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consistency</span>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400 font-mono">
            {stats?.consistencyOverall || 94}%
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Within 5 min of target wake time
          </p>
        </div>

        {/* Average Sleep */}
        <div className="rounded-2xl glass-card border border-purple-500/20 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Sleep</span>
            <Moon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 font-mono">
            {stats?.avgSleepHours || 7.6} <span className="text-base font-sans font-medium text-slate-300">Hrs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Target: 7.5 - 8.5 Hours
          </p>
        </div>

        {/* Total Wakes */}
        <div className="rounded-2xl glass-card border border-emerald-500/20 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Wakes</span>
            <Sun className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
            {stats?.totalWakes || 42}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Active alarms: <span className="text-white font-semibold">{stats?.activeAlarmsCount || 2}</span>
          </p>
        </div>

      </div>

      {/* 7-DAY CONSISTENCY VISUAL CHART */}
      <div className="rounded-3xl glass-card border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">7-Day Wake Consistency & Sleep Hours</h3>
            <p className="text-xs text-slate-400">Nightly duration and morning wake accuracy</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-indigo-500" /> Sleep Hours
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Accuracy Score
            </span>
          </div>
        </div>

        {/* Visual Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 border-b border-slate-800">
          {weeklyData.map((d, idx) => {
            const heightPercent = Math.min(100, (d.sleepHours / 9) * 100);
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 border border-slate-700 px-2 py-1 rounded mb-1 text-center whitespace-nowrap shadow-lg">
                  {d.wakeTime} ({d.sleepHours}h)
                </div>

                <div className="w-full max-w-[48px] bg-slate-900 rounded-t-xl overflow-hidden relative flex flex-col justify-end p-1">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <span className="text-xs font-semibold text-slate-400 mt-2">{d.day}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{d.consistencyScore}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* GAMIFICATION BADGES */}
      <div className="rounded-3xl glass-card border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Milestone Achievement Badges</h3>
              <p className="text-xs text-slate-400">Unlock trophies by building consistent rituals</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(stats?.badges || []).map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl p-4 border transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`p-2 rounded-xl text-base ${badge.unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  🏆
                </span>
                {badge.unlocked ? (
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    In Progress
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{badge.name}</h4>
              <p className="text-xs text-slate-400 mb-3">{badge.description}</p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${badge.unlocked ? 'bg-amber-400' : 'bg-indigo-500'}`}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
