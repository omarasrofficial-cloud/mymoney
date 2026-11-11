// src/components/Navbar.tsx
import React from 'react';
import { Moon, Sun, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { formatDateLabel, getTodayISO } from '../utils/date';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isPinEnabled: boolean;
  onLockApp?: () => void;
  onOpenSmartInput?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  isPinEnabled,
  onLockApp,
  onOpenSmartInput
}) => {
  const todayStr = getTodayISO();

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 pt-[calc(var(--sat)+8px)] pb-2 px-4 transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 font-bold text-lg select-none">
            ৳
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              MyMoney
            </h1>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {formatDateLabel(todayStr)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {onOpenSmartInput && (
            <button
              onClick={onOpenSmartInput}
              aria-label="Open Smart Input"
              className="min-w-touch min-h-touch px-2.5 py-1.5 flex items-center space-x-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 text-xs font-semibold active:scale-95 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>+ Entry</span>
            </button>
          )}

          {isPinEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              aria-label="Lock App"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="min-w-touch min-h-touch flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
};
