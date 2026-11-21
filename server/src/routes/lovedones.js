import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Seed initial peace of mind ping
const seedDefaultPings = (userId) => {
  const existing = db.find('lovedOnePings', p => p.userId === userId);
  if (existing.length === 0) {
    db.insert('lovedOnePings', {
      id: 'ping-1',
      userId,
      userName: 'Alex Johnson',
      lovedOneName: 'Sarah',
      status: 'AWAKE_AND_HEALTHY',
      message: 'Alex woke up on time at 6:30 AM! Morning hydration completed.',
      location: 'Central Residence (Safe Zone)',
      batteryLevel: '94%',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
    });
  }
};
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  seedDefaultPings('demo-user-id');
}

// GET /loved-ones/pings - Get history of wake and peace-of-mind check-ins
router.get('/pings', authMiddleware, (req, res) => {
  try {
    const pings = db.find('lovedOnePings', p => p.userId === req.user.id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ pings });
  } catch (err) {
    console.error('Fetch pings error:', err);
    res.status(500).json({ error: 'Failed to retrieve check-ins' });
  }
});

// POST /loved-ones/ping - Trigger manual or automated peace of mind check-in
router.post('/ping', authMiddleware, async (req, res) => {
  try {
    const { status, message, location, coordinates, batteryLevel } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);

    const newPing = {
      id: uuidv4(),
      userId: req.user.id,
      userName: user?.name || user?.username || 'User',
      lovedOneName: user?.lovedOne?.name || 'Loved One',
      lovedOnePhone: user?.lovedOne?.phone || '',
      status: status || 'CHECK_IN_OK',
      message: message || `${user?.name || 'User'} checked in safe and sound.`,
      location: location || 'Current Location',
      coordinates: coordinates || null,
      batteryLevel: batteryLevel || '100%',
      timestamp: new Date().toISOString()
    };

    await db.insert('lovedOnePings', newPing);
    res.status(201).json({ ping: newPing, message: 'Peace-of-mind check-in dispatched!' });
  } catch (err) {
    console.error('Create ping error:', err);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// GET /loved-ones/status/:userId - Public companion view for the partner
router.get('/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.findOne('users', u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Companion profile not found' });
    }

    const latestPing = db.find('lovedOnePings', p => p.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

    const alarms = db.find('alarms', a => a.userId === userId && a.active);

    res.json({
      userName: user.name || user.username,
      partnerName: user.lovedOne?.name || 'Partner',
      lastAwakeDate: user.lastAwakeDate || 'Today',
      currentStreak: user.streak || 1,
      latestPing: latestPing || null,
      upcomingAlarm: alarms[0]?.time || '06:30',
      status: 'ALL_GOOD'
    });
  } catch (err) {
    console.error('Public companion status error:', err);
    res.status(500).json({ error: 'Could not load companion status' });
  }
});

export default router;
