import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Apple, 
  Play, 
  CheckCircle2, 
  Share, 
  PlusSquare,
  QrCode,
  Globe,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const InstallAppModal = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);
      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        setIsStandalone(true);
      }
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    } else {
      alert('To install directly onto your home screen:\n\n• On iPhone (Safari): Tap the Share button (square with arrow) and tap "Add to Home Screen".\n• On Android (Chrome): Tap the three dots (menu) in top right and tap "Install app" or "Add to Home screen".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Install AuraAlarm</h3>
              <p className="text-xs text-slate-400">Install from this website on your phone</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/30 text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg font-extrabold text-white mb-1">
            Install AuraAlarm on Your Mobile Phone
          </h4>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-5">
            Add the secure web app to your home screen. No APK download or unknown installer is required.
          </p>

          <div className="flex items-center justify-center">
            <button
              onClick={handleNativeInstall}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>{deferredPrompt ? 'Install AuraAlarm' : 'How to Install on Home Screen'}</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step for iOS and Android */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white shrink-0">
              <Apple className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block mb-0.5">Apple iPhone & iPad (Safari — Required for Lock-Screen Alerts)</span>
              <p className="text-slate-300">
                1. Tap the Safari <Share className="w-3.5 h-3.5 inline mx-1 text-indigo-400" /> Share button &rarr; scroll down &rarr; tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-400" />.<br />
                2. Open the <strong>AuraAlarm</strong> icon from your iPhone Home Screen and tap <strong>"Allow Phone Alerts"</strong> so alarms ring on your lock screen and home screen.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-white block mb-0.5">Android Phone (Google Chrome / Edge / Opera)</span>
              <p className="text-slate-300">
                Tap the 3 dots in the top-right corner &rarr; select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Scan QR Code from Laptop or Desktop */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">Viewing on a Computer?</span>
              <p className="text-[11px] text-slate-400">
                Open the site on your phone over HTTPS, then use its browser install option:
              </p>
              <code className="text-[10px] text-indigo-300 font-mono block mt-0.5 truncate max-w-[280px]">
                {currentUrl || 'http://192.168.8.197:5000'}
              </code>
            </div>
          </div>

          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/30 whitespace-nowrap">
            Zero App Store Fees
          </span>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Browser-based install; no APK download
          </span>
          <span className="font-mono text-indigo-400">v1.0.0 Global</span>
        </div>

      </div>
    </div>
  );
};
