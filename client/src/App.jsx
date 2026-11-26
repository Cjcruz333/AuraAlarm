import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Plus, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Flame, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Volume2,
  Crown,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from './context/AuthContext.jsx';
import { useAlarm } from './context/AlarmContext.jsx';
import { api } from './services/api.js';
import { trackAlarmCreated, trackAppSection, trackPageView } from './services/analytics.js';

// Components
import { Navbar } from './components/Navbar.jsx';
import { AlarmCard } from './components/AlarmCard.jsx';
import { AlarmEditModal } from './components/AlarmEditModal.jsx';
import { AlarmRingingModal } from './components/AlarmRingingModal.jsx';
import { SleepSoundPlayer } from './components/SleepSoundPlayer.jsx';
import { FitnessTracker } from './components/FitnessTracker.jsx';
import { LocationReminders } from './components/LocationReminders.jsx';
import { DashboardStats } from './components/DashboardStats.jsx';
import { LovedOnePeaceOfMind } from './components/LovedOnePeaceOfMind.jsx';
import { BiometricAuthModal } from './components/BiometricAuthModal.jsx';
import { CalendarExportModal } from './components/CalendarExportModal.jsx';
import { FeedbackSupportModal } from './components/FeedbackSupportModal.jsx';
import { SocialShareModal } from './components/SocialShareModal.jsx';
import { InstallAppModal } from './components/InstallAppModal.jsx';
import { UpgradeProModal } from './components/UpgradeProModal.jsx';
import { WorldClock } from './components/WorldClock.jsx';
import { AdminProofModal } from './components/AdminProofModal.jsx';
import { ReferralRewards } from './components/ReferralRewards.jsx';
import { SettingsPage } from './components/SettingsPage.jsx';
import { notificationService } from './services/notificationService.js';
import { Stopwatch } from './components/Stopwatch.jsx';
import { useSettings } from './context/SettingsContext.jsx';

const getPasswordResetTokenFromHash = () => {
  const [route, query = ''] = window.location.hash.split('?', 2);
  return route === '#reset-password'
    ? new URLSearchParams(query).get('token') || ''
    : '';
};

const isFreeTrialActive = (user) => {
  if (!user || user.username === 'demo') return false;
  if (user.isPro && user.subscriptionStatus === 'active') return false;
  const trialEndsAt = Date.parse(user.trialEndsAt || '');
  return Number.isFinite(trialEndsAt) && trialEndsAt > Date.now();
};

const hasActiveSubscription = (user) => {
  if (isFreeTrialActive(user)) return true;
  if (!user?.isPro || user.username === 'demo' || user.subscriptionStatus !== 'active') return false;
  if (user.proPlan === 'pro_lifetime' && !user.proExpiresAt) return true;
  const expiresAt = Date.parse(user.proExpiresAt || '');
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
};

export default function App() {
  const { user, loading, refreshUser } = useAuth();
  const { t } = useSettings();
  const {
    alarms,
    loadAlarms,
    testAlarm,
    milestoneToast,
    setMilestoneToast,
    currentTime,
    notificationPermission,
    requestNotificationPermission
  } = useAlarm();
  const isPreview = !hasActiveSubscription(user);

  const [activeTab, setActiveTab] = useState('alarms');
  const [referralStats, setReferralStats] = useState(null);
  const [referralReminderError, setReferralReminderError] = useState('');
  const expiryTimestamp = Date.parse(user?.proExpiresAt || '');
  const timeUntilExpiry = expiryTimestamp - currentTime.getTime();
  const shouldCheckReferralReminder = hasActiveSubscription(user) &&
    user.proPlan !== 'pro_lifetime' &&
    Number.isFinite(expiryTimestamp) &&
    timeUntilExpiry > 0 &&
    timeUntilExpiry <= 2 * 24 * 60 * 60 * 1000;

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [alarmToEdit, setAlarmToEdit] = useState(null);
  const [resetToken, setResetToken] = useState(getPasswordResetTokenFromHash);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(() => Boolean(resetToken));
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState(() => resetToken ? 'reset' : 'login');

  useEffect(() => {
    if (user) {
      trackAppSection(activeTab);
    } else {
      trackPageView('AuraAlarm | Sign In');
    }
  }, [activeTab, user]);

  useEffect(() => {
    const handlePasswordResetLink = () => {
      const token = getPasswordResetTokenFromHash();
      if (!token) return;
      setResetToken(token);
      setAuthModalTab('reset');
      setIsBiometricModalOpen(true);
    };

    window.addEventListener('hashchange', handlePasswordResetLink);
    return () => window.removeEventListener('hashchange', handlePasswordResetLink);
  }, []);

  useEffect(() => {
    if (!shouldCheckReferralReminder || !user?.id) {
      setReferralStats(null);
      setReferralReminderError('');
      return undefined;
    }

    let cancelled = false;
    const loadReferralStats = async () => {
      try {
        const result = await api.getMyReferrals();
        if (cancelled) return;
        setReferralStats(result.stats);
        setReferralReminderError('');
      } catch (err) {
        if (cancelled) return;
        console.error('Referral expiry reminder load error:', err);
        setReferralReminderError('We could not check your referral progress. Open Refer & Earn to refresh it.');
      }
    };

    loadReferralStats();
    const refreshInterval = setInterval(loadReferralStats, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refreshInterval);
    };
  }, [shouldCheckReferralReminder, user?.id, user?.proExpiresAt]);

  const openAuth = (tab = 'login') => {
    setAuthModalTab(user ? 'biometric' : tab);
    setIsBiometricModalOpen(true);
  };

  const handlePasswordResetComplete = () => {
    api.setToken(null);
    refreshUser();
    setResetToken('');
    setAuthModalTab('login');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  };

  const openSubscription = () => {
    if (user) {
      setIsUpgradeModalOpen(true);
    } else {
      openAuth('register');
    }
  };

  const handleOpenStreakShare = () => {
    if (!hasActiveSubscription(user)) {
      openSubscription();
      return;
    }
    setIsShareModalOpen(true);
  };

  // Alarm Handlers
  const handleOpenAddAlarm = () => {
    if (isPreview) {
      openSubscription();
      return;
    }
    setAlarmToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditAlarm = (alarm) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    setAlarmToEdit(alarm);
    setIsEditModalOpen(true);
  };

  const handleSetAlarmForCountry = (countryItem) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    setAlarmToEdit({
      timezone: countryItem.timezone,
      label: `Wake Up in ${countryItem.city}`,
      time: '07:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAlarm = async (alarmData) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    try {
      if (alarmData.id) {
        await api.updateAlarm(alarmData.id, alarmData);
      } else {
        await api.createAlarm(alarmData);
        trackAlarmCreated();
      }
      loadAlarms();
    } catch (err) {
      console.error('Save alarm error:', err);
    }
  };

  const handleToggleAlarm = async (id) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    if (notificationPermission === 'default') {
      try {
        await requestNotificationPermission();
      } catch (e) {}
    }
    try {
      await api.toggleAlarm(id);
      loadAlarms();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleToggleAmPm = async (id) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    const target = alarms.find(a => a.id === id);
    if (!target || !target.time) return;
    const [hStr, mStr] = String(target.time).split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return;
    // Flip by 12 hours: e.g. 01:57 -> 13:57, 13:57 -> 01:57
    h = (h + 12) % 24;
    const newTime = `${String(h).padStart(2, '0')}:${mStr || '00'}`;
    try {
      await api.updateAlarm(id, { ...target, time: newTime });
      loadAlarms();
    } catch (err) {
      console.error('Toggle AM/PM error:', err);
    }
  };

  const handleDeleteAlarm = async (id) => {
    if (isPreview) {
      openSubscription();
      return;
    }
    if (!confirm('Are you sure you want to delete this alarm?')) return;
    try {
      await api.deleteAlarm(id);
      loadAlarms();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Checking your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans">
        <BiometricAuthModal
          isOpen
          canClose={false}
          onClose={() => setIsBiometricModalOpen(false)}
          initialTab={resetToken ? 'reset' : 'login'}
          resetToken={resetToken}
          onResetComplete={handlePasswordResetComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBiometrics={() => openAuth(user ? 'biometric' : 'login')}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenCalendar={() => setIsCalendarModalOpen(true)}
        onOpenShare={handleOpenStreakShare}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenUpgrade={openSubscription}
        onOpenAdmin={user?.isAdmin ? () => setIsAdminModalOpen(true) : undefined}
      />

      {isPreview && (
        <div className="bg-indigo-950/90 border-b border-indigo-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">
                {user?.subscriptionStatus === 'pending_verification' ? 'Payment under review' : 'You’re exploring AuraAlarm preview'}
              </p>
              <p className="text-xs text-indigo-200">
                {user?.subscriptionStatus === 'pending_verification'
                  ? 'Explore the app while we verify your payment. Your account data and paid features unlock after approval.'
                  : 'Explore the app before subscribing. Preview data is sample-only; subscribe to save alarms and use account features.'}
              </p>
            </div>
            <button
              onClick={openSubscription}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-extrabold hover:from-amber-400 hover:to-yellow-400"
            >
              {user ? 'View Subscription Plans' : 'Create Account to Subscribe'}
            </button>
            {user?.subscriptionStatus === 'pending_verification' && (
              <button
                onClick={refreshUser}
                className="shrink-0 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                Refresh Membership
              </button>
            )}
          </div>
        </div>
      )}

      {notificationPermission !== 'granted' && (
        notificationPermission !== 'unsupported' ? (
          <div className="bg-emerald-950/80 border-b border-emerald-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  {notificationPermission === 'denied'
                    ? '🔕 Phone alarm notifications are blocked'
                    : '🔔 Enable Lock-Screen & Home-Screen Alerts'}
                </p>
                <p className="text-xs text-emerald-200/90">
                  {notificationPermission === 'denied'
                    ? 'Allow notifications for AuraAlarm in your phone settings so alarms can ring and show on your screen.'
                    : 'Allow alerts so your alarm rings loudly and shows on your phone screen even when your phone is locked or on the home screen.'}
                </p>
              </div>
              {notificationPermission === 'default' && (
                <button
                  onClick={requestNotificationPermission}
                  className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-extrabold hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20"
                >
                  Allow Phone Alerts
                </button>
              )}
            </div>
          </div>
        ) : notificationService.isIOSBrowser() && !notificationService.isStandalonePWA() ? (
          <div className="bg-indigo-950/80 border-b border-indigo-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  📱 Enable iPhone Alarm Alerts & Reminders
                </p>
                <p className="text-xs text-indigo-200/85">
                  On iPhone, tap Safari Share (↑) → <strong>Add to Home Screen</strong>, then open AuraAlarm from your Home Screen to allow phone notifications & alarm reminders.
                </p>
              </div>
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="shrink-0 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold"
              >
                How to Install
              </button>
            </div>
          </div>
        ) : null
      )}

      {/* Nighttime Alarm Advice Banner */}
      {alarms.some(a => a && a.active) && (
        <div className="bg-slate-900/90 border-b border-indigo-500/20 py-2.5 px-4 text-center">
          <p className="text-xs text-indigo-300 font-medium">
            🌙 <strong>Tip for tonight:</strong> Keep AuraAlarm open and your phone plugged in tonight. Keep your phone's built-in alarm as a backup.
          </p>
        </div>
      )}

      {/* Habit Milestone / Notification Toast Bar */}
      {milestoneToast && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full animate-fadeIn">
          <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{milestoneToast}</span>
            </div>
            <button
              onClick={() => setMilestoneToast(null)}
              className="text-xs text-indigo-400 hover:text-white underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {shouldCheckReferralReminder
        && referralStats?.subscriberReferralsIn48Hours < 5
        && !referralStats?.subscriberWindowExpired && (
        <div role="status" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full animate-fadeIn">
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-amber-100 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <div>
                <p className="text-sm font-bold">{t('Your subscription expires within 2 days')}</p>
                <p className="mt-1 text-xs text-amber-100/80">
                  {t('You have {{count}} of 5 invited people with active paid subscriptions. Reach 5 to qualify for the ₦5,000 subscriber reward. Your current expiry date will not change.', {
                    count: referralStats.subscriberReferralsIn48Hours || 0
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('referrals')}
              className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300"
            >
              {t('View referral progress')}
            </button>
          </div>
        </div>
      )}

      {shouldCheckReferralReminder && referralReminderError && !referralStats && (
        <div role="alert" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full animate-fadeIn">
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/40 bg-amber-950/40 p-4 text-amber-100 shadow-xl sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">{t(referralReminderError)}</p>
            <button
              onClick={() => setActiveTab('referrals')}
              className="shrink-0 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300"
            >
              {t('View referral progress')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: ALARMS */}
        {activeTab === 'alarms' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Minimalist Hero Section */}
            <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Biometric Verified • E2EE Cloud Sync</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                  Minimalist Smart Alarms
                </h1>
                <p className="text-sm text-slate-300">
                  Wake up greeting your special someone, accompanied by adaptive time greetings ("Good morning", "Good afternoon", or "Good evening"), custom personal media chimes, and instant loved-one peace-of-mind alerts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab('world')}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-sm font-bold shadow-md transition-all duration-200 active:scale-95"
                >
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>World Clock</span>
                </button>
                <button
                  onClick={handleOpenAddAlarm}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all duration-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Alarm</span>
                </button>
              </div>
            </div>

            {/* Direct Monetization / VIP Member Callout */}
            {user?.subscriptionStatus === 'pending_verification' ? (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Payment Proof Submitted • Awaiting Bank Verification</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        PENDING
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Your transfer reference ({user.pendingReference || 'Under Review'}) is being verified against Fidelity Bank account 3004543080.
                    </p>
                  </div>
                </div>
                <button
                  onClick={openSubscription}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shrink-0"
                >
                  View Submitted Proof
                </button>
              </div>
            ) : hasActiveSubscription(user) ? (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Crown className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Aura {user.proPlanName || 'VIP Member'} Active</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {user.proBadge || 'VIP'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      All VIP sleep frequencies, couple safe pings, and unlimited geofence alerts are permanently unlocked.
                    </p>
                  </div>
                </div>
                <button
                  onClick={openSubscription}
                  className="text-xs font-semibold text-amber-400 hover:underline shrink-0"
                >
                  View Membership Pass
                </button>
              </div>
            ) : (
              <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
                    <Crown className="w-5 h-5 fill-slate-950" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Unlock Aura Pro & Duo Couples Pass</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        From $3.99 / ₦3,000
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      Sync wake screens with your partner, unlock 528Hz Solfeggio soundscapes, and get unlimited location arrival alarms.
                    </p>
                  </div>
                </div>
                <button
                  onClick={openSubscription}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all shrink-0 active:scale-95"
                >
                  Upgrade to VIP pro
                </button>
              </div>
            )}

            {/* Alarms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={handleToggleAlarm}
                  onToggleAmPm={handleToggleAmPm}
                  onEdit={handleOpenEditAlarm}
                  onDelete={handleDeleteAlarm}
                  onTest={testAlarm}
                />
              ))}

              {alarms.length === 0 && (
                <div className="col-span-2 text-center py-16 rounded-3xl glass-card border border-slate-800">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Active Alarms</h3>
                  <p className="text-xs text-slate-400 mb-4">Set your first wake schedule with loved one photo and custom audio.</p>
                  <button
                    onClick={handleOpenAddAlarm}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white"
                  >
                    Set Alarm Now
                  </button>
                </div>
              )}
            </div>

            {/* Quick Test Feature Callout */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Want to see how your customized alarm looks when ringing? Click the <strong>Play (▶)</strong> button on any alarm card.</span>
              </div>
              <button
                onClick={() => alarms[0] && testAlarm(alarms[0])}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
              >
                Test Preview
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: GLOBAL WORLD CLOCK & COUNTRY TIMEZONES */}
        {activeTab === 'world' && (
          <WorldClock onSetAlarmForCountry={handleSetAlarmForCountry} />
        )}

        {/* TAB 3: SLEEP AID SOUND GENERATOR */}
        {activeTab === 'sleep' && <SleepSoundPlayer onOpenUpgrade={openSubscription} />}

        {/* TAB 3: FITNESS & NUTRITION */}
        {activeTab === 'fitness' && <FitnessTracker />}

        {/* TAB 4: LOCATION REMINDERS */}
        {activeTab === 'location' && (
          <LocationReminders onOpenCalendar={() => setIsCalendarModalOpen(true)} />
        )}

        {/* TAB 5: DASHBOARD & STREAKS */}
        {activeTab === 'stats' && (
          <DashboardStats onOpenShare={handleOpenStreakShare} />
        )}

        {/* TAB 6: LOVED ONE PEACE OF MIND */}
        {activeTab === 'peace' && <LovedOnePeaceOfMind />}

        {activeTab === 'referrals' && (
          <ReferralRewards
            onLogin={() => openAuth('login')}
            onRegister={() => openAuth('register')}
          />
        )}

        {activeTab === 'stopwatch' && <Stopwatch />}
        {activeTab === 'settings' && <SettingsPage />}

      </main>

      {/* Fullscreen Alarm Ringing Modal */}
      <AlarmRingingModal />

      {/* Alarm Add/Edit Modal */}
      <AlarmEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        alarmToEdit={alarmToEdit}
        onSave={handleSaveAlarm}
      />

      {/* Biometric Security Modal */}
      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        initialTab={authModalTab}
        resetToken={resetToken}
        onResetComplete={handlePasswordResetComplete}
      />

      {/* Calendar Export Modal */}
      <CalendarExportModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* Feedback & Direct Support Modal (okeke12347@gmail.com) */}
      <FeedbackSupportModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Social Share Streak Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onOpenUpgrade={openSubscription}
      />

      {/* Install Mobile App Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Direct Monetization & VIP Pro Modal */}
      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onOpenAdmin={user?.isAdmin ? () => setIsAdminModalOpen(true) : undefined}
      />

      {/* Owner / Admin Payment Proof Verification Modal */}
      <AdminProofModal
        isOpen={isAdminModalOpen}
        isAdmin={user?.isAdmin}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-800/80 glass-panel py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">AuraAlarm</span>
            <span>• Next-Gen Alarm, Sleep & Wellness Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={openSubscription}
              aria-label="Aura Pro VIP"
              title="Aura Pro VIP"
              className="p-2.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 transition-colors"
            >
              <Crown className="w-5 h-5 fill-amber-400" />
            </button>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              aria-label="Owner Portal"
              title="Owner Portal"
              className="p-2.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              aria-label="Support: okeke12347@gmail.com"
              title="Support: okeke12347@gmail.com"
              className="p-2.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 transition-colors"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsBiometricModalOpen(true)}
              aria-label="E2EE 256-Bit"
              title="E2EE 256-Bit"
              className="p-2.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              aria-label="iCal Sync"
              title="iCal Sync"
              className="p-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
