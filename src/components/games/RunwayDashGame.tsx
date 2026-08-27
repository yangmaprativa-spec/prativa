import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { getDifficultyTier } from '../../types/game';
import { playSfxCoin, playSfxRunnerHurdle, playSfxHeelTap, playSfxLevelUp, playSfxPop } from '../../utils/audioSystem';

interface RunwayDashGameProps {
  playerLevel: number;
  onFinish: (coinsEarned: number, xpEarned: number) => void;
  onClose: () => void;
}

interface ObstacleOrItem {
  id: number;
  lane: number; // 0 (Left), 1 (Middle), 2 (Right)
  y: number; // 0 to 100%
  type: 'coin' | 'diamond' | 'star' | 'hurdle' | 'puddle';
  icon: string;
  collected?: boolean;
}

export const RunwayDashGame: React.FC<RunwayDashGameProps> = ({
  playerLevel,
  onFinish,
  onClose,
}) => {
  const tier = getDifficultyTier(playerLevel);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerLane, setPlayerLane] = useState(1); // Middle
  const [score, setScore] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [lives, setLives] = useState(3);
  const [distance, setDistance] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const itemsRef = useRef<ObstacleOrItem[]>([]);
  const playerLaneRef = useRef(1);
  const livesRef = useRef(3);
  const isPlayingRef = useRef(false);
  const [, setRerender] = useState(0);

  // Difficulty scaling
  const speed = playerLevel <= 30 ? 1.4 : playerLevel <= 60 ? 2.0 : 2.7;
  const spawnRateMs = playerLevel <= 30 ? 600 : playerLevel <= 60 ? 440 : 340;

  const startGame = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    setPlayerLane(1);
    playerLaneRef.current = 1;
    setScore(0);
    setCoinsCollected(0);
    setLives(3);
    livesRef.current = 3;
    setDistance(0);
    setIsGameOver(false);
    itemsRef.current = [];
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        moveLane(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const moveLane = (dir: -1 | 1) => {
    playSfxHeelTap();
    setPlayerLane((prev) => {
      const next = Math.max(0, Math.min(2, prev + dir));
      playerLaneRef.current = next;
      return next;
    });
  };

  // Spawner loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    let nextId = 1;

    const spawner = setInterval(() => {
      const lane = Math.floor(Math.random() * 3);
      const isObstacle = Math.random() < (playerLevel <= 30 ? 0.35 : 0.48);

      let item: ObstacleOrItem;
      if (isObstacle) {
        const type = Math.random() > 0.5 ? 'hurdle' : 'puddle';
        item = {
          id: nextId++,
          lane,
          y: 0,
          type,
          icon: type === 'hurdle' ? '🚧' : '💧',
        };
      } else {
        const rand = Math.random();
        const type = rand < 0.6 ? 'coin' : rand < 0.85 ? 'star' : 'diamond';
        item = {
          id: nextId++,
          lane,
          y: 0,
          type,
          icon: type === 'coin' ? '✨' : type === 'star' ? '⭐' : '💎',
        };
      }
      itemsRef.current.push(item);
    }, spawnRateMs);

    return () => clearInterval(spawner);
  }, [isPlaying, isGameOver, playerLevel, spawnRateMs]);

  // Main physics & collision animation loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;
    let reqId = 0;

    const loop = () => {
      setDistance((d) => d + 1);
      const items = itemsRef.current;
      const currentLane = playerLaneRef.current;

      for (let i = items.length - 1; i >= 0; i--) {
        items[i].y += speed;

        // Collision checking near player position (y around 80-90%)
        if (!items[i].collected && items[i].y > 78 && items[i].y < 92 && items[i].lane === currentLane) {
          items[i].collected = true;

          if (items[i].type === 'hurdle' || items[i].type === 'puddle') {
            // Hit obstacle
            playSfxRunnerHurdle();
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              endGame();
              return;
            }
          } else {
            // Collected reward item
            playSfxCoin();
            if (items[i].type === 'coin') {
              setScore((s) => s + 50);
              setCoinsCollected((c) => c + 1);
            } else if (items[i].type === 'star') {
              setScore((s) => s + 100);
              setCoinsCollected((c) => c + 2);
            } else if (items[i].type === 'diamond') {
              setScore((s) => s + 200);
              setCoinsCollected((c) => c + 5);
            }
          }
        }

        // Clean up out of bounds
        if (items[i].y > 105) {
          items.splice(i, 1);
        }
      }

      setRerender((r) => r + 1);
      reqId = requestAnimationFrame(loop);
    };

    reqId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(reqId);
  }, [isPlaying, isGameOver, speed]);

  const endGame = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    isPlayingRef.current = false;
    playSfxLevelUp();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const coinsEarned = coinsCollected * 5 + Math.floor(score * 0.08) + 20;
  const xpEarned = Math.floor(distance * 0.15) + Math.floor(score * 0.1) + 25;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44]">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">👠</span>
            <div>
              <h2 className="font-black text-xl tracking-wide">Runway Heel Dash</h2>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.tierColor }}
              >
                {tier.tierCategory} Runway (Lv. {playerLevel})
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
            <div className="text-6xl animate-bounce">🏃‍♀️</div>
            <h3 className="text-lg font-black text-[#4A2D44]">Dash Down the Glamour Runway!</h3>
            <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
              Dodge hurdles and water puddles while collecting sparkling coins and diamonds! Tap the Left/Right arrows or use your keyboard.
            </p>
            <div className="flex gap-2">
              <span className="text-xs bg-pink-50 text-pink-600 font-bold px-3 py-1.5 rounded-xl border border-pink-200">
                ✨ Collect In-Game Coins
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-xl border border-blue-200">
                ⭐ Distance XP Bonus
              </span>
            </div>
            <button
              onClick={startGame}
              className="w-full bg-[#FF70A6] text-white font-black py-3.5 rounded-2xl shadow-lg border-b-4 border-[#D84B8A] active:translate-y-1 text-base tracking-wider uppercase mt-2 hover:bg-[#ff5b9a]"
            >
              Start Runway Dash
            </button>
          </div>
        )}

        {isPlaying && (
          <div className="w-full flex flex-col items-center">
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-2 px-2">
              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-pink-200">
                {[...Array(3)].map((_, i) => (
                  <span key={i} className={`text-base ${i < lives ? 'opacity-100' : 'opacity-20'}`}>
                    ❤️
                  </span>
                ))}
              </div>
              <div className="bg-[#FFF9C4] px-4 py-1 rounded-full font-black text-xs border border-yellow-300 shadow-sm">
                ✨ {coinsCollected} Coins
              </div>
              <div className="bg-pink-100 px-3 py-1 rounded-full font-black text-xs text-pink-600">
                Score: {score}
              </div>
            </div>

            {/* 3-Lane Runway Canvas */}
            <div className="w-full h-80 bg-gradient-to-b from-[#B9F3FC] to-[#92C7CF] rounded-[2rem] border-4 border-white shadow-xl relative overflow-hidden flex">
              {/* Lane dividers */}
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                <div className="border-r-2 border-dashed border-white/40 h-full"></div>
                <div className="border-r-2 border-dashed border-white/40 h-full"></div>
                <div></div>
              </div>

              {/* Falling items / obstacles */}
              {itemsRef.current
                .filter((item) => !item.collected)
                .map((item) => (
                  <div
                    key={item.id}
                    className="absolute -translate-x-1/2 text-3xl transition-none drop-shadow-md"
                    style={{
                      left: `${(item.lane * 2 + 1) * (100 / 6)}%`,
                      top: `${item.y}%`,
                    }}
                  >
                    {item.icon}
                  </div>
                ))}

              {/* Player Avatar */}
              <div
                className="absolute top-[82%] -translate-x-1/2 text-4xl transition-all duration-150 drop-shadow-lg"
                style={{
                  left: `${(playerLane * 2 + 1) * (100 / 6)}%`,
                }}
              >
                💃
              </div>
            </div>

            {/* Mobile / Screen Controls */}
            <div className="flex gap-4 w-full mt-3">
              <button
                onClick={() => moveLane(-1)}
                className="flex-1 bg-white hover:bg-pink-50 p-3 rounded-2xl shadow-sm border border-pink-200 font-black text-lg flex items-center justify-center gap-2 active:scale-95"
              >
                ← Left
              </button>
              <button
                onClick={() => moveLane(1)}
                className="flex-1 bg-white hover:bg-pink-50 p-3 rounded-2xl shadow-sm border border-pink-200 font-black text-lg flex items-center justify-center gap-2 active:scale-95"
              >
                Right →
              </button>
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="w-full bg-white rounded-[2rem] p-6 text-center my-4 border border-pink-100 flex flex-col items-center gap-4 animate-in fade-in">
            <div className="text-5xl">🏆</div>
            <h3 className="text-xl font-black text-[#4A2D44]">Runway Run Complete!</h3>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="bg-[#FFF9C4] p-3 rounded-2xl border border-yellow-300">
                <span className="text-xs font-bold opacity-70">Coins Grabbed</span>
                <p className="text-xl font-black">{coinsCollected}</p>
              </div>
              <div className="bg-pink-50 p-3 rounded-2xl border border-pink-200">
                <span className="text-xs font-bold opacity-70">Run Distance</span>
                <p className="text-xl font-black">{distance}m</p>
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
