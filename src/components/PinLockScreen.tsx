// src/components/PinLockScreen.tsx
import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ correctPin, onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);

      if (next.length === 4) {
        if (next === correctPin) {
          onUnlock();
        } else {
          setErrorShake(true);
          setTimeout(() => {
            setErrorShake(false);
            setEnteredPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((p) => p.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-between py-12 px-6 select-none animate-fadeIn">
      {/* Top Title */}
      <div className="flex flex-col items-center space-y-3 pt-6">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Enter MyMoney PIN</h2>
        <p className="text-xs text-gray-400">Unlock your private finance ledger</p>
      </div>

      {/* 4-Dot Indicators */}
      <div className={`flex items-center space-x-4 my-6 ${errorShake ? 'animate-bounce text-red-400' : ''}`}>
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < enteredPin.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                filled
                  ? errorShake
                    ? 'bg-red-500 scale-125'
                    : 'bg-emerald-400 scale-125 shadow-sm shadow-emerald-400/50'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          );
        })}
      </div>

      {/* Keypad: Large touch targets (min 44px, iOS style 64px circles) */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-4 pb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num)}
            className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xl font-bold flex items-center justify-center mx-auto active:scale-90 active:bg-emerald-600/30 transition-all"
          >
            {num}
          </button>
        ))}

        <div />

        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xl font-bold flex items-center justify-center mx-auto active:scale-90 active:bg-emerald-600/30 transition-all"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="w-16 h-16 rounded-full bg-slate-800/40 hover:bg-slate-700 text-gray-400 hover:text-white flex items-center justify-center mx-auto active:scale-90 transition-all"
          aria-label="Delete digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
