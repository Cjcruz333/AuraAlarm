import express from 'express';
import { db } from '../db.js';
import { adminMiddleware, authMiddleware } from '../middleware/auth.js';
import { createUniqueReferralCode, syncReferralRewards } from '../services/referrals.js';

const router = express.Router();

const maskName = (name) => {
  const parts = String(name || 'AuraAlarm member').trim().split(/\s+/);
  return parts.map(part => `${part.slice(0, 1).toUpperCase()}•••`).join(' ');
};

router.get('/paid', (req, res) => {
  const paidRewards = db.find('referralRewards', reward => reward.status === 'paid')
    .sort((a, b) => Date.parse(b.paidAt || '') - Date.parse(a.paidAt || ''))
    .slice(0, 20)
    .map(reward => {
      const user = db.findOne('users', item => item.id === reward.userId);
      return {
        id: reward.id,
        displayName: maskName(user?.name || user?.username),
        title: reward.title,
        amount: reward.amount,
        currency: reward.currency,
        paidAt: reward.paidAt
      };
    });

  res.json({ payments: paidRewards });
});

router.get('/me', authMiddleware, async (req, res) => {
  let user = db.findOne('users', item => item.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!user.referralCode) {
    user = await db.update('users', item => item.id === user.id, {
      referralCode: createUniqueReferralCode()
    });
  }

  const stats = await syncReferralRewards(user.id);
  const rewards = db.find('referralRewards', reward => reward.userId === user.id)
    .sort((a, b) => Date.parse(a.earnedAt) - Date.parse(b.earnedAt));

  res.json({
    referralCode: user.referralCode,
    stats,
    rewards
  });
});

router.post('/claim', authMiddleware, async (req, res) => {
  const { rewardId } = req.body;
  if (typeof rewardId !== 'string' || !rewardId.trim()) {
    return res.status(400).json({ error: 'Reward ID is required' });
  }

  const user = db.findOne('users', item => item.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await syncReferralRewards(user.id);

  const reward = db.findOne(
    'referralRewards',
    item => item.id === rewardId && item.userId === user.id
  );
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  if (reward.status !== 'available') {
    return res.status(409).json({ error: 'This reward has already been requested or paid' });
  }

  const requestedReward = await db.update('referralRewards', item => item.id === reward.id, {
    status: 'requested',
    requestedAt: new Date().toISOString()
  });

  res.json({
    message: 'Reward requested. Sign-in is confirmed; the team will contact you to arrange payment.',
    reward: requestedReward
  });
});

router.get('/admin/requests', adminMiddleware, (req, res) => {
  const requests = db.find('referralRewards', reward => reward.status === 'requested')
    .sort((a, b) => Date.parse(a.requestedAt || '') - Date.parse(b.requestedAt || ''))
    .map(reward => {
      const user = db.findOne('users', item => item.id === reward.userId);
      return {
        ...reward,
        userName: user?.name || user?.username || 'Unknown user',
        userEmail: user?.email || 'Unknown email'
      };
    });

  res.json({ requests });
});

router.post('/admin/mark-paid', adminMiddleware, async (req, res) => {
  const { rewardId } = req.body;
  if (typeof rewardId !== 'string' || !rewardId.trim()) {
    return res.status(400).json({ error: 'Reward ID is required' });
  }

  const reward = db.findOne('referralRewards', item => item.id === rewardId);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  if (reward.status !== 'requested') {
    return res.status(409).json({ error: 'Only requested rewards can be marked paid' });
  }

  const paidReward = await db.update('referralRewards', item => item.id === reward.id, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    paidBy: req.user.id
  });

  res.json({ message: 'Payout marked as paid and added to public payment history.', reward: paidReward });
});

export default router;
