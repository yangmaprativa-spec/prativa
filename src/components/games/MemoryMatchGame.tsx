import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getDifficultyTier } from '../../types/game';
import { playSfxCardFlip, playSfxCardMatch, playSfxLevelUp, playSfxPop } from '../../utils/audioSystem';

interface MemoryMatchGameProps {
  playerLevel: number;
  onFinish: (coinsEarned: number, xpEarned: number) => void;
  onClose: () => void;
}

interface Card {
  id: number;
  pairId: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS_POOL = ['👠', '👗', '👑', '💎', '🌸', '🕶️', '👝', '💄', '💍', '🎀', '🎽', '👢'];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({
  playerLevel,
  onFinish,
  onClose,
}) => {
  const tier = getDifficultyTier(playerLevel);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchesFound, setMatchesFound] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(40);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  // Determine pair count & timer based on player level
  const pairsCount = playerLevel <= 30 ? 6 : playerLevel <= 60 ? 8 : 10;
  const initialTime = playerLevel <= 30 ? 45 : playerLevel <= 60 ? 38 : 32;

  const initCards = () => {
    const selectedIcons = ICONS_POOL.slice(0, pairsCount);
    const cardPairs: Card[] = [];

    selectedIcons.forEach((icon, pairIdx) => {
      cardPairs.push({
        id: pairIdx * 2,
        pairId: pairIdx,
        icon,
        isFlipped: false,
        isMatched: false,
      });
      cardPairs.push({
        id: pairIdx * 2 + 1,
        pairId: pairIdx,
        icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setFlippedIndices([]);
    setMatchesFound(0);
    setMovesCount(0);
    setTimeLeft(initialTime);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          setIsPlaying(false);
          setIsVictory(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  const handleCardClick = (index: number) => {
    if (!isPlaying || isGameOver || cards[index].isMatched || cards[index].isFlipped) return;
    if (flippedIndices.length >= 2) return;

    playSfxCardFlip();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMovesCount((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // Match!
        playSfxCardMatch();
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);
          setMatchesFound((m) => {
            const next = m + 1;
            if (next === pairsCount) {
              // Victory!
              playSfxLevelUp();
              setIsVictory(true);
              setIsGameOver(true);
              setIsPlaying(false);
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
            }
            return next;
          });
        }, 300);
      } else {
        // No match -> flip back
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  // Calculate rewards
  const coinsEarned = isVictory
    ? Math.floor(100 + timeLeft * 5 + (pairsCount * 15) - movesCount * 2)
    : Math.floor(matchesFound * 15);
  const xpEarned = isVictory ? Math.floor(80 + timeLeft * 3 + pairsCount * 10) : matchesFound * 12 + 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44] max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👝</span>
            <div>
              <h2 className="font-black text-xl tracking-wide">Fashion Memory Match</h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.tierColor }}
              >
                {tier.tierCategory} ({pairsCount} Pairs • Lv. {playerLevel})
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

        {!isPlaying && !isGameOver && (
          <div className="w-full bg-white rounded-[2rem] p-6 text-center my-4 border border-pink-100 flex flex-col items-center gap-4">
            <div className="text-6xl animate-bounce">👗</div>
            <h3 className="text-lg font-black text-[#4A2D44]">Find Matching Fashion Pairs!</h3>
            <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
              Flip the cards and match the stylish heels, jewelry, and gowns before the timer runs out! Complete quickly for bonus coins!
            </p>
            <div className="flex gap-2">
              <span className="text-xs bg-pink-50 text-pink-600 font-bold px-3 py-1.5 rounded-xl border border-pink-200">
                ✨ High Coin Payout
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-xl border border-blue-200">
                ⭐ Up to 150+ XP
              </span>
            </div>
            <button
              onClick={initCards}
              className="w-full bg-[#FF70A6] text-white font-black py-3.5 rounded-2xl shadow-lg border-b-4 border-[#D84B8A] active:translate-y-1 text-base tracking-wider uppercase mt-2 hover:bg-[#ff5b9a]"
            >
              Start Matching
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full flex flex-col items-center">
            {/* Status Bar */}
            <div className="w-full flex justify-between items-center mb-3 px-1">
              <div className="bg-white px-3.5 py-1 rounded-full font-black text-xs border border-pink-200 shadow-sm flex items-center gap-1.5">
                <span>⏱️ {timeLeft}s</span>
              </div>
              <div className="text-xs font-black text-pink-500 bg-pink-100 px-3 py-1 rounded-full">
                ✨ {matchesFound} / {pairsCount} Pairs
              </div>
              <div className="bg-[#FFF9C4] px-3.5 py-1 rounded-full font-black text-xs border border-yellow-300 shadow-sm">
                Moves: {movesCount}
              </div>
            </div>

            {/* Cards Grid */}
            <div
              className={`w-full grid gap-2.5 p-3 bg-white/80 rounded-[2rem] border-2 border-pink-200 shadow-inner ${
                pairsCount <= 6 ? 'grid-cols-4' : pairsCount <= 8 ? 'grid-cols-4' : 'grid-cols-5'
              }`}
            >
              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-3xl font-bold cursor-pointer transition-all duration-300 transform select-none shadow-md ${
                    card.isMatched
                      ? 'bg-green-100 border-2 border-green-300 opacity-60 scale-95'
                      : card.isFlipped
                      ? 'bg-pink-100 border-2 border-pink-400 rotate-y-180 scale-105'
                      : 'bg-gradient-to-br from-[#FF99C8] to-[#FC67A7] border-2 border-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <span>{card.icon}</span>
                  ) : (
                    <span className="text-white text-lg opacity-80">?</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="w-full bg-white rounded-[2rem] p-6 text-center my-4 border border-pink-100 flex flex-col items-center gap-4 animate-in fade-in">
            <div className="text-5xl">{isVictory ? '👑' : '⏰'}</div>
            <h3 className="text-xl font-black text-[#4A2D44]">
              {isVictory ? 'Master of Fashion Memory!' : "Time's Up!"}
            </h3>
            <p className="text-xs text-gray-500">
              {isVictory
                ? `Matched all ${pairsCount} pairs in ${movesCount} moves with ${timeLeft}s left!`
                : `You found ${matchesFound} pairs! Good effort!`}
            </p>

            <div className="flex items-center gap-4 bg-green-50 px-6 py-3 rounded-2xl border border-green-200 w-full justify-around">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✨</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-green-700 uppercase">Coins Won</span>
                  <p className="font-black text-green-800 text-lg">+{coinsEarned}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-green-700 uppercase">XP Gained</span>
                  <p className="font-black text-green-800 text-lg">+{xpEarned}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={initCards}
                className="flex-1 bg-pink-100 text-pink-600 font-black py-3 rounded-xl hover:bg-pink-200"
              >
                Play Again
              </button>
              <button
                onClick={() => onFinish(coinsEarned, xpEarned)}
                className="flex-1 bg-[#FF70A6] text-white font-black py-3 rounded-xl shadow-md hover:bg-[#ff5b9a]"
              >
                Collect Rewards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
