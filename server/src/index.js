import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import authRoutes from './routes/auth.js';
import alarmRoutes from './routes/alarms.js';
import sleepRoutes from './routes/sleep.js';
import locationRoutes from './routes/location.js';
import calendarRoutes from './routes/calendar.js';
import lovedOneRoutes from './routes/lovedones.js';
import fitnessRoutes from './routes/fitness.js';
import statsRoutes from './routes/stats.js';
import feedbackRoutes from './routes/feedback.js';
import subscriptionRoutes from './routes/subscriptions.js';
import referralRoutes from './routes/referrals.js';
import { db, UPLOADS_DIR } from './db.js';
import { subscriberMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.join(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('trust proxy', 1);
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Download Android APK
app.get(['/api/download/app', '/download/app', '/download/auraalarm.apk', '/auraalarm.apk'], (req, res) => {
  const publicApk = path.join(__dirname, '../../client/public/auraalarm.apk');
  const distApk = path.join(CLIENT_DIST, 'auraalarm.apk');
  const apkPath = fs.existsSync(distApk) ? distApk : publicApk;
  if (fs.existsSync(apkPath)) {
    return res.download(apkPath, 'auraalarm.apk');
  }
  res.status(404).json({ error: 'Android APK build is not currently available.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alarms', subscriberMiddleware, alarmRoutes);
app.use('/api/sleep', subscriberMiddleware, sleepRoutes);
app.use('/api/location', subscriberMiddleware, locationRoutes);
app.use('/api/calendar', subscriberMiddleware, calendarRoutes);
app.use('/api/loved-ones', subscriberMiddleware, lovedOneRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/stats', subscriberMiddleware, statsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/referrals', referralRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'AuraAlarm Global API',
    version: '1.0.0',
    mode: 'production',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend client dist if built
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

async function startServer() {
  await db.initialize();
  app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIp();
    console.log(`🚀 AuraAlarm Server running smoothly on http://localhost:${PORT}`);
    console.log(`📱 Local Network (Phone / Wi-Fi): http://${localIp}:${PORT}`);
    console.log(`📁 Static uploads folder: ${UPLOADS_DIR}`);
  });
}

startServer().catch(async err => {
  console.error('Failed to initialize server:', err);
  try {
    await db.close();
  } catch (closeError) {
    console.error('Failed to close database pool:', closeError);
  }
  process.exitCode = 1;
});
