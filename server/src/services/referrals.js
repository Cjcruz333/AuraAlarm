import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { isSubscriptionActive } from '../middleware/auth.js';

const REFERRAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const SUBSCRIBER_REFERRAL_WINDOW_MS = 48 * 60 * 60 * 1000;
const REWARDS = {
  signup_milestone: {
    amount: 2000,
    title: '10 referrals in 24 hours'
  },
  subscriber_milestone: {
    amount: 5000,
    title: '5 invited subscribers within 48 hours of first payment'
  }
};

const getFirstSubscriptionTime = user => {
  const firstSubscriptionTime = Date.parse(user.firstProSubscribedAt || '');
  if (Number.isFinite(firstSubscriptionTime)) return firstSubscriptionTime;
  return Date.parse(user.proSubscribedAt || '');
};

export const getSubscriberReferralProgress = (referrals, now = Date.now()) => {
  const paymentTimes = referrals
    .map(getFirstSubscriptionTime)
    .filter(timestamp => Number.isFinite(timestamp) && timestamp <= now);

  if (!paymentTimes.length) {
    return {
      subscriberReferralsIn48Hours: 0,
      subscriberWindowStartsAt: null,
      subscriberWindowEndsAt: null,
      subscriberWindowExpired: false
    };
  }

  const windowStartsAt = Math.min(...paymentTimes);
  const windowEndsAt = windowStartsAt + SUBSCRIBER_REFERRAL_WINDOW_MS;
  const subscriberReferralsIn48Hours = referrals.filter(user => {
    const subscribedAt = getFirstSubscriptionTime(user);
    return Number.isFinite(subscribedAt)
      && subscribedAt >= windowStartsAt
      && subscribedAt <= windowEndsAt
      && subscribedAt <= now
      && isSubscriptionActive(user, now);
  }).length;

  return {
    subscriberReferralsIn48Hours,
    subscriberWindowStartsAt: new Date(windowStartsAt).toISOString(),
    subscriberWindowEndsAt: new Date(windowEndsAt).toISOString(),
    subscriberWindowExpired: now > windowEndsAt && subscriberReferralsIn48Hours < 5
  };
};

export const createUniqueReferralCode = () => {
  let referralCode;
  do {
    referralCode = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
  } while (db.findOne('users', user => user.referralCode === referralCode));
  return referralCode;
};

export const getReferralStats = (userId, now = Date.now()) => {
  const referrals = db.find('users', user => user.referredBy === userId);
  const recentReferrals = referrals.filter(user => {
    const referredAt = Date.parse(user.referredAt || '');
    return Number.isFinite(referredAt) && referredAt >= now - REFERRAL_WINDOW_MS && referredAt <= now;
  });
  const activeSubscribers = referrals.filter(user => isSubscriptionActive(user, now));
  const subscriberProgress = getSubscriberReferralProgress(referrals, now);

  return {
    totalReferrals: referrals.length,
    referralsIn24Hours: recentReferrals.length,
    activeSubscribers: activeSubscribers.length,
    ...subscriberProgress
  };
};

export const syncReferralRewards = async (userId, now = Date.now()) => {
  const stats = getReferralStats(userId, now);
  const milestones = [
    { type: 'signup_milestone', achieved: stats.referralsIn24Hours >= 10 },
    { type: 'subscriber_milestone', achieved: stats.subscriberReferralsIn48Hours >= 5 }
  ];

  for (const milestone of milestones) {
    if (!milestone.achieved) continue;

    const existing = db.findOne(
      'referralRewards',
      reward => reward.userId === userId && reward.type === milestone.type
    );
    if (!existing) {
      await db.insert('referralRewards', {
        id: uuidv4(),
        userId,
        type: milestone.type,
        title: REWARDS[milestone.type].title,
        amount: REWARDS[milestone.type].amount,
        currency: 'NGN',
        status: 'available',
        earnedAt: new Date(now).toISOString()
      });
    }
  }

  return stats;
};
