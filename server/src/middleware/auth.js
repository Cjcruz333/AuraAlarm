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
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }

  const user = db.findOne('users', item => item.id === decoded.id);
  if (!user || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
  req.user = decoded;
  next();
};

export const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next();
    }

    const user = db.findOne('users', item => item.id === decoded.id);
    if (user && (decoded.authVersion || 0) === (user.authVersion || 0)) {
      req.user = decoded;
    }
  }
  next();
};

// Returns true when the user is within their 7-day free trial window
export const isFreeTrialActive = (user, now = Date.now()) => {
  if (!user || user.username === 'demo') return false;
  if (user.isPro && user.subscriptionStatus === 'active') return false; // already paid
  const trialEndsAt = Date.parse(user.trialEndsAt || '');
  return Number.isFinite(trialEndsAt) && trialEndsAt > now;
};

export const isSubscriptionActive = (user, now = Date.now()) => {
  // A user inside their free trial counts as active (Pro-equivalent)
  if (isFreeTrialActive(user, now)) return true;

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
      // Check if the trial just expired to give a helpful message
      const trialExpired = user.trialEndsAt && Date.parse(user.trialEndsAt) <= Date.now();
      return res.status(403).json({
        error: trialExpired
          ? 'Your 7-day free trial has ended. Subscribe to a Pro plan to continue enjoying premium features.'
          : 'An active subscription is required to access this feature',
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionStatus: user.subscriptionStatus || 'none',
        trialExpired: !!trialExpired
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
