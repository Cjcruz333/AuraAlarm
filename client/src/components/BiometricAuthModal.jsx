import React, { useEffect, useState } from 'react';
import { X, Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { trackSignUp, trackTrialStarted } from '../services/analytics.js';

export const BiometricAuthModal = ({ isOpen, onClose, initialTab = 'login', resetToken = '', onResetComplete, canClose = true }) => {
  const { user, login, register, logout } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [passwordResetError, setPasswordResetError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (resetToken) {
        setTab('reset');
      } else if (user) {
        setTab('account');
      } else {
        setTab(initialTab === 'account' || initialTab === 'biometric' ? 'login' : initialTab);
      }
    }
  }, [initialTab, isOpen, resetToken, user]);

  if (!isOpen) return null;

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await login(username, password);
      onClose();
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStandardRegister = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please agree to the Terms and Privacy Policy to create an account.');
      return;
    }
    setIsProcessing(true);
    try {
      await register({ username, email, password, referralCode });
      trackSignUp();
      trackTrialStarted();
      onClose();
    } catch (err) {
      alert(err.message || 'Registration failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setPasswordResetMessage('');
    setPasswordResetError(false);
    try {
      const result = await api.requestPasswordReset(email);
      setPasswordResetMessage(result.message);
    } catch (err) {
      setPasswordResetMessage(err.message || 'Could not request a password reset.');
      setPasswordResetError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordResetMessage('The passwords do not match.');
      setPasswordResetError(true);
      return;
    }

    setIsProcessing(true);
    setPasswordResetMessage('');
    setPasswordResetError(false);
    try {
      const result = await api.resetPassword(resetToken, newPassword);
      onResetComplete?.();
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTab('login');
      setPasswordResetMessage(result.message);
    } catch (err) {
      setPasswordResetMessage(err.message || 'Could not reset the password.');
      setPasswordResetError(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const openForgotPassword = () => {
    setEmail(username.includes('@') ? username : '');
    setPasswordResetMessage('');
    setPasswordResetError(false);
    setTab('forgot');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              {tab === 'forgot'
                ? 'Forgot Password'
                : tab === 'reset'
                  ? 'Choose a New Password'
                  : tab === 'login'
                    ? 'Sign In to AuraAlarm'
                    : tab === 'register'
                      ? 'Create Your Account'
                      : 'Account Profile'}
            </h3>
          </div>
          {canClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!canClose && (
          <section className="mb-5">
            <h1 className="text-xl font-extrabold text-white">AuraAlarm Smart Alarm Clock</h1>
            <p className="mt-2 text-sm text-slate-400">
              AuraAlarm is a web alarm clock with customizable alarms, a world clock, sleep sounds, and wellness tools. Sign in or create an account to get started.
            </p>
          </section>
        )}

        {/* Tab Switcher for non-logged-in users */}
        {!user && !['forgot', 'reset'].includes(tab) && (
          <div className="flex rounded-xl bg-slate-900 p-1 mb-6 border border-slate-800">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* TAB: SIGNED IN PROFILE OVERVIEW */}
        {user && tab === 'account' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
              <User className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-0.5">
                {user.username}
              </h4>
              <p className="text-xs text-slate-400">
                {user.email || 'No email attached'}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Secure sign-in
                </span>
                {user.isPro && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {user.proBadge || 'VIP PRO'}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full space-y-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  logout();
                  setTab('login');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold transition-colors border border-slate-700"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* TAB: STANDARD LOGIN */}
        {tab === 'login' && !user && (
          <form onSubmit={handleStandardLogin} className="space-y-4">
            {passwordResetMessage && (
              <p role="status" className={`text-xs rounded-xl px-3 py-2 ${passwordResetError ? 'text-rose-300 bg-rose-500/10' : 'text-emerald-300 bg-emerald-500/10'}`}>
                {passwordResetMessage}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username or email"
                autoComplete="username"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end -mt-2">
              <button type="button" onClick={openForgotPassword} className="text-xs text-indigo-300 hover:text-indigo-200">
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-60"
            >
              {isProcessing ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* TAB: FORGOT PASSWORD */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-400">
              Enter the email address on your account and we will send a password reset link if it exists.
            </p>
            {passwordResetMessage && (
              <p role="status" className={`text-xs rounded-xl px-3 py-2 ${passwordResetError ? 'text-rose-300 bg-rose-500/10' : 'text-emerald-300 bg-emerald-500/10'}`}>
                {passwordResetMessage}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Account email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-60"
            >
              {isProcessing ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setTab('login')} className="w-full text-xs text-slate-400 hover:text-white">
              Back to Sign In
            </button>
          </form>
        )}

        {/* TAB: RESET PASSWORD */}
        {tab === 'reset' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-xs text-slate-400">Choose a new password with at least 12 characters.</p>
            {passwordResetMessage && (
              <p role="status" className={`text-xs rounded-xl px-3 py-2 ${passwordResetError ? 'text-rose-300 bg-rose-500/10' : 'text-emerald-300 bg-emerald-500/10'}`}>
                {passwordResetMessage}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={12}
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Confirm new password</label>
              <input
                type="password"
                required
                minLength={12}
                maxLength={72}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !resetToken}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-60"
            >
              {isProcessing ? 'Updating...' : 'Reset Password'}
            </button>
            <button type="button" onClick={() => setTab('login')} className="w-full text-xs text-slate-400 hover:text-white">
              Back to Sign In
            </button>
          </form>
        )}

        {/* TAB: REGISTER */}
        {tab === 'register' && !user && (
          <form onSubmit={handleStandardRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="champion"
                autoComplete="username"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@auraalarm.app"
                autoComplete="email"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Referral code (optional)</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter your invite code"
                autoComplete="off"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Terms and Privacy Policy Mandatory Agreement Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
                />
                <span className="leading-tight">
                  By signing up you agree to our{' '}
                  <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                    Privacy Policy
                  </a>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !agreedToTerms}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
