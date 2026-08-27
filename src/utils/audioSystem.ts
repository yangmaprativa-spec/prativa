import { SoundSettings, DEFAULT_SOUND_SETTINGS } from '../types/audio';

const STORAGE_SOUND_KEY = 'virtual_character_sound_settings_v2';

let audioCtx: AudioContext | null = null;
let bgmInterval: any = null;
let currentSoundSettings: SoundSettings = { ...DEFAULT_SOUND_SETTINGS };

// Lazy init Web Audio Context (resumes upon user interaction)
export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Load saved sound settings
export const loadSoundSettings = (): SoundSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_SOUND_KEY);
    if (saved) {
      currentSoundSettings = { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(saved) };
      return currentSoundSettings;
    }
  } catch (err) {
    console.error('Failed to load sound settings:', err);
  }
  currentSoundSettings = { ...DEFAULT_SOUND_SETTINGS };
  return currentSoundSettings;
};

// Save sound settings
export const saveSoundSettings = (settings: SoundSettings): void => {
  currentSoundSettings = settings;
  try {
    localStorage.setItem(STORAGE_SOUND_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save sound settings:', err);
  }
  // Sync BGM
  updateBgmState();
};

// ==================== SFX SYNTHESIZERS ====================

// Generic helper to create quick synth tone
const playSynthTone = (
  freqs: number[],
  durations: number[],
  type: OscillatorType = 'sine',
  volumeMultiplier: number = 1.0
) => {
  if (!currentSoundSettings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  const vol = Math.max(0.01, currentSoundSettings.sfxVolume * volumeMultiplier);
  masterGain.gain.setValueAtTime(vol, now);
  masterGain.connect(ctx.destination);

  let startTime = now;
  freqs.forEach((freq, i) => {
    const dur = durations[i] || 0.1;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Envelope
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(1, startTime + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);

    startTime += dur * 0.85;
  });
};

// Button Pop
export const playSfxPop = () => {
  if (!currentSoundSettings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);

  gain.gain.setValueAtTime(currentSoundSettings.sfxVolume * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
};

// Sparkling Coin Chime
export const playSfxCoin = () => {
  playSynthTone([987.77, 1318.51, 1760.0], [0.08, 0.08, 0.2], 'triangle', 0.65);
};

// Level Up Victory Fanfare
export const playSfxLevelUp = () => {
  playSynthTone(
    [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98],
    [0.1, 0.1, 0.1, 0.15, 0.15, 0.45],
    'triangle',
    0.85
  );
};

// Petting Giggle / Happy Warble
export const playSfxPetGiggle = () => {
  if (!currentSoundSettings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [659, 784, 987, 880, 1174];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = now + i * 0.07;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.1, time + 0.06);

    gain.gain.setValueAtTime(currentSoundSettings.sfxVolume * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.09);
  });
};

// Eating Munching sound
export const playSfxEat = () => {
  playSynthTone([440, 523, 659, 587], [0.07, 0.07, 0.07, 0.12], 'sine', 0.5);
};

// Bubble Bath Splash
export const playSfxBath = () => {
  if (!currentSoundSettings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  for (let i = 0; i < 5; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = now + i * 0.06 + Math.random() * 0.03;
    const freq = 600 + Math.random() * 800;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq + 400, time + 0.08);

    gain.gain.setValueAtTime(currentSoundSettings.sfxVolume * 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }
};

// High Heel Step Tap
export const playSfxHeelTap = () => {
  if (!currentSoundSettings.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

  gain.gain.setValueAtTime(currentSoundSettings.sfxVolume * 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.06);
};

// Mini-game: Rhythm lane hit
export const playSfxRhythmHit = (type: 'perfect' | 'great' | 'good' | 'miss' | 'bomb') => {
  if (!currentSoundSettings.sfxEnabled) return;
  if (type === 'bomb') {
    playSynthTone([180, 120, 80], [0.1, 0.15, 0.25], 'sawtooth', 0.8);
    return;
  }
  if (type === 'miss') {
    playSynthTone([220, 196], [0.08, 0.12], 'sawtooth', 0.3);
    return;
  }
  if (type === 'perfect') {
    playSynthTone([1046.5, 1318.5, 1567.98], [0.06, 0.06, 0.15], 'triangle', 0.7);
  } else if (type === 'great') {
    playSynthTone([880, 1174.6], [0.07, 0.12], 'triangle', 0.6);
  } else {
    playSynthTone([659.25, 783.99], [0.08, 0.1], 'triangle', 0.5);
  }
};

// Mini-game: Memory Card flip & match
export const playSfxCardFlip = () => {
  playSynthTone([440, 587], [0.05, 0.06], 'sine', 0.4);
};

export const playSfxCardMatch = () => {
  playSynthTone([523.25, 659.25, 783.99, 1046.5], [0.08, 0.08, 0.08, 0.2], 'triangle', 0.7);
};

// Mini-game: Runner obstacle hit
export const playSfxRunnerHurdle = () => {
  playSynthTone([300, 200, 140], [0.06, 0.08, 0.15], 'sawtooth', 0.6);
};

// ==================== PROCEDURAL BGM ENGINE ====================

const BGM_MELODIES = {
  dreamy: [
    { notes: [523.25, 659.25, 783.99], dur: 0.5 },
    { notes: [587.33, 698.46, 880.0], dur: 0.5 },
    { notes: [659.25, 783.99, 987.77], dur: 0.5 },
    { notes: [783.99, 987.77, 1174.66], dur: 0.75 },
    { notes: [659.25, 880.0, 1046.5], dur: 0.5 },
    { notes: [523.25, 659.25, 783.99], dur: 0.75 },
  ],
  runway: [
    { notes: [440, 554.37, 659.25], dur: 0.3 },
    { notes: [440, 554.37, 659.25], dur: 0.3 },
    { notes: [493.88, 587.33, 739.99], dur: 0.3 },
    { notes: [554.37, 659.25, 830.61], dur: 0.4 },
    { notes: [659.25, 830.61, 987.77], dur: 0.4 },
    { notes: [554.37, 659.25, 830.61], dur: 0.5 },
  ],
  cafe: [
    { notes: [392.0, 493.88, 587.33], dur: 0.4 },
    { notes: [440.0, 523.25, 659.25], dur: 0.4 },
    { notes: [493.88, 587.33, 739.99], dur: 0.4 },
    { notes: [523.25, 659.25, 783.99], dur: 0.6 },
    { notes: [440.0, 554.37, 659.25], dur: 0.5 },
  ],
  lofi: [
    { notes: [261.63, 329.63, 392.0, 493.88], dur: 0.8 },
    { notes: [293.66, 349.23, 440.0, 523.25], dur: 0.8 },
    { notes: [329.63, 392.0, 493.88, 587.33], dur: 0.8 },
    { notes: [261.63, 329.63, 392.0, 440.0], dur: 1.0 },
  ],
};

let currentBgmStep = 0;

export const updateBgmState = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }

  if (!currentSoundSettings.bgmEnabled || currentSoundSettings.bgmTrack === 'off') {
    return;
  }

  const track = currentSoundSettings.bgmTrack;
  const melody = BGM_MELODIES[track] || BGM_MELODIES.dreamy;
  currentBgmStep = 0;

  const playNextChord = () => {
    if (!currentSoundSettings.bgmEnabled || currentSoundSettings.bgmTrack === 'off') return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const chord = melody[currentBgmStep % melody.length];
    currentBgmStep++;

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(currentSoundSettings.bgmVolume * 0.22, now);
    masterGain.connect(ctx.destination);

    // Warm Lowpass filter for smooth ambient tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(track === 'lofi' ? 700 : track === 'runway' ? 2200 : 1400, now);
    filter.connect(masterGain);

    chord.notes.forEach((freq, noteIdx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + noteIdx * 0.03;

      osc.type = track === 'runway' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = chord.dur;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(noteTime);
      osc.stop(noteTime + dur + 0.1);
    });
  };

  // Step loop
  const stepSpeed = track === 'runway' ? 420 : track === 'lofi' ? 950 : 620;
  playNextChord();
  bgmInterval = setInterval(playNextChord, stepSpeed);
};

// ==================== SPEECH SYNTHESIS HELPER ====================

export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
};

export const speakWithSettings = (
  text: string,
  settings: SoundSettings,
  gender: 'female' | 'male',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
) => {
  if (!settings.voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').trim();
  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Pitch calculation based on custom setting or gender
  utterance.pitch = settings.voicePitch;
  utterance.rate = settings.voiceRate;

  const voices = getAvailableVoices();
  let selectedVoice: SpeechSynthesisVoice | undefined;

  if (settings.voiceURI) {
    selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI || v.name === settings.voiceURI);
  }

  if (!selectedVoice) {
    // Default fallback
    const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
    if (gender === 'female') {
      selectedVoice =
        englishVoices.find((v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('google')) ||
        englishVoices[0];
    } else {
      selectedVoice =
        englishVoices.find((v) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel')) ||
        englishVoices[0];
    }
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    onError?.();
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
};
