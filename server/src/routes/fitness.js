import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Curated Fitness Programs
const WORKOUT_PLANS = [
  {
    id: 'plan_morning_mobility',
    title: 'Sunrise Energy & Joint Mobility',
    duration: '10 Mins',
    level: 'All Levels',
    focus: 'Wake Up Body, Reduce Stiffness, Boost Circulation',
    exercises: [
      { name: 'Cat-Cow Spinal Activation', durationSec: 60, reps: '10 cycles', tip: 'Inhale deeply as belly dips, exhale as spine arches.' },
      { name: 'World\'s Greatest Stretch', durationSec: 90, reps: '5 per side', tip: 'Step into deep lunge, rotate chest towards sky.' },
      { name: 'Dynamic Standing Arm Sweeps', durationSec: 60, reps: '15 reps', tip: 'Open chest, expand ribcage to oxygenate blood.' },
      { name: 'Bodyweight Air Squats', durationSec: 90, reps: '15 reps', tip: 'Keep chest proud and drive through heels.' },
      { name: 'Gentle Child\'s Pose to Cobra', durationSec: 90, reps: '6 cycles', tip: 'Release lower back and wake spine.' }
    ]
  },
  {
    id: 'plan_hiit_ignition',
    title: 'Metabolic Dawn Spark (HIIT)',
    duration: '15 Mins',
    level: 'Intermediate',
    focus: 'Cardio Boost, Fat Oxidation & Dopamine Release',
    exercises: [
      { name: 'Jumping Jacks / Step Jacks', durationSec: 45, reps: '45s Work', tip: 'Land softly on balls of feet.' },
      { name: 'High Knees or March in Place', durationSec: 45, reps: '45s Work', tip: 'Pump opposite arms in rhythm.' },
      { name: 'Plank Hold with Shoulder Taps', durationSec: 45, reps: '45s Work', tip: 'Keep hips completely stable.' },
      { name: 'Reverse Lunges with Reach', durationSec: 45, reps: '45s Work', tip: 'Alternating sides, maintain tall posture.' },
      { name: 'Mountain Climbers', durationSec: 45, reps: '45s Work', tip: 'Drive knees rhythmically toward chest.' }
    ]
  },
  {
    id: 'plan_evening_decompression',
    title: 'Twilight Restorative Decompression',
    duration: '12 Mins',
    level: 'Beginner / Relaxing',
    focus: 'Parasympathetic Activation & Deep Sleep Prep',
    exercises: [
      { name: 'Legs Up the Wall (Viparita Karani)', durationSec: 180, reps: 'Hold 3m', tip: 'Drain lymphatic fluid, slow heart rate.' },
      { name: 'Supine Spinal Twist', durationSec: 120, reps: '1m each side', tip: 'Breathe into diaphragm as shoulders stay pinned.' },
      { name: 'Reclining Butterfly Pose', durationSec: 120, reps: 'Hold 2m', tip: 'Relax hips and inner thighs.' },
      { name: '4-7-8 Deep Box Breathing', durationSec: 180, reps: 'Hold 3m', tip: 'Inhale 4s, hold 7s, exhale slowly 8s.' }
    ]
  }
];

// GET /fitness/plans - List workout plans
router.get('/plans', (req, res) => {
  res.json({ plans: WORKOUT_PLANS });
});

// GET /fitness/logs - User workout history
router.get('/logs', authMiddleware, (req, res) => {
  try {
    const logs = db.find('fitnessLogs', l => l.userId === req.user.id);
    res.json({ logs });
  } catch (err) {
    console.error('Fetch fitness logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve fitness logs' });
  }
});

// POST /fitness/complete - Mark workout session completed
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const { planId, planTitle, durationMinutes, caloriesBurned } = req.body;
    const log = {
      id: uuidv4(),
      userId: req.user.id,
      planId: planId || 'plan_morning_mobility',
      planTitle: planTitle || 'Sunrise Energy & Joint Mobility',
      durationMinutes: durationMinutes || 10,
      caloriesBurned: caloriesBurned || 65,
      date: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString()
    };

    await db.insert('fitnessLogs', log);
    res.status(201).json({ log, message: 'Workout completed! Milestone reached.' });
  } catch (err) {
    console.error('Record workout error:', err);
    res.status(500).json({ error: 'Failed to record workout' });
  }
});

// GET /fitness/nutrition - Get today's nutrition & water log
router.get('/nutrition', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let log = db.findOne('nutritionLogs', n => n.userId === req.user.id && n.date === today);
    if (!log) {
      log = {
        id: uuidv4(),
        userId: req.user.id,
        date: today,
        waterGlasses: 3,
        waterTarget: 8,
        calories: 1250,
        calorieTarget: 2200,
        proteinGrams: 75,
        carbsGrams: 140,
        fatGrams: 45,
        meals: [
          { name: 'Hydrating Morning Green Shake', calories: 280, time: '07:15 AM' },
          { name: 'Oatmeal with Blueberries & Chia Seeds', calories: 420, time: '08:30 AM' }
        ]
      };
      await db.insert('nutritionLogs', log);
    }
    res.json({ nutrition: log });
  } catch (err) {
    console.error('Fetch nutrition error:', err);
    res.status(500).json({ error: 'Failed to retrieve nutrition' });
  }
});

// POST /fitness/nutrition/water - Increment or set water intake
router.post('/nutrition/water', authMiddleware, async (req, res) => {
  try {
    const { change, target } = req.body;
    const today = new Date().toISOString().split('T')[0];
    let log = db.findOne('nutritionLogs', n => n.userId === req.user.id && n.date === today);

    if (!log) {
      log = await db.insert('nutritionLogs', {
        id: uuidv4(),
        userId: req.user.id,
        date: today,
        waterGlasses: Math.max(0, change || 1),
        waterTarget: target || 8,
        calories: 0,
        calorieTarget: 2200,
        meals: []
      });
    } else {
      const newWater = Math.max(0, (log.waterGlasses || 0) + (change || 1));
      log = await db.update('nutritionLogs', n => n.id === log.id, {
        waterGlasses: newWater,
        waterTarget: target || log.waterTarget || 8
      });
    }

    res.json({ nutrition: log, message: 'Hydration logged!' });
  } catch (err) {
    console.error('Update water error:', err);
    res.status(500).json({ error: 'Failed to update water' });
  }
});

// POST /fitness/nutrition/meal - Add a meal entry
router.post('/nutrition/meal', authMiddleware, async (req, res) => {
  try {
    const { name, calories, time } = req.body;
    const today = new Date().toISOString().split('T')[0];
    let log = db.findOne('nutritionLogs', n => n.userId === req.user.id && n.date === today);

    const meal = {
      name: name || 'Healthy Snack',
      calories: Number(calories) || 200,
      time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (!log) {
      log = await db.insert('nutritionLogs', {
        id: uuidv4(),
        userId: req.user.id,
        date: today,
        waterGlasses: 2,
        waterTarget: 8,
        calories: meal.calories,
        calorieTarget: 2200,
        meals: [meal]
      });
    } else {
      const meals = [...(log.meals || []), meal];
      const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      log = await db.update('nutritionLogs', n => n.id === log.id, {
        meals,
        calories: totalCalories
      });
    }

    res.status(201).json({ nutrition: log, message: 'Meal logged successfully' });
  } catch (err) {
    console.error('Log meal error:', err);
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

export default router;
