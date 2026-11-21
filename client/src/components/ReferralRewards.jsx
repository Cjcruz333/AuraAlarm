import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Crown, Gift, LoaderCircle, LockKeyhole, RefreshCw, Share2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const formatNaira = amount => new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
}).format(amount);

const formatDate = date => new Date(date).toLocaleDateString();

export const ReferralRewards = ({ onLogin, onRegister }) => {
  const { user } = useAuth();
  const [referralData, setReferralData] = useState(null);
  const [paidRewards, setPaidRewards] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const canManagePayouts = user?.role === 'admin'
    || user?.email?.toLowerCase() === 'okeke12347@gmail.com';

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [paidResult, referralResult] = await Promise.all([
        api.getPaidReferralRewards(),
        user ? api.getMyReferrals() : Promise.resolve(null)
      ]);
      setPaidRewards(paidResult.payments || []);
      setReferralData(referralResult);
    } catch (err) {
      setError(err.message || 'Could not load referral information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const referralLink = referralData?.referralCode
    ? `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(referralData.referralCode)}`
    : '';

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setMessage('Your invite link has been copied.');
    } catch (err) {
      setError(`Could not copy the invite link: ${err.message}`);
    }
  };

  const requestReward = async (rewardId) => {
    setBusyId(rewardId);
    setMessage('');
    setError('');
    try {
      const result = await api.claimReferralReward(rewardId);
      setMessage(result.message);
      await loadData();
    } catch (err) {
      setError(err.message || 'Could not request this reward.');
    } finally {
      setBusyId(null);
    }
  };

  const loadAdminRequests = async () => {
    setBusyId('admin');
    setError('');
    try {
      const result = await api.getAdminReferralRequests();
      setAdminRequests(result.requests || []);
      setAdminOpen(true);
    } catch (err) {
      setError(`Could not load payout requests: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const markRewardPaid = async (rewardId) => {
    setBusyId(rewardId);
    setError('');
    setMessage('');
    try {
      const result = await api.adminMarkReferralRewardPaid(rewardId);
      setMessage(result.message);
      await loadAdminRequests();
      await loadData();
    } catch (err) {
      setError(`Could not mark reward as paid: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const stats = referralData?.stats;

  return (
    <div className="space-y-8 animate-fadeIn">
      <section className="space-y-5">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 sm:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">AuraAlarm referral rewards</p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">Invite friends. Earn real rewards.</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Choose a referral reward and track your progress from your account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/60 to-slate-900 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Quick invite reward</p>
                <h2 className="mt-2 text-3xl font-black text-white">{formatNaira(2000)}</h2>
              </div>
              <Users className="h-8 w-8 text-indigo-300" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">Invite 10 people within 24 hours</p>
            <p className="mt-1 text-sm text-slate-400">They must create an account using your referral link during the same 24-hour period.</p>
          </article>

          <article className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 p-5 shadow-lg shadow-amber-950/20 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Subscriber reward</p>
                <h2 className="mt-2 text-3xl font-black text-white">{formatNaira(5000)}</h2>
              </div>
              <Crown className="h-8 w-8 text-amber-300" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">Invite 5 people who subscribe</p>
            <p className="mt-1 text-sm text-slate-400">Each invited person must have an active, verified paid subscription for you to qualify.</p>
          </article>
        </div>

        <p className="px-1 text-xs text-slate-400">
          Request earned rewards while signed in. Payouts are handled manually, and the public payment history only includes payouts confirmed by an admin.
        </p>
      </section>

      {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</p>}

      {!user ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center">
          <LockKeyhole className="mx-auto mb-3 h-8 w-8 text-indigo-300" />
          <h2 className="text-lg font-bold text-white">Sign in to get your invite link and request rewards</h2>
          <p className="mt-2 text-sm text-slate-400">Create an account to receive your unique referral link and track eligible invites.</p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={onLogin} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">Sign in</button>
            <button onClick={onRegister} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">Create account</button>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-indigo-300"><Users className="h-5 w-5" /><h2 className="font-bold text-white">Your invite link</h2></div>
              <div className="flex gap-2">
                <input readOnly value={referralLink} aria-label="Your referral link" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200" />
                <button onClick={copyReferralLink} disabled={!referralLink} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
                  <Copy className="h-4 w-4" /><span className="hidden sm:inline">Copy</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Invitees need to use this link when they create an account.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /><h2 className="font-bold text-white">Your progress</h2></div>
              {loading ? <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" /> : (
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300"><strong className="text-white">{stats?.referralsIn24Hours || 0}/10</strong> new accounts in the last 24 hours</p>
                  <p className="text-slate-300"><strong className="text-white">{stats?.activeSubscribers || 0}/5</strong> invited users with an active paid subscription</p>
                  <p className="text-xs text-slate-500">{stats?.totalReferrals || 0} total invited accounts</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">Your rewards</h2>
              <button onClick={loadData} disabled={loading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" title="Refresh rewards"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
            </div>
            {!referralData?.rewards?.length ? (
              <p className="text-sm text-slate-400">No rewards earned yet. Share your invite link to get started.</p>
            ) : (
              <div className="space-y-3">
                {referralData.rewards.map(reward => (
                  <div key={reward.id} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-white">{reward.title}</p>
                      <p className="mt-1 text-sm text-amber-300">{formatNaira(reward.amount)}</p>
                      <p className="mt-1 text-xs capitalize text-slate-400">{reward.status === 'requested' ? 'Payout requested' : reward.status}</p>
                    </div>
                    {reward.status === 'available' && (
                      <button onClick={() => requestReward(reward.id)} disabled={busyId === reward.id} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                        {busyId === reward.id ? 'Requesting…' : 'Request payout'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {canManagePayouts && (
        <section className="rounded-2xl border border-amber-500/20 bg-slate-900/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold text-white">Admin payout queue</h2><p className="text-xs text-slate-400">Mark a reward paid only after the transfer is complete.</p></div>
            <button onClick={loadAdminRequests} disabled={busyId === 'admin'} className="rounded-xl border border-amber-500/30 px-4 py-2 text-sm font-bold text-amber-300 hover:bg-amber-500/10">
              {busyId === 'admin' ? 'Loading…' : 'View requests'}
            </button>
          </div>
          {adminOpen && (
            <div className="mt-4 space-y-3">
              {!adminRequests.length && <p className="text-sm text-slate-400">No payout requests are waiting.</p>}
              {adminRequests.map(reward => (
                <div key={reward.id} className="flex flex-col gap-3 rounded-xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{reward.userName} · {reward.userEmail}</p>
                    <p className="text-sm text-slate-300">{reward.title} — {formatNaira(reward.amount)}</p>
                  </div>
                  <button onClick={() => markRewardPaid(reward.id)} disabled={busyId === reward.id} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50">
                    {busyId === reward.id ? 'Saving…' : 'Mark paid'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center gap-2"><Share2 className="h-5 w-5 text-emerald-300" /><h2 className="text-lg font-bold text-white">Confirmed referral payments</h2></div>
        {loading && !paidRewards.length ? <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" /> : paidRewards.length ? (
          <div className="space-y-3">
            {paidRewards.map(payment => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                <div><p className="font-semibold text-white">{payment.displayName}</p><p className="text-xs text-slate-400">{payment.title} · Paid {formatDate(payment.paidAt)}</p></div>
                <p className="font-bold text-emerald-300">{formatNaira(payment.amount)}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400">No referral payouts have been confirmed yet. This list will show only real rewards marked paid by an admin.</p>}
      </section>
    </div>
  );
};
