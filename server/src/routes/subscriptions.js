import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, UPLOADS_DIR } from '../db.js';
import { adminMiddleware, authMiddleware, isSubscriptionActive, isFreeTrialActive } from '../middleware/auth.js';
import { syncReferralRewards } from '../services/referrals.js';

const router = express.Router();

// Ensure receipts directory exists
const RECEIPTS_DIR = path.join(UPLOADS_DIR, 'receipts');
if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

// Multer storage for payment proof receipts
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RECEIPTS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `proof-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`);
  }
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Please upload an image screenshot (JPG, PNG, WEBP) or PDF receipt'));
    }
  }
});

// Worldwide Supported Currencies & Exchange Rates (relative to USD)
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro (EU)', rate: 0.92, flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', rate: 1450, flag: '🇳🇬' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', rate: 1.37, flag: '🇨🇦' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺' },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 84.5, flag: '🇮🇳' },
  ZAR: { symbol: 'R', name: 'South African Rand', rate: 18.2, flag: '🇿🇦' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', rate: 130, flag: '🇰🇪' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.5, flag: '🇬🇭' },
  AED: { symbol: 'AED', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪' },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 154, flag: '🇯🇵' }
};

// Base Plans in USD & localized defaults
export const SUBSCRIPTION_PLANS = [
  {
    id: 'pro_monthly',
    name: 'Aura Pro Monthly',
    tagline: 'Personal Circadian & Sleep Master',
    baseUSD: 3.99,
    priceUSD: 3.99,
    priceNGN: 3000,
    interval: 'month',
    badge: 'PRO',
    highlight: false,
    features: [
      'Unlimited Loved-One Custom Alarm Screens',
      'Exclusive VIP 528Hz Solfeggio & Astral Sleep Sounds',
      'Unlimited Destination Geofence Arrival Reminders',
      'Personal Media Library Sync & Custom Sounds',
      'Circadian Mobility & HIIT Video Guides',
      'End-to-End Encrypted Vault Notes (AES-256-GCM)'
    ]
  },
  {
    id: 'pro_duo',
    name: 'Aura Duo Couples Pass',
    tagline: 'Best for Partners, Couples & Families',
    baseUSD: 5.99,
    priceUSD: 5.99,
    priceNGN: 4500,
    interval: 'month',
    badge: 'DUO VIP',
    highlight: true,
    features: [
      'Everything in Aura Pro for 2 Linked Accounts',
      'Automated Wake-Up SMS/WhatsApp Companion Alerts',
      'Live "Arrived Safely" Proximity Beacon',
      'Shared Morning Streak & Daily Inspiration Notes',
      'Synchronized Calendar Schedule Export (.ics)',
      'VIP Priority Support directly with Developer'
    ]
  },
  {
    id: 'pro_lifetime',
    name: 'Founder Lifetime VIP Pass',
    tagline: 'Pay Once, Own AuraAlarm Forever',
    baseUSD: 49.00,
    priceUSD: 49.00,
    priceNGN: 40000,
    interval: 'lifetime',
    badge: 'FOUNDER VIP',
    highlight: false,
    features: [
      'One-Time Payment — Zero Recurring Fees Forever',
      'All Future Soundscapes, Updates & Features Included',
      'Exclusive Golden Founder Badge on Dashboard',
      'Direct Support with Creator (okeke12347@gmail.com)',
      'Early Beta Access to New AI Voice Drops',
      '7-Day No-Questions-Asked Money-Back Guarantee'
    ]
  }
];

// Helper to calculate price in any currency
export function getPriceInCurrency(baseUSD, currency) {
  const curr = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
  const raw = baseUSD * curr.rate;
  if (currency === 'NGN') return Math.round(raw / 100) * 100;
  if (currency === 'INR' || currency === 'JPY' || currency === 'KES') return Math.round(raw);
  return Math.round(raw * 100) / 100;
}

// GET /api/subscriptions/plans
router.get('/plans', (req, res) => {
  const currency = req.query.currency || 'USD';
  const plansWithCurrency = SUBSCRIPTION_PLANS.map(p => ({
    ...p,
    currency,
    localPrice: getPriceInCurrency(p.baseUSD, currency),
    symbol: SUPPORTED_CURRENCIES[currency]?.symbol || '$'
  }));

  res.json({
    success: true,
    plans: plansWithCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    activeCurrency: currency,
    bankDetails: {
      bankName: 'Fidelity Bank',
      accountName: 'OKEKE CHIEMERIA JOHN',
      accountNumber: '3004543080',
      supportEmail: 'okeke12347@gmail.com'
    }
  });
});

// GET /api/subscriptions/my-status
router.get('/my-status', authMiddleware, (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = db.find('transactions', t => t.userId === req.user.id) || [];
    const pendingProof = transactions.find(t => t.status === 'pending_verification');

    const trialActive = isFreeTrialActive(user);
    const trialEndsAt = user.trialEndsAt || null;
    const trialDaysLeft = trialActive && trialEndsAt
      ? Math.max(0, Math.ceil((Date.parse(trialEndsAt) - Date.now()) / 86_400_000))
      : 0;

    res.json({
      success: true,
      isPro: isSubscriptionActive(user),
      proPlan: user.proPlan || 'free',
      proPlanName: user.proPlanName || 'Free Tier',
      proBadge: user.proBadge || (isSubscriptionActive(user) ? 'VIP' : 'FREE'),
      proSubscribedAt: user.proSubscribedAt || null,
      proExpiresAt: user.proExpiresAt || null,
      subscriptionStatus: isSubscriptionActive(user)
        ? (trialActive && !user.isPro ? 'trial' : 'active')
        : user.proExpiresAt && Date.parse(user.proExpiresAt) <= Date.now()
          ? 'expired'
          : user.subscriptionStatus || 'none',
      isFreeTrialActive: trialActive,
      trialStartedAt: user.trialStartedAt || null,
      trialEndsAt,
      trialDaysLeft,
      pendingProof: pendingProof || null,
      transactions
    });
  } catch (err) {
    console.error('Fetch subscription status error:', err);
    res.status(500).json({ error: 'Failed to retrieve subscription status' });
  }
});

// POST /api/subscriptions/upload-receipt
// Upload receipt screenshot / debit alert proof
router.post('/upload-receipt', authMiddleware, uploadReceipt.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select a receipt image or screenshot to upload' });
    }

    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    res.json({
      success: true,
      receiptUrl,
      filename: req.file.filename,
      message: 'Payment receipt uploaded successfully'
    });
  } catch (err) {
    console.error('Upload receipt error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload receipt' });
  }
});

// POST /api/subscriptions/submit-proof
// SUBMIT PROOF OF PAYMENT (DOES NOT GRANT PRO WITHOUT VERIFICATION)
router.post('/submit-proof', authMiddleware, async (req, res) => {
  try {
    const { 
      planId, 
      currency = 'NGN', 
      senderName, 
      senderBank, 
      transactionReference, 
      receiptUrl, 
      notes = '' 
    } = req.body;

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    if (!senderName || senderName.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter the Sender Account Name shown on your transfer' });
    }

    if (!senderBank || senderBank.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter the Bank used to make the transfer' });
    }

    if (!transactionReference || transactionReference.trim().length < 4) {
      return res.status(400).json({ error: 'Please enter the Bank Transaction Reference / Session ID from your receipt' });
    }

    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const amount = getPriceInCurrency(plan.baseUSD, currency);
    const proofId = uuidv4();
    const now = new Date().toISOString();

    const proofRecord = {
      id: proofId,
      userId: user.id,
      userName: user.name || user.username,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amount,
      currency,
      paymentMethod: 'fidelity_bank_transfer',
      settlementAccount: '3004543080 Fidelity Bank (OKEKE CHIEMERIA JOHN)',
      senderName: senderName.trim(),
      senderBank: senderBank.trim(),
      transactionReference: transactionReference.trim(),
      receiptUrl: receiptUrl || null,
      notes: notes.trim(),
      status: 'pending_verification', // STRICTLY PENDING! NO FREE ACCESS!
      createdAt: now
    };

    // Save proof to transactions
    await db.insert('transactions', proofRecord);

    // Update user record with pending verification status (isPro REMAINS FALSE)
    const alreadyActive = isSubscriptionActive(user);
    const updatedUser = await db.update('users', u => u.id === req.user.id, {
      isPro: alreadyActive,
      subscriptionStatus: alreadyActive ? 'active' : 'pending_verification',
      pendingPlan: plan.name,
      pendingReference: transactionReference.trim(),
      pendingSubmittedAt: now
    });

    const { passwordHash: _, ...safeUser } = updatedUser;

    res.json({
      success: true,
      status: 'pending_verification',
      proof: proofRecord,
      user: safeUser,
      message: '✅ Proof of payment submitted successfully! Your payment is currently being matched against Fidelity Bank account 3004543080. Once Okeke Chiemeria John confirms receipt of funds, your Pro VIP account will be activated.'
    });
  } catch (err) {
    console.error('Submit payment proof error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit payment proof' });
  }
});

// POST /api/subscriptions/process-card
// Process ATM card via Paystack verified reference or gateway
router.post('/process-card', authMiddleware, async (req, res) => {
  try {
    const { planId, currency = 'USD', paystackReference } = req.body;
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const user = db.findOne('users', u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!paystackReference || !['NGN', 'USD'].includes(currency)) {
      return res.status(400).json({ error: 'A valid Paystack reference and a supported currency are required' });
    }

    if (db.findOne('transactions', transaction => transaction.reference === paystackReference)) {
      return res.status(409).json({ error: 'This Paystack payment reference has already been used' });
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return res.status(503).json({ error: 'Card payments are not configured. Please submit a bank transfer proof instead.' });
    }

    const verificationResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } }
    );
    const verification = await verificationResponse.json();
    const payment = verification.data;
    const expectedAmount = Math.round(getPriceInCurrency(plan.baseUSD, currency) * 100);

    if (
      !verificationResponse.ok ||
      !verification.status ||
      payment?.status !== 'success' ||
      payment.reference !== paystackReference ||
      payment.amount !== expectedAmount ||
      payment.currency !== currency ||
      payment.customer?.email?.toLowerCase() !== user.email.toLowerCase()
    ) {
      return res.status(400).json({ error: 'Paystack could not verify a successful payment for this account and plan' });
    }

    const now = new Date();
    let expiresAt = null;
    if (plan.interval === 'month') {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + 30);
      expiresAt = exp.toISOString();
    }

    const updatedUser = await db.update('users', u => u.id === req.user.id, {
      isPro: true,
      proPlan: plan.id,
      proPlanName: plan.name,
      proBadge: plan.badge,
      proSubscribedAt: now.toISOString(),
      firstProSubscribedAt: user.firstProSubscribedAt || user.proSubscribedAt || now.toISOString(),
      proExpiresAt: expiresAt,
      subscriptionStatus: 'active'
    });

    await db.insert('transactions', {
      id: uuidv4(),
      reference: paystackReference,
      userId: user.id,
      userName: user.name || user.username,
      userEmail: user.email,
      planId: plan.id,
      planName: plan.name,
      amount: getPriceInCurrency(plan.baseUSD, currency),
      currency,
      paymentMethod: 'paystack_inline_gateway',
      status: 'approved',
      verifiedAt: now.toISOString(),
      createdAt: now.toISOString()
    });
    if (updatedUser.referredBy) await syncReferralRewards(updatedUser.referredBy);

    const { passwordHash: _, ...safeUser } = updatedUser;
    return res.json({
      success: true,
      user: safeUser,
      plan,
      message: 'Payment successfully verified through Paystack.'
    });
  } catch (err) {
    console.error('Process card error:', err);
    res.status(500).json({ error: err.message || 'Payment processing failed' });
  }
});

// --- ADMIN / OWNER VERIFICATION PANEL (OKEKE CHIEMERIA JOHN) ---

// GET /api/subscriptions/admin/proofs
// List all submitted proofs for John to review
router.get('/admin/proofs', adminMiddleware, (req, res) => {
  try {
    const transactions = db.find('transactions', () => true) || [];
    // Sort pending first, then by date desc
    const sorted = [...transactions].sort((a, b) => {
      if (a.status === 'pending_verification' && b.status !== 'pending_verification') return -1;
      if (b.status === 'pending_verification' && a.status !== 'pending_verification') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      proofs: sorted,
      pendingCount: sorted.filter(t => t.status === 'pending_verification').length,
      approvedCount: sorted.filter(t => t.status === 'approved' || t.status === 'success').length
    });
  } catch (err) {
    console.error('Admin fetch proofs error:', err);
    res.status(500).json({ error: 'Failed to retrieve payment proofs' });
  }
});

// POST /api/subscriptions/admin/approve
// John verifies money in Fidelity Bank -> Click Approve -> User gets VIP Pro!
router.post('/admin/approve', adminMiddleware, async (req, res) => {
  try {
    const { proofId } = req.body;
    if (!proofId) {
      return res.status(400).json({ error: 'Transaction / Proof ID is required' });
    }

    const proof = db.findOne('transactions', t => t.id === proofId || t.reference === proofId);
    if (!proof) {
      return res.status(404).json({ error: 'Payment proof not found' });
    }
    if (proof.status !== 'pending_verification') {
      return res.status(409).json({ error: 'Only pending payment proofs can be approved' });
    }

    const targetUser = db.findOne('users', u => u.id === proof.userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Associated user not found' });
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === proof.planId) || SUBSCRIPTION_PLANS[0];
    const now = new Date();
    let expiresAt = null;
    if (plan.interval === 'month') {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + 30);
      expiresAt = exp.toISOString();
    } else if (plan.interval === 'year') {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + 365);
      expiresAt = exp.toISOString();
    }

    // 1. Upgrade user to PRO VIP
    const updatedUser = await db.update('users', u => u.id === targetUser.id, {
      isPro: true,
      proPlan: plan.id,
      proPlanName: plan.name,
      proBadge: plan.badge,
      proSubscribedAt: now.toISOString(),
      firstProSubscribedAt: targetUser.firstProSubscribedAt || targetUser.proSubscribedAt || now.toISOString(),
      proExpiresAt: expiresAt,
      subscriptionStatus: 'active',
      pendingPlan: null,
      pendingReference: null
    });

    // 2. Mark transaction as approved
    await db.update('transactions', t => t.id === proof.id, {
      status: 'approved',
      approvedBy: 'Authorized admin after manual bank-credit verification',
      verifiedAt: now.toISOString()
    });
    if (updatedUser.referredBy) await syncReferralRewards(updatedUser.referredBy);

    res.json({
      success: true,
      message: `🎉 Payment verified! User ${targetUser.name || targetUser.username} has been upgraded to ${plan.name}.`,
      user: updatedUser
    });
  } catch (err) {
    console.error('Admin approve error:', err);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// POST /api/subscriptions/admin/reject
// John marks payment proof as rejected (e.g. fake transfer or funds not seen)
router.post('/admin/reject', adminMiddleware, async (req, res) => {
  try {
    const { proofId, reason = 'Payment was not found in Fidelity Bank account 3004543080' } = req.body;
    if (!proofId) {
      return res.status(400).json({ error: 'Proof ID is required' });
    }

    const proof = db.findOne('transactions', t => t.id === proofId || t.reference === proofId);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }
    if (proof.status !== 'pending_verification') {
      return res.status(409).json({ error: 'Only pending payment proofs can be rejected' });
    }

    const rejectionReason = typeof reason === 'string' && reason.trim()
      ? reason.trim()
      : 'Payment was not confirmed in Fidelity Bank account 3004543080';
    const now = new Date().toISOString();

    await db.update('transactions', t => t.id === proof.id, {
      status: 'rejected',
      rejectionReason,
      rejectedBy: 'Authorized admin after manual bank-credit review',
      rejectedAt: now
    });

    if (proof.userId) {
      const targetUser = db.findOne('users', u => u.id === proof.userId);
      if (targetUser) {
        await db.update('users', u => u.id === proof.userId, {
          isPro: isSubscriptionActive(targetUser),
          subscriptionStatus: isSubscriptionActive(targetUser) ? 'active' : 'rejected',
          rejectionReason,
          pendingPlan: null,
          pendingReference: null
        });
      }
    }

    res.json({
      success: true,
      message: `❌ Payment rejected: "${rejectionReason}". Access denied for user.`
    });
  } catch (err) {
    console.error('Admin reject error:', err);
    res.status(500).json({ error: 'Failed to reject proof' });
  }
});

// Automated bank approvals remain disabled until a signed, provider-verified webhook is configured.
router.post('/fidelity-webhook', (req, res) => {
  res.status(501).json({
    error: 'Automated bank verification is not configured. Payment proofs must be reviewed by an admin.'
  });
});

// POST /api/subscriptions/verify-nip
// Automated NIBSS Instant Payment (NIP) session ID validator & fraud detector
router.post('/verify-nip', (req, res) => {
  const { sessionID } = req.body;
  if (!sessionID) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const clean = String(sessionID).trim();
  const isLength30 = clean.length === 30;
  const isAllDigits = /^\d+$/.test(clean);

  const isValidFormat = isLength30 && isAllDigits;
  const riskScore = !isValidFormat ? 'HIGH_FRAUD_RISK' : 'FORMAT_VALID_PENDING_FIDELITY_CREDIT';

  res.json({
    success: true,
    sessionID: clean,
    isValidFormat,
    riskScore,
    reason: !isValidFormat 
      ? `Suspected Fake Transfer: Real NIBSS bank transfers have a 30-digit numeric session ID. Provided value is ${clean.length} characters.`
      : 'Session ID follows standard NIBSS format. Verify credit alert in Fidelity Bank account 3004543080 before approval.'
  });
});

// POST /api/subscriptions/admin/reset-user
// Reset user back to Free tier
router.post('/admin/reset-user', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const targetId = userId || 'demo-user-id';

    const updatedUser = await db.update('users', u => u.id === targetId, {
      isPro: false,
      proPlan: 'free',
      proPlanName: 'Free Tier',
      proBadge: 'FREE',
      proSubscribedAt: null,
      proExpiresAt: null,
      subscriptionStatus: 'none',
      pendingPlan: null,
      pendingReference: null
    });

    res.json({
      success: true,
      message: 'User reset to Free Tier',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
