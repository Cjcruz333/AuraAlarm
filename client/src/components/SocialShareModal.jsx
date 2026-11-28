import React, { useState, useRef } from 'react';
import { 
  X, 
  Share2, 
  Flame, 
  Copy, 
  Check, 
  Twitter, 
  MessageCircle, 
  Sparkles, 
  Crown, 
  Download, 
  Heart, 
  ShieldCheck, 
  Palette,
  Edit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import confetti from 'canvas-confetti';

export const SocialShareModal = ({ isOpen, onClose, onOpenUpgrade }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState('gold'); // 'gold' | 'astral' | 'diamond' | 'obsidian'
  const [customQuote, setCustomQuote] = useState(user?.lovedOne?.message || 'Rise and shine, champion! Today is yours.');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);

  const cardRef = useRef(null);

  if (!isOpen) return null;

  const expiresAt = Date.parse(user?.proExpiresAt || '');
  const isSubscribed = Boolean(
    user?.isPro &&
    user.username !== 'demo' &&
    user.subscriptionStatus === 'active' &&
    (
      (user.proPlan === 'pro_lifetime' && !user.proExpiresAt) ||
      (Number.isFinite(expiresAt) && expiresAt > Date.now())
    )
  );

  if (!isSubscribed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <div className="w-full max-w-md rounded-3xl glass-panel border border-amber-500/40 p-7 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5">
            <Crown className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Subscribe to share your streak</h2>
          <p className="text-sm text-slate-300 mb-6">
            Choose an AuraAlarm plan to create and share your daily streak graphic.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={onOpenUpgrade}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-sm font-extrabold hover:from-amber-400 hover:to-yellow-400"
            >
              View Subscription Plans
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-bold hover:bg-slate-700"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const streakDays = user?.streak || 21;
  const isVip = Boolean(user?.isPro);

  const shareText = `👑 Just unlocked Day ${streakDays} on AuraAlarm VIP Pro! Waking up with synchronized circadian frequencies and loved one alerts. #AuraAlarm #AuraProVIP #MorningRoutine #MasterOfDawn`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 }
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  // Generate crisp VIP Card image via native HTML5 Canvas
  const handleDownloadCard = () => {
    setDownloadingImg(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      // Background Gradient
      let grad = ctx.createLinearGradient(0, 0, 1200, 630);
      if (selectedSkin === 'gold') {
        grad.addColorStop(0, '#1a1300');
        grad.addColorStop(0.5, '#0a0d14');
        grad.addColorStop(1, '#2a1a00');
      } else if (selectedSkin === 'astral') {
        grad.addColorStop(0, '#0f051d');
        grad.addColorStop(0.5, '#0a0d14');
        grad.addColorStop(1, '#1b0a2a');
      } else if (selectedSkin === 'diamond') {
        grad.addColorStop(0, '#001a24');
        grad.addColorStop(0.5, '#0a0d14');
        grad.addColorStop(1, '#002633');
      } else {
        grad.addColorStop(0, '#0a0d14');
        grad.addColorStop(1, '#151922');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Gold Metallic Border
      ctx.lineWidth = 12;
      ctx.strokeStyle = selectedSkin === 'gold' ? '#f59e0b' : '#6366f1';
      ctx.strokeRect(30, 30, 1140, 570);

      // Top Tag
      ctx.fillStyle = selectedSkin === 'gold' ? '#f59e0b' : '#818cf8';
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isVip ? '👑 VIP FOUNDER • DAILY WAKE STREAK' : '🔥 DAILY WAKE STREAK • AURAALARM', 600, 120);

      // Main Streak Count
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 130px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${streakDays} DAYS`, 600, 260);

      // Subtitle
      ctx.fillStyle = '#10b981';
      ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Consistency Score: 94% • Master of Dawn', 600, 320);

      // Quote box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.roundRect ? ctx.roundRect(150, 370, 900, 90, 20) : ctx.fillRect(150, 370, 900, 90);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'italic 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`"${customQuote}"`, 600, 425);

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('POWERED BY AURAALARM • SMART ALARM & SLEEP AID SUITE', 600, 540);

      // Convert to downloadable image
      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AuraAlarm-VIP-Streak-${streakDays}Days.png`;
      link.href = imageUri;
      link.click();

      confetti({ particleCount: 70, spread: 70 });
    } catch (err) {
      console.error('Download card error:', err);
    } finally {
      setDownloadingImg(false);
    }
  };

  const skinStyles = {
    gold: {
      cardBg: 'bg-gradient-to-br from-amber-950/80 via-slate-950 to-amber-950/60 border-amber-500/60 shadow-amber-500/20 ring-1 ring-amber-500/40',
      tagBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
      streakText: 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent',
      glow: 'from-amber-500/20 via-yellow-500/10 to-transparent'
    },
    astral: {
      cardBg: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 border-indigo-500/50 shadow-indigo-500/20 ring-1 ring-purple-500/40',
      tagBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      streakText: 'bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent',
      glow: 'from-indigo-500/20 via-purple-500/10 to-transparent'
    },
    diamond: {
      cardBg: 'bg-gradient-to-br from-cyan-950 via-slate-950 to-sky-950 border-cyan-500/50 shadow-cyan-500/20 ring-1 ring-cyan-500/40',
      tagBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      streakText: 'bg-gradient-to-r from-cyan-300 via-teal-200 to-sky-300 bg-clip-text text-transparent',
      glow: 'from-cyan-500/20 via-teal-500/10 to-transparent'
    },
    obsidian: {
      cardBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-black border-slate-700 shadow-slate-900/50',
      tagBg: 'bg-slate-800 text-slate-300 border-slate-700',
      streakText: 'text-white',
      glow: 'from-slate-700/10 via-transparent to-transparent'
    }
  };

  const currentSkin = skinStyles[selectedSkin] || skinStyles.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 overflow-hidden">
        
        {/* Golden ambient aura */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">VIP Morning Streak Pass</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  VIP PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Export & share your prestigious wake-up consistency</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VIP Theme Skin Selector */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800 mb-5 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5 pl-2 text-[11px]">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Card Theme:</span>
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'gold', label: '👑 24K Gold' },
              { id: 'astral', label: '✨ Astral' },
              { id: 'diamond', label: '💎 Diamond' },
              { id: 'obsidian', label: 'Classic' }
            ].map(skin => (
              <button
                key={skin.id}
                onClick={() => setSelectedSkin(skin.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  selectedSkin === skin.id
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-400 hover:text-white bg-slate-900/60'
                }`}
              >
                {skin.label}
              </button>
            ))}
          </div>
        </div>

        {/* BEAUTIFUL VIP SHAREABLE CARD PREVIEW */}
        <div 
          ref={cardRef}
          className={`relative p-6 sm:p-8 rounded-3xl border shadow-2xl text-center mb-5 overflow-hidden transition-all duration-300 ${currentSkin.cardBg}`}
        >
          {/* Animated Glow Shimmer */}
          <div className={`absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br ${currentSkin.glow} rounded-full blur-2xl pointer-events-none`} />
          <div className="absolute top-3 left-3 text-amber-400/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="absolute bottom-3 right-3 text-amber-400/30">
            <Sparkles className="w-4 h-4" />
          </div>

          {/* Top Pill */}
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border shadow-sm ${currentSkin.tagBg}`}>
            <Crown className="w-4 h-4 fill-current text-amber-400" />
            <span>{isVip ? '👑 VIP FOUNDER' : '🔥 DAILY WAKE STREAK'}</span>
          </div>

          {/* Huge Golden Streak Days */}
          <div className="my-2">
            <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tight ${currentSkin.streakText}`}>
              {streakDays}
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 font-sans block mt-1">
              CONSECUTIVE DAYS
            </span>
          </div>

          <p className="text-xs text-slate-300 font-semibold mb-4 mt-2">
            Consistency Score: <span className="text-emerald-400 font-bold">94%</span> • <span className="text-amber-300">Master of Dawn 👑</span>
          </p>

          {/* Loved One Quote / Motivation */}
          <div className="relative group p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-200 italic mb-4 shadow-inner">
            <p>"{customQuote}"</p>
            
            {user?.lovedOne?.name && (
              <span className="text-[10px] text-amber-400/80 block mt-1 font-semibold font-sans not-italic">
                — Dedicated with love to {user.lovedOne.name} ❤️
              </span>
            )}

            <button
              onClick={() => setIsEditingQuote(!isEditingQuote)}
              className="absolute top-2 right-2 p-1 rounded text-slate-500 hover:text-white transition-colors"
              title="Edit Motivation Quote"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>

          {isEditingQuote && (
            <div className="mb-4 animate-fadeIn">
              <input
                type="text"
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                placeholder="Type your personal morning motivation..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          )}

          {/* Watermark */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-mono pt-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>POWERED BY AURAALARM • SMART ALARM & SLEEP AID</span>
          </div>
        </div>

        {/* Share & Download Actions */}
        <div className="space-y-2.5 relative z-10">
          
          {/* Action Row: Socials */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleShareTwitter}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#1DA1F2]/15 hover:bg-[#1DA1F2]/25 text-[#1DA1F2] border border-[#1DA1F2]/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Twitter className="w-4 h-4 fill-current" />
              <span>Post to X</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Action: Download VIP Graphic */}
          <button
            onClick={handleDownloadCard}
            disabled={downloadingImg}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{downloadingImg ? 'Generating VIP Image...' : 'Download VIP Streak Graphic (PNG)'}</span>
          </button>

          {/* Copy Shareable Text */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'VIP Streak text copied!' : 'Copy Shareable Text'}</span>
          </button>

        </div>

      </div>
    </div>
  );
};
