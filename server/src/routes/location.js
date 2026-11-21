import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper: Haversine distance in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Seed default location reminder for demo
const seedDefaultLocationReminders = (userId) => {
  const existing = db.find('locationReminders', r => r.userId === userId);
  if (existing.length === 0) {
    db.insert('locationReminders', {
      id: 'loc-1',
      userId,
      title: 'Arrive at Fitness Center - Hydrate & Warm-up',
      destinationName: 'Metropolitan Athletic Club',
      latitude: 40.7128,
      longitude: -74.0060,
      radiusMeters: 250,
      triggerOn: 'arrive',
      active: true,
      soundNotification: 'chime',
      encryptedNote: '',
      createdAt: new Date().toISOString()
    });

    db.insert('locationReminders', {
      id: 'loc-2',
      userId,
      title: 'Arrive Home - Activate Wind-Down Sleep Aid',
      destinationName: 'Sanctuary Apartment',
      latitude: 40.7580,
      longitude: -73.9855,
      radiusMeters: 150,
      triggerOn: 'arrive',
      active: true,
      soundNotification: 'zen_bell',
      encryptedNote: '',
      createdAt: new Date().toISOString()
    });
  }
};
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  seedDefaultLocationReminders('demo-user-id');
}

// GET /location
router.get('/', authMiddleware, (req, res) => {
  try {
    const reminders = db.find('locationReminders', r => r.userId === req.user.id);
    res.json({ reminders });
  } catch (err) {
    console.error('Fetch location reminders error:', err);
    res.status(500).json({ error: 'Failed to retrieve location reminders' });
  }
});

// POST /location
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      destinationName,
      latitude,
      longitude,
      radiusMeters = 200,
      triggerOn = 'arrive',
      soundNotification = 'chime',
      encryptedNote = ''
    } = req.body;

    if (!title || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Title, latitude, and longitude are required' });
    }

    const newReminder = {
      id: uuidv4(),
      userId: req.user.id,
      title,
      destinationName: destinationName || 'Target Location',
      latitude: Number(latitude),
      longitude: Number(longitude),
      radiusMeters: Number(radiusMeters) || 200,
      triggerOn,
      active: true,
      soundNotification,
      encryptedNote,
      createdAt: new Date().toISOString()
    };

    await db.insert('locationReminders', newReminder);
    res.status(201).json({ reminder: newReminder });
  } catch (err) {
    console.error('Create location reminder error:', err);
    res.status(500).json({ error: 'Failed to create location reminder' });
  }
});

// PUT /location/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.findOne('locationReminders', r => r.id === id && r.userId === req.user.id);
    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await db.update('locationReminders', r => r.id === id, req.body);
    res.json({ reminder: updated });
  } catch (err) {
    console.error('Update location reminder error:', err);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// DELETE /location/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.delete('locationReminders', r => r.id === id && r.userId === req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json({ message: 'Location reminder removed' });
  } catch (err) {
    console.error('Delete location reminder error:', err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// POST /location/check - Evaluate user's current GPS position against all active geofences
router.post('/check', authMiddleware, (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Current coordinates required' });
    }

    const activeReminders = db.find('locationReminders', r => r.userId === req.user.id && r.active);
    const triggered = [];

    activeReminders.forEach(rem => {
      const distance = getDistanceFromLatLonInMeters(latitude, longitude, rem.latitude, rem.longitude);
      if (distance <= rem.radiusMeters) {
        triggered.push({
          ...rem,
          distanceMeters: Math.round(distance)
        });
      }
    });

    res.json({ triggered, count: triggered.length });
  } catch (err) {
    console.error('Check location proximity error:', err);
    res.status(500).json({ error: 'Proximity check failed' });
  }
});

export default router;
