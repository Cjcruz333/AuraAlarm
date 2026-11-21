import React, { useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';

const formatElapsed = milliseconds => {
  const centiseconds = Math.floor(milliseconds / 10) % 100;
  const totalSeconds = Math.floor(milliseconds / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':')
    + `.${String(centiseconds).padStart(2, '0')}`;
};

export const Stopwatch = () => {
  const { t } = useSettings();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState([]);
  const startedAtRef = useRef(0);
  const accumulatedMsRef = useRef(0);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = setInterval(() => {
      setElapsedMs(accumulatedMsRef.current + performance.now() - startedAtRef.current);
    }, 30);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = () => {
    startedAtRef.current = performance.now();
    setIsRunning(true);
  };

  const pause = () => {
    const elapsed = accumulatedMsRef.current + performance.now() - startedAtRef.current;
    accumulatedMsRef.current = elapsed;
    setElapsedMs(elapsed);
    setIsRunning(false);
  };

  const reset = () => {
    accumulatedMsRef.current = 0;
    startedAtRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
    setLaps([]);
  };

  const recordLap = () => {
    const elapsed = accumulatedMsRef.current + performance.now() - startedAtRef.current;
    const previousLapTime = laps[0]?.elapsedMs || 0;
    setElapsedMs(elapsed);
    setLaps(current => [{
      number: current.length + 1,
      elapsedMs: elapsed,
      splitMs: elapsed - previousLapTime
    }, ...current]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fadeIn">
      <header className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <Timer className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black text-white sm:text-3xl">{t('Stopwatch')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t(isRunning ? 'Running' : elapsedMs > 0 ? 'Paused' : 'Ready')}</p>
        <p className="mt-7 font-mono text-5xl font-extrabold tabular-nums tracking-tight text-white sm:text-7xl" aria-live="off">
          {formatElapsed(elapsedMs)}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {isRunning ? (
            <button
              type="button"
              onClick={pause}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400"
            >
              <Pause className="h-4 w-4" /> {t('Pause')}
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500"
            >
              <Play className="h-4 w-4 fill-current" /> {t('Start')}
            </button>
          )}
          <button
            type="button"
            onClick={recordLap}
            disabled={!isRunning}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Flag className="h-4 w-4" /> {t('Lap')}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={elapsedMs === 0 && !isRunning}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" /> {t('Reset')}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="mb-4 text-lg font-bold text-white">{t('Laps')}</h2>
        {laps.length === 0 ? (
          <p className="text-sm text-slate-400">{t('No laps recorded yet.')}</p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>{t('Lap')}</span><span>{t('Time')}</span><span>{t('Split')}</span>
            </div>
            {laps.map(lap => (
              <div key={lap.number} className="grid grid-cols-3 rounded-xl bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200">
                <span>#{lap.number}</span>
                <span className="font-mono tabular-nums">{formatElapsed(lap.elapsedMs)}</span>
                <span className="font-mono tabular-nums">{formatElapsed(lap.splitMs)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
