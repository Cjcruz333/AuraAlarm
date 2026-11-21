import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Dumbbell, 
  Droplets, 
  Apple, 
  Clock, 
  CheckCircle2, 
  Play, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api.js';
import confetti from 'canvas-confetti';

export const FitnessTracker = () => {
  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [nutrition, setNutrition] = useState(null);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');

  useEffect(() => {
    loadFitnessData();
  }, []);

  const loadFitnessData = async () => {
    const [plansResult, nutritionResult] = await Promise.allSettled([
      api.getFitnessPlans(),
      api.getNutrition()
    ]);

    if (plansResult.status === 'fulfilled') {
      setPlans(plansResult.value.plans || []);
      setPlansError('');
    } else {
      console.error('Fitness plans load error:', plansResult.reason);
      setPlansError('Workout plans could not be loaded. Please try again.');
    }
    setIsLoadingPlans(false);

    if (nutritionResult.status === 'fulfilled') {
      setNutrition(nutritionResult.value.nutrition || null);
    } else {
      console.warn('Nutrition data is unavailable:', nutritionResult.reason);
    }
  };

  const startWorkout = (plan) => {
    setActiveWorkout(plan);
    setCurrentExerciseIdx(0);
    setTimerSeconds(plan.exercises[0]?.durationSec || 60);
    setIsTimerRunning(true);
  };

  const handleNextExercise = () => {
    if (!activeWorkout) return;
    const nextIdx = currentExerciseIdx + 1;
    if (nextIdx < activeWorkout.exercises.length) {
      setCurrentExerciseIdx(nextIdx);
      setTimerSeconds(activeWorkout.exercises[nextIdx]?.durationSec || 60);
      setIsTimerRunning(true);
    } else {
      // Completed entire workout!
      setIsTimerRunning(false);
      completeWorkoutSession();
    }
  };

  const completeWorkoutSession = async () => {
    if (!activeWorkout) return;
    const completedWorkout = activeWorkout;
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      await api.completeWorkout({
        planId: completedWorkout.id,
        planTitle: completedWorkout.title,
        durationMinutes: parseInt(completedWorkout.duration) || 12,
        caloriesBurned: 110
      });
      alert(`🎉 Great work! You finished "${completedWorkout.title}" and your workout was saved.`);
      setActiveWorkout(null);
      loadFitnessData();
    } catch (err) {
      console.error('Complete workout error:', err);
      alert(`Workout complete! We couldn't save this session. Check your connection or sign in with an active subscription to save progress.`);
    } finally {
      setActiveWorkout(null);
    }
  };

  useEffect(() => {
    if (!isTimerRunning || !activeWorkout) return undefined;
    if (timerSeconds <= 0) {
      handleNextExercise();
      return undefined;
    }

    const timeout = setTimeout(() => setTimerSeconds(timerSeconds - 1), 1000);
    return () => clearTimeout(timeout);
  }, [isTimerRunning, timerSeconds, activeWorkout, currentExerciseIdx]);

  const handleWaterClick = async (change) => {
    try {
      const res = await api.updateWater(change);
      setNutrition(res.nutrition);
      if (change > 0 && res.nutrition.waterGlasses % 4 === 0) {
        confetti({ particleCount: 40, spread: 50 });
      }
    } catch (err) {
      console.error('Water update error:', err);
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) return;
    try {
      const res = await api.addMeal({
        name: newMealName,
        calories: Number(newMealCalories)
      });
      setNutrition(res.nutrition);
      setNewMealName('');
      setNewMealCalories('');
    } catch (err) {
      console.error('Add meal error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner: Fitness & Metabolic Sync */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Peak Morning Physiology
              </span>
              <span className="text-xs text-slate-400">Circadian Synchronized</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Personalized Workouts & Fuel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              A 15-minute, no-equipment full-body circuit is the best way to build a consistent morning habit at home. It wakes up stiff muscles, boosts circulation, and builds foundational strength without overwhelming your joints.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-3.5 rounded-2xl border border-slate-700/80">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Burn Target</span>
                <span className="text-lg font-bold text-white">550 kcal</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Hydration</span>
                <span className="text-lg font-bold text-white">
                  {nutrition?.waterGlasses || 3}/{nutrition?.waterTarget || 8} Glasses
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE WORKOUT PLAYER (If session in progress) */}
      {activeWorkout && (
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/60 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 mb-6">
            <div>
              <span className="text-xs uppercase font-semibold text-indigo-400">
                Active Workout Session
              </span>
              <h3 className="text-xl font-bold text-white">{activeWorkout.title}</h3>
            </div>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setActiveWorkout(null);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800"
            >
              Exit Routine
            </button>
          </div>

          {/* Current Exercise Card */}
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Exercise {currentExerciseIdx + 1} of {activeWorkout.exercises.length}
            </span>
            <h4 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {activeWorkout.exercises[currentExerciseIdx]?.name}
            </h4>
            <p className="text-sm text-indigo-300 font-medium mb-4">
              🎯 Target: {activeWorkout.exercises[currentExerciseIdx]?.reps}
            </p>

            {/* Countdown Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-pulse" />
              <div className="w-28 h-28 rounded-full bg-slate-900 flex flex-col items-center justify-center border-2 border-indigo-500 shadow-xl">
                <span className="text-3xl font-mono font-extrabold text-white">{timerSeconds}s</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
              </div>
            </div>

            {/* Coach Tip */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 w-full mb-6 text-xs text-slate-300">
              💡 <span className="font-semibold text-white">Form Tip:</span> {activeWorkout.exercises[currentExerciseIdx]?.tip}
            </div>

            {/* Player Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
              >
                {isTimerRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleNextExercise}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <span>{currentExerciseIdx + 1 === activeWorkout.exercises.length ? 'Finish Routine' : 'Next Exercise'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKOUT PLANS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-indigo-400" />
            <span>Circadian Workout Library</span>
          </h3>
          <span className="text-xs text-slate-400">Scientifically calibrated for wake & sleep</span>
        </div>

        {plansError ? (
          <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
            <p>{plansError}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoadingPlans(true);
                loadFitnessData();
              }}
              className="mt-3 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-rose-500/30"
            >
              Try again
            </button>
          </div>
        ) : isLoadingPlans ? (
          <p className="text-sm text-slate-400">Loading workout plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-slate-400">No workout plans are available right now.</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl glass-card border border-slate-800 p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {plan.duration}
                  </span>
                  <span className="text-xs font-medium text-slate-400">{plan.level}</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">{plan.title}</h4>
                <p className="text-xs text-slate-400 mb-4">{plan.focus}</p>

                {/* Exercises list summary */}
                <div className="space-y-1.5 mb-4">
                  {plan.exercises.map((ex, i) => (
                    <div key={i} className="flex items-center text-xs text-slate-300 gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="truncate">{ex.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => startWorkout(plan)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Routine</span>
              </button>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* NUTRITION & HYDRATION DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hydration Tracker */}
        <div className="rounded-3xl glass-card border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Daily Hydration Milestones</h4>
                <p className="text-xs text-slate-400">Target: 8 Glasses (~2,000ml)</p>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-cyan-400">
              {Math.round(((nutrition?.waterGlasses || 0) / (nutrition?.waterTarget || 8)) * 100)}%
            </span>
          </div>

          {/* Interactive Glasses Bar */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const isFilled = idx < (nutrition?.waterGlasses || 0);
              return (
                <button
                  key={idx}
                  onClick={() => handleWaterClick(isFilled ? -1 : 1)}
                  className={`h-14 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isFilled
                      ? 'bg-gradient-to-t from-cyan-600 to-blue-500 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-600 hover:border-slate-700'
                  }`}
                  title={`Glass ${idx + 1} (250ml)`}
                >
                  <Droplets className={`w-4 h-4 ${isFilled ? 'fill-white' : ''}`} />
                  <span className="text-[10px] font-bold mt-1">{idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => handleWaterClick(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Drink 1 Glass (+250ml)</span>
            </button>
            <span className="text-xs text-slate-400">Reminders alert at 10 AM & 2 PM</span>
          </div>
        </div>

        {/* Meal & Macro Tracker */}
        <div className="rounded-3xl glass-card border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Metabolic Fuel Logging</h4>
                <p className="text-xs text-slate-400">
                  Total Today: <span className="text-slate-200 font-bold">{nutrition?.calories || 0} kcal</span>
                </p>
              </div>
            </div>
          </div>

          {/* Logged Meals List */}
          <div className="space-y-2 mb-4 max-h-32 overflow-y-auto pr-1">
            {(nutrition?.meals || []).map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-200 font-medium truncate">{m.name}</span>
                <span className="text-slate-400 font-mono">{m.calories} kcal • {m.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Add Meal Form */}
          <form onSubmit={handleAddMeal} className="flex gap-2">
            <input
              type="text"
              value={newMealName}
              onChange={(e) => setNewMealName(e.target.value)}
              placeholder="e.g. Avocado Toast with Eggs"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              value={newMealCalories}
              onChange={(e) => setNewMealCalories(e.target.value)}
              placeholder="kcal"
              className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Log
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
