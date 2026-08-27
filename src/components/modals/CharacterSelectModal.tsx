import React from 'react';
import { CharacterGender } from '../../types/game';

interface CharacterSelectModalProps {
  currentGender: CharacterGender;
  currentName: string;
  onSelect: (gender: CharacterGender, name: string) => void;
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  currentGender,
  currentName,
  onSelect,
  onClose,
  isInitialSetup = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#FFEDF5] w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border-4 border-white flex flex-col items-center relative text-[#4A2D44]">
        {!isInitialSetup && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-gray-400 hover:text-pink-500"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-5">
          <span className="text-4xl mb-2 inline-block">✨</span>
          <h2 className="text-2xl font-black tracking-tight text-[#4A2D44]">
            {isInitialSetup ? 'Choose Your 3D Companion' : 'Switch Companion'}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Select your companion to begin your stylish fashion & AI conversation journey!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mb-5">
          {/* Female Character Card */}
          <div
            onClick={() => onSelect('female', 'Angela')}
            className={`bg-white rounded-[2rem] p-5 border-4 transition-all duration-200 cursor-pointer flex flex-col items-center text-center shadow-md hover:scale-105 active:scale-95 ${
              currentGender === 'female' ? 'border-[#FC67A7] bg-pink-50/50 ring-4 ring-pink-200' : 'border-transparent hover:border-pink-200'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#FF99C8] to-[#FC67A7] flex items-center justify-center text-4xl shadow-inner mb-3 border-2 border-white">
              💃
            </div>
            <h3 className="font-black text-base text-[#4A2D44]">Angela</h3>
            <span className="text-[11px] font-bold text-pink-500 bg-pink-100 px-2 py-0.5 rounded-full mt-1">
              Fashionista
            </span>
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              Sweet, creative, passionate about gowns, high heels, and glamour!
            </p>
          </div>

          {/* Male Character Card */}
          <div
            onClick={() => onSelect('male', 'Leo')}
            className={`bg-white rounded-[2rem] p-5 border-4 transition-all duration-200 cursor-pointer flex flex-col items-center text-center shadow-md hover:scale-105 active:scale-95 ${
              currentGender === 'male' ? 'border-[#3B82F6] bg-blue-50/50 ring-4 ring-blue-200' : 'border-transparent hover:border-blue-200'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#93C5FD] to-[#3B82F6] flex items-center justify-center text-4xl shadow-inner mb-3 border-2 border-white">
              🕺
            </div>
            <h3 className="font-black text-base text-[#4A2D44]">Leo</h3>
            <span className="text-[11px] font-bold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full mt-1">
              Streetwear Icon
            </span>
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              Chill, adventurous, loves sneakers, jackets, rhythm games, and tech!
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            onSelect(currentGender, currentName);
            onClose?.();
          }}
          className="w-full bg-[#FF70A6] text-white font-black py-3.5 rounded-2xl shadow-lg border-b-4 border-[#D84B8A] active:translate-y-1 text-base tracking-wider uppercase hover:bg-[#ff5b9a]"
        >
          Confirm & Play
        </button>
      </div>
    </div>
  );
};
