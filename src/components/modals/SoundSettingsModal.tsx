import React, { useState, useEffect } from 'react';
import {
  SoundSettings,
  VOICE_PRESETS,
  VoicePresetType,
  BgmTrackType,
  DEFAULT_SOUND_SETTINGS,
} from '../../types/audio';
import {
  saveSoundSettings,
  getAvailableVoices,
  speakWithSettings,
  playSfxPop,
  playSfxCoin,
  playSfxLevelUp,
  playSfxPetGiggle,
  playSfxEat,
  playSfxBath,
  playSfxHeelTap,
  playSfxRhythmHit,
  getAudioContext,
} from '../../utils/audioSystem';

interface SoundSettingsModalProps {
  settings: SoundSettings;
  characterGender: 'female' | 'male';
  characterName: string;
  onUpdateSettings: (newSettings: SoundSettings) => void;
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  settings,
  characterGender,
  characterName,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'bgm' | 'sfx'>('voice');
  const [localSettings, setLocalSettings] = useState<SoundSettings>({ ...settings });
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    // Populate browser voices
    const updateVoices = () => {
      const v = getAvailableVoices();
      setSystemVoices(v);
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleChange = (partial: Partial<SoundSettings>) => {
    const updated = { ...localSettings, ...partial };
    setLocalSettings(updated);
    onUpdateSettings(updated);
    saveSoundSettings(updated);
  };

  const handleSelectPreset = (presetKey: Exclude<VoicePresetType, 'custom'>) => {
    playSfxPop();
    const preset = VOICE_PRESETS[presetKey];
    handleChange({
      voicePreset: presetKey,
      voicePitch: preset.pitch,
      voiceRate: preset.rate,
    });
  };

  const handleTestVoice = () => {
    getAudioContext(); // Resume audio context
    setIsTestingVoice(true);
    const samplePhrases = [
      `Hello! I'm ${characterName}! How do I sound to you?`,
      `Yay! This is my new voice! What do you think of this style?`,
      `Hi there darling! I love fashion and talking with you!`,
    ];
    const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];

    speakWithSettings(
      phrase,
      localSettings,
      characterGender,
      () => setIsTestingVoice(true),
      () => setIsTestingVoice(false),
      () => setIsTestingVoice(false)
    );
  };

  const tracks: { id: BgmTrackType; label: string; icon: string; desc: string }[] = [
    { id: 'dreamy', label: 'Dreamy Pastel Waltz', icon: '🌸', desc: 'Gentle, soothing harp & piano chimes' },
    { id: 'runway', label: 'Fashion Runway Beat', icon: '👠', desc: 'Upbeat chic runway tempo with bells' },
    { id: 'cafe', label: 'Cute Cafe Melodies', icon: '☕', desc: 'Cheerful, warm jazz-pop melody' },
    { id: 'lofi', label: 'Lofi Starlight Lullaby', icon: '🌙', desc: 'Warm relaxing ambient starlight chords' },
    { id: 'off', label: 'Muted (No Music)', icon: '🔕', desc: 'Silence background music' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-xl rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44] max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          id="btn-close-sound-modal"
          onClick={() => {
            playSfxPop();
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center font-black text-gray-400 hover:text-pink-500 transition-colors"
        >
          ✕
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 flex items-center justify-center text-2xl text-white shadow-md mb-2">
          🎵
        </div>
        <h2 className="text-2xl font-black text-[#4A2D44]">Sound & Voice Studio</h2>
        <p className="text-xs text-gray-500 mb-4 text-center max-w-md">
          Customize {characterName}'s spoken voice, pitch, speaking speed, background music soundtracks, and audio effects!
        </p>

        {/* Navigation Tabs */}
        <div className="flex w-full bg-white p-1 rounded-2xl shadow-sm border border-pink-100 mb-5">
          <button
            id="tab-sound-voice"
            onClick={() => {
              playSfxPop();
              setActiveTab('voice');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'voice'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <span>🎙️</span>
            <span>Character Voice</span>
          </button>
          <button
            id="tab-sound-bgm"
            onClick={() => {
              playSfxPop();
              setActiveTab('bgm');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bgm'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <span>🎶</span>
            <span>Music (BGM)</span>
          </button>
          <button
            id="tab-sound-sfx"
            onClick={() => {
              playSfxPop();
              setActiveTab('sfx');
            }}
            className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sfx'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-gray-500 hover:text-pink-600'
            }`}
          >
            <span>🔊</span>
            <span>Sound Effects</span>
          </button>
        </div>

        {/* TAB 1: CHARACTER VOICE */}
        {activeTab === 'voice' && (
          <div className="w-full flex flex-col gap-4">
            {/* Master Voice Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-sm block">Companion Spoken Voice (TTS)</span>
                <span className="text-[11px] text-gray-500">
                  {localSettings.voiceEnabled ? 'Spoken responses are active' : 'Voice is currently muted'}
                </span>
              </div>
              <button
                id="toggle-voice-enabled"
                onClick={() => {
                  playSfxPop();
                  handleChange({ voiceEnabled: !localSettings.voiceEnabled });
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                  localSettings.voiceEnabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {localSettings.voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
              </button>
            </div>

            {/* Quick Voice Presets */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
              <span className="font-bold text-xs block mb-1 text-pink-600">✨ Quick Voice Style Presets</span>
              <p className="text-[11px] text-gray-500 mb-3">
                Select an instant personality preset for {characterName}:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(VOICE_PRESETS) as Array<Exclude<VoicePresetType, 'custom'>>).map((key) => {
                  const p = VOICE_PRESETS[key];
                  const isSelected = localSettings.voicePreset === key;
                  return (
                    <button
                      key={key}
                      id={`preset-voice-${key}`}
                      onClick={() => handleSelectPreset(key)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        isSelected
                          ? 'border-pink-500 bg-pink-50/80 shadow-md ring-2 ring-pink-400'
                          : 'border-gray-100 bg-gray-50/70 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{p.icon}</span>
                        <span className="font-bold text-xs text-[#4A2D44]">{p.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 leading-tight">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Tuning Controls: Pitch & Speed */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex flex-col gap-3.5">
              <span className="font-bold text-xs block text-purple-700">🎛️ Voice Pitch & Speed Tuning</span>

              {/* Pitch slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Voice Pitch (Tone)</span>
                  <span className="text-pink-600 font-bold">{localSettings.voicePitch.toFixed(2)}x {localSettings.voicePitch > 1.3 ? '🎀 Cute / High' : localSettings.voicePitch < 0.95 ? '🕶️ Deep' : '✨ Balanced'}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.9"
                  step="0.05"
                  value={localSettings.voicePitch}
                  onChange={(e) => {
                    handleChange({
                      voicePitch: parseFloat(e.target.value),
                      voicePreset: 'custom',
                    });
                  }}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-pink-100 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Deep & Low (0.6x)</span>
                  <span>Normal (1.0x)</span>
                  <span>High & Chibi (1.9x)</span>
                </div>
              </div>

              {/* Speed slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Speaking Speed (Rate)</span>
                  <span className="text-pink-600 font-bold">{localSettings.voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={localSettings.voiceRate}
                  onChange={(e) => {
                    handleChange({
                      voiceRate: parseFloat(e.target.value),
                      voicePreset: 'custom',
                    });
                  }}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-pink-100 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                  <span>Gentle & Calm (0.7x)</span>
                  <span>Standard (1.0x)</span>
                  <span>Energetic & Fast (1.5x)</span>
                </div>
              </div>

              {/* Browser voice selector if available */}
              {systemVoices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    System Speech Voice Engine
                  </label>
                  <select
                    value={localSettings.voiceURI}
                    onChange={(e) => {
                      handleChange({ voiceURI: e.target.value });
                    }}
                    className="w-full bg-pink-50/50 border border-pink-200 rounded-xl p-2 text-xs font-medium text-[#4A2D44] focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >
                    <option value="">✨ Auto-Select Best Voice for {characterName}</option>
                    {systemVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Test Voice Button */}
            <button
              id="btn-test-voice-sound"
              onClick={handleTestVoice}
              disabled={isTestingVoice}
              className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isTestingVoice
                  ? 'bg-pink-300 text-white cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:brightness-105 active:scale-[0.99]'
              }`}
            >
              <span>{isTestingVoice ? '🗣️ Speaking Sample...' : '▶️ Test Voice Sample'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: BACKGROUND MUSIC (BGM) */}
        {activeTab === 'bgm' && (
          <div className="w-full flex flex-col gap-4">
            {/* Master BGM Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-sm block">Background Music (BGM)</span>
                <span className="text-[11px] text-gray-500">
                  {localSettings.bgmEnabled ? 'Music is actively playing' : 'Music is paused'}
                </span>
              </div>
              <button
                id="toggle-bgm-enabled"
                onClick={() => {
                  getAudioContext();
                  playSfxPop();
                  handleChange({ bgmEnabled: !localSettings.bgmEnabled });
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                  localSettings.bgmEnabled
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {localSettings.bgmEnabled ? '🎶 Music ON' : '🔇 Music OFF'}
              </button>
            </div>

            {/* Track Selector */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm flex flex-col gap-2.5">
              <span className="font-bold text-xs text-pink-600 block">🎼 Select Soundtrack</span>
              <div className="flex flex-col gap-2">
                {tracks.map((t) => {
                  const isCurrent = localSettings.bgmTrack === t.id;
                  return (
                    <button
                      key={t.id}
                      id={`btn-bgm-track-${t.id}`}
                      onClick={() => {
                        getAudioContext();
                        playSfxPop();
                        handleChange({
                          bgmTrack: t.id,
                          bgmEnabled: t.id !== 'off',
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-300 shadow-sm'
                          : 'border-gray-100 bg-gray-50 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                          {t.icon}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#4A2D44] block">{t.label}</span>
                          <span className="text-[10px] text-gray-500">{t.desc}</span>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="px-2.5 py-1 bg-pink-500 text-white rounded-full text-[10px] font-black animate-pulse">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BGM Volume Slider */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Music Volume</span>
                <span className="text-pink-600 font-bold">{Math.round(localSettings.bgmVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.bgmVolume}
                onChange={(e) => {
                  handleChange({ bgmVolume: parseFloat(e.target.value) });
                }}
                className="w-full accent-pink-500 cursor-pointer h-2 bg-pink-100 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* TAB 3: SOUND EFFECTS (SFX) */}
        {activeTab === 'sfx' && (
          <div className="w-full flex flex-col gap-4">
            {/* Master SFX Toggle */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 flex items-center justify-between shadow-sm">
              <div>
                <span className="font-bold text-sm block">Sound Effects (SFX)</span>
                <span className="text-[11px] text-gray-500">
                  {localSettings.sfxEnabled ? 'Interactive audio effects are enabled' : 'Effects are muted'}
                </span>
              </div>
              <button
                id="toggle-sfx-enabled"
                onClick={() => {
                  playSfxPop();
                  handleChange({ sfxEnabled: !localSettings.sfxEnabled });
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-sm ${
                  localSettings.sfxEnabled
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {localSettings.sfxEnabled ? '🔊 SFX ON' : '🔇 SFX OFF'}
              </button>
            </div>

            {/* SFX Volume Slider */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Sound Effects Volume</span>
                <span className="text-purple-600 font-bold">{Math.round(localSettings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localSettings.sfxVolume}
                onChange={(e) => {
                  handleChange({ sfxVolume: parseFloat(e.target.value) });
                }}
                className="w-full accent-purple-500 cursor-pointer h-2 bg-purple-100 rounded-lg"
              />
            </div>

            {/* Interactive Soundboard Test */}
            <div className="bg-white p-4 rounded-2xl border border-pink-100 shadow-sm">
              <span className="font-bold text-xs text-purple-700 block mb-1">🎹 Interactive SFX Soundboard</span>
              <p className="text-[11px] text-gray-500 mb-3">
                Tap any button below to hear and test in-game sounds:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  id="sfx-test-coin"
                  onClick={() => playSfxCoin()}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>✨</span>
                  <span>Coin Sparkle</span>
                </button>

                <button
                  id="sfx-test-levelup"
                  onClick={() => playSfxLevelUp()}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>👑</span>
                  <span>Level Up Fanfare</span>
                </button>

                <button
                  id="sfx-test-pet"
                  onClick={() => playSfxPetGiggle()}
                  className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl text-xs font-bold text-pink-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🐾</span>
                  <span>Pet Giggle</span>
                </button>

                <button
                  id="sfx-test-eat"
                  onClick={() => playSfxEat()}
                  className="p-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-xs font-bold text-orange-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🍎</span>
                  <span>Munch Snack</span>
                </button>

                <button
                  id="sfx-test-bath"
                  onClick={() => playSfxBath()}
                  className="p-2.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-xl text-xs font-bold text-cyan-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🛁</span>
                  <span>Bubble Bath</span>
                </button>

                <button
                  id="sfx-test-heel"
                  onClick={() => playSfxHeelTap()}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>👠</span>
                  <span>High Heel Tap</span>
                </button>

                <button
                  id="sfx-test-rhythm"
                  onClick={() => playSfxRhythmHit('perfect')}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🎯</span>
                  <span>Arcade Perfect</span>
                </button>

                <button
                  id="sfx-test-pop"
                  onClick={() => playSfxPop()}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <span>🔘</span>
                  <span>Button Pop</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset / Footer Actions */}
        <div className="w-full flex items-center justify-between pt-4 mt-2 border-t border-pink-100">
          <button
            id="btn-reset-sound-defaults"
            onClick={() => {
              playSfxPop();
              const defaults = { ...DEFAULT_SOUND_SETTINGS };
              setLocalSettings(defaults);
              onUpdateSettings(defaults);
              saveSoundSettings(defaults);
            }}
            className="text-[11px] text-gray-500 hover:text-pink-600 underline font-medium"
          >
            Reset Sound to Defaults
          </button>

          <button
            id="btn-save-close-sound"
            onClick={() => {
              playSfxPop();
              onClose();
            }}
            className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
