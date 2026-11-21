import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { db, UPLOADS_DIR } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Audio upload storage
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `sound-${Date.now()}-${uuidv4()}${ext}`);
  }
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || file.originalname.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Seed default alarms for demo
const seedDefaultAlarms = (userId) => {
  const existing = db.find('alarms', a => a.userId === userId);
  if (existing.length === 0) {
    db.insert('alarms', {
      id: 'alarm-1',
      userId,
      label: 'Morning Rise & Radiance',
      time: '06:30',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      active: true,
      soundId: 'gentle_chimes',
      soundName: 'Gentle Dawn Chimes',
      customSoundUrl: '',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
      lovedOneName: 'Sarah',
      greetingEnabled: true,
      speechGreeting: true,
      e2eeEncryptedNotes: '',
      snoozeCount: 0,
      createdAt: new Date().toISOString()
    });

    db.insert('alarms', {
      id: 'alarm-2',
      userId,
      label: 'Weekend Energy & Stretch',
      time: '08:00',
      days: ['Sat', 'Sun'],
      active: true,
      soundId: 'zen_breeze',
      soundName: 'Zen Garden Breeze',
      customSoundUrl: '',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
      lovedOneName: 'Sarah',
      greetingEnabled: true,
      speechGreeting: true,
      e2eeEncryptedNotes: '',
      snoozeCount: 0,
      createdAt: new Date().toISOString()
    });
  }
};
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  seedDefaultAlarms('demo-user-id');
}

// GET /alarms
router.get('/', authMiddleware, (req, res) => {
  try {
    const alarms = db.find('alarms', a => a.userId === req.user.id);
    res.json({ alarms });
  } catch (err) {
    console.error('Fetch alarms error:', err);
    res.status(500).json({ error: 'Failed to retrieve alarms' });
  }
});

// POST /alarms
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      label,
      time,
      days = [],
      active = true,
      soundId = 'gentle_chimes',
      soundName = 'Gentle Dawn Chimes',
      customSoundUrl = '',
      photoUrl = '',
      lovedOneName = '',
      greetingEnabled = true,
      speechGreeting = true,
      e2eeEncryptedNotes = ''
    } = req.body;

    if (!time) {
      return res.status(400).json({ error: 'Alarm time is required (HH:MM format)' });
    }

    const newAlarm = {
      id: uuidv4(),
      userId: req.user.id,
      label: label || 'Alarm',
      time,
      days,
      active: Boolean(active),
      soundId,
      soundName,
      customSoundUrl,
      photoUrl,
      lovedOneName,
      greetingEnabled: Boolean(greetingEnabled),
      speechGreeting: Boolean(speechGreeting),
      e2eeEncryptedNotes,
      snoozeCount: 0,
      createdAt: new Date().toISOString()
    };

    await db.insert('alarms', newAlarm);
    res.status(201).json({ alarm: newAlarm });
  } catch (err) {
    console.error('Create alarm error:', err);
    res.status(500).json({ error: 'Failed to create alarm' });
  }
});

// PUT /alarms/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.findOne('alarms', a => a.id === id && a.userId === req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    const updated = await db.update('alarms', a => a.id === id, req.body);
    res.json({ alarm: updated });
  } catch (err) {
    console.error('Update alarm error:', err);
    res.status(500).json({ error: 'Failed to update alarm' });
  }
});

// PATCH /alarms/:id/toggle
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.findOne('alarms', a => a.id === id && a.userId === req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    const updated = await db.update('alarms', a => a.id === id, { active: !existing.active });
    res.json({ alarm: updated });
  } catch (err) {
    console.error('Toggle alarm error:', err);
    res.status(500).json({ error: 'Failed to toggle alarm' });
  }
});

// DELETE /alarms/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('alarms', a => a.id === id && a.userId === req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Alarm not found or already deleted' });
    }
    res.json({ message: 'Alarm deleted successfully' });
  } catch (err) {
    console.error('Delete alarm error:', err);
    res.status(500).json({ error: 'Failed to delete alarm' });
  }
});

// POST /alarms/:id/dismiss - Record awake event, update streak, notify loved one
router.post('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates, locationName } = req.body || {};

    const user = db.findOne('users', u => u.id === req.user.id);
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const newStreak = (user.streak || 0) + 1;
      const bestStreak = Math.max(newStreak, user.bestStreak || 0);
      const totalWakes = (user.totalWakes || 0) + 1;

      await db.update('users', u => u.id === req.user.id, {
        streak: newStreak,
        bestStreak,
        totalWakes,
        lastAwakeDate: today
      });

      // Record loved one ping if notification enabled
      if (user.lovedOne && user.lovedOne.notifyOnWake) {
        await db.insert('lovedOnePings', {
          id: uuidv4(),
          userId: user.id,
          userName: user.name || user.username,
          lovedOneName: user.lovedOne.name,
          lovedOnePhone: user.lovedOne.phone,
          timestamp: new Date().toISOString(),
          status: 'WOKE_UP_ON_TIME',
          message: `${user.name || user.username} just woke up on time! All is safe and sound.`,
          location: user.lovedOne.shareLocation ? (locationName || 'Home / Verified Device') : 'Private',
          coordinates: user.lovedOne.shareLocation ? coordinates : null
        });
      }
    }

    res.json({
      message: 'Alarm dismissed. Streak updated & loved one notified!',
      streak: user ? (user.streak || 0) + 1 : 1
    });
  } catch (err) {
    console.error('Dismiss alarm error:', err);
    res.status(500).json({ error: 'Failed to process alarm dismissal' });
  }
});

// POST /alarms/upload-sound - Upload custom audio for alarm tone
router.post('/upload-sound', authMiddleware, uploadAudio.single('sound'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    const soundUrl = `/uploads/${req.file.filename}`;
    res.json({ soundUrl, soundName: req.file.originalname });
  } catch (err) {
    console.error('Upload sound error:', err);
    res.status(500).json({ error: 'Audio upload failed' });
  }
});

export default router;
