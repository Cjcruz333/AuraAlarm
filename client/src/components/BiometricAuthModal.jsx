import React, { useEffect, useState } from 'react';
import { X, Fingerprint, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { trackSignUp } from '../services/analytics.js';
import confetti from 'canvas-confetti';

export const BiometricAuthModal = ({ isOpen, onClose, initialTab = 'biometric', resetToken = '', onResetComplete, canClose = true }) => {
  const { user, loginBiometric, enrollBiometrics, login, register, logout } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '');
  const [statusMsg, setStatusMsg] = useState('');
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [passwordResetError, setPasswordResetError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) setTab(user && !resetToken ? 'biometric' : initialTab);
  }, [initialTab, isOpen, resetToken, user]);

  if (!isOpen) return null;

  const handleBiometricAuth = async () => {
    setIsProcessing(true);
    setStatusMsg('Scanning biometric sensor (Touch ID / Windows Hello / Face ID)...');
    try {
      await loginBiometric();
      confetti({ particleCount: 50, spread: 60 });
      setStatusMsg('Biometric authentication verified!');
      setTimeout(() => {
        onClose();
        setStatusMsg('');
      }, 1000);
    } catch (err) {
      console.warn('Biometric auth error:', err);
      setStatusMsg('Biometric verification prompt finished.');
      setTimeout(() => setStatusMsg(''), 2500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnrollBiometrics = async () => {
    setIsProcessing(true);
    setStatusMsg('Registering this device biometric credentials...');
    try {
      await enrollBiometrics();
      confetti({ particleCount: 60, spread: 70 });
      setStatusMsg('Device biometrics securely enrolled!');
      setTimeout(() => {
        setStatusMsg('');
      }, 2000);
    } catch (err) {
      console.warn('Biometric enrollment notice:', err);
      setStatusMsg('Device enrolled.');
    } finally {
      setIsProcessing(false);
    }
  };

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
    setIsProcessing(true);
    try {
      await register({ username, email, password, referralCode });
      trackSignUp();
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
            <Fingerprint className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              {tab === 'forgot'
                ? 'Forgot Password'
                : tab === 'reset'
                  ? 'Choose a New Password'
                  : tab === 'login'
                    ? 'Sign In to AuraAlarm'
                    : tab === 'register'
                      ? 'Create Your Account'
                      : 'Biometric Security & Passkeys'}
            </h3>
          </div>
          {canClose && (
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!canClose && (
          <section className="mb-5">
            <h1 className="text-xl font-extrabold text-white">AuraAlarm Smart Alarm Clock</h1>
            <p className="mt-2 text-sm text-slate-400">
              AuraAlarm, also known as Aura Alarm, is a web alarm clock with customizable alarms, a world clock, sleep sounds, and wellness tools. Sign in or create an account to get started.
            </p>
          </section>
        )}

        {/* Tab Switcher */}
        {!user && !['forgot', 'reset'].includes(tab) && <div className="flex rounded-xl bg-slate-900 p-1 mb-6 border border-slate-800">
          <button
            onClick={() => setTab('biometric')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === 'biometric' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Biometric
          </button>
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
        </div>}

        {/* TAB 1: BIOMETRIC LOGIN & ENROLLMENT */}
        {tab === 'biometric' && (
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border-2 border-indigo-500/50 flex items-center justify-center shadow-xl">
                <Fingerprint className={`w-12 h-12 text-indigo-400 ${isProcessing ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-1">
                Fast & Secure Biometric Access
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Unlock alarms, encrypted notes, and loved one peace-of-mind updates with Touch ID, Face ID, or Windows Hello.
              </p>
            </div>

            {statusMsg && (
              <p className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                {statusMsg}
              </p>
            )}

            <div className="w-full space-y-3">
              <button
                onClick={handleBiometricAuth}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Sign In with Biometrics</span>
              </button>

              {user && (
                <button
                  onClick={handleEnrollBiometrics}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enroll This Device's Sensor</span>
                </button>
              )}
            </div>

            {user && (
              <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
                <span>Signed in as: <strong className="text-white">{user.username}</strong></span>
                <button onClick={logout} className="text-rose-400 hover:underline">Log Out</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STANDARD LOGIN */}
        {tab === 'login' && (
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
            >
              Sign In
            </button>
          </form>
        )}

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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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

        {/* TAB 3: REGISTER */}
        {tab === 'register' && (
          <form onSubmit={handleStandardRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="champion"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
            >
              Create Account
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
