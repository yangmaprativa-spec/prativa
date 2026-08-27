export type VoicePresetType = 'sweet' | 'warm' | 'glamour' | 'cool' | 'playful' | 'chibi' | 'custom';

export type BgmTrackType = 'dreamy' | 'runway' | 'cafe' | 'lofi' | 'off';

export interface SoundSettings {
  voicePreset: VoicePresetType;
  voiceURI: string;
  voicePitch: number; // 0.5 to 2.0
  voiceRate: number; // 0.6 to 1.8
  voiceEnabled: boolean;
  bgmEnabled: boolean;
  bgmTrack: BgmTrackType;
  bgmVolume: number; // 0.0 to 1.0
  sfxEnabled: boolean;
  sfxVolume: number; // 0.0 to 1.0
}

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  voicePreset: 'sweet',
  voiceURI: '',
  voicePitch: 1.25,
  voiceRate: 1.02,
  voiceEnabled: true,
  bgmEnabled: false, // Default off until user turns on to avoid surprise auto-play
  bgmTrack: 'dreamy',
  bgmVolume: 0.3,
  sfxEnabled: true,
  sfxVolume: 0.65,
};

export const VOICE_PRESETS: Record<
  Exclude<VoicePresetType, 'custom'>,
  { label: string; icon: string; pitch: number; rate: number; desc: string }
> = {
  sweet: {
    label: 'Sweet & Cheerful',
    icon: '🍬',
    pitch: 1.3,
    rate: 1.03,
    desc: 'Bright, adorable, and lively tone',
  },
  warm: {
    label: 'Warm & Gentle',
    icon: '💖',
    pitch: 1.08,
    rate: 0.95,
    desc: 'Soft, soothing, and cozy voice',
  },
  glamour: {
    label: 'Glamour Diva',
    icon: '👑',
    pitch: 1.18,
    rate: 1.0,
    desc: 'Confident, stylish, and charismatic',
  },
  cool: {
    label: 'Cool & Chill',
    icon: '🕶️',
    pitch: 0.88,
    rate: 0.96,
    desc: 'Relaxed, smooth, and modern tone',
  },
  playful: {
    label: 'Playful & Energetic',
    icon: '⚡',
    pitch: 1.45,
    rate: 1.15,
    desc: 'Super cheerful, quick, and bubbly',
  },
  chibi: {
    label: 'Cute Chibi',
    icon: '🐱',
    pitch: 1.65,
    rate: 1.2,
    desc: 'High-pitched anime companion style',
  },
};
