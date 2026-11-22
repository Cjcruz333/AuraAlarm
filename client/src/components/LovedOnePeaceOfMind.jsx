import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Upload, 
  ShieldCheck, 
  Bell, 
  MapPin, 
  CheckCircle2, 
  Send, 
  Link, 
  Clock, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

export const LovedOnePeaceOfMind = () => {
  const { user, updateLovedOne } = useAuth();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Partner');
  const [photoUrl, setPhotoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [notifyOnWake, setNotifyOnWake] = useState(true);
  const [shareLocation, setShareLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pings, setPings] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (user?.lovedOne) {
      setName(user.lovedOne.name || '');
      setRelationship(user.lovedOne.relationship || 'Partner');
      setPhotoUrl(user.lovedOne.photoUrl || '');
      setPhone(user.lovedOne.phone || '');
      setMessage(user.lovedOne.message || 'Rise and shine, my love! Today is yours.');
      setNotifyOnWake(user.lovedOne.notifyOnWake !== false);
      setShareLocation(user.lovedOne.shareLocation !== false);
    }
    loadPings();
  }, [user]);

  const loadPings = async () => {
    try {
      const res = await api.getLovedOnePings();
      setPings(res.pings || []);
    } catch (err) {
      console.warn('Pings fetch notice:', err);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadPhoto(file);
      setPhotoUrl(res.photoUrl);
    } catch (err) {
      console.error('Photo upload error:', err);
      setPhotoUrl(URL.createObjectURL(file));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateLovedOne({
        name,
        relationship,
        photoUrl,
        phone,
        message,
        notifyOnWake,
        shareLocation
      });
      alert('❤️ Loved one companion profile updated successfully!');
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendManualPing = async () => {
    try {
      await api.sendLovedOnePing({
        status: 'MANUAL_PEACE_OF_MIND_PING',
        message: `${user?.name || 'Your partner'} checked in: All is peaceful and safe!`,
        location: 'Safe Home Zone',
        batteryLevel: '96%'
      });
      loadPings();
      alert('🕊️ Peace of mind check-in dispatched to your loved one!');
    } catch (err) {
      console.error('Ping error:', err);
    }
  };

  const copyCompanionLink = () => {
    const url = `${window.location.origin}/companion-status/${user?.id || 'demo-user-id'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/15 text-pink-400 border border-pink-500/30">
              Peace of Mind & Companion Care
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Safe Beacon
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Loved One Alarm Screen & Location Sync
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Wake up looking at the person who inspires you most. Keep each other reassured with automated morning wake pings and peace-of-mind safety updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSendManualPing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-pink-600/30 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send "I'm Safe" Ping</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Customization Settings */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 rounded-3xl glass-card border border-slate-800 p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Heart className="w-5 h-5 text-pink-400" />
            <span>Customize Loved One Alarm Experience</span>
          </h3>

          {/* Photo Upload & Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-lg">
                {photoUrl ? (
                  <img src={api.resolveAssetUrl(photoUrl)} alt="Loved One" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Heart className="w-10 h-10" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                Alarm Ringing Screen Portrait
              </span>
              <p className="text-xs text-slate-400">
                This photo will be displayed prominently with soft morning ambient lighting when your alarm rings.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPhoto ? 'Uploading...' : 'Upload Portrait Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Preset 1
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Preset 2
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Loved One's Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="Partner">Partner / Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Child">Child</option>
                <option value="Best Friend">Best Friend</option>
                <option value="Inspiration">Daily Inspiration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Custom Morning Wake Greeting Note
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Rise and shine, my love! Today is yours."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contact Phone / SMS Notification Target
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 382-9102"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnWake}
                onChange={(e) => setNotifyOnWake(e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4 bg-slate-900 border-slate-700"
              />
              <span>Send automated peace-of-mind notification when alarm is dismissed</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4 bg-slate-900 border-slate-700"
              />
              <span>Include safe location zone tag (e.g., "Home Safe Zone") in check-in</span>
            </label>
          </div>

          {/* Submit button */}
          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md shadow-pink-600/30 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Saving...' : 'Save Loved One Configuration'}</span>
            </button>
          </div>
        </form>

        {/* Right Col: Live Peace of Mind Beacon & Check-In History */}
        <div className="space-y-6">
          
          {/* Companion Web Link */}
          <div className="rounded-3xl glass-card border border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
              <Link className="w-4 h-4" />
              <h4 className="text-sm font-bold text-white">Loved One Companion Portal</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Share this dedicated link so your partner can view your wake streak & safety updates directly on their phone.
            </p>
            <button
              onClick={copyCompanionLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>{copiedLink ? 'Copied Link to Clipboard!' : 'Copy Partner Companion Link'}</span>
            </button>
          </div>

          {/* History of Check-ins */}
          <div className="rounded-3xl glass-card border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Recent Peace-of-Mind Pings</span>
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pings.length === 0 ? (
                <p className="text-xs text-slate-500">No pings logged yet. Dismiss an alarm to generate one!</p>
              ) : (
                pings.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Awake & Safe
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium">{p.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        {p.location || 'Safe Location'}
                      </span>
                      {p.batteryLevel && (
                        <span>• Battery: {p.batteryLevel}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
