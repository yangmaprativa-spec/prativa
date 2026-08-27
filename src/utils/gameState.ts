import { DailyTask, GameState, getXpRequiredForLevel } from '../types/game';
import { WARDROBE_CATALOG } from '../data/wardrobeCatalog';

const STORAGE_KEY = 'virtual_character_game_save_v2';

export const getInitialDailyTasks = (): DailyTask[] => [
  {
    id: 'task_feed',
    title: 'Feed Character',
    description: 'Give your companion a delicious sweet treat or healthy fruit.',
    icon: '🍎',
    xpReward: 65,
    coinReward: 30,
    completed: false,
    type: 'feed',
  },
  {
    id: 'task_clean',
    title: 'Bubble Spa Bath',
    description: 'Groom and wash your character with warm bubble water.',
    icon: '🛁',
    xpReward: 75,
    coinReward: 35,
    completed: false,
    type: 'clean',
  },
  {
    id: 'task_dress',
    title: 'Style & Dress Up',
    description: 'Equip or switch an outfit, heels, shoes, or accessory.',
    icon: '👗',
    xpReward: 50,
    coinReward: 25,
    completed: false,
    type: 'dress',
  },
  {
    id: 'task_talk',
    title: 'Warm Conversation',
    description: 'Chat with your character and hear what they have to say.',
    icon: '💬',
    xpReward: 70,
    coinReward: 40,
    completed: false,
    type: 'talk',
  },
  {
    id: 'task_minigame',
    title: 'Play Mini-Game',
    description: 'Test your reflexes and skills in any arcade mini-game.',
    icon: '🎮',
    xpReward: 80,
    coinReward: 45,
    completed: false,
    type: 'minigame',
  },
];

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDefaultGameState = (): GameState => {
  const defaultUnlocked = WARDROBE_CATALOG
    .filter(item => item.unlockedByDefault || item.price === 0)
    .map(item => item.id);

  return {
    characterGender: 'female',
    characterName: 'Angela',
    level: 1,
    xp: 0,
    coins: 150, // Starter bonus coins
    equipped: {
      clothes: 'outfit_casual_pink',
      shoes: 'shoes_classic_white',
      heels: '',
      accessories: 'acc_none',
    },
    unlockedItemIds: defaultUnlocked,
    tasks: getInitialDailyTasks(),
    lastDailyReset: getTodayDateString(),
    stats: {
      conversationsCount: 0,
      miniGamesWon: 0,
      totalCoinsEarned: 150,
      tasksCompleted: 0,
    },
    roomTheme: 'bedroom',
  };
};

export const loadGameState = (): GameState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getDefaultGameState();
    const parsed: GameState = JSON.parse(saved);

    // Check if daily tasks need reset for today
    const today = getTodayDateString();
    if (parsed.lastDailyReset !== today) {
      parsed.tasks = getInitialDailyTasks();
      parsed.lastDailyReset = today;
    }

    // Ensure all default unlocked items exist
    const defaultUnlocked = WARDROBE_CATALOG
      .filter(item => item.unlockedByDefault || item.price === 0)
      .map(item => item.id);
    
    parsed.unlockedItemIds = Array.from(new Set([...(parsed.unlockedItemIds || []), ...defaultUnlocked]));

    return parsed;
  } catch (err) {
    console.error('Failed to parse saved game state:', err);
    return getDefaultGameState();
  }
};

export const saveGameState = (state: GameState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save game state to localStorage:', err);
  }
};

export interface LevelUpResult {
  newLevel: number;
  newXp: number;
  didLevelUp: boolean;
  levelsGained: number;
  bonusCoinsAwarded: number;
}

export const addXpAndCalculateLevel = (currentLevel: number, currentXp: number, xpToAdd: number): LevelUpResult => {
  let level = currentLevel;
  let xp = currentXp + xpToAdd;
  let didLevelUp = false;
  let levelsGained = 0;
  let bonusCoins = 0;

  while (level < 90) {
    const required = getXpRequiredForLevel(level);
    if (xp >= required) {
      xp -= required;
      level += 1;
      didLevelUp = true;
      levelsGained += 1;
      // Bonus coins per level up!
      bonusCoins += 50 + level * 10;
    } else {
      break;
    }
  }

  // Cap at 90 max level
  if (level >= 90) {
    level = 90;
    const maxReq = getXpRequiredForLevel(90);
    if (xp > maxReq) xp = maxReq;
  }

  return {
    newLevel: level,
    newXp: xp,
    didLevelUp,
    levelsGained,
    bonusCoinsAwarded: bonusCoins,
  };
};
