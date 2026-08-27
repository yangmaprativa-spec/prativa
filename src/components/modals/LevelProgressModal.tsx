import React from 'react';
import { getDifficultyTier, getXpRequiredForLevel } from '../../types/game';

interface LevelProgressModalProps {
  currentLevel: number;
  currentXp: number;
  onClose: () => void;
}

const MILESTONES = [
  { level: 1, title: 'Journey Begins', reward: 'Starter Pack', icon: '🌱', tier: 'Easy' },
  { level: 10, title: 'Gown Unlock', reward: 'Royal Velvet Outfit', icon: '👗', tier: 'Easy' },
  { level: 15, title: 'Glass Pumps', reward: 'Crystal Glass Heels', icon: '💎', tier: 'Easy' },
  { level: 30, title: 'Rising Star Master', reward: '500 Coins + Cyber Gear', icon: '⚡', tier: 'Easy' },
  { level: 45, title: 'Celestial Couture', reward: 'Diamond Stardust Dress', icon: '✨', tier: 'Medium' },
  { level: 60, title: 'Fashion Icon', reward: '1000 Coins + Halo', icon: '👑', tier: 'Medium' },
  { level: 75, title: 'Haute Couture', reward: 'Legendary Runways', icon: '🔥', tier: 'Hard' },
  { level: 90, title: 'Legendary Superstar', reward: 'Ultimate Crown & Trophy', icon: '🏆', tier: 'Hard' },
];

export const LevelProgressModal: React.FC<LevelProgressModalProps> = ({
  currentLevel,
  currentXp,
  onClose,
}) => {
  const tier = getDifficultyTier(currentLevel);
  const requiredXp = getXpRequiredForLevel(currentLevel);
  const xpPercent = Math.min(100, Math.round((currentXp / requiredXp) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44] max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 hover:text-pink-500"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-[#FF99C8] rounded-full flex items-center justify-center border-4 border-white shadow-md mx-auto mb-2 text-2xl font-black text-white">
            {currentLevel}
          </div>
          <h2 className="text-xl font-black text-[#4A2D44]">Level Progression (1 - 90)</h2>
          <span
            className="text-xs font-black px-3 py-1 rounded-full text-white inline-block mt-1"
            style={{ backgroundColor: tier.tierColor }}
          >
            {tier.tierName} • {tier.tierCategory} Tier
          </span>
        </div>

        {/* Current XP Progress Card */}
        <div className="w-full bg-white rounded-2xl p-4 border border-pink-100 shadow-sm mb-4">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-gray-500 uppercase tracking-wider text-[10px]">Level {currentLevel} Progress</span>
            <span className="text-pink-600 font-black">
              {currentXp} / {requiredXp} XP ({xpPercent}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-[#FFE0EF] rounded-full overflow-hidden border border-[#FFD1E6]">
            <div
              className="h-full bg-gradient-to-r from-[#FF99C8] to-[#FC67A7] transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Difficulty Tiers Overview */}
        <div className="grid grid-cols-3 gap-2 w-full mb-4">
          <div className={`p-3 rounded-2xl border text-center ${currentLevel <= 30 ? 'bg-green-50 border-green-300 ring-2 ring-green-200' : 'bg-white border-gray-100 opacity-75'}`}>
            <span className="text-xs font-black text-green-700 block">EASY</span>
            <span className="text-[10px] text-gray-500 font-bold">Lv. 1 - 30</span>
            <p className="text-[9px] text-gray-400 mt-1">Gentle mini-games & fast XP gain</p>
          </div>

          <div className={`p-3 rounded-2xl border text-center ${currentLevel > 30 && currentLevel <= 60 ? 'bg-pink-50 border-pink-300 ring-2 ring-pink-200' : 'bg-white border-gray-100 opacity-75'}`}>
            <span className="text-xs font-black text-pink-600 block">MEDIUM</span>
            <span className="text-[10px] text-gray-500 font-bold">Lv. 31 - 60</span>
            <p className="text-[9px] text-gray-400 mt-1">Faster timing, higher coin payouts</p>
          </div>

          <div className={`p-3 rounded-2xl border text-center ${currentLevel > 60 ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' : 'bg-white border-gray-100 opacity-75'}`}>
            <span className="text-xs font-black text-rose-600 block">HARD</span>
            <span className="text-[10px] text-gray-500 font-bold">Lv. 61 - 90</span>
            <p className="text-[9px] text-gray-400 mt-1">Elite obstacles & legendary prestige</p>
          </div>
        </div>

        {/* Major Milestone Roadmap */}
        <div className="w-full bg-white rounded-2xl p-4 border border-pink-100 shadow-sm flex flex-col gap-2.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
            Milestone Rewards
          </h3>
          {MILESTONES.map((m) => {
            const isPassed = currentLevel >= m.level;
            return (
              <div
                key={m.level}
                className={`flex items-center justify-between p-2 rounded-xl border ${
                  isPassed
                    ? 'bg-green-50/70 border-green-200'
                    : 'bg-gray-50/50 border-gray-100 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                      isPassed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isPassed ? '✓' : `L${m.level}`}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">{m.title}</span>
                    <span className="text-[10px] text-gray-500">{m.reward}</span>
                  </div>
                </div>
                <span className="text-xl">{m.icon}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
