import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ItemCategory, WardrobeItem } from '../../types/game';
import { WARDROBE_CATALOG } from '../../data/wardrobeCatalog';

interface WardrobePanelProps {
  gender: 'female' | 'male';
  coins: number;
  playerLevel: number;
  equipped: {
    clothes: string;
    shoes: string;
    heels: string;
    accessories: string;
  };
  unlockedItemIds: string[];
  onUnlockItem: (item: WardrobeItem) => void;
  onEquipItem: (item: WardrobeItem) => void;
  onClose?: () => void;
}

export const WardrobePanel: React.FC<WardrobePanelProps> = ({
  gender,
  coins,
  playerLevel,
  equipped,
  unlockedItemIds,
  onUnlockItem,
  onEquipItem,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('clothes');
  const [activeTab, setActiveTab] = useState<'all' | 'owned' | 'shop'>('all');

  const categories: { id: ItemCategory; label: string; icon: string }[] = [
    { id: 'clothes', label: 'CLOTHES', icon: '👗' },
    { id: 'heels', label: 'HEELS', icon: '👠' },
    { id: 'shoes', label: 'SHOES', icon: '👟' },
    { id: 'accessories', label: 'ACCESS.', icon: '👑' },
  ];

  // Filter items based on category and character gender
  const categoryItems = WARDROBE_CATALOG.filter((item) => {
    if (item.category !== selectedCategory) return false;
    if (item.gender !== 'all' && item.gender !== gender) return false;
    return true;
  });

  const filteredItems = categoryItems.filter((item) => {
    const isUnlocked = unlockedItemIds.includes(item.id);
    if (activeTab === 'owned') return isUnlocked;
    if (activeTab === 'shop') return !isUnlocked;
    return true;
  });

  const ownedCount = WARDROBE_CATALOG.filter((i) => unlockedItemIds.includes(i.id)).length;
  const totalCount = WARDROBE_CATALOG.length;

  const handleItemAction = (item: WardrobeItem) => {
    const isUnlocked = unlockedItemIds.includes(item.id);

    if (isUnlocked) {
      // Equip immediately
      onEquipItem(item);
    } else {
      // Check level requirements
      if (item.requiredLevel && playerLevel < item.requiredLevel) {
        alert(`This item unlocks when you reach Level ${item.requiredLevel}! Current level: ${playerLevel}.`);
        return;
      }

      // Check coin balance
      if (coins < item.price) {
        alert(`You need ${item.price} coins to unlock this item. Play mini-games or complete daily tasks to earn more!`);
        return;
      }

      // Unlock and celebrate!
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onUnlockItem(item);
      onEquipItem(item);
    }
  };

  const isEquipped = (itemId: string): boolean => {
    return (
      equipped.clothes === itemId ||
      equipped.shoes === itemId ||
      equipped.heels === itemId ||
      equipped.accessories === itemId
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 text-[#4A2D44]">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <h3 className="text-sm font-black uppercase tracking-wider">Wardrobe Boutique</h3>
        </div>
        <span className="text-[10px] bg-pink-100 px-2.5 py-1 rounded-full font-bold text-pink-600">
          {ownedCount}/{totalCount} Owned
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-1 min-w-[64px] text-[11px] font-black py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
              selectedCategory === cat.id
                ? 'bg-[#FF70A6] text-white shadow-sm'
                : 'bg-white/80 text-gray-500 hover:bg-pink-50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Item Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2.5 overflow-y-auto pr-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>
        {filteredItems.map((item) => {
          const unlocked = unlockedItemIds.includes(item.id);
          const equippedNow = isEquipped(item.id);
          const levelLocked = !!(item.requiredLevel && playerLevel < item.requiredLevel);
          const canAfford = coins >= item.price;

          return (
            <div
              key={item.id}
              onClick={() => handleItemAction(item)}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-between text-center relative cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                equippedNow
                  ? 'bg-pink-50 border-2 border-pink-400 shadow-sm'
                  : unlocked
                  ? 'bg-white border-2 border-pink-100 hover:border-pink-300'
                  : 'bg-white/60 border-2 border-dashed border-pink-200 hover:bg-white'
              }`}
            >
              {/* Equipped Checkmark Badge */}
              {equippedNow && (
                <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full p-1 shadow-sm">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              )}

              {/* Icon / Preview */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl my-1 relative">
                <span className={unlocked ? '' : 'grayscale opacity-75'}>{item.icon}</span>
                {/* Color swatches */}
                <div
                  className="w-3 h-3 rounded-full absolute -bottom-1 -right-1 border border-white shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
              </div>

              {/* Title */}
              <span className="text-[11px] font-bold text-[#4A2D44] line-clamp-1 mt-1">{item.name}</span>

              {/* Status / Price button */}
              <div className="mt-2 w-full">
                {equippedNow ? (
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-tight bg-pink-100 px-2 py-0.5 rounded-full block">
                    Equipped
                  </span>
                ) : unlocked ? (
                  <button className="w-full bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black py-1 rounded-xl shadow-xs">
                    Wear
                  </button>
                ) : levelLocked ? (
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full block">
                    🔒 Lv. {item.requiredLevel}
                  </span>
                ) : (
                  <div
                    className={`w-full py-1 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 shadow-xs ${
                      canAfford
                        ? 'bg-[#FFF9C4] text-yellow-900 border border-yellow-300'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <span>✨</span>
                    <span>{item.price}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
