import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CharacterGender,
  GameState,
  WardrobeItem,
  ChatMessage,
  getXpRequiredForLevel,
  getDifficultyTier,
} from './types/game';
import {
  loadGameState,
  saveGameState,
  addXpAndCalculateLevel,
  getTodayDateString,
} from './utils/gameState';
import { SoundSettings } from './types/audio';
import {
  loadSoundSettings,
  saveSoundSettings,
  speakWithSettings,
  playSfxPop,
  playSfxCoin,
  playSfxLevelUp,
  playSfxPetGiggle,
  playSfxEat,
  playSfxBath,
  playSfxHeelTap,
  updateBgmState,
  getAudioContext,
} from './utils/audioSystem';
import { WARDROBE_CATALOG } from './data/wardrobeCatalog';
import { CharacterCanvas } from './components/CharacterCanvas';
import { RhythmCatchGame } from './components/games/RhythmCatchGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { RunwayDashGame } from './components/games/RunwayDashGame';
import { CareActions } from './components/care/CareActions';
import { WardrobePanel } from './components/wardrobe/WardrobePanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { CharacterSelectModal } from './components/modals/CharacterSelectModal';
import { LevelProgressModal } from './components/modals/LevelProgressModal';
import { SoundSettingsModal } from './components/modals/SoundSettingsModal';

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => loadSoundSettings());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [characterAction, setCharacterAction] = useState<
    'idle' | 'happy' | 'wave' | 'spin' | 'eat' | 'bath'
  >('idle');
  const [activeSpeechBubble, setActiveSpeechBubble] = useState<string | null>(null);

  // Modals & UI View state
  const [activeMiniGame, setActiveMiniGame] = useState<'rhythm' | 'memory' | 'runner' | null>(null);
  const [activeCareModal, setActiveCareModal] = useState<'feed' | 'bath' | null>(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCharSelectModal, setShowCharSelectModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMiniGamePicker, setShowMiniGamePicker] = useState(false);
  const [mobileTab, setMobileTab] = useState<'main' | 'tasks' | 'wardrobe' | 'chat'>('main');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const speechTimerRef = useRef<any>(null);

  // Auto-save game state to localStorage on changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Sync BGM with soundSettings
  useEffect(() => {
    updateBgmState();
  }, [soundSettings.bgmEnabled, soundSettings.bgmTrack, soundSettings.bgmVolume]);

  // Initial welcome greeting
  useEffect(() => {
    const greetingText = `Hi there! I'm ${gameState.characterName}! So excited to hang out with you today! ✨`;
    setChatMessages([
      {
        id: 'msg_welcome',
        sender: 'character',
        text: greetingText,
        timestamp: Date.now(),
        emotion: 'happy',
      },
    ]);
    triggerSpeechBubble(greetingText);
  }, [gameState.characterGender]);

  // Speech bubble display helper
  const triggerSpeechBubble = (text: string) => {
    setActiveSpeechBubble(text);
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => {
      setActiveSpeechBubble(null);
    }, 7000);
  };

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Text-To-Speech using sound & voice settings
  const speakText = (text: string) => {
    speakWithSettings(
      text,
      soundSettings,
      gameState.characterGender,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  // Award XP and handle level up calculations
  const awardXpAndCoins = (xpToAdd: number, coinsToAdd: number, reason?: string) => {
    setGameState((prev) => {
      const levelResult = addXpAndCalculateLevel(prev.level, prev.xp, xpToAdd);
      const totalCoinsGained = coinsToAdd + levelResult.bonusCoinsAwarded;

      if (levelResult.didLevelUp) {
        playSfxLevelUp();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        showToast(`🎉 LEVEL UP! You reached Level ${levelResult.newLevel}! (+${levelResult.bonusCoinsAwarded} Bonus Coins)`);
        setCharacterAction('happy');
        const levelMsg = `OMG! We just leveled up to Level ${levelResult.newLevel}! You're amazing! 🌟`;
        triggerSpeechBubble(levelMsg);
        speakText(levelMsg);
      } else {
        if (coinsToAdd > 0) {
          playSfxCoin();
        }
        if (reason) {
          showToast(`+${xpToAdd} XP • +${coinsToAdd} Coins (${reason})`);
        }
      }

      return {
        ...prev,
        level: levelResult.newLevel,
        xp: levelResult.newXp,
        coins: prev.coins + totalCoinsGained,
        stats: {
          ...prev.stats,
          totalCoinsEarned: prev.stats.totalCoinsEarned + totalCoinsGained,
        },
      };
    });
  };

  // Complete a daily task
  const completeTask = (taskId: string) => {
    setGameState((prev) => {
      const taskIndex = prev.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1 || prev.tasks[taskIndex].completed) return prev;

      const updatedTasks = [...prev.tasks];
      const task = updatedTasks[taskIndex];
      task.completed = true;

      // Award task rewards
      awardXpAndCoins(task.xpReward, task.coinReward, task.title);

      const allCompleted = updatedTasks.every((t) => t.completed);
      if (allCompleted) {
        setTimeout(() => {
          awardXpAndCoins(100, 75, 'All Daily Tasks Bonus!');
          confetti({ particleCount: 100, spread: 70 });
        }, 800);
      }

      return {
        ...prev,
        tasks: updatedTasks,
        stats: {
          ...prev.stats,
          tasksCompleted: prev.stats.tasksCompleted + 1,
        },
      };
    });
  };

  // Handle Character Chat Message
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiThinking(true);

    try {
      const activeOutfit = WARDROBE_CATALOG.find((i) => i.id === gameState.equipped.clothes)?.name;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          characterGender: gameState.characterGender,
          characterName: gameState.characterName,
          level: gameState.level,
          equippedOutfitName: activeOutfit,
          chatHistory: chatMessages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      const replyText = data.reply || "I'm so glad we're talking! What fun adventure should we do next?";
      const emotion = data.emotion || 'happy';

      const charMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'character',
        text: replyText,
        timestamp: Date.now(),
        emotion,
      };

      setChatMessages((prev) => [...prev, charMsg]);
      triggerSpeechBubble(replyText);
      speakText(replyText);

      // Character body animation based on emotion
      if (emotion === 'excited' || emotion === 'loving') {
        setCharacterAction('happy');
      } else if (emotion === 'surprised') {
        setCharacterAction('spin');
      }

      // Complete talk daily task & award XP
      completeTask('task_talk');
      awardXpAndCoins(15, 5);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackReply = `I love chatting with you! You have the best style! 💕`;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'character',
          text: fallbackReply,
          timestamp: Date.now(),
          emotion: 'happy',
        },
      ]);
      triggerSpeechBubble(fallbackReply);
      speakText(fallbackReply);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Mini-Game Finish handler
  const handleMiniGameFinish = (coinsEarned: number, xpEarned: number) => {
    setActiveMiniGame(null);
    awardXpAndCoins(xpEarned, coinsEarned, 'Mini-Game Victory');
    completeTask('task_minigame');
    setGameState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        miniGamesWon: prev.stats.miniGamesWon + 1,
      },
    }));
  };

  // Wardrobe Unlock & Equip
  const handleUnlockItem = (item: WardrobeItem) => {
    setGameState((prev) => {
      if (prev.coins < item.price) return prev;
      playSfxCoin();
      return {
        ...prev,
        coins: prev.coins - item.price,
        unlockedItemIds: [...prev.unlockedItemIds, item.id],
      };
    });
    showToast(`Unlocked ${item.name}! ✨`);
  };

  const handleEquipItem = (item: WardrobeItem) => {
    if (item.category === 'heels' || item.category === 'shoes') {
      playSfxHeelTap();
    } else {
      playSfxPop();
    }

    setGameState((prev) => {
      const newEquipped = { ...prev.equipped };
      if (item.category === 'clothes') newEquipped.clothes = item.id;
      if (item.category === 'shoes') {
        newEquipped.shoes = item.id;
        newEquipped.heels = ''; // Clear heels if sneakers equipped
      }
      if (item.category === 'heels') {
        newEquipped.heels = item.id;
        newEquipped.shoes = ''; // Clear flats if heels equipped
      }
      if (item.category === 'accessories') newEquipped.accessories = item.id;

      return {
        ...prev,
        equipped: newEquipped,
      };
    });

    completeTask('task_dress');
    setCharacterAction('spin');
    const compliments = [
      `Wow! This ${item.name} looks stunning on me! ✨`,
      `I feel so glamorous in this new style! Thank you! 💖`,
      `Ooh, this fits like a dream! Let's strike a pose! 💃`,
    ];
    const picked = compliments[Math.floor(Math.random() * compliments.length)];
    triggerSpeechBubble(picked);
    speakText(picked);
  };

  // 3D Canvas Click zone interactions
  const handleCharacterClick = (zone: 'head' | 'body' | 'feet') => {
    getAudioContext(); // Resume Web Audio
    if (zone === 'head') {
      // Petting
      playSfxPetGiggle();
      setCharacterAction('happy');
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.4 } });
      const petQuotes = [
        'Hehe, that tickles! You are so sweet! 💕',
        'Purr... I love getting head pats! 🥰',
        'You give the best pats! ✨',
      ];
      const quote = petQuotes[Math.floor(Math.random() * petQuotes.length)];
      triggerSpeechBubble(quote);
      speakText(quote);
      awardXpAndCoins(10, 2);
    } else if (zone === 'body') {
      // Tickle
      playSfxPetGiggle();
      setCharacterAction('wave');
      const giggleQuotes = [
        'Hehehe! That tickles so much! 😄',
        'Giggle! You caught me off guard! 🌸',
        'Wave back! Ready for fun! 👋',
      ];
      const quote = giggleQuotes[Math.floor(Math.random() * giggleQuotes.length)];
      triggerSpeechBubble(quote);
      speakText(quote);
    } else {
      // Feet / Shoes -> Spin dance
      playSfxHeelTap();
      setCharacterAction('spin');
      const shoeQuotes = [
        'Check out my stylish steps! 👠✨',
        'Spinning with style! 💃',
        'Love these shoes so much! 🌟',
      ];
      const quote = shoeQuotes[Math.floor(Math.random() * shoeQuotes.length)];
      triggerSpeechBubble(quote);
      speakText(quote);
    }
  };

  // Feeding & Bathing Care Action handlers
  const handleFeedCharacter = (foodName: string, xp: number, coins: number) => {
    playSfxEat();
    setCharacterAction('eat');
    awardXpAndCoins(xp, coins, `Treated to ${foodName}`);
    completeTask('task_feed');
    const msg = `Mmm, that ${foodName} was super delicious! Thank you so much! 🍎✨`;
    triggerSpeechBubble(msg);
    speakText(msg);
  };

  const handleCleanCharacter = (toolName: string, xp: number, coins: number) => {
    playSfxBath();
    setCharacterAction('bath');
    awardXpAndCoins(xp, coins, `Spa with ${toolName}`);
    completeTask('task_clean');
    const msg = `So fresh and sparkly clean! I feel like royalty! 🛁✨`;
    triggerSpeechBubble(msg);
    speakText(msg);
  };

  const requiredXp = getXpRequiredForLevel(gameState.level);
  const xpPercent = Math.min(100, Math.round((gameState.xp / requiredXp) * 100));
  const remainingTasks = gameState.tasks.filter((t) => !t.completed).length;

  return (
    <div className="w-full h-screen bg-[#FFEDF5] font-sans flex flex-col p-3 md:p-6 overflow-hidden select-none text-[#4A2D44]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#4A2D44] text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-full shadow-2xl border-2 border-pink-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= 1. HEADER (Artistic Flair Theme) ================= */}
      <header className="flex items-center justify-between mb-3 bg-white/85 backdrop-blur-md p-3 md:p-4 rounded-[2rem] shadow-sm border border-white shrink-0">
        {/* Level Badge & XP Progress */}
        <div
          onClick={() => setShowLevelModal(true)}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          title="Click to view Level 1-90 Progress & Rewards"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FF99C8] rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0">
            <span className="text-xl md:text-2xl font-black text-white">{gameState.level}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-black opacity-60">
                Level {gameState.level} / 90
              </span>
              <span className="text-[9px] bg-pink-100 text-pink-600 font-bold px-1.5 py-0.2 rounded-md">
                {getDifficultyTier(gameState.level).tierCategory}
              </span>
            </div>
            <div className="w-32 md:w-48 h-3 bg-[#FFE0EF] rounded-full mt-1 overflow-hidden border border-[#FFD1E6]">
              <div
                className="h-full bg-gradient-to-r from-[#FF99C8] to-[#FC67A7] transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency & Tokens */}
        <div className="flex items-center gap-3 md:gap-6">
          {/* Virtual In-game Coins */}
          <div
            onClick={() => setShowMiniGamePicker(true)}
            className="flex items-center gap-2 md:gap-3 bg-[#FFF9C4] px-3.5 md:px-5 py-1.5 md:py-2 rounded-full border-2 border-[#FDD835] shadow-inner cursor-pointer hover:scale-105 transition-transform"
            title="Earn coins in Mini-Games & Daily Tasks!"
          >
            <span className="text-lg md:text-xl">✨</span>
            <span className="font-black text-sm md:text-lg">{gameState.coins.toLocaleString()}</span>
          </div>

          {/* Daily Tasks Status Pill */}
          <div
            onClick={() => setMobileTab('tasks')}
            className="hidden sm:flex items-center gap-2 bg-[#E1F5FE] px-3.5 md:px-4 py-1.5 md:py-2 rounded-full border-2 border-[#03A9F4] shadow-inner cursor-pointer"
          >
            <span className="text-base">📋</span>
            <span className="font-black text-xs md:text-sm">
              {gameState.tasks.filter((t) => t.completed).length}/{gameState.tasks.length}
            </span>
          </div>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex items-center gap-2">
          {/* Sound & Voice Studio Button */}
          <button
            id="btn-open-sound-studio"
            onClick={() => {
              getAudioContext();
              playSfxPop();
              setShowSoundModal(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-300 px-3 py-2 md:py-2.5 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all text-xs font-bold text-[#4A2D44]"
            title="Customize Spoken Voice, Music & Sound Effects"
          >
            <span className="text-base md:text-lg">🎵</span>
            <span className="hidden lg:inline">Sound & Voice</span>
          </button>

          <button
            onClick={() => {
              playSfxPop();
              setShowCharSelectModal(true);
            }}
            className="bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-pink-100 hover:scale-105 active:scale-95 text-base md:text-lg"
            title="Switch Companion (Angela / Leo)"
          >
            {gameState.characterGender === 'female' ? '💃' : '🕺'}
          </button>

          <button
            onClick={() => {
              playSfxPop();
              setShowSettingsModal(true);
            }}
            className="bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-pink-100 hover:scale-105 active:scale-95 text-base md:text-lg"
            title="Game Settings & Guide"
          >
            ⚙️
          </button>

          <button
            onClick={() => {
              playSfxPop();
              saveGameState(gameState);
              showToast('Game progress saved locally! 💾');
              confetti({ particleCount: 30, spread: 50 });
            }}
            className="hidden md:flex bg-[#FF70A6] text-white font-black py-2.5 md:py-3 px-4 md:px-6 rounded-2xl shadow-md hover:bg-[#ff5b9a] text-xs md:text-sm tracking-wider uppercase active:scale-95"
          >
            Save Game
          </button>
        </div>
      </header>

      {/* ================= 2. MOBILE NAVIGATION TABS ================= */}
      <div className="flex md:hidden gap-1.5 mb-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl border border-white shrink-0">
        <button
          onClick={() => setMobileTab('main')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
            mobileTab === 'main' ? 'bg-[#FF70A6] text-white shadow-xs' : 'text-gray-500'
          }`}
        >
          Stage
        </button>
        <button
          onClick={() => setMobileTab('tasks')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
            mobileTab === 'tasks' ? 'bg-[#FF70A6] text-white shadow-xs' : 'text-gray-500'
          }`}
        >
          Tasks ({remainingTasks})
        </button>
        <button
          onClick={() => setMobileTab('wardrobe')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
            mobileTab === 'wardrobe' ? 'bg-[#FF70A6] text-white shadow-xs' : 'text-gray-500'
          }`}
        >
          Wardrobe
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all ${
            mobileTab === 'chat' ? 'bg-[#FF70A6] text-white shadow-xs' : 'text-gray-500'
          }`}
        >
          Talk
        </button>
      </div>

      {/* ================= 3. MAIN GAMEPLAY AREA ================= */}
      <div className="flex-1 flex gap-4 min-h-0 relative">
        {/* LEFT COLUMN: Daily Tasks & Mini-Game Launcher */}
        <aside
          className={`w-full md:w-64 flex flex-col gap-3 shrink-0 ${
            mobileTab === 'tasks' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Daily Tasks Card */}
          <div className="bg-white rounded-[2rem] p-4 md:p-5 shadow-sm border border-white flex-1 flex flex-col min-h-0 overflow-y-auto">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-pink-400">●</span> Daily Care Tasks
              </span>
              <span className="text-[10px] bg-pink-50 text-pink-600 font-bold px-2 py-0.5 rounded-md">
                XP Bonus
              </span>
            </h3>

            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-0.5">
              {gameState.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    if (task.type === 'feed') setActiveCareModal('feed');
                    else if (task.type === 'clean') setActiveCareModal('bath');
                    else if (task.type === 'minigame') setShowMiniGamePicker(true);
                    else if (task.type === 'dress') setMobileTab('wardrobe');
                    else if (task.type === 'talk') setMobileTab('chat');
                  }}
                  className={`flex items-center justify-between p-2.5 md:p-3 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] ${
                    task.completed
                      ? 'bg-green-50/80 border-green-100'
                      : 'bg-pink-50/60 border-pink-100 hover:bg-pink-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                        task.completed
                          ? 'bg-green-400 text-white'
                          : 'bg-white border-2 border-pink-200 text-pink-400'
                      }`}
                    >
                      {task.completed ? '✓' : task.icon}
                    </div>
                    <div className="text-left">
                      <span
                        className={`text-xs font-bold block ${
                          task.completed ? 'line-through opacity-50 text-gray-500' : 'text-[#4A2D44]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-[9px] text-pink-500 font-bold">
                        +{task.xpReward} XP • +{task.coinReward} ✨
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-3 border-t border-pink-50 text-center">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-tight">
                {remainingTasks === 0
                  ? '🌟 All daily care tasks complete! +100 XP awarded!'
                  : `${remainingTasks} tasks remaining for bonus chest`}
              </p>
            </div>
          </div>

          {/* Mini-Games Button Card */}
          <div
            onClick={() => setShowMiniGamePicker(true)}
            className="bg-[#A0E7E5] rounded-[2rem] p-4 md:p-5 shadow-md flex flex-col items-center justify-center gap-1.5 cursor-pointer border-4 border-white hover:scale-[1.03] active:scale-95 transition-all"
          >
            <span className="text-3xl md:text-4xl animate-pulse">🎮</span>
            <span className="font-black text-sm md:text-base text-white drop-shadow-sm tracking-wider uppercase">
              Play Mini-Games
            </span>
            <span className="text-[10px] text-teal-800 font-bold bg-white/50 px-3 py-0.5 rounded-full">
              Earn Coins ✨ (Level {gameState.level})
            </span>
          </div>
        </aside>

        {/* CENTER COLUMN: 3D Character Stage */}
        <main
          className={`flex-1 bg-gradient-to-b from-[#B9F3FC] to-[#92C7CF] rounded-[2.5rem] md:rounded-[3rem] relative overflow-hidden border-8 md:border-[12px] border-white shadow-xl flex items-center justify-center min-h-0 ${
            mobileTab === 'main' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Room / Stage Badge */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 bg-white/40 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[11px] md:text-xs font-black text-[#2A5D67] shadow-xs z-10 flex items-center gap-1.5">
            <span>📍</span>
            <span>Dreamy Fashion Stage</span>
          </div>

          {/* Interactive Hint */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold text-[#2A5D67] z-10 hidden sm:block">
            👆 Click Head to Pet • Body to Tickle • Shoes to Spin!
          </div>

          {/* 3D WebGL Canvas */}
          <div className="w-full h-full relative">
            <CharacterCanvas
              gender={gameState.characterGender}
              equipped={gameState.equipped}
              isSpeaking={isSpeaking}
              actionState={characterAction}
              onCharacterClick={handleCharacterClick}
            />

            {/* Speech Bubble Overlay */}
            {activeSpeechBubble && (
              <div className="absolute top-12 md:top-16 right-4 md:right-8 bg-white p-3.5 md:p-4 rounded-3xl shadow-lg border-b-4 border-pink-200 max-w-[200px] md:max-w-[240px] z-20 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-bold leading-relaxed italic text-[#4A2D44]">
                  "{activeSpeechBubble}"
                </p>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 border-l border-b border-pink-100" />
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Wardrobe / Chat Drawer */}
        <aside
          className={`w-full md:w-72 bg-white rounded-[2rem] p-4 md:p-5 shadow-sm border border-white shrink-0 min-h-0 ${
            mobileTab === 'wardrobe' || mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {mobileTab === 'chat' ? (
            <ChatPanel
              messages={chatMessages}
              characterName={gameState.characterName}
              isThinking={isAiThinking}
              onSendMessage={handleSendMessage}
              voiceEnabled={soundSettings.voiceEnabled}
              onToggleVoice={() => {
                const updated = { ...soundSettings, voiceEnabled: !soundSettings.voiceEnabled };
                setSoundSettings(updated);
                saveSoundSettings(updated);
              }}
            />
          ) : (
            <WardrobePanel
              gender={gameState.characterGender}
              coins={gameState.coins}
              playerLevel={gameState.level}
              equipped={gameState.equipped}
              unlockedItemIds={gameState.unlockedItemIds}
              onUnlockItem={handleUnlockItem}
              onEquipItem={handleEquipItem}
            />
          )}
        </aside>
      </div>

      {/* ================= 4. FOOTER: Chat Bar & Quick Care ================= */}
      <footer className="bg-white/85 backdrop-blur-md mt-3 rounded-[2rem] md:rounded-[2.5rem] flex items-center px-4 md:px-8 py-2 md:py-3 gap-3 md:gap-6 shadow-md border border-white shrink-0">
        {/* Mic Voice Button */}
        <button
          onClick={() => {
            setMobileTab('chat');
            const SpeechRecognition =
              (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
              showToast('Speech recognition not supported on this device. You can type!');
            }
          }}
          className="w-10 h-10 md:w-12 md:h-12 bg-pink-100 hover:bg-pink-200 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs"
          title="Voice Chat"
        >
          <span className="text-xl md:text-2xl">🎙️</span>
        </button>

        {/* Chat Input Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={`Talk with ${gameState.characterName}... (Gemini AI)`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                handleSendMessage((e.target as HTMLInputElement).value.trim());
                (e.target as HTMLInputElement).value = '';
              }
            }}
            className="w-full bg-[#F5F5F5] py-2.5 md:py-3.5 px-4 md:px-6 rounded-full border-2 border-transparent focus:border-pink-300 outline-none text-xs md:text-sm font-medium placeholder:text-gray-400 text-[#4A2D44]"
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
              if (input && input.value.trim()) {
                handleSendMessage(input.value.trim());
                input.value = '';
              }
            }}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-[#FF70A6] text-white p-1.5 md:p-2 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-[#ff5b9a]"
          >
            →
          </button>
        </div>

        {/* Quick Care Buttons (Feed & Bath) */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveCareModal('feed')}
            className="bg-[#FFF9C4] hover:bg-[#fff59d] p-2.5 md:p-3 rounded-full border-2 border-[#FDD835] shadow-xs active:scale-95 transition-transform"
            title="Feed Companion (Daily Task)"
          >
            <span className="text-lg md:text-xl">🍎</span>
          </button>
          <button
            onClick={() => setActiveCareModal('bath')}
            className="bg-[#E1F5FE] hover:bg-[#b3e5fc] p-2.5 md:p-3 rounded-full border-2 border-[#03A9F4] shadow-xs active:scale-95 transition-transform"
            title="Bubble Spa Bath (Daily Task)"
          >
            <span className="text-lg md:text-xl">🛁</span>
          </button>
        </div>
      </footer>

      {/* ================= MODALS & MINI-GAME OVERLAYS ================= */}

      {/* Mini-Game Picker Modal */}
      {showMiniGamePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFEDF5] w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44]">
            <button
              onClick={() => setShowMiniGamePicker(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 hover:text-pink-500"
            >
              ✕
            </button>

            <span className="text-4xl mb-1">🎮</span>
            <h2 className="text-xl font-black">Arcade Mini-Games</h2>
            <p className="text-xs text-gray-500 mb-4 text-center">
              Play mini-games to win in-game coins and XP! Difficulty scales with your Level ({gameState.level}/90).
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Game 1: Rhythm Star Catch */}
              <div
                onClick={() => {
                  setShowMiniGamePicker(false);
                  setActiveMiniGame('rhythm');
                }}
                className="bg-white hover:bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm flex items-center gap-4 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-3xl shrink-0">
                  ⭐
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-black text-sm text-[#4A2D44]">Rhythm Star Catch</h3>
                  <p className="text-[10px] text-gray-500">Tap falling musical notes in time with combo streaks.</p>
                </div>
                <span className="text-xs bg-[#FFF9C4] text-yellow-800 font-bold px-2 py-1 rounded-lg border border-yellow-300">
                  ✨ Coins
                </span>
              </div>

              {/* Game 2: Fashion Memory Match */}
              <div
                onClick={() => {
                  setShowMiniGamePicker(false);
                  setActiveMiniGame('memory');
                }}
                className="bg-white hover:bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm flex items-center gap-4 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-3xl shrink-0">
                  👝
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-black text-sm text-[#4A2D44]">Fashion Memory Match</h3>
                  <p className="text-[10px] text-gray-500">Match luxury heels, dresses, and tiara cards.</p>
                </div>
                <span className="text-xs bg-[#FFF9C4] text-yellow-800 font-bold px-2 py-1 rounded-lg border border-yellow-300">
                  ✨ Coins
                </span>
              </div>

              {/* Game 3: Runway Heel Dash */}
              <div
                onClick={() => {
                  setShowMiniGamePicker(false);
                  setActiveMiniGame('runner');
                }}
                className="bg-white hover:bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100 shadow-sm flex items-center gap-4 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-3xl shrink-0">
                  👠
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-black text-sm text-[#4A2D44]">Runway Heel Dash</h3>
                  <p className="text-[10px] text-gray-500">Dodge obstacles and grab stardust diamonds.</p>
                </div>
                <span className="text-xs bg-[#FFF9C4] text-yellow-800 font-bold px-2 py-1 rounded-lg border border-yellow-300">
                  ✨ Coins
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Mini-Games */}
      {activeMiniGame === 'rhythm' && (
        <RhythmCatchGame
          playerLevel={gameState.level}
          onFinish={handleMiniGameFinish}
          onClose={() => setActiveMiniGame(null)}
        />
      )}
      {activeMiniGame === 'memory' && (
        <MemoryMatchGame
          playerLevel={gameState.level}
          onFinish={handleMiniGameFinish}
          onClose={() => setActiveMiniGame(null)}
        />
      )}
      {activeMiniGame === 'runner' && (
        <RunwayDashGame
          playerLevel={gameState.level}
          onFinish={handleMiniGameFinish}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {/* Care Actions Modal (Feed & Bath) */}
      {activeCareModal && (
        <CareActions
          mode={activeCareModal}
          onFeed={handleFeedCharacter}
          onClean={handleCleanCharacter}
          onClose={() => setActiveCareModal(null)}
        />
      )}

      {/* Level 1-90 Progress Modal */}
      {showLevelModal && (
        <LevelProgressModal
          currentLevel={gameState.level}
          currentXp={gameState.xp}
          onClose={() => setShowLevelModal(false)}
        />
      )}

      {/* Character Switcher Modal */}
      {showCharSelectModal && (
        <CharacterSelectModal
          currentGender={gameState.characterGender}
          currentName={gameState.characterName}
          onSelect={(gender, name) => {
            setGameState((prev) => ({
              ...prev,
              characterGender: gender,
              characterName: name,
            }));
            setShowCharSelectModal(false);
            showToast(`Switched companion to ${name}!`);
          }}
          onClose={() => setShowCharSelectModal(false)}
        />
      )}

      {/* Sound & Voice Studio Modal */}
      {showSoundModal && (
        <SoundSettingsModal
          settings={soundSettings}
          characterGender={gameState.characterGender}
          characterName={gameState.characterName}
          onUpdateSettings={(newSettings) => {
            setSoundSettings(newSettings);
            saveSoundSettings(newSettings);
          }}
          onClose={() => setShowSoundModal(false)}
        />
      )}

      {/* Settings & Plain-Language Instructions Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#FFEDF5] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                playSfxPop();
                setShowSettingsModal(false);
              }}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 hover:text-pink-500"
            >
              ✕
            </button>

            <span className="text-4xl mb-1">⚙️</span>
            <h2 className="text-xl font-black">Game Settings & Guide</h2>
            <p className="text-xs text-gray-500 mb-4 text-center">
              Everything you need to know to play and customize your virtual 3D game!
            </p>

            <div className="w-full flex flex-col gap-3 text-xs">
              {/* Sound & Voice Studio Card */}
              <div className="bg-white p-4 rounded-2xl border border-pink-100 flex items-center justify-between shadow-sm">
                <div>
                  <span className="font-bold text-sm block text-pink-600">🎵 Sound, Music & Voice Studio</span>
                  <span className="text-[10px] text-gray-500">
                    Voice presets, speech pitch/speed, music soundtracks & soundboard
                  </span>
                </div>
                <button
                  id="btn-settings-open-sound"
                  onClick={() => {
                    playSfxPop();
                    setShowSoundModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold text-xs shadow-sm hover:brightness-105"
                >
                  Change Sound 🎵
                </button>
              </div>

              {/* Gemini API Key Guide */}
              <div className="bg-white p-4 rounded-2xl border border-pink-100">
                <span className="font-bold text-pink-600 block mb-1">✨ How to Add Gemini API Key</span>
                <p className="text-gray-600 leading-relaxed text-[11px]">
                  In Google AI Studio, open the <strong>Settings &gt; Secrets</strong> panel in the left sidebar, and add your <strong>GEMINI_API_KEY</strong>. Your 3D companion uses Gemini 3.7 Flash for intelligent, natural conversations!
                </p>
              </div>

              {/* How to Play & Test Guide */}
              <div className="bg-white p-4 rounded-2xl border border-pink-100">
                <span className="font-bold text-teal-700 block mb-1">🎮 Core Game Loop</span>
                <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px]">
                  <li><strong>Talk:</strong> Type or speak to chat with your companion in real time.</li>
                  <li><strong>Mini-Games:</strong> Play Rhythm Catch, Memory Match, or Runway Dash to win coins.</li>
                  <li><strong>Wardrobe:</strong> Spend coins to unlock stylish outfits, shoes, and high heels.</li>
                  <li><strong>Daily Tasks:</strong> Feed snacks, take a bubble bath, and level up from 1 to 90!</li>
                </ul>
              </div>

              {/* Reset Game Button */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset your local game progress?')) {
                    localStorage.removeItem('virtual_character_game_save_v2');
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-200 hover:bg-red-100 text-center mt-2"
              >
                Reset Game Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
