import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware, subscriberMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Curated Fitness Programs
const WORKOUT_PLANS = [
  {
    id: 'plan_morning_full_body_15',
    title: '15-Minute No-Equipment Full-Body Workout',
    duration: '15 Mins',
    level: 'Beginner / All Levels',
    focus: 'A balanced home workout with low-impact options for every movement.',
    exercises: [
      { name: 'March in Place and Arm Swings', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Start gently and use this time to warm up.' },
      { name: 'Jumping Jacks or Step Jacks', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'For a low-impact option, step one foot out at a time.' },
      { name: 'Push-Ups or Knee Push-Ups', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Use a wall or sturdy counter for an easier push-up.' },
      { name: 'Bodyweight Squats', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Sit back to a comfortable depth and keep your knees aligned with your toes.' },
      { name: 'Reverse Lunges', durationSec: 90, reps: '30 seconds alternating, 15 seconds rest; repeat twice', tip: 'Hold a chair for balance or step back without lowering deeply.' },
      { name: 'Mountain Climbers', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Slow the pace or do standing wall mountain climbers.' },
      { name: 'Glute Bridges', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Lift your hips smoothly while keeping your lower back comfortable.' },
      { name: 'Plank Shoulder Taps', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'Do the taps from your knees or against a wall if needed.' },
      { name: 'High Knees or Brisk March', durationSec: 90, reps: '30 seconds moving, 15 seconds rest; repeat twice', tip: 'March instead of jogging to keep it low impact.' },
      { name: 'Standing Full-Body Stretch', durationSec: 90, reps: 'Gentle stretches and steady breathing', tip: 'Move slowly and stop if a stretch feels painful.' }
    ]
  },
  {
    id: 'plan_full_body_30',
    title: '30-Minute Full-Body Workout',
    duration: '30 Mins',
    level: 'Beginner / Intermediate',
    focus: 'A longer no-equipment routine with rest built into each exercise.',
    exercises: [
      { name: 'March in Place and Arm Swings', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Use an easy pace to warm up.' },
      { name: 'Jumping Jacks or Step Jacks', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Step out one foot at a time for a low-impact option.' },
      { name: 'Push-Ups or Knee Push-Ups', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Use a wall or sturdy counter for an easier push-up.' },
      { name: 'Bodyweight Squats', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Choose a comfortable depth and keep your knees aligned with your toes.' },
      { name: 'Reverse Lunges', durationSec: 180, reps: '40 seconds alternating, 20 seconds rest; repeat three times', tip: 'Hold a chair for balance or use a shorter step.' },
      { name: 'Mountain Climbers', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Slow down or use standing wall mountain climbers.' },
      { name: 'Glute Bridges', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Lift smoothly without arching your lower back.' },
      { name: 'Plank Shoulder Taps', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'Do the taps from your knees or against a wall.' },
      { name: 'High Knees or Brisk March', durationSec: 180, reps: '40 seconds moving, 20 seconds rest; repeat three times', tip: 'March rather than jog to lower the impact.' },
      { name: 'Standing Full-Body Stretch', durationSec: 180, reps: 'Gentle stretches and steady breathing', tip: 'Stretch gently and stop if you feel pain.' }
    ]
  },
  {
    id: 'plan_morning_mobility',
    title: 'Sunrise Energy & Joint Mobility',
    duration: '10 Mins',
    level: 'All Levels',
    focus: 'Wake Up Body, Reduce Stiffness, Boost Circulation',
    exercises: [
      { name: 'Cat-Cow Spinal Activation', durationSec: 120, reps: 'Move gently for 2 minutes', tip: 'Inhale as your belly dips and exhale as your spine arches.' },
      { name: 'World\'s Greatest Stretch', durationSec: 120, reps: 'Alternate sides for 2 minutes', tip: 'Use a comfortable lunge depth and rotate gently.' },
      { name: 'Dynamic Standing Arm Sweeps', durationSec: 120, reps: 'Move gently for 2 minutes', tip: 'Open your chest without forcing your shoulders.' },
      { name: 'Bodyweight Air Squats', durationSec: 120, reps: 'Move gently for 2 minutes', tip: 'Keep your chest comfortable and use a range that feels good.' },
      { name: 'Gentle Child\'s Pose to Cobra', durationSec: 120, reps: 'Move gently for 2 minutes', tip: 'Move between poses slowly and stop if uncomfortable.' }
    ]
  },
  {
    id: 'plan_hiit_ignition',
    title: '5-Minute Metabolic Spark (HIIT)',
    duration: '5 Mins',
    level: 'Intermediate',
    focus: 'Cardio Boost, Fat Oxidation & Dopamine Release',
    exercises: [
      { name: 'Jumping Jacks / Step Jacks', durationSec: 60, reps: '30 seconds moving, 30 seconds rest', tip: 'Land softly or step side to side.' },
      { name: 'High Knees or March in Place', durationSec: 60, reps: '30 seconds moving, 30 seconds rest', tip: 'Pump opposite arms or keep it to a brisk march.' },
      { name: 'Plank Hold with Shoulder Taps', durationSec: 60, reps: '30 seconds moving, 30 seconds rest', tip: 'Use your knees and keep your hips steady.' },
      { name: 'Reverse Lunges with Reach', durationSec: 60, reps: '30 seconds alternating, 30 seconds rest', tip: 'Alternate sides and keep a comfortable stance.' },
      { name: 'Mountain Climbers', durationSec: 60, reps: '30 seconds moving, 30 seconds rest', tip: 'Move slowly or use the standing wall variation.' }
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
      { name: 'Supine Spinal Twist', durationSec: 180, reps: '90 seconds each side', tip: 'Breathe slowly and keep your shoulders relaxed.' },
      { name: 'Reclining Butterfly Pose', durationSec: 180, reps: 'Hold for 3 minutes', tip: 'Relax your hips and inner thighs without forcing the stretch.' },
      { name: '4-7-8 Deep Box Breathing', durationSec: 180, reps: 'Hold 3m', tip: 'Inhale 4s, hold 7s, exhale slowly 8s.' }
    ]
  }
];

// GET /fitness/plans - List workout plans
router.get('/plans', (req, res) => {
  res.json({ plans: WORKOUT_PLANS });
});

router.use(subscriberMiddleware);

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
