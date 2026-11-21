import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { 
  Globe, 
  Search, 
  Plus, 
  Clock, 
  Sun, 
  Moon, 
  Check, 
  Sparkles, 
  Bell, 
  Compass,
  ArrowRight,
  Pin,
  Trash2
} from 'lucide-react';

export const WORLD_COUNTRIES = [
  { country: 'Nigeria', city: 'Lagos', timezone: 'Africa/Lagos', flag: '🇳🇬', region: 'Africa', utc: 'UTC+1' },
  { country: 'United Kingdom', city: 'London', timezone: 'Europe/London', flag: '🇬🇧', region: 'Europe', utc: 'UTC+0' },
  { country: 'United States', city: 'New York (EST)', timezone: 'America/New_York', flag: '🇺🇸', region: 'Americas', utc: 'UTC-5' },
  { country: 'United States', city: 'Los Angeles (PST)', timezone: 'America/Los_Angeles', flag: '🇺🇸', region: 'Americas', utc: 'UTC-8' },
  { country: 'United States', city: 'Chicago (CST)', timezone: 'America/Chicago', flag: '🇺🇸', region: 'Americas', utc: 'UTC-6' },
  { country: 'Canada', city: 'Toronto', timezone: 'America/Toronto', flag: '🇨🇦', region: 'Americas', utc: 'UTC-5' },
  { country: 'Canada', city: 'Vancouver', timezone: 'America/Vancouver', flag: '🇨🇦', region: 'Americas', utc: 'UTC-8' },
  { country: 'France', city: 'Paris', timezone: 'Europe/Paris', flag: '🇫🇷', region: 'Europe', utc: 'UTC+1' },
  { country: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin', flag: '🇩🇪', region: 'Europe', utc: 'UTC+1' },
  { country: 'Italy', city: 'Rome', timezone: 'Europe/Rome', flag: '🇮🇹', region: 'Europe', utc: 'UTC+1' },
  { country: 'Spain', city: 'Madrid', timezone: 'Europe/Madrid', flag: '🇪🇸', region: 'Europe', utc: 'UTC+1' },
  { country: 'United Arab Emirates', city: 'Dubai', timezone: 'Asia/Dubai', flag: '🇦🇪', region: 'Middle East', utc: 'UTC+4' },
  { country: 'Saudi Arabia', city: 'Riyadh', timezone: 'Asia/Riyadh', flag: '🇸🇦', region: 'Middle East', utc: 'UTC+3' },
  { country: 'Japan', city: 'Tokyo', timezone: 'Asia/Tokyo', flag: '🇯🇵', region: 'Asia', utc: 'UTC+9' },
  { country: 'China', city: 'Beijing', timezone: 'Asia/Shanghai', flag: '🇨🇳', region: 'Asia', utc: 'UTC+8' },
  { country: 'India', city: 'New Delhi & Mumbai', timezone: 'Asia/Kolkata', flag: '🇮🇳', region: 'Asia', utc: 'UTC+5:30' },
  { country: 'Singapore', city: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬', region: 'Asia', utc: 'UTC+8' },
  { country: 'South Korea', city: 'Seoul', timezone: 'Asia/Seoul', flag: '🇰🇷', region: 'Asia', utc: 'UTC+9' },
  { country: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney', flag: '🇦🇺', region: 'Oceania', utc: 'UTC+11' },
  { country: 'Australia', city: 'Melbourne', timezone: 'Australia/Melbourne', flag: '🇦🇺', region: 'Oceania', utc: 'UTC+11' },
  { country: 'New Zealand', city: 'Auckland', timezone: 'Pacific/Auckland', flag: '🇳🇿', region: 'Oceania', utc: 'UTC+13' },
  { country: 'South Africa', city: 'Johannesburg', timezone: 'Africa/Johannesburg', flag: '🇿🇦', region: 'Africa', utc: 'UTC+2' },
  { country: 'Kenya', city: 'Nairobi', timezone: 'Africa/Nairobi', flag: '🇰🇪', region: 'Africa', utc: 'UTC+3' },
  { country: 'Ghana', city: 'Accra', timezone: 'Africa/Accra', flag: '🇬🇭', region: 'Africa', utc: 'UTC+0' },
  { country: 'Egypt', city: 'Cairo', timezone: 'Africa/Cairo', flag: '🇪🇬', region: 'Africa', utc: 'UTC+2' },
  { country: 'Brazil', city: 'São Paulo', timezone: 'America/Sao_Paulo', flag: '🇧🇷', region: 'Americas', utc: 'UTC-3' },
  { country: 'Mexico', city: 'Mexico City', timezone: 'America/Mexico_City', flag: '🇲🇽', region: 'Americas', utc: 'UTC-6' },
  { country: 'Argentina', city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', region: 'Americas', utc: 'UTC-3' },
  { country: 'Switzerland', city: 'Zurich', timezone: 'Europe/Zurich', flag: '🇨🇭', region: 'Europe', utc: 'UTC+1' },
  { country: 'Netherlands', city: 'Amsterdam', timezone: 'Europe/Amsterdam', flag: '🇳🇱', region: 'Europe', utc: 'UTC+1' }
];

export const WorldClock = ({ onSetAlarmForCountry }) => {
  const { locale, clockFormat } = useSettings();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  
  // User's pinned world clocks (saved in localStorage)
  const [pinnedTimezones, setPinnedTimezones] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_pinned_clocks');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default world destinations
    return ['Africa/Lagos', 'Europe/London', 'America/New_York', 'Asia/Dubai', 'Asia/Tokyo', 'Australia/Sydney'];
  });

  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const savePinned = (list) => {
    setPinnedTimezones(list);
    localStorage.setItem('aura_pinned_clocks', JSON.stringify(list));
  };

  const togglePin = (tz) => {
    if (pinnedTimezones.includes(tz)) {
      savePinned(pinnedTimezones.filter(item => item !== tz));
    } else {
      savePinned([...pinnedTimezones, tz]);
    }
  };

  // Helper to format time in a specific timezone
  const getTimeInZone = (tz) => {
    try {
      const timeStr = currentTime.toLocaleTimeString(locale, {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: clockFormat === '12h'
      });
      const dateStr = currentTime.toLocaleDateString(locale, {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      // Hour in 24h format for Day/Night calculation
      const hour24 = parseInt(
        currentTime.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', hour12: false }),
        10
      );
      const isDay = hour24 >= 6 && hour24 < 18;

      return { timeStr, dateStr, isDay, hour24 };
    } catch {
      return { timeStr: '--:--:--', dateStr: '---', isDay: true, hour24: 12 };
    }
  };

  // Calculate time difference relative to local user
  const getTimeDiff = (targetTz) => {
    try {
      const now = new Date();
      const localStr = now.toLocaleString('en-US', { timeZone: localTimezone });
      const targetStr = now.toLocaleString('en-US', { timeZone: targetTz });
      
      const diffMs = new Date(targetStr) - new Date(localStr);
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      if (diffHours === 0) return 'Same time as you';
      if (diffHours > 0) return `+${diffHours}h ahead of you`;
      return `${Math.abs(diffHours)}h behind you`;
    } catch {
      return '';
    }
  };

  const regions = ['All', 'Africa', 'Europe', 'Americas', 'Asia', 'Middle East', 'Oceania'];

  const filteredCountries = WORLD_COUNTRIES.filter(item => {
    const matchesSearch = 
      item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const pinnedItems = WORLD_COUNTRIES.filter(c => pinnedTimezones.includes(c.timezone));
  const localInfo = getTimeInZone(localTimezone);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner: Auto-detected Local Time & Worldwide Suite */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Worldwide Synchronized Alarm Suite • All 24 Timezones</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Global World Clock & Country Alarms
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
              Check real-time clocks in every country on earth. Set international alarms synchronized with family, clients, or flight arrivals anywhere in the world.
            </p>
          </div>

          {/* Local Device Clock Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-left min-w-[260px] shadow-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Your Current Location & Time
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 truncate max-w-[170px]">
                📍 {localTimezone}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                {localInfo.isDay ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
                {localInfo.isDay ? 'Day' : 'Night'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono my-1 tracking-tight">
              {localInfo.timeStr}
            </div>
            <div className="text-[11px] text-slate-400">
              {localInfo.dateStr}
            </div>
          </div>
        </div>
      </div>

      {/* PINNED WORLD CLOCKS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Your Pinned World Clocks</h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {pinnedItems.length} Active
            </span>
          </div>
          <span className="text-xs text-slate-400">Ticking with live global seconds</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pinnedItems.map((item) => {
            const zInfo = getTimeInZone(item.timezone);
            const diffText = getTimeDiff(item.timezone);

            return (
              <div
                key={item.timezone}
                className="relative rounded-2xl p-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" role="img" aria-label={item.country}>{item.flag}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{item.city}</h3>
                        <span className="text-[11px] text-slate-400 block">{item.country} • {item.utc}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`p-1.5 rounded-xl text-xs flex items-center gap-1 ${
                        zInfo.isDay ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-300'
                      }`}>
                        {zInfo.isDay ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </span>
                      <button
                        onClick={() => togglePin(item.timezone)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove Pin"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-3">
                    <span className="text-3xl font-extrabold text-white font-mono tracking-tight block">
                      {zInfo.timeStr}
                    </span>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span>{zInfo.dateStr}</span>
                      <span className="text-indigo-400 font-semibold">{diffText}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">{item.timezone}</span>
                  <button
                    onClick={() => onSetAlarmForCountry && onSetAlarmForCountry(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold transition-all"
                  >
                    <Bell className="w-3 h-3" />
                    <span>Set Alarm</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEARCH & BROWSE ALL COUNTRIES */}
      <div className="rounded-3xl glass-panel border border-slate-800 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Browse Countries Worldwide</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any country on earth to view its time or pin it to your dashboard.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country, city, or continent..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {regions.map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedRegion === reg
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredCountries.map((item) => {
            const isPinned = pinnedTimezones.includes(item.timezone);
            const zInfo = getTimeInZone(item.timezone);

            return (
              <div
                key={item.timezone}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0" role="img" aria-label={item.country}>{item.flag}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">{item.city}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{item.country}</span>
                    <span className="text-[11px] font-mono text-indigo-300 font-semibold">{zInfo.timeStr.slice(0, 5)} {zInfo.timeStr.slice(-2)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <button
                    onClick={() => togglePin(item.timezone)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      isPinned
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                    title={isPinned ? 'Pinned to Top' : 'Pin to Top'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => onSetAlarmForCountry && onSetAlarmForCountry(item)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                  >
                    Set Alarm
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCountries.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs">
            No matching countries or timezones found for "{searchQuery}".
          </div>
        )}

      </div>

    </div>
  );
};
