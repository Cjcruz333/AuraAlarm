// Advanced Web Audio API Engine for Sleep Sounds and Alarm Synthesizers
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.activeNodes = [];
    this.activeAlarmOscillators = [];
    this.activeSleepTrack = null;
    this.customAudioPlayer = null;
    this.alarmChimePlayer = null;
    this.keepAlivePlayer = null;
    this.alarmInterval = null;
    this.alarmLoopTimer = null;
    this.masterGain = null;
    this.unlocked = false;
    this.isAlarmRinging = false;
    this.audioState = 'idle'; // 'idle' | 'playing' | 'blocked' | 'error' | 'stopped'
    this.audioStateListeners = [];
    this.setupAutoUnlock();
  }

  onAudioStateChange(fn) {
    if (typeof fn === 'function') {
      this.audioStateListeners.push(fn);
      fn(this.audioState);
      return () => {
        this.audioStateListeners = this.audioStateListeners.filter(l => l !== fn);
      };
    }
    return () => {};
  }

  setAudioState(state, detail = '') {
    console.log(`[AudioEngine] 📢 Audio State: ${state} ${detail ? '(' + detail + ')' : ''}`);
    this.audioState = state;
    this.audioStateListeners.forEach(listener => {
      try { listener(state, detail); } catch (e) {}
    });
  }

  // Explicitly unlock audio from a user click gesture (e.g., Set Alarm / Save Alarm)
  async unlockAudio() {
    console.log('[AudioEngine] 🔓 Unlocking audio via user gesture...');
    try {
      const ctx = this.init();
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[AudioEngine] AudioContext resumed successfully, state:', ctx.state);
      }
      if (ctx.state === 'running') {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
      // Also prime alarm chime player on user gesture so iOS allows it later
      const chime = this.ensureAlarmChimePlayer('/alarm_chime.wav');
      chime.volume = 0;
      const primePromise = chime.play();
      if (primePromise !== undefined) {
        primePromise.then(() => {
          chime.pause();
          chime.currentTime = 0;
          chime.volume = 1.0;
        }).catch(() => {
          chime.volume = 1.0;
        });
      }

      this.ensureKeepAlivePlayer();
      const playPromise = this.keepAlivePlayer.play();
      if (playPromise !== undefined) {
        await playPromise.catch(err => {
          console.warn('[AudioEngine] Silent HTML5 audio play notification:', err);
        });
      }
      this.unlocked = true;
      console.log('[AudioEngine] ✅ Audio engine successfully unlocked and ready. Context state:', ctx.state);
    } catch (err) {
      console.warn('[AudioEngine] unlockAudio error:', err);
    }
  }

  ensureKeepAlivePlayer() {
    if (!this.keepAlivePlayer) {
      this.keepAlivePlayer = new Audio('/silence.wav');
      this.keepAlivePlayer.loop = true;
      this.keepAlivePlayer.playsInline = true;
      this.keepAlivePlayer.volume = 0.01;
    }
    return this.keepAlivePlayer;
  }

  ensureAlarmChimePlayer(chimeUrl = '/alarm_chime.wav') {
    if (!this.alarmChimePlayer) {
      this.alarmChimePlayer = new Audio(chimeUrl);
      this.alarmChimePlayer.playsInline = true;
      this.alarmChimePlayer.preload = 'auto';
    } else {
      if (this.alarmChimePlayer.src !== chimeUrl && !this.alarmChimePlayer.src.endsWith(chimeUrl)) {
        this.alarmChimePlayer.src = chimeUrl;
      }
    }
    this.alarmChimePlayer.muted = false;
    this.alarmChimePlayer.loop = true;
    this.alarmChimePlayer.volume = 1.0;
    return this.alarmChimePlayer;
  }

  setupAutoUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = async () => {
      try {
        const ctx = this.init();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        if (!this.unlocked && ctx.state === 'running') {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
          this.unlocked = true;
        }
        // Start background keep-alive on user interaction so iOS/PWA does not suspend in background
        if (!this.isAlarmRinging) {
          this.startKeepAlive();
        }
      } catch {
        // ignore until next gesture
      }
    };
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlock, { passive: true });
    });
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime + 0.1);
    }
  }

  // --- SLEEP AID SOUND GENERATORS ---

  playSleepSound(type = 'rain_window', volume = 0.7) {
    this.stopSleepSound();
    this.init();
    this.activeSleepTrack = type;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const sleepGain = ctx.createGain();
    sleepGain.gain.setValueAtTime(0.01, now);
    sleepGain.gain.linearRampToValueAtTime(volume, now + 1.5);
    sleepGain.connect(this.masterGain);

    if (type === 'rain_window') {
      // Pink noise + simulated random droplets
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      whiteNoise.connect(filter);
      filter.connect(sleepGain);
      whiteNoise.start();

      this.activeNodes.push(whiteNoise, filter, sleepGain);
    } else if (type === 'ocean_tide') {
      // Sweeping lowpass filter on pink/brown noise
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 1.8;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);

      // LFO for tide rhythm
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, now); // ~8 second wave cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(300, now);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      noise.connect(filter);
      filter.connect(sleepGain);

      noise.start();
      lfo.start();

      this.activeNodes.push(noise, filter, lfo, lfoGain, sleepGain);
    } else if (type === 'binaural_theta') {
      // 6Hz Binaural theta wave (216Hz left, 222Hz right)
      const merger = ctx.createChannelMerger(2);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(216, now);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(222, now);

      const gainL = ctx.createGain();
      gainL.gain.setValueAtTime(0.2, now);
      const gainR = ctx.createGain();
      gainR.gain.setValueAtTime(0.2, now);

      oscL.connect(gainL);
      gainL.connect(merger, 0, 0); // left channel

      oscR.connect(gainR);
      gainR.connect(merger, 0, 1); // right channel

      merger.connect(sleepGain);

      oscL.start();
      oscR.start();

      this.activeNodes.push(oscL, oscR, gainL, gainR, merger, sleepGain);
    } else if (type === 'deep_white_noise') {
      // Brown noise for masking
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 1.2;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(sleepGain);
      noise.start();
      this.activeNodes.push(noise, sleepGain);
    } else if (type === 'astral_solfeggio') {
      // 528 Hz Pure Miracle Solfeggio with subtle 432 Hz undertone & slow shimmering amplitude modulation
      const osc528 = ctx.createOscillator();
      osc528.type = 'sine';
      osc528.frequency.setValueAtTime(528, now);

      const osc432 = ctx.createOscillator();
      osc432.type = 'sine';
      osc432.frequency.setValueAtTime(264, now); // Sub-harmonic

      const amLfo = ctx.createOscillator();
      amLfo.type = 'sine';
      amLfo.frequency.setValueAtTime(0.1, now); // 10s breathe cycle

      const amGain = ctx.createGain();
      amGain.gain.setValueAtTime(0.15, now);
      amLfo.connect(amGain.gain);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.18, now);

      osc528.connect(amGain);
      osc432.connect(amGain);
      amGain.connect(toneGain);
      toneGain.connect(sleepGain);

      osc528.start();
      osc432.start();
      amLfo.start();

      this.activeNodes.push(osc528, osc432, amLfo, amGain, toneGain, sleepGain);
    } else if (type === 'lucid_delta') {
      // 2.5Hz Pineal Delta binaural beats (108Hz Left, 110.5Hz Right)
      const merger = ctx.createChannelMerger(2);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(108, now);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(110.5, now); // Delta 2.5 Hz difference

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.25, now);

      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(subGain);
      subGain.connect(sleepGain);

      oscL.start();
      oscR.start();

      this.activeNodes.push(oscL, oscR, merger, subGain, sleepGain);
    } else if (type === 'nebula_celestial') {
      // Cosmic drone chords (110Hz A2, 164.81Hz E3, 220Hz A3, 329.63Hz E4) with soft low-pass filter
      const freqs = [110, 164.81, 220, 329.63];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.connect(sleepGain);

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f + (idx * 0.3), now);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, now);

        osc.connect(g);
        g.connect(filter);
        osc.start();
        this.activeNodes.push(osc, g);
      });
      this.activeNodes.push(filter, sleepGain);
    } else {
      // Zen / campfire ambient harmonic
      const baseFreqs = [196, 261.63, 329.63, 392.00];
      baseFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.04, now);

        osc.connect(subGain);
        subGain.connect(sleepGain);
        osc.start();
        this.activeNodes.push(osc, subGain);
      });
      this.activeNodes.push(sleepGain);
    }
  }

  stopSleepSound() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {
        // ignore already stopped
      }
    });
    this.activeNodes = [];
    this.activeSleepTrack = null;
  }

  // --- ALARM SOUND GENERATORS ---

  async playAlarmSound(soundId = 'gentle_chimes', customUrl = null) {
    console.log('[AudioEngine] 🔊 STARTING ALARM SOUND. Sound ID:', soundId, 'Custom URL:', customUrl);
    this.isAlarmRinging = true;
    this.setAudioState('playing', 'Starting audio...');

    // 1. First stop any existing interval loops without resetting isAlarmRinging
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmLoopTimer) {
      clearTimeout(this.alarmLoopTimer);
      this.alarmLoopTimer = null;
    }

    // 2. Ensure AudioContext is initialized and resumed
    const ctx = this.init();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('[AudioEngine] AudioContext resumed for alarm, state:', ctx.state);
      } catch (err) {
        console.error('[AudioEngine] AudioContext resume failed:', err);
      }
    }

    let html5Success = false;

    // 3. Play HTML5 audio chime using the single persistent player instance
    const chimeUrl = customUrl || '/alarm_chime.wav';
    try {
      const player = this.ensureAlarmChimePlayer(chimeUrl);
      player.muted = false;
      player.volume = 1.0;
      player.loop = true;
      player.currentTime = 0;

      const playPromise = player.play();
      if (playPromise !== undefined) {
        await playPromise.then(() => {
          html5Success = true;
          this.setAudioState('playing', 'HTML5 Audio chime playing loudly');
          console.log('[AudioEngine] 🔊 HTML5 alarm chime audio successfully playing loudly from:', chimeUrl);
        }).catch(err => {
          console.error('[AudioEngine] Direct HTML5 audio play rejected (e.g. iOS autoplay policy):', err.name, err.message);
          if (err.name === 'NotAllowedError') {
            this.setAudioState('blocked', 'Autoplay blocked by iOS Safari');
          } else {
            this.setAudioState('error', `${err.name}: ${err.message}`);
          }
        });
      }
    } catch (e) {
      console.error('[AudioEngine] Failed to play HTML5 Audio player:', e);
      this.setAudioState('error', e.message || 'HTML5 player failure');
    }

    // 4. Update MediaSession to show Alarm Ringing!
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: '⏰ Alarm Ringing!',
          artist: 'AuraAlarm Wake-Up Call',
          album: 'AuraAlarm Smart Clock'
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {}
    }

    // 5. Run Web Audio chime loop (synthesizer) simultaneously
    try {
      this.startChimeLoop(soundId);
      if (ctx.state === 'running') {
        if (!html5Success && this.audioState === 'blocked') {
          // If WebAudio is running, Web Audio synth IS sounding!
          this.setAudioState('playing', 'Web Audio synthesizer playing');
        }
      }
    } catch (synthErr) {
      console.error('[AudioEngine] Web Audio chime loop start failed:', synthErr);
    }
  }

  startChimeLoop(soundId) {
    console.log('[AudioEngine] 🎶 Starting Web Audio synthesizer chime loop for soundId:', soundId);
    
    // Clear any previous interval before creating a new one
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }

    const playChimeSequence = () => {
      if (!this.ctx || !this.isAlarmRinging) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      if (soundId === 'zen_bell') {
        notes = [220.00, 440.00, 880.00];
      } else if (soundId === 'energy_pulsar') {
        notes = [440, 554.37, 659.25, 880];
      }

      notes.forEach((freq, idx) => {
        if (!this.isAlarmRinging) return;
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = soundId === 'zen_bell' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.25);

          gain.gain.setValueAtTime(0, now + idx * 0.25);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.25 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.25 + 1.4);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start(now + idx * 0.25);
          osc.stop(now + idx * 0.25 + 1.5);

          this.activeAlarmOscillators.push(osc, gain);
          // Auto remove after note completes
          setTimeout(() => {
            const oscIdx = this.activeAlarmOscillators.indexOf(osc);
            if (oscIdx > -1) this.activeAlarmOscillators.splice(oscIdx, 1);
            const gIdx = this.activeAlarmOscillators.indexOf(gain);
            if (gIdx > -1) this.activeAlarmOscillators.splice(gIdx, 1);
          }, 1600);
        } catch (e) {}
      });
    };

    // Play immediately and repeat every 2.8 seconds
    playChimeSequence();
    this.alarmInterval = setInterval(playChimeSequence, 2800);
  }

  stopAlarmSound(resetState = true) {
    console.log('[AudioEngine] ⏹️ STOPPING ALARM SOUND. stopAlarmSound called.');
    if (resetState) {
      this.isAlarmRinging = false;
      this.setAudioState('stopped', 'Alarm sound stopped');
    }

    // 1. Clear all intervals and timers immediately
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmLoopTimer) {
      clearTimeout(this.alarmLoopTimer);
      this.alarmLoopTimer = null;
    }

    // 2. Stop and silence the single persistent alarm chime player
    if (this.alarmChimePlayer) {
      try {
        this.alarmChimePlayer.pause();
        this.alarmChimePlayer.loop = false;
        this.alarmChimePlayer.currentTime = 0;
      } catch (e) {
        console.warn('[AudioEngine] Error pausing alarmChimePlayer:', e);
      }
    }

    // Also stop customAudioPlayer if any
    if (this.customAudioPlayer) {
      try {
        this.customAudioPlayer.pause();
        this.customAudioPlayer.loop = false;
        this.customAudioPlayer.currentTime = 0;
      } catch (e) {}
    }

    // 3. Stop and disconnect all active alarm synthesizer oscillators and gain nodes
    if (Array.isArray(this.activeAlarmOscillators)) {
      this.activeAlarmOscillators.forEach(node => {
        try {
          if (typeof node.stop === 'function') node.stop();
          if (typeof node.disconnect === 'function') node.disconnect();
        } catch (e) {}
      });
      this.activeAlarmOscillators = [];
    }

    // 4. Ensure keepAlivePlayer is NOT playing alarm chime; revert to silent audio or pause
    if (this.keepAlivePlayer) {
      try {
        this.keepAlivePlayer.pause();
        this.keepAlivePlayer.currentTime = 0;
        this.keepAlivePlayer.loop = true;
        this.keepAlivePlayer.volume = 0.01;
        if (!this.keepAlivePlayer.src.endsWith('/silence.wav')) {
          this.keepAlivePlayer.src = '/silence.wav';
        }
      } catch (e) {}
    }

    // 5. Cancel speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // 6. Stop vibration
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }

    // 7. Clear mediaSession (set state 'none' and clear metadata)
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
      } catch (e) {}
    }

    // 8. Close open notifications
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && typeof reg.getNotifications === 'function') {
            reg.getNotifications().then(notifications => {
              if (Array.isArray(notifications)) {
                notifications.forEach(n => {
                  try { n.close(); } catch (err) {}
                });
              }
            }).catch(() => {});
          }
        }).catch(() => {});
      } catch (e) {}
    }

    console.log('[AudioEngine] ⏹️ All alarm audio, oscillators, intervals, and notifications successfully terminated.');
  }

  // --- BACKGROUND KEEP-ALIVE (iOS PWA & Web Background Timer) ---
  // The keep-alive is strictly silent and NEVER plays the alarm ringing sound.
  startKeepAlive(description = 'Alarm active and standing by') {
    if (typeof window === 'undefined' || this.isAlarmRinging) return;
    try {
      const player = this.ensureKeepAlivePlayer();
      player.volume = 0.01;
      player.loop = true;
      if (!player.src.endsWith('/silence.wav')) {
        player.src = '/silence.wav';
      }
      player.play().then(() => {
        if ('mediaSession' in navigator && !this.isAlarmRinging) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: 'AuraAlarm Standing By',
            artist: description,
            album: 'AuraAlarm Smart Clock'
          });
          navigator.mediaSession.playbackState = 'playing';
        }
      }).catch(() => {
        // Audio playback requires user interaction
      });
    } catch (e) {}
  }

  // Trigger loud chime when backgrounded (delegates to playAlarmSound)
  triggerBackgroundAudibleChime() {
    console.log('[AudioEngine] 🚨 triggerBackgroundAudibleChime requested');
    // Ensure the chime player is playing /alarm_chime.wav directly
    this.playAlarmSound('gentle_chimes', '/alarm_chime.wav');
  }

  stopKeepAlive() {
    if (this.keepAlivePlayer) {
      try {
        this.keepAlivePlayer.pause();
        this.keepAlivePlayer.currentTime = 0;
      } catch (e) {}
    }
  }
}

export const audioEngine = new AudioEngine();
if (typeof window !== 'undefined') {
  window.audioEngine = audioEngine;
}
