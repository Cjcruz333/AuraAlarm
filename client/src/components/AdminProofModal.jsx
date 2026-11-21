import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Eye, 
  RefreshCw,
  Building2,
  User,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Lock,
  PhoneCall,
  Check
} from 'lucide-react';
import { api } from '../services/api.js';

export const AdminProofModal = ({ isOpen, onClose }) => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'

  // Dedicated In-App Rejection Modal State (Replaces broken browser prompt)
  const [rejectModalProof, setRejectModalProof] = useState(null);
  const [rejectReason, setRejectReason] = useState('Fake Transfer - Funds not received in Fidelity Bank account 3004543080');

  useEffect(() => {
    if (isOpen) {
      loadProofs();
    }
  }, [isOpen]);

  const loadProofs = async ({ preserveMessage = false } = {}) => {
    setLoading(true);
    if (!preserveMessage) setActionMsg('');
    try {
      const res = await api.getAdminProofs();
      setProofs(res.proofs || []);
    } catch (err) {
      console.error('Failed to load proofs:', err);
      setActionMsg(`Could not load payment proofs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proofId) => {
    if (!confirm('Are you sure you want to approve this payment and grant VIP Pro access to this user? Only approve after confirming the funds dropped into your Fidelity Bank account 3004543080.')) return;
    setProcessingId(proofId);
    setActionMsg('');
    try {
      const res = await api.adminApproveProof(proofId);
      setActionMsg(res.message || 'Payment approved successfully!');
      await loadProofs({ preserveMessage: true });
    } catch (err) {
      setActionMsg('Failed to approve: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (proof) => {
    setRejectModalProof(proof);
    setRejectReason('Fake Transfer - Funds not received in Fidelity Bank account 3004543080');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalProof) return;
    if (!rejectReason.trim()) {
      setActionMsg('Enter a reason before rejecting this payment proof.');
      return;
    }

    setProcessingId(rejectModalProof.id);
    setActionMsg('');

    try {
      const res = await api.adminRejectProof(rejectModalProof.id, rejectReason);
      setActionMsg(res.message || `❌ Proof rejected. Pro access blocked for ${rejectModalProof.userName}.`);
      setRejectModalProof(null);
      await loadProofs({ preserveMessage: true });
    } catch (err) {
      setActionMsg('Failed to reject: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  const filteredProofs = proofs.filter(p => {
    if (filter === 'pending') return p.status === 'pending_verification';
    if (filter === 'approved') return p.status === 'approved' || p.status === 'success';
    if (filter === 'rejected') return p.status === 'rejected';
    return true;
  });

  const pendingCount = proofs.filter(p => p.status === 'pending_verification').length;

  // This checks formatting only; it cannot confirm a credit with Fidelity Bank.
  const checkSessionFraudRisk = (ref) => {
    if (!ref) return { isRisk: true, reason: 'No reference or session ID provided. This is not a bank verification.' };
    const clean = String(ref).trim();
    if (clean.length !== 30) {
      return { 
        isRisk: true, 
        reason: `This reference has ${clean.length} characters. Format checks cannot determine whether money was received; verify the credit directly with Fidelity Bank.` 
      };
    }
    if (!/^\d+$/.test(clean)) {
      return { isRisk: true, reason: 'This reference contains non-numeric characters. Format checks cannot confirm whether money was received.' };
    }
    return { isRisk: false, reason: 'Numeric reference format only. It is not verified by Fidelity Bank; confirm the credit in your bank account before approving.' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl glass-panel border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl my-6 max-h-[92vh] flex flex-col bg-slate-950/95 overflow-hidden">
        
        {/* Header */}
        <div className="pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Owner Payment Verification Portal</span>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] animate-pulse">
                      {pendingCount} Pending
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Settlement Account: <strong className="text-amber-300">Fidelity Bank • 3004543080 (OKEKE CHIEMERIA JOHN)</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadProofs}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Refresh Proofs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Bank Action Bar */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <a
              href="https://online.fidelitybank.ng"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-semibold transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open Fidelity Online Banking</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Phone USSD Balance Check: <strong>*770*0#</strong></span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Manual bank-credit verification required; no bank API is connected</span>
            </div>
          </div>
        </div>

        {/* Status notification */}
        {actionMsg && (
          <div className="my-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-between shrink-0">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 my-4 shrink-0 overflow-x-auto pb-1">
          {[
            { id: 'pending', label: `Pending Verification (${pendingCount})` },
            { id: 'approved', label: 'Approved & Active' },
            { id: 'rejected', label: 'Rejected (Fake / No Credit)' },
            { id: 'all', label: `All Records (${proofs.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Proofs List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {filteredProofs.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span>No payment proofs found in this filter category.</span>
            </div>
          ) : (
            filteredProofs.map((item) => {
              const fraudCheck = checkSessionFraudRisk(item.transactionReference || item.reference);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.status === 'pending_verification'
                      ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40 shadow-lg'
                      : item.status === 'approved' || item.status === 'success'
                      ? 'bg-slate-900/60 border-emerald-500/30'
                      : 'bg-slate-900/40 border-rose-500/30 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{item.planName || 'Aura Pro'}</span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                          {item.currency} {item.amount}
                        </span>
                        <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                          item.status === 'pending_verification'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : item.status === 'approved' || item.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}>
                          {item.status === 'pending_verification' ? '⏳ PENDING REVIEW' : item.status === 'rejected' ? '❌ REJECTED' : '✅ APPROVED'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        User: <strong className="text-slate-200">{item.userName}</strong> ({item.userEmail})
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Transfer Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Sender Account Name</span>
                      <strong className="text-white text-xs">{item.senderName || 'Not specified'}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Sending Bank</span>
                      <strong className="text-cyan-300 text-xs">{item.senderBank || 'Direct Transfer'}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Transaction Ref / Session ID</span>
                      <strong className="text-amber-400 font-mono text-[11px] block truncate" title={item.transactionReference}>
                        {item.transactionReference || item.reference || 'None'}
                      </strong>
                    </div>
                  </div>

                  {/* Anti-Fraud Inspection Badge (Pending status only) */}
                  {item.status === 'pending_verification' && (
                    <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 mb-3 ${
                      fraudCheck.isRisk
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}>
                      {fraudCheck.isRisk ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="block text-[11px] uppercase tracking-wider font-extrabold">
                          {fraudCheck.isRisk ? '⚠️ Reference format warning' : '🔍 Reference format only'}
                        </strong>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {fraudCheck.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rejection Note (If rejected) */}
                  {item.status === 'rejected' && item.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 mb-3 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Rejection Reason:</strong> {item.rejectionReason}
                      </div>
                    </div>
                  )}

                  {/* Receipt Image Preview & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div>
                      {item.receiptUrl ? (
                        <button
                          onClick={() => setSelectedReceipt(item.receiptUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View Uploaded Bank Receipt</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No receipt file uploaded (Reference only)</span>
                      )}
                    </div>

                    {/* Actions for Pending Proofs */}
                    {item.status === 'pending_verification' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openRejectModal(item)}
                          disabled={processingId === item.id}
                          className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold transition-all disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>Reject (Fake Transfer)</span>
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
                          disabled={processingId === item.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{processingId === item.id ? 'Approving...' : 'Approve & Unlock Pro'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* IN-APP REJECTION DIALOG (100% RELIABLE, NO BROKEN BROWSER PROMPT) */}
        {rejectModalProof && createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-lg bg-slate-950 p-6 rounded-3xl border-2 border-rose-500/50 shadow-2xl flex flex-col space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span>Reject Payment & Block Access</span>
                </div>
                <button
                  onClick={() => setRejectModalProof(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">User:</span>
                  <strong className="text-white">{rejectModalProof.userName} ({rejectModalProof.userEmail})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Claimed Amount:</span>
                  <strong className="text-amber-400 font-mono">{rejectModalProof.currency} {rejectModalProof.amount}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sender Bank:</span>
                  <strong className="text-cyan-300">{rejectModalProof.senderBank}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session ID:</span>
                  <strong className="text-amber-300 font-mono text-[11px] break-all">{rejectModalProof.transactionReference}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select Quick Reason:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                  {[
                    'Fake Transfer / Forged Receipt Slip',
                    'No Credit Alert in Fidelity Bank (3004543080)',
                    'Invalid NIP Session ID',
                    'Incorrect Amount / Underpayment'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`text-[11px] p-2 rounded-xl text-left border transition-all ${
                        rejectReason === preset
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Custom Rejection Explanation:
                </label>
                <textarea
                  rows="2"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Enter rejection reason..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalProof(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={processingId === rejectModalProof.id}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {processingId === rejectModalProof.id ? 'Rejecting...' : 'Confirm Rejection & Block Access'}
                </button>
              </div>

            </div>
          </div>,
          document.body
        )}

        {/* Modal for viewing receipt image enlarged */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="relative max-w-2xl max-h-[85vh] bg-slate-950 p-4 rounded-2xl border border-slate-700 flex flex-col">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h4 className="text-xs font-bold text-slate-300 mb-2">Customer Transfer Receipt Screenshot</h4>
              <div className="overflow-auto max-h-[75vh]">
                <img
                  src={selectedReceipt}
                  alt="Transfer Receipt"
                  className="w-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
