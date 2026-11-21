import React, { useState } from 'react';
import { 
  CloudRain, 
  Waves, 
  Brain, 
  Wind, 
  Flame, 
  Sparkles, 
  Play, 
  Square, 
  Volume2, 
  Clock, 
  Moon, 
  CheckCircle2,
  Crown,
  Lock
} from 'lucide-react';
import { useAlarm } from '../context/AlarmContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export const SleepSoundPlayer = ({ onOpenUpgrade }) => {
  const { user } = useAuth();
  const { 
    sleepTrack, 
    sleepTimerMinutes, 
    sleepRemainingSeconds, 
    sleepVolume, 
    startSleepSound, 
    stopSleepSound, 
    adjustSleepVolume 
  } = useAlarm();

  const [selectedDuration, setSelectedDuration] = useState(45);
  const [breathingPhase, setBreathingPhase] = useState('Inhale (4s)');

  const sleepSounds = [
    {
      id: 'rain_window',
      title: 'Rain on Skylight',
      category: 'Nature',
      desc: 'Gentle raindrops falling rhythmically on glass',
      icon: CloudRain,
      color: 'from-blue-600/30 to-indigo-600/30 border-blue-500/30 text-blue-400'
    },
    {
      id: 'ocean_tide',
      title: 'Pacific Deep Tide',
      category: 'Water',
      desc: 'Slow rhythmic waves washing ashore under starlight',
      icon: Waves,
      color: 'from-cyan-600/30 to-teal-600/30 border-cyan-500/30 text-cyan-400'
    },
    {
      id: 'binaural_theta',
      title: 'Theta Wave (6Hz)',
      category: 'Binaural Beats',
      desc: 'Pure harmonic frequencies tuned for REM sleep induction',
      icon: Brain,
      color: 'from-purple-600/30 to-pink-600/30 border-purple-500/30 text-purple-400'
    },
    {
      id: 'deep_white_noise',
      title: 'Aura Brown Noise',
      category: 'Sound Masking',
      desc: 'Warm spectral acoustic blanket masking urban sounds',
      icon: Wind,
      color: 'from-amber-600/30 to-orange-600/30 border-amber-500/30 text-amber-400'
    },
    {
      id: 'campfire_ember',
      title: 'Twilight Campfire',
      category: 'Warmth',
      desc: 'Soothing wood crackle and gentle ambient pine breeze',
      icon: Flame,
      color: 'from-rose-600/30 to-red-600/30 border-rose-500/30 text-rose-400'
    },
    {
      id: 'zen_bamboo',
      title: 'Zen Sanctuary Stream',
      category: 'Meditative',
      desc: 'Natural trickling spring water with serene undertones',
      icon: Sparkles,
      color: 'from-emerald-600/30 to-green-600/30 border-emerald-500/30 text-emerald-400'
    },
    {
      id: 'astral_solfeggio',
      title: '528Hz Miracle Solfeggio',
      category: 'VIP Healing',
      desc: 'Harmonic restorative tone for deep cellular calm & anxiety release',
      icon: Crown,
      color: 'from-amber-600/30 to-yellow-600/30 border-amber-500/40 text-amber-400',
      isVip: true
    },
    {
      id: 'lucid_delta',
      title: '2.5Hz Pineal Delta Dream',
      category: 'VIP Binaural',
      desc: 'Sub-delta synchronized waves for dream recall & REM sleep',
      icon: Sparkles,
      color: 'from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-400',
      isVip: true
    },
    {
      id: 'nebula_celestial',
      title: 'Celestial Nebula Drift',
      category: 'VIP Cosmic',
      desc: 'Deep atmospheric harmonic resonance that quiets racing night thoughts',
      icon: Moon,
      color: 'from-fuchsia-600/30 to-pink-600/30 border-fuchsia-500/40 text-fuchsia-400',
      isVip: true
    }
  ];

  const timerOptions = [15, 30, 45, 60, 90];

  const formatRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectSound = (sound) => {
    if (sound.isVip && !user?.isPro) {
      if (onOpenUpgrade) {
        onOpenUpgrade();
      }
      return;
    }

    if (sleepTrack === sound.id) {
      stopSleepSound();
    } else {
      startSleepSound(sound.id, selectedDuration);
      // Log session
      api.logSleepSession({
        soundId: sound.id,
        soundTitle: sound.title,
        durationMinutes: selectedDuration
      }).catch(err => console.warn('Sleep log notice:', err));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner / Active Playing Station */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-indigo-500/20 p-6 sm:p-8">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              sleepTrack ? 'bg-indigo-600 shadow-lg shadow-indigo-600/40 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              <Moon className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Fall Asleep Sound Engine
                </span>
                {sleepTrack && (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {sleepTrack ? sleepSounds.find(s => s.id === sleepTrack)?.title : 'Select a Sleep Soundscape'}
              </h2>
              <p className="text-xs text-slate-400">
                Scientifically tuned acoustic frequencies for deep delta & theta sleep cycles.
              </p>
            </div>
          </div>

          {/* Active Sound Timer & Controls */}
          {sleepTrack ? (
            <div className="flex items-center gap-4 bg-slate-900/80 px-6 py-3.5 rounded-2xl border border-slate-700/80">
              <div className="text-right">
                <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Sleep Timer
                </span>
                <span className="text-2xl font-bold font-mono text-indigo-300">
                  {formatRemaining(sleepRemainingSeconds)}
                </span>
              </div>
              <button
                onClick={stopSleepSound}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-2">Timer:</span>
              {timerOptions.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedDuration(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedDuration === m
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume slider */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-sm">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sleepVolume}
              onChange={(e) => adjustSleepVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 w-8">
              {Math.round(sleepVolume * 100)}%
            </span>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Auto-fades gently to avoid sleep disruption.
          </div>
        </div>

      </div>

      {/* Grid of Soundscapes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sleepSounds.map((sound) => {
          const Icon = sound.icon;
          const isPlaying = sleepTrack === sound.id;

          return (
            <div
              key={sound.id}
              onClick={() => handleSelectSound(sound)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative group overflow-hidden ${
                isPlaying
                  ? 'glass-card border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/50'
                  : sound.isVip && !user?.isPro
                  ? 'bg-gradient-to-br from-amber-500/5 via-slate-900/60 to-slate-950 border-amber-500/30 hover:border-amber-400'
                  : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {sound.isVip && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg shadow flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 fill-slate-950" />
                  <span>VIP PRO</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-3">
                <div className={`p-3 rounded-xl border bg-gradient-to-br ${sound.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-md bg-slate-800">
                    {sound.category}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isPlaying 
                      ? 'bg-indigo-600 text-white' 
                      : sound.isVip && !user?.isPro
                      ? 'bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}>
                    {isPlaying ? (
                      <Square className="w-3.5 h-3.5 fill-white" />
                    ) : sound.isVip && !user?.isPro ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1">
                {sound.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                {sound.desc}
              </p>

              {/* Sound frequency badge */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Natural Synthesized Audio</span>
                {isPlaying && (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Playing
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4-7-8 Breathing & Relaxation Visualizer */}
      <div className="rounded-3xl glass-card border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 block">
            Parasympathetic Reset
          </span>
          <h3 className="text-xl font-bold text-white mb-2">
            Dr. Weil's 4-7-8 Sleep Breathing Method
          </h3>
          <p className="text-xs text-slate-300 max-w-md">
            Inhale quietly through the nose for 4 seconds, hold your breath for 7 seconds, and exhale completely through the mouth making a whoosh sound for 8 seconds.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-center p-2 shadow-xl shadow-indigo-600/30 text-white text-[11px] font-bold">
              Relax & Inhale
            </div>
          </div>
          <span className="text-[11px] text-indigo-300 font-semibold">Sync breathing to natural tempo</span>
        </div>
      </div>

    </div>
  );
};
