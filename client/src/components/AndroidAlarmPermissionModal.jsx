import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Clock, 
  BatteryCharging, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  X
} from 'lucide-react';
import { nativeAlarmService } from '../services/nativeAlarm.js';

export const AndroidAlarmPermissionModal = ({ isOpen, onClose }) => {
  const [permissions, setPermissions] = useState({
    exactAlarm: false,
    notifications: false,
    batteryOptimization: false
  });
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    setChecking(true);
    const status = await nativeAlarmService.checkPermissions();
    setPermissions(status);
    setChecking(false);
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  // Re-check when app regains focus after returning from Android Settings
  useEffect(() => {
    const handleFocus = () => {
      if (isOpen) {
        checkStatus();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen]);

  if (!isOpen) return null;

  const allGranted = permissions.exactAlarm && permissions.notifications && permissions.batteryOptimization;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span>Google Clock Setup Guide</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Android 12+
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ensure AuraAlarm rings reliably at 100% volume over your lock screen.
            </p>
          </div>
        </div>

        {allGranted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 my-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-300">All Permissions Granted!</h4>
            <p className="text-xs text-slate-300">
              AuraAlarm is fully authorized to wake your screen, bypass battery saver, and ring at the exact scheduled second.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              Continue to App
            </button>
          </div>
        ) : (
          <div className="space-y-3 my-4">
            
            {/* 1. Exact Alarms */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              permissions.exactAlarm 
                ? 'bg-slate-900/60 border-emerald-500/30' 
                : 'bg-indigo-950/20 border-indigo-500/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    permissions.exactAlarm ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>1. Exact Alarm Permission</span>
                      {permissions.exactAlarm && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Allows Android's AlarmManager to schedule precise wake-ups down to the second.
                    </p>
                  </div>
                </div>

                {!permissions.exactAlarm && (
                  <button
                    onClick={() => nativeAlarmService.requestExactAlarmPermission()}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1"
                  >
                    <span>Grant</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Notifications */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              permissions.notifications 
                ? 'bg-slate-900/60 border-emerald-500/30' 
                : 'bg-indigo-950/20 border-indigo-500/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    permissions.notifications ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>2. Notification Permission</span>
                      {permissions.notifications && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Required for loud foreground ring alerts, lock screen controls, and snooze actions.
                    </p>
                  </div>
                </div>

                {!permissions.notifications && (
                  <button
                    onClick={() => nativeAlarmService.requestNotificationPermission()}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1"
                  >
                    <span>Allow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Battery Optimization Exemption */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              permissions.batteryOptimization 
                ? 'bg-slate-900/60 border-emerald-500/30' 
                : 'bg-indigo-950/20 border-indigo-500/40'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    permissions.batteryOptimization ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-amber-400'
                  }`}>
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>3. Battery Optimization Exemption</span>
                      {permissions.batteryOptimization && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stops Android's battery saver (Doze Mode) from putting AuraAlarm to sleep overnight.
                    </p>
                  </div>
                </div>

                {!permissions.batteryOptimization && (
                  <button
                    onClick={() => nativeAlarmService.requestBatteryOptimization()}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold shadow-md shadow-amber-500/20 flex items-center gap-1"
                  >
                    <span>Exempt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 4. Display Over Lock Screen Guidance */}
            <div className="p-3.5 rounded-2xl border bg-slate-900/60 border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      4. Lock Screen & Full Screen Intent
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      On Xiaomi, OPPO, vivo, or Samsung phones, enable "Show on Lock screen" and "Display pop-up window" in system settings.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => nativeAlarmService.openAppSettings()}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1"
                >
                  <span>Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <button
            onClick={checkStatus}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {checking ? 'Refreshing...' : '🔄 Re-check permissions'}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            {allGranted ? 'Done' : 'Set Up Later'}
          </button>
        </div>

      </div>
    </div>
  );
};
