import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getDifficultyTier } from '../../types/game';
import { playSfxRhythmHit, playSfxPop, playSfxCoin, playSfxLevelUp } from '../../utils/audioSystem';

interface RhythmCatchGameProps {
  playerLevel: number;
  onFinish: (coinsEarned: number, xpEarned: number) => void;
  onClose: () => void;
}

interface Note {
  id: number;
  lane: number; // 0, 1, 2, 3
  y: number; // 0 to 100%
  symbol: string;
  isBomb: boolean;
  hit?: boolean;
}

export const RhythmCatchGame: React.FC<RhythmCatchGameProps> = ({
  playerLevel,
  onFinish,
  onClose,
}) => {
  const tier = getDifficultyTier(playerLevel);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);

  const notesRef = useRef<Note[]>([]);
  const [, setRerender] = useState(0);

  const laneSymbols = ['⭐', '💎', '🌸', '👠'];
  const laneColors = ['#FF99C8', '#A0E7E5', '#FFF9C4', '#FC67A7'];
  const laneKeys = ['A', 'S', 'D', 'F'];

  // Difficulty scaling
  const fallSpeed = playerLevel <= 30 ? 1.2 : playerLevel <= 60 ? 1.9 : 2.6;
  const spawnIntervalMs = playerLevel <= 30 ? 700 : playerLevel <= 60 ? 500 : 380;
  const hasBombs = playerLevel >= 40;

  // Start game
  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTimeLeft(30);
    setIsGameOver(false);
    notesRef.current = [];
  };

  // Timer loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver]);

  // Spawner loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    let nextId = 1;
    const spawner = setInterval(() => {
      const lane = Math.floor(Math.random() * 4);
      const isBomb = hasBombs && Math.random() < 0.18;
      notesRef.current.push({
        id: nextId++,
        lane,
        y: 0,
        symbol: isBomb ? '💣' : laneSymbols[lane],
        isBomb,
      });
    }, spawnIntervalMs);

    return () => clearInterval(spawner);
  }, [isPlaying, isGameOver, hasBombs, spawnIntervalMs]);

  // Physics animation loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    let reqId = 0;

    const loop = () => {
      const notes = notesRef.current;
      for (let i = notes.length - 1; i >= 0; i--) {
        notes[i].y += fallSpeed;
        // Missed note
        if (notes[i].y > 105 && !notes[i].hit) {
          if (!notes[i].isBomb) {
            setCombo(0);
            showFeedback('MISS', '#9CA3AF');
          }
          notes.splice(i, 1);
        }
      }
      setRerender((r) => r + 1);
      reqId = requestAnimationFrame(loop);
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [isPlaying, isGameOver, fallSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      const laneIndex = laneKeys.indexOf(key);
      if (laneIndex !== -1) {
        handleLanePress(laneIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver]);

  const showFeedback = (text: string, color: string) => {
    setFeedback({ text, color, id: Date.now() });
  };

  const handleLanePress = (laneIndex: number) => {
    if (!isPlaying || isGameOver) return;

    // Find closest note in this lane near hit zone (y between 70% and 95%)
    const hitZoneTarget = 85;
    const candidates = notesRef.current.filter((n) => n.lane === laneIndex && !n.hit && n.y > 55 && n.y < 100);

    if (candidates.length === 0) return;

    // Pick closest
    candidates.sort((a, b) => Math.abs(a.y - hitZoneTarget) - Math.abs(b.y - hitZoneTarget));
    const target = candidates[0];
    target.hit = true;

    if (target.isBomb) {
      playSfxRhythmHit('bomb');
      setScore((s) => Math.max(0, s - 80));
      setCombo(0);
      showFeedback('BOOM! -80', '#EF4444');
      return;
    }

    const dist = Math.abs(target.y - hitZoneTarget);
    let pts = 0;
    if (dist < 6) {
      pts = 100;
      playSfxRhythmHit('perfect');
      showFeedback('PERFECT! +100', '#EC4899');
    } else if (dist < 14) {
      pts = 60;
      playSfxRhythmHit('great');
      showFeedback('GREAT! +60', '#3B82F6');
    } else {
      pts = 30;
      playSfxRhythmHit('good');
      showFeedback('GOOD +30', '#10B981');
    }

    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxCombo) setMaxCombo(newCombo);

    // Multiplier bonus
    const multiplier = 1 + Math.min(2, Math.floor(newCombo / 5) * 0.25);
    setScore((s) => Math.floor(s + pts * multiplier));
  };

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playSfxLevelUp();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  // Coins & XP rewards
  const coinsEarned = Math.floor(score * 0.12) + (score > 1000 ? 50 : 20);
  const xpEarned = Math.floor(score * 0.18) + 30;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44] overflow-hidden">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⭐</span>
            <div>
              <h2 className="font-black text-xl tracking-wide">Rhythm Star Catch</h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.tierColor }}
              >
                {tier.tierCategory} Mode (Lv. {playerLevel})
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
            <div className="text-6xl animate-bounce">🎶</div>
            <h3 className="text-lg font-black text-[#4A2D44]">Catch the Falling Beats!</h3>
            <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
              Tap the lanes or press keys <span className="font-bold text-pink-500">A, S, D, F</span> as stars hit the target zone. Build high combo streaks for massive coin multipliers!
            </p>
            <div className="flex gap-2">
              <span className="text-xs bg-pink-50 text-pink-600 font-bold px-3 py-1.5 rounded-xl border border-pink-200">
                ✨ Earn up to 200+ Coins
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-xl border border-blue-200">
                ⭐ Earn up to 150+ XP
              </span>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-[#FF70A6] text-white font-black py-3.5 rounded-2xl shadow-lg border-b-4 border-[#D84B8A] active:translate-y-1 text-base tracking-wider uppercase mt-2 hover:bg-[#ff5b9a]"
            >
              Start Game
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full flex flex-col items-center">
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-2 px-2">
              <div className="bg-white px-4 py-1.5 rounded-full font-black text-sm border border-pink-200 shadow-sm flex items-center gap-2">
                <span>⏱️ {timeLeft}s</span>
              </div>
              {combo > 2 && (
                <div className="text-xs font-black text-pink-500 animate-pulse bg-pink-100 px-3 py-1 rounded-full">
                  🔥 {combo} COMBO!
                </div>
              )}
              <div className="bg-[#FFF9C4] px-4 py-1.5 rounded-full font-black text-sm border border-yellow-300 shadow-sm">
                Score: {score}
              </div>
            </div>

            {/* Rhythm Track Stage */}
            <div className="w-full h-80 bg-white/90 rounded-[2rem] border-4 border-pink-200 relative overflow-hidden flex shadow-inner">
              {/* Hit Target Line */}
              <div className="absolute top-[85%] left-0 right-0 h-3 bg-pink-400/30 border-y-2 border-dashed border-pink-400 z-10 pointer-events-none flex items-center justify-center">
                <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest bg-white/80 px-2 rounded-full">
                  HIT ZONE
                </span>
              </div>

              {/* Feedback popup */}
              {feedback && (
                <div
                  key={feedback.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-black text-xl tracking-wider drop-shadow-md animate-ping"
                  style={{ color: feedback.color }}
                >
                  {feedback.text}
                </div>
              )}

              {/* 4 Lanes */}
              {[0, 1, 2, 3].map((lane) => (
                <div
                  key={lane}
                  className="flex-1 h-full border-r last:border-r-0 border-pink-100 relative flex flex-col items-center justify-end pb-3 hover:bg-pink-50/40 cursor-pointer"
                  onClick={() => handleLanePress(lane)}
                >
                  {/* Key Indicator */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-md text-sm transition-transform active:scale-90"
                    style={{ backgroundColor: laneColors[lane] }}
                  >
                    {laneKeys[lane]}
                  </div>

                  {/* Falling Notes in this lane */}
                  {notesRef.current
                    .filter((n) => n.lane === lane && !n.hit)
                    .map((note) => (
                      <div
                        key={note.id}
                        className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-2 border-white transition-none"
                        style={{
                          top: `${note.y}%`,
                          backgroundColor: note.isBomb ? '#EF4444' : laneColors[lane],
                        }}
                      >
                        {note.symbol}
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <p className="text-[11px] font-bold text-gray-500 mt-2">
              Tap buttons or press <span className="text-pink-500 font-black">A S D F</span>
            </p>
          </div>
        )}

        {isGameOver && (
          <div className="w-full bg-white rounded-[2rem] p-6 text-center my-4 border border-pink-100 flex flex-col items-center gap-4 animate-in fade-in">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-black text-[#4A2D44]">Fabulous Rhythm Performance!</h3>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="bg-[#FFF9C4] p-3 rounded-2xl border border-yellow-300">
                <span className="text-xs font-bold opacity-70">Final Score</span>
                <p className="text-xl font-black">{score}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200">
                <span className="text-xs font-bold opacity-70">Max Streak</span>
                <p className="text-xl font-black">{maxCombo}x</p>
              </div>
            </div>

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
                onClick={startGame}
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
