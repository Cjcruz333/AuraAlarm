import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Curated list of ambient sleep aid profiles
const SLEEP_SOUND_PROFILES = [
  {
    id: 'rain_window',
    title: 'Rain on Skylight',
    category: 'Nature',
    description: 'Gentle raindrops falling rhythmically on a glass window',
    icon: 'CloudRain',
    frequencyHint: 'pink_noise',
    defaultDurationMinutes: 45
  },
  {
    id: 'ocean_tide',
    title: 'Pacific Deep Tide',
    category: 'Water',
    description: 'Slow rhythmic waves washing ashore under starlight',
    icon: 'Waves',
    frequencyHint: 'low_rumble',
    defaultDurationMinutes: 60
  },
  {
    id: 'binaural_theta',
    title: 'Theta Wave Restoration (6Hz)',
    category: 'Binaural',
    description: 'Pure synchronized frequencies tuned for deep REM sleep recovery',
    icon: 'Brain',
    frequencyHint: 'sine_binaural',
    defaultDurationMinutes: 60
  },
  {
    id: 'deep_white_noise',
    title: 'Aura Brown & White Blend',
    category: 'Acoustic',
    description: 'Continuous spectral noise masking urban disruptions',
    icon: 'Wind',
    frequencyHint: 'brown_noise',
    defaultDurationMinutes: 30
  },
  {
    id: 'campfire_ember',
    title: 'Twilight Campfire',
    category: 'Warmth',
    description: 'Soothing wood crackle and gentle ambient forest breeze',
    icon: 'Flame',
    frequencyHint: 'crackle',
    defaultDurationMinutes: 45
  },
  {
    id: 'zen_bamboo',
    title: 'Zen Sanctuary Stream',
    category: 'Meditative',
    description: 'Trickling natural spring water with soft chime undertones',
    icon: 'Sparkles',
    frequencyHint: 'harmonic_stream',
    defaultDurationMinutes: 60
  },
  {
    id: 'astral_solfeggio',
    title: '528Hz Miracle Solfeggio',
    category: 'VIP Healing',
    description: 'Ancient harmonic frequency tuned for cellular rejuvenation and anxiety relief',
    icon: 'Crown',
    frequencyHint: 'solfeggio_528',
    defaultDurationMinutes: 60,
    isVip: true
  },
  {
    id: 'lucid_delta',
    title: '2.5Hz Pineal Delta Dream',
    category: 'VIP Binaural',
    description: 'Deep sub-delta synchronized waves for vivid restorative REM sleep',
    icon: 'Sparkles',
    frequencyHint: 'binaural_delta',
    defaultDurationMinutes: 60,
    isVip: true
  },
  {
    id: 'nebula_celestial',
    title: 'Celestial Nebula Drift',
    category: 'VIP Cosmic',
    description: 'Atmospheric cosmic choir resonance that quietens racing night thoughts',
    icon: 'Moon',
    frequencyHint: 'celestial_drone',
    defaultDurationMinutes: 90,
    isVip: true
  }
];

// GET /sleep/sounds and /sleep/catalog
router.get(['/sounds', '/catalog'], (req, res) => {
  res.json({ sounds: SLEEP_SOUND_PROFILES });
});

// GET /sleep/history - Sleep logs for active user
router.get('/history', authMiddleware, (req, res) => {
  try {
    const sessions = db.find('sleepSessions', s => s.userId === req.user.id);
    res.json({ sessions });
  } catch (err) {
    console.error('Fetch sleep history error:', err);
    res.status(500).json({ error: 'Failed to retrieve sleep history' });
  }
});

// POST /sleep/session - Log a completed sleep session
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const { soundId, soundTitle, durationMinutes, qualityRating, notes } = req.body;
    const session = {
      id: uuidv4(),
      userId: req.user.id,
      soundId: soundId || 'rain_window',
      soundTitle: soundTitle || 'Rain on Skylight',
      durationMinutes: durationMinutes || 45,
      qualityRating: qualityRating || 5,
      notes: notes || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    await db.insert('sleepSessions', session);
    res.status(201).json({ session });
  } catch (err) {
    console.error('Log sleep session error:', err);
    res.status(500).json({ error: 'Failed to record sleep session' });
  }
});

export default router;
