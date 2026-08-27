export type CharacterGender = 'female' | 'male';

export type ItemCategory = 'clothes' | 'shoes' | 'heels' | 'accessories';

export interface WardrobeItem {
  id: string;
  name: string;
  category: ItemCategory;
  gender: 'all' | 'female' | 'male';
  price: number;
  icon: string;
  unlockedByDefault?: boolean;
  requiredLevel?: number;
  color: string;
  secondaryColor?: string;
  styleVariant: string;
  description: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  completed: boolean;
  type: 'feed' | 'clean' | 'dress' | 'talk' | 'minigame';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'character';
  text: string;
  timestamp: number;
  emotion?: 'happy' | 'excited' | 'thinking' | 'surprised' | 'loving';
}

export interface GameState {
  characterGender: CharacterGender;
  characterName: string;
  level: number;
  xp: number;
  coins: number;
  equipped: {
    clothes: string;
    shoes: string;
    heels: string;
    accessories: string;
  };
  unlockedItemIds: string[];
  tasks: DailyTask[];
  lastDailyReset: string; // ISO date YYYY-MM-DD
  stats: {
    conversationsCount: number;
    miniGamesWon: number;
    totalCoinsEarned: number;
    tasksCompleted: number;
  };
  roomTheme: 'bedroom' | 'boutique' | 'balcony' | 'disco';
}

// XP needed for next level: scales dynamically from level 1 to 90
export const getXpRequiredForLevel = (level: number): number => {
  if (level <= 30) {
    // Easy tier: 100 to 450 XP per level
    return Math.floor(100 + (level - 1) * 12);
  } else if (level <= 60) {
    // Medium tier: 460 to 1100 XP per level
    return Math.floor(460 + (level - 30) * 22);
  } else {
    // Hard tier (61-90): 1120 to 2200 XP per level
    return Math.floor(1120 + (level - 60) * 36);
  }
};

export const getDifficultyTier = (level: number): {
  tierName: string;
  tierColor: string;
  tierCategory: 'Easy' | 'Medium' | 'Hard';
} => {
  if (level <= 15) return { tierName: 'Beginner Stylist', tierColor: '#4ADE80', tierCategory: 'Easy' };
  if (level <= 30) return { tierName: 'Rising Star', tierColor: '#60A5FA', tierCategory: 'Easy' };
  if (level <= 45) return { tierName: 'Chic Trendsetter', tierColor: '#F472B6', tierCategory: 'Medium' };
  if (level <= 60) return { tierName: 'Fashion Icon', tierColor: '#A78BFA', tierCategory: 'Medium' };
  if (level <= 75) return { tierName: 'Haute Couture Master', tierColor: '#FB923C', tierCategory: 'Hard' };
  return { tierName: 'Legendary Superstar', tierColor: '#E11D48', tierCategory: 'Hard' };
};
