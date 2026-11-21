import React, { useState } from 'react';
import { X, Calendar, Download, CheckCircle2, ArrowRight, Smartphone } from 'lucide-react';
import { api } from '../services/api.js';

export const CalendarExportModal = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownloadIcs = () => {
    const url = api.getIcsExportUrl();
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'aura_alarm_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Export to External Calendar</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-6">
          Seamlessly synchronize all your scheduled alarms, recurring habits, and geofence location reminders with your native calendar system.
        </p>

        {/* 1-Click Download Button */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/30 text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Download className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Standard iCalendar (.ics) File</h4>
          <p className="text-xs text-slate-400 mb-4">
            Universal format recognized natively across all modern devices.
          </p>

          <button
            onClick={handleDownloadIcs}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{downloaded ? 'Downloaded Successfully!' : 'Download Schedule (.ics)'}</span>
          </button>
        </div>

        {/* Import Guides */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            How to Import on Your Device
          </span>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs">
            <span className="font-bold text-indigo-400">Apple Calendar:</span>
            <span className="text-slate-300">Tap the downloaded .ics file on iPhone/Mac to add all recurring alerts automatically.</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs">
            <span className="font-bold text-indigo-400">Google Calendar:</span>
            <span className="text-slate-300">Open Settings &gt; Import & Export &gt; select the downloaded file to sync with Android & Web.</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3 text-xs">
            <span className="font-bold text-indigo-400">Microsoft Outlook:</span>
            <span className="text-slate-300">Click File &gt; Open & Export &gt; Import/Export &gt; Import an iCalendar (.ics) file.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
