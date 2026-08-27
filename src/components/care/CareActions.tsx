import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface CareActionsProps {
  onFeed: (foodName: string, xpReward: number, coinReward: number) => void;
  onClean: (toolName: string, xpReward: number, coinReward: number) => void;
  onClose: () => void;
  mode: 'feed' | 'bath';
}

const FOODS = [
  { name: 'Fresh Apple', icon: '🍎', xp: 40, coins: 15, quote: 'Crunchy and sweet! Just what I needed!' },
  { name: 'Strawberry Cake', icon: '🍰', xp: 60, coins: 25, quote: 'Delicious! The frosting is perfection! 💕' },
  { name: 'Rainbow Ice Cream', icon: '🍦', xp: 50, coins: 20, quote: 'Yummy! Cool and refreshing!' },
  { name: 'Boba Milk Tea', icon: '🧋', xp: 55, coins: 22, quote: 'Tapioca pearls are my absolute favorite!' },
  { name: 'Berry Smoothie', icon: '🍓', xp: 45, coins: 18, quote: 'So energizing! Ready for a fashion show!' },
];

const BATH_TOOLS = [
  { name: 'Rose Bubble Soap', icon: '🧼', xp: 50, coins: 20, desc: 'Warm velvety rose petals aroma' },
  { name: 'Lavender Sponge', icon: '🧽', xp: 60, coins: 25, desc: 'Soft lather scrub that revitalizes glow' },
  { name: 'Sparkle Bath Bombs', icon: '🫧', xp: 75, coins: 30, desc: 'Rainbow fizzing bubbles and shimmer' },
  { name: 'Golden Hair Dryer', icon: '✨', xp: 45, coins: 15, desc: 'Silky smooth salon blowout finish' },
];

export const CareActions: React.FC<CareActionsProps> = ({
  onFeed,
  onClean,
  onClose,
  mode,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleSelectFood = (food: typeof FOODS[0]) => {
    setSelectedItem(food.name);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => {
      onFeed(food.name, food.xp, food.coins);
      onClose();
    }, 600);
  };

  const handleSelectBath = (tool: typeof BATH_TOOLS[0]) => {
    setSelectedItem(tool.name);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => {
      onClean(tool.name, tool.xp, tool.coins);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44]">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{mode === 'feed' ? '🍎' : '🛁'}</span>
            <div>
              <h2 className="font-black text-xl tracking-wide">
                {mode === 'feed' ? 'Delicious Treats' : 'Bubble Spa Bath'}
              </h2>
              <span className="text-xs font-bold text-pink-500">
                {mode === 'feed' ? 'Choose a snack for your companion' : 'Pamper with spa grooming'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 hover:text-pink-500 text-lg"
          >
            ✕
          </button>
        </div>

        {mode === 'feed' ? (
          <div className="grid grid-cols-2 gap-3 w-full">
            {FOODS.map((food) => (
              <button
                key={food.name}
                onClick={() => handleSelectFood(food)}
                disabled={selectedItem !== null}
                className={`bg-white hover:bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 text-center ${
                  selectedItem === food.name ? 'border-pink-500 bg-pink-100 scale-105' : ''
                }`}
              >
                <span className="text-4xl">{food.icon}</span>
                <span className="font-black text-xs text-[#4A2D44]">{food.name}</span>
                <div className="flex gap-1.5 text-[10px] font-bold">
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">+{food.xp} XP</span>
                  <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-md">+{food.coins} ✨</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 w-full">
            {BATH_TOOLS.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleSelectBath(tool)}
                disabled={selectedItem !== null}
                className={`bg-white hover:bg-blue-50/80 p-4 rounded-2xl border-2 border-blue-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 text-center ${
                  selectedItem === tool.name ? 'border-blue-500 bg-blue-100 scale-105' : ''
                }`}
              >
                <span className="text-4xl">{tool.icon}</span>
                <span className="font-black text-xs text-[#4A2D44]">{tool.name}</span>
                <span className="text-[10px] text-gray-500 line-clamp-1">{tool.desc}</span>
                <div className="flex gap-1.5 text-[10px] font-bold mt-1">
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">+{tool.xp} XP</span>
                  <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-md">+{tool.coins} ✨</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
