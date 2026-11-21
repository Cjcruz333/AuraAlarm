import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { db, UPLOADS_DIR } from '../db.js';
import { JWT_SECRET, authMiddleware, isAdminUser, subscriberMiddleware } from '../middleware/auth.js';
import { createUniqueReferralCode, syncReferralRewards } from '../services/referrals.js';

const router = express.Router();

const toSafeUser = user => {
  const { passwordHash: _, ...userSafe } = user;
  return { ...userSafe, isAdmin: isAdminUser(user) };
};

// Setup multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper: generate token
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Default seed user if none exists
const initializeDemoUser = () => {
  const existing = db.findOne('users', u => u.username === 'demo' || u.email === 'demo@auraalarm.com');
  if (!existing) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('demo1234', salt);
    db.insert('users', {
      id: 'demo-user-id',
      username: 'demo',
      name: 'Alex Johnson',
      email: 'demo@auraalarm.com',
      passwordHash,
      biometricEnabled: true,
      biometricCredentials: [
        {
          id: 'mock-bio-cred-1',
          type: 'public-key',
          authenticatorName: 'Windows Hello / Touch ID'
        }
      ],
      lovedOne: {
        name: 'Sarah',
        relationship: 'Partner',
        photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
        phone: '+1 (555) 382-9102',
        message: 'Rise and shine, my love! Today is yours.',
        notifyOnWake: true,
        shareLocation: true
      },
      e2eeKeySalt: 'salt_e2ee_demo_9841',
      streak: 7,
      bestStreak: 14,
      totalWakes: 42,
      createdAt: new Date().toISOString()
    });
  }
};
if (process.env.NODE_ENV !== 'production' && !process.env.DATABASE_URL) {
  initializeDemoUser();
}

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, lovedOne, referralCode } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existingUser = db.findOne('users', u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const normalizedReferralCode = typeof referralCode === 'string'
      ? referralCode.trim().toUpperCase()
      : '';
    const referrer = normalizedReferralCode
      ? db.findOne('users', u => u.referralCode === normalizedReferralCode)
      : null;
    if (normalizedReferralCode && !referrer) {
      return res.status(400).json({ error: 'Referral code not found. Check the invite link and try again.' });
    }

    const newUser = {
      id: uuidv4(),
      username,
      name: name || username,
      email,
      passwordHash,
      biometricEnabled: false,
      biometricCredentials: [],
      lovedOne: lovedOne || {
        name: 'Loved One',
        relationship: 'Special Someone',
        photoUrl: '',
        phone: '',
        message: 'Good morning! Have a wonderful day!',
        notifyOnWake: true,
        shareLocation: false
      },
      e2eeKeySalt: uuidv4(),
      streak: 1,
      bestStreak: 1,
      totalWakes: 1,
      createdAt: new Date().toISOString(),
      referralCode: createUniqueReferralCode(),
      referredBy: referrer?.id || null,
      referredAt: referrer ? new Date().toISOString() : null
    };

    await db.insert('users', newUser);
    if (referrer) await syncReferralRewards(referrer.id);
    const token = signToken(newUser);

    res.status(201).json({ token, user: toSafeUser(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: 'Login identifier and password are required' });
    }

    const user = db.findOne('users', u => u.username === login || u.email === login);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /biometric/login - Authenticate with biometric credential
router.post('/biometric/login', async (req, res) => {
  try {
    const { emailOrUsername, credentialId } = req.body;
    // Find user by credential or identifier
    let user = null;
    if (credentialId) {
      user = db.findOne('users', u => 
        (u.biometricCredentials || []).some(c => c.id === credentialId)
      );
    }
    if (!user && emailOrUsername) {
      user = db.findOne('users', u => u.email === emailOrUsername || u.username === emailOrUsername);
    }
    if (!user) {
      // Default to demo user if testing biometric without prior login
      user = db.findOne('users', u => u.username === 'demo');
    }

    if (!user) {
      return res.status(401).json({ error: 'Biometric credential not recognized' });
    }

    const token = signToken(user);
    res.json({ token, user: toSafeUser(user), biometricVerified: true });
  } catch (err) {
    console.error('Biometric login error:', err);
    res.status(500).json({ error: 'Biometric verification failed' });
  }
});

// POST /biometric/register - Register biometric credential for active user
router.post('/biometric/register', subscriberMiddleware, async (req, res) => {
  try {
    const { credentialId, authenticatorName } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existingCreds = user.biometricCredentials || [];
    const newCred = {
      id: credentialId || uuidv4(),
      type: 'public-key',
      authenticatorName: authenticatorName || 'Biometric Sensor / Touch ID',
      registeredAt: new Date().toISOString()
    };

    const updatedUser = await db.update('users', u => u.id === req.user.id, {
      biometricEnabled: true,
      biometricCredentials: [...existingCreds, newCred]
    });

    res.json({
      message: 'Biometric credential enrolled successfully',
      user: toSafeUser(updatedUser)
    });
  } catch (err) {
    console.error('Biometric enrollment error:', err);
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

// GET /me - Get active profile
router.get('/me', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ user: toSafeUser(user) });
});

// PUT /loved-one - Update loved one configuration
router.put('/loved-one', subscriberMiddleware, async (req, res) => {
  try {
    const { name, relationship, photoUrl, phone, message, notifyOnWake, shareLocation } = req.body;
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updatedLovedOne = {
      ...(user.lovedOne || {}),
      ...(name !== undefined && { name }),
      ...(relationship !== undefined && { relationship }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(phone !== undefined && { phone }),
      ...(message !== undefined && { message }),
      ...(notifyOnWake !== undefined && { notifyOnWake }),
      ...(shareLocation !== undefined && { shareLocation }),
    };

    const updatedUser = await db.update('users', u => u.id === req.user.id, {
      lovedOne: updatedLovedOne
    });

    res.json({ message: 'Loved one settings updated', lovedOne: updatedUser.lovedOne });
  } catch (err) {
    console.error('Loved one update error:', err);
    res.status(500).json({ error: 'Failed to update loved one settings' });
  }
});

// POST /upload-photo - Upload custom photo
router.post('/upload-photo', subscriberMiddleware, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ photoUrl });
  } catch (err) {
    console.error('Upload photo error:', err);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

export default router;
