// src/components/HomeView.tsx
import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  Clock,
  Scale,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Smartphone,
  Building2,
  Banknote,
  Plus
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { SmartTextInput } from './SmartTextInput';
import { Charts } from './Charts';
import { ReconcileModal } from './ReconcileModal';
import { PwaBanner } from './PwaBanner';
import type { useFinanceData } from '../hooks/useFinanceData';
import type { Wallet } from '../types/models';

type FinanceData = ReturnType<typeof useFinanceData>;

interface HomeViewProps {
  data: FinanceData;
  onNavigateToPeople: () => void;
  onNavigateToHistory: () => void;
  onNavigateToAssets: () => void;
  onNavigateToSettings: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  data,
  onNavigateToPeople,
  onNavigateToHistory,
  onNavigateToAssets,
  onNavigateToSettings
}) => {
  const [reconcileTarget, setReconcileTarget] = useState<Wallet | null>(null);
  const [showNetWorthBreakdown, setShowNetWorthBreakdown] = useState(false);

  const {
    wallets,
    walletBalances,
    netWorthSummary,
    spentToday,
    spentThisWeek,
    spentThisMonth,
    hasTransactionToday,
    needBackupAlert,
    overduePeople,
    upcomingLoans,
    budgets,
    categories,
    keywordDict,
    learnedDict,
    transactions,
    settings
  } = data;

  const defaultWalletId = settings?.defaultWalletId || 'cash';

  const getWalletIcon = (icon: string) => {
    switch (icon) {
      case 'smartphone':
        return Smartphone;
      case 'building-2':
        return Building2;
      default:
        return Banknote;
    }
  };

  return (
    <div className="space-y-4 pb-20 px-3 pt-2 max-w-md mx-auto">
      {/* Standalone iOS PWA banner */}
      <PwaBanner />

      {/* ALERT BANNERS */}
      {/* 1. Nothing added today banner */}
      {!hasTransactionToday && (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                You haven't added anything today
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Type or dictate your expenses above to stay on track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Overdue Loans / Repayments Alert */}
      {overduePeople.length > 0 && (
        <div
          onClick={onNavigateToPeople}
          className="cursor-pointer p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.99] transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-900 dark:text-red-200">
                {overduePeople.length} Loan{overduePeople.length > 1 ? 's' : ''} Overdue
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-300">
                Tap to check {overduePeople.map((p) => p.name).join(', ')} in People Ledger
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-red-500" />
        </div>
      )}

      {/* 3. Upcoming Loans Due in 7 Days */}
      {upcomingLoans.length > 0 && (
        <div
          onClick={onNavigateToPeople}
          className="cursor-pointer p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.99] transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {upcomingLoans.length} Due Soon in 7 Days
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {upcomingLoans.map((p) => `${p.name} (due ${p.earliestDueDate})`).join(', ')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500" />
        </div>
      )}

      {/* 4. Weekly Backup Alert */}
      {needBackupAlert && (
        <div
          onClick={onNavigateToSettings}
          className="cursor-pointer p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-center justify-between shadow-sm active:scale-[0.99] transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900 dark:text-purple-200">
                Backup Reminder: No backup in 7 days
              </p>
              <p className="text-[11px] text-purple-700 dark:text-purple-300">
                Tap to export JSON backup and protect your data
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-500" />
        </div>
      )}

      {/* SMART FREEFORM INPUT (Prominent at top) */}
      <SmartTextInput
        defaultWalletId={defaultWalletId}
        wallets={wallets}
        categories={categories}
        keywordDict={keywordDict}
        learnedDict={learnedDict}
        existingTodayEntries={transactions.filter((tx) => tx.date === data.todayStr)}
      />

      {/* NET WORTH CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">
            Total Net Worth
          </span>
          <button
            onClick={() => setShowNetWorthBreakdown(!showNetWorthBreakdown)}
            className="text-[11px] text-gray-300 hover:text-white underline underline-offset-2"
          >
            {showNetWorthBreakdown ? 'Hide details' : 'Breakdown'}
          </button>
        </div>

        <div className="flex items-baseline space-x-2 mb-3">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {formatBDT(netWorthSummary.netWorth)}
          </span>
        </div>

        {/* Breakdown dropdown */}
        {showNetWorthBreakdown && (
          <div className="pt-3 mt-3 border-t border-white/10 space-y-1.5 text-xs animate-fadeIn">
            <div className="flex justify-between text-gray-300">
              <span>Wallets & Cash:</span>
              <span className="font-semibold text-white">{formatBDT(netWorthSummary.totalWallets)}</span>
            </div>
            <div className="flex justify-between text-emerald-300">
              <span>Money Owed To Me:</span>
              <span className="font-semibold">{formatBDT(netWorthSummary.totalOwedToMe)}</span>
            </div>
            <div className="flex justify-between text-blue-300">
              <span>Savings Goals:</span>
              <span className="font-semibold">{formatBDT(netWorthSummary.totalSavingsInGoals)}</span>
            </div>
            <div className="flex justify-between text-cyan-300">
              <span>DPS Deposited:</span>
              <span className="font-semibold">{formatBDT(netWorthSummary.totalDpsDeposited)}</span>
            </div>
            <div className="flex justify-between text-teal-300">
              <span>FDR Principal:</span>
              <span className="font-semibold">{formatBDT(netWorthSummary.totalFdrValue)}</span>
            </div>
            <div className="flex justify-between text-amber-300">
              <span>Investments Value:</span>
              <span className="font-semibold">{formatBDT(netWorthSummary.totalInvestments)}</span>
            </div>
            <div className="flex justify-between text-red-300 pt-1 border-t border-white/5">
              <span>Money I Owe:</span>
              <span className="font-semibold">-{formatBDT(netWorthSummary.totalIOwe)}</span>
            </div>
          </div>
        )}

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 block">Total Wallets</span>
            <span className="font-bold text-sm text-gray-100">
              {formatBDT(netWorthSummary.totalWallets)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">Assets & Receivables</span>
            <span className="font-bold text-sm text-emerald-400">
              +{formatBDT(
                netWorthSummary.totalOwedToMe +
                netWorthSummary.totalSavingsInGoals +
                netWorthSummary.totalDpsDeposited +
                netWorthSummary.totalFdrValue +
                netWorthSummary.totalInvestments
              )}
            </span>
          </div>
        </div>
      </div>

      {/* WALLETS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Wallets ({wallets.length})
          </h2>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Tap card to Reconcile
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {wallets.map((wallet) => {
            const Icon = getWalletIcon(wallet.icon);
            const balance = walletBalances[wallet.id] || 0;
            return (
              <div
                key={wallet.id}
                onClick={() => setReconcileTarget(wallet)}
                className="cursor-pointer bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: wallet.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center space-x-0.5">
                    <Scale className="w-2.5 h-2.5" />
                    <span>Check</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {wallet.name}
                  </h3>
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                    {formatBDT(balance)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OWES SNAPSHOT CARDS (I Owe & Owed to Me) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={onNavigateToPeople}
          className="cursor-pointer bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <ArrowDownLeft className="w-4 h-4" />
            <span className="text-xs font-bold">Owed To Me</span>
          </div>
          <p className="text-base font-extrabold text-gray-900 dark:text-white">
            {formatBDT(netWorthSummary.totalOwedToMe)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
            Tap to view People ➔
          </span>
        </div>

        <div
          onClick={onNavigateToPeople}
          className="cursor-pointer bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-2 text-red-500 dark:text-red-400 mb-1">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-bold">I Owe</span>
          </div>
          <p className="text-base font-extrabold text-gray-900 dark:text-white">
            {formatBDT(netWorthSummary.totalIOwe)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 block">
            Tap to view People ➔
          </span>
        </div>
      </div>

      {/* SPENDING METRICS (Today / This Week / This Month) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
          Spending Snapshot (Expenses Only)
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">
              Today
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
              {formatBDT(spentToday.totalExpense)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">
              This Week
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
              {formatBDT(spentThisWeek.totalExpense)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">
              This Month
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatBDT(spentThisMonth.totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* CHARTS (7-day bar chart & monthly category breakdown) */}
      <Charts
        transactions={transactions}
        categoryTotals={spentThisMonth.categoryExpenses}
        totalMonthlyExpense={spentThisMonth.totalExpense}
      />

      {/* MONTHLY CATEGORY TOTALS (Budget bars appear ONLY where limits are set!) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Monthly Category Totals
          </h3>
          <span className="text-[11px] text-gray-400">
            {Object.keys(spentThisMonth.categoryExpenses).length} categories
          </span>
        </div>

        {Object.keys(spentThisMonth.categoryExpenses).length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">
            No expenses recorded yet this month.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(spentThisMonth.categoryExpenses).map(([category, spent]) => {
              // Check if user has explicitly set a budget limit for this category
              const budgetObj = budgets.find(
                (b) => b.category.toLowerCase() === category.toLowerCase() && b.monthlyLimit > 0
              );
              const limit = budgetObj ? budgetObj.monthlyLimit : null;

              let percent = 0;
              let barColor = 'bg-emerald-500';
              if (limit) {
                percent = Math.min(100, Math.round((spent / limit) * 100));
                if (percent >= 100) barColor = 'bg-red-500';
                else if (percent >= 80) barColor = 'bg-amber-500';
              }

              return (
                <div key={category} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {category}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatBDT(spent)}
                      </span>
                      {limit && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          / {formatBDT(limit)} ({percent}%)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Budget progress bar ONLY appears if user configured a limit! */}
                  {limit && (
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className={`h-full ${barColor} transition-all duration-300`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECONCILE MODAL */}
      {reconcileTarget && (
        <ReconcileModal
          wallet={reconcileTarget}
          currentDerivedBalance={walletBalances[reconcileTarget.id] || 0}
          isOpen={!!reconcileTarget}
          onClose={() => setReconcileTarget(null)}
        />
      )}
    </div>
  );
};
