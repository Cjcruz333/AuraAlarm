import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubscriberReferralProgress } from './referrals.js';

const start = Date.parse('2026-01-01T00:00:00.000Z');
const twoDays = 48 * 60 * 60 * 1000;

const subscriber = (paidAt, expiresAt = start + 7 * 24 * 60 * 60 * 1000) => ({
  isPro: true,
  subscriptionStatus: 'active',
  proPlan: 'pro_monthly',
  firstProSubscribedAt: new Date(paidAt).toISOString(),
  proExpiresAt: new Date(expiresAt).toISOString()
});

test('counts five active referrals through the 48-hour deadline', () => {
  const referrals = [
    subscriber(start),
    subscriber(start + 60_000),
    subscriber(start + 120_000),
    subscriber(start + 180_000),
    subscriber(start + twoDays)
  ];

  const progress = getSubscriberReferralProgress(referrals, start + twoDays);

  assert.equal(progress.subscriberReferralsIn48Hours, 5);
  assert.equal(progress.subscriberWindowEndsAt, new Date(start + twoDays).toISOString());
  assert.equal(progress.subscriberWindowExpired, false);
});

test('does not count subscriptions that start after the 48-hour deadline', () => {
  const referrals = [
    subscriber(start),
    subscriber(start + 60_000),
    subscriber(start + 120_000),
    subscriber(start + 180_000),
    subscriber(start + twoDays + 1)
  ];

  const progress = getSubscriberReferralProgress(referrals, start + twoDays + 1);

  assert.equal(progress.subscriberReferralsIn48Hours, 4);
  assert.equal(progress.subscriberWindowExpired, true);
});

test('keeps the first payment as the window start if that subscription later expires', () => {
  const referrals = [
    subscriber(start, start + 60 * 60 * 1000),
    subscriber(start + 60_000),
    subscriber(start + 120_000),
    subscriber(start + 180_000),
    subscriber(start + 240_000)
  ];

  const progress = getSubscriberReferralProgress(referrals, start + 2 * 60 * 60 * 1000);

  assert.equal(progress.subscriberWindowStartsAt, new Date(start).toISOString());
  assert.equal(progress.subscriberReferralsIn48Hours, 4);
});

test('leaves the subscriber window unstarted until a referral pays', () => {
  const progress = getSubscriberReferralProgress([], start);

  assert.equal(progress.subscriberReferralsIn48Hours, 0);
  assert.equal(progress.subscriberWindowStartsAt, null);
  assert.equal(progress.subscriberWindowEndsAt, null);
  assert.equal(progress.subscriberWindowExpired, false);
});
