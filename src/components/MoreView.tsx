// src/components/MoreView.tsx
import React, { useState } from 'react';
import { Target, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { BudgetsView } from './BudgetsView';
import { ReportsView } from './ReportsView';
import { SettingsView } from './SettingsView';
import type { useFinanceData } from '../hooks/useFinanceData';

type FinanceData = ReturnType<typeof useFinanceData>;

interface MoreViewProps {
  data: FinanceData;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  initialSubTab?: 'budgets' | 'reports' | 'settings';
}

export const MoreView: React.FC<MoreViewProps> = ({
  data,
  darkMode,
  onToggleDarkMode,
  initialSubTab = 'budgets'
}) => {
  const [subTab, setSubTab] = useState<'budgets' | 'reports' | 'settings'>(initialSubTab);

  return (
    <div className="space-y-4 pb-24 px-3 pt-2 max-w-md mx-auto">
      {/* Top 3-Way Sub Tab Switcher */}
      <div className="grid grid-cols-3 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setSubTab('budgets')}
          className={`min-h-touch py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            subTab === 'budgets'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Budgets</span>
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`min-h-touch py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            subTab === 'reports'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Reports</span>
        </button>

        <button
          onClick={() => setSubTab('settings')}
          className={`min-h-touch py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            subTab === 'settings'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Sub Views */}
      {subTab === 'budgets' && (
        <BudgetsView
          budgets={data.budgets}
          categories={data.categories}
          categoryExpensesThisMonth={data.spentThisMonth.categoryExpenses}
        />
      )}

      {subTab === 'reports' && (
        <ReportsView
          transactions={data.transactions}
          wallets={data.allWallets}
          spentToday={data.spentToday}
          spentThisWeek={data.spentThisWeek}
          spentThisMonth={data.spentThisMonth}
        />
      )}

      {subTab === 'settings' && (
        <SettingsView
          settings={data.settings}
          wallets={data.wallets}
          allWallets={data.allWallets}
          categories={data.categories}
          keywords={data.keywords}
          learnedWords={data.learnedWords}
          walletBalances={data.walletBalances}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
        />
      )}
    </div>
  );
};
