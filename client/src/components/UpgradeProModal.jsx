import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Globe, 
  Upload, 
  FileText, 
  Clock, 
  AlertCircle, 
  Eye, 
  ShieldAlert,
  DollarSign,
  Landmark,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

// Supported worldwide currencies and rates
const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', rate: 1.0, flag: '🇺🇸', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', rate: 0.92, flag: '🇪🇺', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', rate: 0.79, flag: '🇬🇧', code: 'GBP' },
  NGN: { symbol: '₦', name: 'Nigerian Naira', rate: 1450, flag: '🇳🇬', code: 'NGN' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', rate: 1.37, flag: '🇨🇦', code: 'CAD' },
  AUD: { symbol: 'AU$', name: 'Australian Dollar', rate: 1.52, flag: '🇦🇺', code: 'AUD' },
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 84.5, flag: '🇮🇳', code: 'INR' },
  ZAR: { symbol: 'R', name: 'South African Rand', rate: 18.2, flag: '🇿🇦', code: 'ZAR' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', rate: 130, flag: '🇰🇪', code: 'KES' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', rate: 15.5, flag: '🇬🇭', code: 'GHS' },
  AED: { symbol: 'AED', name: 'UAE Dirham', rate: 3.67, flag: '🇦🇪', code: 'AED' },
  JPY: { symbol: '¥', name: 'Japanese Yen', rate: 154, flag: '🇯🇵', code: 'JPY' }
};

const POPULAR_BANKS = [
  'Access Bank',
  'GTBank (Guaranty Trust Bank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'UBA (United Bank for Africa)',
  'OPay',
  'Palmpay',
  'Kuda Bank',
  'Moniepoint Microfinance Bank',
  'Fidelity Bank',
  'Stanbic IBTC Bank',
  'Sterling Bank',
  'Wema Bank / ALAT',
  'Union Bank',
  'FCMB',
  'Ecobank',
  'Polaris Bank',
  'Keystone Bank',
  'Other Bank / International Wire'
];

const FIDELITY_ACCOUNT_NUMBER = '3004543080';

export const UpgradeProModal = ({ isOpen, onClose, onOpenAdmin }) => {
  const { user, setUser, refreshUser } = useAuth();
  
  const [currency, setCurrency] = useState('NGN');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('pro_duo');
  const [paymentTab, setPaymentTab] = useState('bank'); // Default to bank transfer
  
  // Bank details state
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedUssd, setCopiedUssd] = useState(false);
  const [copyError, setCopyError] = useState('');

  // Proof of Payment Form State (REQUIRED for Fidelity Bank)
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('Access Bank');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [transferNotes, setTransferNotes] = useState('');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardBrand, setCardBrand] = useState('Card');

  // Pending proof verification state
  const [pendingProof, setPendingProof] = useState(null);

  // Loading & error
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const copyText = async (value, setCopied) => {
    setCopied(false);
    setCopyError('');
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is not available');
      }
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      setCopyError('Could not copy. Please select and copy the text manually.');
    }
  };

  // Auto-detect visitor's country and local currency from browser timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      setDetectedLocation(tz);

      if (tz.includes('Lagos') || tz.includes('Nigeria')) {
        setCurrency('NGN');
      } else if (tz.includes('London') || tz.includes('Belfast')) {
        setCurrency('GBP');
      } else if (tz.includes('Europe')) {
        setCurrency('EUR');
      } else if (tz.includes('Toronto') || tz.includes('Vancouver')) {
        setCurrency('CAD');
      } else if (tz.includes('Sydney') || tz.includes('Australia')) {
        setCurrency('AUD');
      } else if (tz.includes('Kolkata') || tz.includes('India')) {
        setCurrency('INR');
      } else if (tz.includes('Johannesburg') || tz.includes('South_Africa')) {
        setCurrency('ZAR');
      } else if (tz.includes('Nairobi') || tz.includes('Kenya')) {
        setCurrency('KES');
      } else if (tz.includes('Accra') || tz.includes('Ghana')) {
        setCurrency('GHS');
      } else if (tz.includes('Dubai') || tz.includes('United_Arab_Emirates')) {
        setCurrency('AED');
      } else if (tz.includes('Tokyo') || tz.includes('Japan')) {
        setCurrency('JPY');
      } else {
        setCurrency('USD');
      }
    } catch {
      setCurrency('NGN');
    }
  }, [isOpen]);

  // Check if current user already has a pending payment proof submitted
  useEffect(() => {
    if (isOpen) {
      api.getSubscriptionStatus().then(res => {
        if (res.subscriptionStatus === 'pending_verification' && res.pendingProof) {
          setPendingProof(res.pendingProof);
        } else {
          setPendingProof(null);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleCardNumberChange = (val) => {
    const raw = val.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);

    if (raw.startsWith('4')) setCardBrand('Visa');
    else if (/^(5[1-5]|2[2-7])/.test(raw)) setCardBrand('Mastercard');
    else if (/^(506|507|650)/.test(raw)) setCardBrand('Verve');
    else if (/^3[47]/.test(raw)) setCardBrand('American Express');
    else setCardBrand('Card');
  };

  const handleExpiryChange = (val) => {
    let raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleReceiptFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Please select a receipt image under 10MB.');
      return;
    }

    setReceiptFile(file);
    setErrorMsg('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const plans = [
    {
      id: 'pro_monthly',
      name: 'Aura Pro Monthly',
      tagline: 'Individual Circadian & Sleep Master',
      baseUSD: 3.99,
      period: '/ month',
      badge: null,
      highlight: false,
      features: [
        'Unlimited Loved-One Custom Alarm Screens',
        'VIP 528Hz Solfeggio & Astral Sleep Soundscapes',
        'Unlimited Destination Geofence Reminders',
        'Circadian HIIT & Mobility Guided Routines',
        'AES-256-GCM Encrypted Notes Vault'
      ]
    },
    {
      id: 'pro_duo',
      name: 'Aura Duo Couples Pass',
      tagline: 'Connect 2 Accounts with Live Safe Pings',
      baseUSD: 5.99,
      period: '/ month',
      badge: 'MOST POPULAR',
      highlight: true,
      features: [
        'Everything in Aura Pro for 2 Linked Devices',
        'Automated Morning Wake-Up Companion Pings',
        'Live "Arrived Safely" Proximity Beacon',
        'Shared Daily Wake Streak & Inspiration Notes',
        'Multi-Calendar .ics Universal Synchronization',
        'Direct Priority Support with Developer'
      ]
    },
    {
      id: 'pro_lifetime',
      name: 'Founder Lifetime VIP',
      tagline: 'Pay Once, Enjoy Unlimited Access Forever',
      baseUSD: 49.00,
      period: 'one-time',
      badge: 'BEST VALUE',
      highlight: false,
      features: [
        'Zero Recurring Fees — Lifetime Access to All Features',
        'All Future Sleep Sounds, AI Voice Drops & Updates Included',
        'Exclusive Golden Founder Badge on Dashboard',
        'Direct 1-on-1 Support (okeke12347@gmail.com)',
        '7-Day 100% Money-Back Guarantee'
      ]
    }
  ];

  if (!isOpen) return null;

  const currentPlan = plans.find(p => p.id === selectedPlanId) || plans[1];
  const currInfo = CURRENCIES[currency] || CURRENCIES.USD;

  const calculatePrice = (baseUSD) => {
    const raw = baseUSD * currInfo.rate;
    if (currency === 'NGN') return (Math.round(raw / 100) * 100).toLocaleString();
    if (currency === 'INR' || currency === 'JPY' || currency === 'KES') return Math.round(raw).toLocaleString();
    return (Math.round(raw * 100) / 100).toFixed(2);
  };

  const displayPrice = `${currInfo.symbol}${calculatePrice(currentPlan.baseUSD)}`;

  // --- SUBMIT PROOF OF PAYMENT (STRICT: DOES NOT GRANT ACCESS UNTIL VERIFIED) ---
  const handleSubmitBankProof = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Strict validation: Must provide sender name, bank, and reference
    if (!senderName.trim() || senderName.trim().length < 3) {
      setErrorMsg('Please enter your Sender Account Full Name as shown on your transfer debit alert.');
      return;
    }
    if (!senderBank.trim()) {
      setErrorMsg('Please select or specify the bank you transferred from.');
      return;
    }
    if (!transactionRef.trim() || transactionRef.trim().length < 4) {
      setErrorMsg('Please enter the Bank Transaction Reference / Session ID from your receipt.');
      return;
    }

    setIsProcessing(true);

    try {
      let uploadedReceiptUrl = '';
      if (receiptFile) {
        const uploadRes = await api.uploadReceipt(receiptFile);
        uploadedReceiptUrl = uploadRes.receiptUrl;
      }

      const res = await api.submitBankProof({
        planId: currentPlan.id,
        currency,
        senderName: senderName.trim(),
        senderBank: senderBank.trim(),
        transactionReference: transactionRef.trim(),
        receiptUrl: uploadedReceiptUrl,
        notes: transferNotes.trim()
      });

      // Update user state: isPro REMAINS FALSE!
      if (res.user) {
        setUser(res.user);
      } else {
        await refreshUser();
      }

      // Show Pending Verification screen
      setPendingProof({
        planName: currentPlan.name,
        price: displayPrice,
        period: currentPlan.period,
        senderName: senderName.trim(),
        senderBank: senderBank.trim(),
        transactionReference: transactionRef.trim(),
        receiptUrl: uploadedReceiptUrl,
        date: new Date().toLocaleString()
      });
    } catch (err) {
      console.error('Submit bank proof error:', err);
      setErrorMsg(err.message || 'Failed to submit payment proof. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Real Card & Gateway Payment Handler ---
  const handleProcessCardPayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!publicKey || typeof window === 'undefined' || !window.PaystackPop) {
        throw new Error('Card payments are not configured. Please submit a bank transfer proof instead.');
      }

      if (!['NGN', 'USD'].includes(currency)) {
        throw new Error('For card checkout, select USD or NGN as the payment currency.');
      }

      const amountNum = parseFloat(calculatePrice(currentPlan.baseUSD).replace(/,/g, ''));
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: user.email,
        amount: Math.round(amountNum * 100),
        currency,
        callback: async (response) => {
          try {
            const verifyRes = await api.processCardSubscription({
              planId: currentPlan.id,
              currency,
              paystackReference: response.reference || response.trxref
            });
            setUser(verifyRes.user);
            onClose();
          } catch (err) {
            setErrorMsg(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        onClose: () => setIsProcessing(false)
      });
      handler.openIframe();
    } catch (err) {
      setErrorMsg(err.message || 'Card payment could not be started.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] glass-panel border border-amber-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl my-0 sm:my-4 overflow-x-hidden overflow-y-auto overscroll-contain">
        
        {/* Golden ambient background */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VIEW 1: PENDING VERIFICATION SCREEN (NO PRO ACCESS UNTIL APPROVED) */}
        {pendingProof ? (
          <div className="text-center py-6 space-y-6 relative z-10 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 p-0.5 shadow-2xl flex items-center justify-center text-amber-400 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
                <Clock className="w-3.5 h-3.5" />
                Proof Submitted • Awaiting Bank Verification
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Payment Verification in Progress
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2">
                Your payment proof has been submitted to <strong>Okeke Chiemeria John</strong>. We are matching your reference against our Fidelity Bank account records.
              </p>
            </div>

            {/* Proof Summary Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 text-left space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-sm font-bold text-white">{pendingProof.planName || currentPlan.name}</span>
                <span className="text-[11px] font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ⏳ PENDING APPROVAL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sender Name</span>
                  <strong className="text-white">{pendingProof.senderName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sending Bank</span>
                  <strong className="text-cyan-300">{pendingProof.senderBank}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction Reference / Session ID</span>
                  <strong className="text-amber-400 font-mono text-xs break-all">{pendingProof.transactionReference}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Settlement Account</span>
                  <span className="text-slate-300">Fidelity Bank (3004543080)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted Date</span>
                  <span className="text-slate-300">{pendingProof.date || 'Just now'}</span>
                </div>
              </div>

              {pendingProof.receiptUrl && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Attached Receipt Screenshot:</span>
                  <a
                    href={api.resolveAssetUrl(pendingProof.receiptUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold underline flex items-center gap-1"
                  >
                    <span>View Image</span>
                  </a>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              🔒 VIP Pro access will unlock automatically as soon as Okeke Chiemeria John confirms your transfer in Fidelity Bank.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => { setPendingProof(null); onClose(); }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Close Window
              </button>

              <button
                onClick={() => setPendingProof(null)}
                className="text-xs text-amber-400 hover:underline"
              >
                Submit another transfer proof
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: PRICING & PAYMENT SELECTION */
          <div className="space-y-6 relative z-10">
            
            {/* Header */}
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>OFFICIAL MONETIZATION & VERIFIED VIP PASS</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Upgrade to AuraAlarm Pro
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Unlock 528Hz sleep frequencies, couples companion pings, and worldwide circadian alarms.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Detected Country / Timezone:</span>
                <strong className="text-white">{detectedLocation || 'Global'}</strong>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-medium">Currency:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-amber-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {Object.entries(CURRENCIES).map(([code, item]) => (
                    <option key={code} value={code} className="bg-slate-950 text-white">
                      {item.flag} {code} ({item.symbol}) - {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const priceFormatted = `${currInfo.symbol}${calculatePrice(plan.baseUSD)}`;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white">{plan.name}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="my-2">
                        <span className="text-2xl font-extrabold text-white font-mono">{priceFormatted}</span>
                        <span className="text-[11px] text-slate-400 ml-1 font-medium">{plan.period}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 mb-3">{plan.tagline}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      {plan.features.slice(0, 3).map((feat, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Payment Method
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Bank Verified Settlement
                </span>
              </div>

              {/* Method Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTab('bank')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentTab === 'bank'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-400 mb-1" />
                  <span>Fidelity Bank & USSD (₦ NGN)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('card')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentTab === 'card'
                      ? 'bg-indigo-600/30 text-white border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400 mb-1" />
                  <span>Global Cards ($ / € / £ / ₦)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('swift')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentTab === 'swift'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-cyan-400 mb-1" />
                  <span>Int'l SWIFT Wire ($ USD / € EUR)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('paypal')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    paymentTab === 'paypal'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4 text-blue-400 mb-1" />
                  <span>PayPal ($ USD / Worldwide)</span>
                </button>
              </div>

              {/* TAB 1: DIRECT FIDELITY BANK TRANSFER & PROOF SUBMISSION */}
              {paymentTab === 'bank' && (
                <div className="space-y-4 pt-1">
                  
                  {/* Bank Account Details Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-amber-500/30 text-xs space-y-3.5 shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>Fidelity Bank Account Details</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                        Zero Processing Fees
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Bank Name</span>
                        <strong className="text-white text-sm">Fidelity Bank</strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Account Name</span>
                        <strong className="text-amber-300 text-sm">OKEKE CHIEMERIA JOHN</strong>
                      </div>
                    </div>

                    {/* Account Number with 1-Click Copy */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border-2 border-amber-500/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Account Number
                        </span>
                        <span className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono tracking-[0.16em] sm:tracking-widest whitespace-nowrap">
                          {FIDELITY_ACCOUNT_NUMBER}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyText(FIDELITY_ACCOUNT_NUMBER, setCopiedAccount)}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 shrink-0"
                      >
                        {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedAccount ? 'Copied!' : 'Copy Number'}</span>
                      </button>
                    </div>
                    {copyError && (
                      <p role="alert" className="text-[11px] text-rose-300">
                        {copyError}
                      </p>
                    )}

                    {/* USSD Quick Dial */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-1">
                      <span>💡 <strong>Quick USSD:</strong> Dial <code className="text-amber-300 font-mono">*770*{FIDELITY_ACCOUNT_NUMBER}*AMOUNT#</code></span>
                      <button
                        type="button"
                        onClick={() => copyText(`*770*${FIDELITY_ACCOUNT_NUMBER}#`, setCopiedUssd)}
                        className="text-amber-400 hover:underline flex items-center gap-1 font-semibold text-[11px]"
                      >
                        {copiedUssd ? 'USSD Copied!' : 'Copy USSD Code'}
                      </button>
                    </div>
                  </div>

                  {/* MANDATORY PROOF OF PAYMENT SUBMISSION FORM */}
                  <div className="p-4 rounded-2xl bg-slate-950 border-2 border-indigo-500/40 space-y-3.5">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs pb-1 border-b border-slate-800">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>Submit Proof of Payment (Required for Verification)</span>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Please enter your transfer receipt details and upload a screenshot so Okeke Chiemeria John can confirm receipt of funds in Fidelity Bank before VIP Pro access is activated.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Sender Account Full Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. Adeola Samuel / John Doe"
                          required
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Sending Bank <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={senderBank}
                          onChange={(e) => setSenderBank(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 cursor-pointer"
                        >
                          {POPULAR_BANKS.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Bank Transaction Reference / Session ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. 000013241114210948000123456789"
                        required
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>

                    {/* Receipt File Upload */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Upload Transfer Receipt Screenshot or Debit Alert
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-indigo-500 text-xs text-slate-300 hover:text-white transition-all">
                          <Upload className="w-4 h-4 text-indigo-400" />
                          <span>{receiptFile ? receiptFile.name : 'Choose receipt screenshot (JPG, PNG, PDF)'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleReceiptFileChange}
                            className="hidden"
                          />
                        </label>

                        {receiptPreview && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                            <img src={receiptPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Optional Note / WhatsApp Contact
                      </label>
                      <input
                        type="text"
                        value={transferNotes}
                        onChange={(e) => setTransferNotes(e.target.value)}
                        placeholder="e.g. Transfer completed from OPay mobile app"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ATM CARD CHECKOUT */}
              {paymentTab === 'card' && (
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 pb-1">
                    <span>Pay with your Real ATM Card:</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px]">
                      {cardBrand}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Cardholder Full Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="e.g. John Chiemeria Okeke"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        ATM Card Number (16 Digits)
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        maxLength={19}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Exp / CVV
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-400"
                        />
                        <input
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="CVV"
                          maxLength={4}
                          className="w-1/2 px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono text-center focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Card payments trigger real bank 3D Secure OTP authorization. For zero fee instant bank processing, use the Fidelity Bank option above.</span>
                  </p>
                </div>
              )}

              {/* TAB 3: INTERNATIONAL SWIFT BANK WIRE (USD, EUR, GBP) */}
              {paymentTab === 'swift' && (
                <div className="space-y-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 text-xs space-y-3 shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs text-cyan-300 font-extrabold flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-cyan-400" />
                        <span>Fidelity Bank International SWIFT Wire Wire</span>
                      </span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold border border-cyan-500/30">
                        USD / EUR / GBP Accepted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Beneficiary Name</span>
                        <strong className="text-white">OKEKE CHIEMERIA JOHN</strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Name</span>
                        <strong className="text-cyan-300">Fidelity Bank PLC</strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Number</span>
                        <strong className="text-amber-400 font-mono text-sm">3004543080</strong>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">SWIFT / BIC Code</span>
                        <strong className="text-emerald-400 font-mono text-sm">FIDNNGLA</strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <strong>Bank Address:</strong> Fidelity Place, 2 Kofo Abayomi Street, Victoria Island, Lagos, Nigeria • Sort Code: 070150003
                    </div>
                  </div>

                  {/* International Wire Proof Submission Form */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3">
                    <div className="text-xs font-bold text-cyan-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Submit International Wire MT103 / Reference</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                          Sender Full Name / Country *
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. John Smith (USA / UK)"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                          Sending Bank & Currency *
                        </label>
                        <input
                          type="text"
                          value={senderBank}
                          onChange={(e) => setSenderBank(e.target.value)}
                          placeholder="e.g. Chase Bank ($ USD) / Barclays (£ GBP)"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Wire Reference / MT103 Code *
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. WIRE-FED-20261119-9842"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Upload Wire Confirmation Document / PDF
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptFileChange}
                        className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYPAL & GLOBAL DIGITAL WALLET (USD) */}
              {paymentTab === 'paypal' && (
                <div className="space-y-3.5 pt-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border border-blue-500/30 text-xs space-y-3 shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs text-blue-300 font-extrabold flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-blue-400" />
                        <span>PayPal Global Checkout (US Dollar $)</span>
                      </span>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/30">
                        Worldwide Accepted
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">PayPal Recipient Email</span>
                        <strong className="text-blue-300 font-mono text-sm">okeke12347@gmail.com</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('okeke12347@gmail.com');
                          alert('PayPal email copied to clipboard!');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-bold"
                      >
                        Copy Email
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Send <strong>${calculatePrice(currentPlan.baseUSD)} USD</strong> directly to <strong>okeke12347@gmail.com</strong> via PayPal. Then enter your PayPal Transaction ID below for verification.
                    </p>
                  </div>

                  {/* PayPal Verification Submission */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-3">
                    <div className="text-xs font-bold text-blue-300 pb-1 border-b border-slate-800 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span>Submit PayPal Transaction Confirmation</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                          Your PayPal Name / Email *
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="e.g. john.doe@gmail.com"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                          PayPal Transaction ID / Receipt Ref *
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="e.g. 9XX1234567890123"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Upload PayPal Screenshot (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptFileChange}
                        className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  {errorMsg}
                </p>
              )}

              {/* ACTION BUTTON */}
              <button
                type="button"
                onClick={paymentTab === 'card' ? handleProcessCardPayment : handleSubmitBankProof}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Submitting Proof for Verification...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {paymentTab === 'bank'
                        ? `Submit Proof of Payment for Verification (${displayPrice})`
                        : `Pay ${displayPrice} with ATM Card`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex flex-col sm:flex-row items-center justify-between pt-1 text-[10px] text-slate-400 gap-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Settlement Account: Fidelity Bank 3004543080
                </span>
                
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-amber-400 hover:underline font-semibold"
                  >
                    Site Owner: Review Payment Proofs
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
