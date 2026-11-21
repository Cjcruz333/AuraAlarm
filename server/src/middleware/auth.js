import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production'
    ? ''
    : randomBytes(32).toString('hex')
);

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
};

export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // ignore
    }
  }
  next();
};

export const isSubscriptionActive = (user, now = Date.now()) => {
  if (!user?.isPro || user.username === 'demo' || user.subscriptionStatus !== 'active') {
    return false;
  }

  if (user.proPlan === 'pro_lifetime' && !user.proExpiresAt) {
    return true;
  }

  const expiresAt = Date.parse(user.proExpiresAt || '');
  return Number.isFinite(expiresAt) && expiresAt > now;
};

export const subscriberMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    const user = db.findOne('users', item => item.id === req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    if (!isSubscriptionActive(user)) {
      return res.status(403).json({
        error: 'An active subscription is required to access this feature',
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionStatus: user.subscriptionStatus || 'none'
      });
    }

    next();
  });
};

export const isAdminUser = user => {
  if (!user) return false;

  const allowedAdmins = [
    'okeke12347@gmail.com',
    (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  ].filter(Boolean);

  return allowedAdmins.includes(user.email?.trim().toLowerCase()) || user.role === 'admin';
};

export const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    const user = db.findOne('users', item => item.id === req.user.id);
    if (!isAdminUser(user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  });
};

export { JWT_SECRET };
