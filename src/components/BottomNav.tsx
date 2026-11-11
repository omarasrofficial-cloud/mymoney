// src/components/BottomNav.tsx
import React from 'react';
import { Home, Receipt, Users, PiggyBank, MoreHorizontal } from 'lucide-react';

export type TabKey = 'home' | 'transactions' | 'people' | 'savings' | 'more';

interface BottomNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { key: 'home' as TabKey, label: 'Home', icon: Home },
    { key: 'transactions' as TabKey, label: 'History', icon: Receipt },
    { key: 'people' as TabKey, label: 'People', icon: Users },
    { key: 'savings' as TabKey, label: 'Assets', icon: PiggyBank },
    { key: 'more' as TabKey, label: 'More', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 pb-[calc(var(--sab)+2px)] transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              aria-label={tab.label}
              className={`min-h-touch py-1.5 flex flex-col items-center justify-center space-y-0.5 text-[11px] font-medium transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
