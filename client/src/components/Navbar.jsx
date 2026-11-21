import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Activity, 
  MapPin, 
  BarChart3, 
  Heart, 
  Fingerprint, 
  Share2, 
  Calendar, 
  Mail, 
  Flame, 
  ShieldCheck,
  Smartphone,
  Crown,
  Globe,
  Menu,
  X,
  Gift,
  Timer,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAlarm } from '../context/AlarmContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenBiometrics, 
  onOpenFeedback, 
  onOpenCalendar, 
  onOpenShare,
  onOpenInstall,
  onOpenUpgrade,
  onOpenAdmin
}) => {
  const { user } = useAuth();
  const { currentTime } = useAlarm();
  const { t, locale, formatTime } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const formattedTime = formatTime(currentTime);

  const formattedDate = currentTime.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const greeting = currentTime.getHours() < 12
    ? t('Good morning')
    : currentTime.getHours() < 17
      ? t('Good afternoon')
      : t('Good evening');
  const displayName = user?.name?.trim() || user?.username || '';
  const firstName = displayName.split(/\s+/)[0];

  const navItems = [
    { id: 'alarms', label: t('Alarms'), icon: Bell },
    { id: 'world', label: t('World Clock'), icon: Globe },
    { id: 'sleep', label: t('Sleep Aid'), icon: Moon },
    { id: 'fitness', label: t('Fitness & Fuel'), icon: Activity },
    { id: 'location', label: t('Location Alerts'), icon: MapPin },
    { id: 'stats', label: t('Dashboard'), icon: BarChart3 },
    { id: 'peace', label: t('Loved One'), icon: Heart },
    { id: 'referrals', label: t('Refer & Earn'), icon: Gift },
    { id: 'stopwatch', label: t('Stopwatch'), icon: Timer },
    { id: 'settings', label: t('Settings'), icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 pwa-safe-area-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16 lg:h-20">
          
          {/* Logo & Clock */}
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src="/icons/icon.svg"
                alt=""
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-lg shadow-indigo-500/20 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent whitespace-nowrap">
                    AuraAlarm
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    E2EE
                  </span>
                </div>
                <p
                  className="text-[10px] sm:text-xs text-slate-400 font-medium truncate"
                  title={user ? `${greeting}, ${displayName}` : formattedTime}
                >
                  <span className="hidden sm:inline">{formattedDate} • </span>
                  <span className="text-slate-200 font-semibold">
                    {user ? `${greeting}, ${firstName}` : formattedTime}
                  </span>
                  {user && <span className="hidden sm:inline"> • {formattedTime}</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Streak */}
          <div className="hidden xl:flex items-center gap-2">
            
            {/* VIP PRO / Upgrade Membership Button */}
            <button
              onClick={onOpenUpgrade}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-md ${
                user?.isPro
                  ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border border-amber-400 text-amber-300 shadow-amber-500/10'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 hover:scale-105 active:scale-95'
              }`}
              title={user?.isPro ? 'Aura Pro VIP Member Active' : 'Upgrade to Aura Pro Membership'}
            >
              <Crown className={`w-3.5 h-3.5 ${user?.isPro ? 'text-amber-400 fill-amber-400' : 'fill-slate-950'}`} />
              <span>{user?.isPro ? (user.proBadge || 'PRO VIP') : 'Upgrade PRO'}</span>
            </button>

            {/* Gamification Streak Pill */}
            <button
              onClick={() => setActiveTab('stats')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors"
              title="Current Daily Wake Streak"
            >
              <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>{user?.streak || 7} Days</span>
            </button>

            {/* Social Share Button */}
            <button
              onClick={onOpenShare}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 transition-colors"
              title="Share Streak & Milestone"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Calendar Export */}
            <button
              onClick={onOpenCalendar}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/50 transition-colors"
              title="Export to Calendar (.ics)"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Feedback / Support Inquiry */}
            <button
              onClick={onOpenFeedback}
              className="p-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/25 transition-colors relative"
              title="Direct Support / Feedback (okeke12347@gmail.com)"
            >
              <Mail className="w-4 h-4" />
            </button>

            {user?.isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-2 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
                title="Owner Portal: Review Customer Payment Proofs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Biometric Authenticator Status */}
            <button
              onClick={onOpenBiometrics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              title="Biometric Security (Touch ID / Face ID)"
            >
              <Fingerprint className="w-4 h-4" />
              <span className="hidden sm:inline">Secure</span>
            </button>

            {/* Install Mobile App Button */}
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all shadow-sm"
              title="Install Mobile App on Phone"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden lg:inline">Install App</span>
            </button>

            {/* User Avatar with Loved One Indicator */}
            <div 
              onClick={() => setActiveTab('peace')}
              className="cursor-pointer relative w-9 h-9 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500 transition-colors"
              title="Loved One Settings"
            >
              {user?.lovedOne?.photoUrl ? (
                <img 
                  src={user.lovedOne.photoUrl} 
                  alt={user.lovedOne.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {user?.name?.[0] || 'A'}
                </div>
              )}
              {user?.isPro && (
                <div className="absolute top-0 right-0 bg-amber-500 rounded-bl-md p-0.5 shadow">
                  <Crown className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                </div>
              )}
            </div>

          </div>

          <div className="relative flex xl:hidden items-center gap-2 shrink-0">
            <button
              onClick={onOpenUpgrade}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20"
              title={user?.isPro ? 'Membership' : 'View subscription plans'}
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span>{user?.isPro ? (user.proBadge || 'PRO') : 'Upgrade'}</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(open => !open)}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {isMobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl z-50">
                <button
                  onClick={() => { setActiveTab('stats'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-amber-300 hover:bg-slate-800"
                >
                  <Flame className="w-4 h-4" /> {user?.streak || 7} day streak
                </button>
                <button
                  onClick={() => { onOpenShare(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Share2 className="w-4 h-4" /> Share streak
                </button>
                <button
                  onClick={() => { onOpenCalendar(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Calendar className="w-4 h-4" /> Calendar
                </button>
                <button
                  onClick={() => { onOpenFeedback(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Mail className="w-4 h-4" /> Support
                </button>
                {user?.isAdmin && (
                  <button
                    onClick={() => { onOpenAdmin(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <ShieldCheck className="w-4 h-4" /> Owner portal
                  </button>
                )}
                <button
                  onClick={() => { onOpenBiometrics(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Fingerprint className="w-4 h-4" /> Security
                </button>
                <button
                  onClick={() => { onOpenInstall(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Smartphone className="w-4 h-4" /> Install app
                </button>
                <button
                  onClick={() => { setActiveTab('stopwatch'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Timer className="w-4 h-4" /> {t('Stopwatch')}
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4" /> {t('Settings')}
                </button>
                <button
                  onClick={() => { setActiveTab('peace'); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  <Heart className="w-4 h-4" /> Loved one settings
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Navigation stays on its own row to avoid crowding the header controls. */}
        <nav className="flex overflow-x-auto py-2 gap-2 border-t border-slate-800/60 no-scrollbar xl:justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
