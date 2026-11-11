// src/components/ReportsView.tsx
import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Percent,
  TrendingDown,
  TrendingUp,
  Receipt,
  Scale
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import type { Transaction, Wallet } from '../types/models';
import type { calculateSpendingTotals } from '../utils/calculations';

interface ReportsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  spentToday: ReturnType<typeof calculateSpendingTotals>;
  spentThisWeek: ReturnType<typeof calculateSpendingTotals>;
  spentThisMonth: ReturnType<typeof calculateSpendingTotals>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  wallets,
  spentToday,
  spentThisWeek,
  spentThisMonth
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');

  const currentStats =
    selectedPeriod === 'today'
      ? spentToday
      : selectedPeriod === 'week'
      ? spentThisWeek
      : spentThisMonth;

  const walletMap: Record<string, string> = {};
  wallets.forEach((w) => { walletMap[w.id] = w.name; });

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export.');
      return;
    }

    const headers = [
      'ID',
      'Date',
      'Type',
      'Amount (BDT)',
      'Wallet Fee (BDT)',
      'Wallet',
      'To Wallet',
      'Category',
      'Person Name',
      'Due Date',
      'Note',
      'Original Typed Text'
    ];

    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type,
      tx.amount,
      tx.charge || 0,
      walletMap[tx.walletId] || tx.walletId,
      tx.toWalletId ? walletMap[tx.toWalletId] || tx.toWalletId : '',
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      `"${(tx.personName || '').replace(/"/g, '""')}"`,
      tx.dueDate || '',
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      `"${(tx.rawText || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyMoney_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Period Selector & CSV Export */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setSelectedPeriod('today')}
            className={`min-h-touch px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'today'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`min-h-touch px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'week'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`min-h-touch px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedPeriod === 'month'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            This Month
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="min-h-touch px-3 py-1.5 bg-gray-900 text-white dark:bg-slate-700 rounded-xl font-bold flex items-center space-x-1 shadow-sm active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Income vs Expense Card */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Cash Flow Summary ({selectedPeriod})
        </h4>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
              Total Income
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              +{formatBDT(currentStats.totalIncome)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
            <span className="text-[10px] text-red-700 dark:text-red-300 font-semibold block">
              Total Expenses
            </span>
            <span className="text-base font-extrabold text-red-600 dark:text-red-400 block mt-0.5">
              -{formatBDT(currentStats.totalExpense)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-gray-100 dark:border-slate-700 text-xs">
          <span className="text-gray-500 dark:text-gray-400">Net Balance this period:</span>
          <span className={`font-bold ${currentStats.totalIncome - currentStats.totalExpense >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {formatBDT(currentStats.totalIncome - currentStats.totalExpense)}
          </span>
        </div>
      </div>

      {/* WALLET FEES PAID REPORT */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Percent className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Wallet Fees Paid
            </h4>
          </div>
          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
            {formatBDT(currentStats.totalWalletFees)}
          </span>
        </div>

        <p className="text-[11px] text-gray-400">
          Charges incurred from bKash/Nagad cashouts, send money, or bank transfers:
        </p>

        {Object.keys(currentStats.feesPerWallet).length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">No wallet fees paid in this period.</p>
        ) : (
          <div className="space-y-1.5 pt-1">
            {Object.entries(currentStats.feesPerWallet).map(([walletId, feeAmt]) => (
              <div key={walletId} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-slate-700/50">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {walletMap[walletId] || walletId}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatBDT(feeAmt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORY BREAKDOWN TABLE */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5">
        <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Category Breakdown ({selectedPeriod})
        </h4>

        {Object.keys(currentStats.categoryExpenses).length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">No category expenses recorded in this period.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {Object.entries(currentStats.categoryExpenses)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = currentStats.totalExpense > 0 ? ((amt / currentStats.totalExpense) * 100).toFixed(1) : '0';
                return (
                  <div key={cat} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white block">
                        {cat}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {pct}% of spending
                      </span>
                    </div>
                    <span className="font-extrabold text-gray-900 dark:text-white">
                      {formatBDT(amt)}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
