import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Plus, 
  Trash2, 
  Volume2, 
  ShieldCheck, 
  Calendar, 
  LocateFixed, 
  BellRing,
  Lock
} from 'lucide-react';
import { api } from '../services/api.js';
import { cryptoService } from '../services/cryptoService.js';

export const LocationReminders = ({ onOpenCalendar }) => {
  const [reminders, setReminders] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [latitude, setLatitude] = useState(40.7128);
  const [longitude, setLongitude] = useState(-74.0060);
  const [radiusMeters, setRadiusMeters] = useState(250);
  const [triggerOn, setTriggerOn] = useState('arrive');
  const [encryptedNote, setEncryptedNote] = useState('');
  const [gpsStatus, setGpsStatus] = useState('');
  const [simulatedAlert, setSimulatedAlert] = useState(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const res = await api.getLocationReminders();
      setReminders(res.reminders || []);
    } catch (err) {
      console.warn('Location reminder load notice:', err);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsStatus('Acquiring high-precision GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsStatus(`Coordinates detected: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        console.warn('GPS position error:', err);
        setGpsStatus('Could not access GPS. Using pinpointed coordinate.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!title) return;

    let encryptedPayload = '';
    if (encryptedNote) {
      encryptedPayload = await cryptoService.encrypt(encryptedNote);
    }

    try {
      await api.createLocationReminder({
        title,
        destinationName: destinationName || 'Target Geofence',
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        triggerOn,
        encryptedNote: encryptedPayload
      });

      setTitle('');
      setDestinationName('');
      setEncryptedNote('');
      setIsAdding(false);
      loadReminders();
    } catch (err) {
      console.error('Create location reminder error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteLocationReminder(id);
      loadReminders();
    } catch (err) {
      console.error('Delete location reminder error:', err);
    }
  };

  const handleTestProximity = async (rem) => {
    try {
      const res = await api.checkProximity(rem.latitude, rem.longitude);
      setSimulatedAlert(`🎯 Proximity Geofence Triggered: You arrived within ${rem.radiusMeters}m of "${rem.destinationName}"! Alert tone ringing.`);
      setTimeout(() => setSimulatedAlert(null), 7000);
    } catch (err) {
      console.error('Proximity test error:', err);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Arrival & Destination Alerts
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Arrival Geofence
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Location-Based Reminders
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Automatically trigger custom audio notifications and task alarms whenever you arrive at the gym, home, or office.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Export to Calendar (.ics)</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location Reminder</span>
          </button>
        </div>
      </div>

      {/* Proximity Simulation Alert Toast */}
      {simulatedAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/80 to-teal-900/80 border border-emerald-500/50 text-white text-sm font-semibold flex items-center justify-between shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span>{simulatedAlert}</span>
          </div>
          <button
            onClick={() => setSimulatedAlert(null)}
            className="text-xs text-emerald-200 hover:text-white px-2 py-1 bg-emerald-800/60 rounded-lg"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ADD LOCATION REMINDER FORM */}
      {isAdding && (
        <form onSubmit={handleCreateReminder} className="rounded-3xl glass-card border border-indigo-500/40 p-6 sm:p-8 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Create Geofence Destination Reminder</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reminder Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Arrive at Gym - Hydrate & Warm-up"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Destination Label
              </label>
              <input
                type="text"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="e.g. Metropolitan Athletic Club"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Location Consent & Transparency Notice */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300">
            <p className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              <span>Location Permission Notice</span>
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              We request your location solely to calculate geofence coordinates for your arrival and departure alarm reminders. We never run background tracking or share your location data, and you can turn off location permission anytime in your browser or device settings.
            </p>
          </div>

          {/* GPS Coordinates and Auto-Detect */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Geographic Coordinates</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Use Current GPS Coordinates</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 mb-1">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            {gpsStatus && <p className="text-[11px] text-emerald-400">{gpsStatus}</p>}
          </div>

          {/* Radius & Trigger Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Geofence Radius: <span className="text-white font-mono">{radiusMeters} meters</span>
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Trigger Event
              </label>
              <select
                value={triggerOn}
                onChange={(e) => setTriggerOn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200"
              >
                <option value="arrive">When Arriving at Destination</option>
                <option value="depart">When Leaving Destination</option>
              </select>
            </div>
          </div>

          {/* E2EE Encrypted Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted Destination Note</span>
            </label>
            <input
              type="text"
              value={encryptedNote}
              onChange={(e) => setEncryptedNote(e.target.value)}
              placeholder="Private note client-side encrypted before cloud sync"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Save Geofence
            </button>
          </div>
        </form>
      )}

      {/* REMINDERS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.map((rem) => (
          <div
            key={rem.id}
            className="rounded-2xl glass-card border border-slate-800 p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{rem.title}</h4>
                    <p className="text-xs text-slate-400">{rem.destinationName}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(rem.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Remove Reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Coordinates and triggers tag */}
              <div className="flex flex-wrap gap-2 my-3 text-[11px] text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 font-mono">
                  {rem.latitude.toFixed(4)}, {rem.longitude.toFixed(4)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800">
                  Radius: {rem.radiusMeters}m
                </span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-semibold uppercase">
                  Trigger on {rem.triggerOn}
                </span>
              </div>
            </div>

            {/* Test Simulation trigger */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Autonomous Geofencing</span>
              <button
                onClick={() => handleTestProximity(rem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold transition-colors"
                title="Test Geofence Simulation"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Simulate Arrival</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
