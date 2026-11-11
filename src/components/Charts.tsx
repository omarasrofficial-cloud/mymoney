// src/components/Charts.tsx
import React from 'react';
import { formatBDT } from '../utils/currency';
import { formatDateToISO, getDayOfWeekName } from '../utils/date';
import type { Transaction } from '../types/models';

interface ChartsProps {
  transactions: Transaction[];
  categoryTotals: Record<string, number>;
  totalMonthlyExpense: number;
}

export const Charts: React.FC<ChartsProps> = ({
  transactions,
  categoryTotals,
  totalMonthlyExpense
}) => {
  // 1. Calculate past 7 days spending
  const today = new Date();
  const past7Days: { dateStr: string; dayLabel: string; amount: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDateToISO(d);
    const dayLabel = i === 0 ? 'Today' : getDayOfWeekName(dateStr);

    const dayExpense = transactions
      .filter((tx) => tx.date === dateStr && tx.type === 'expense')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0) + (Number(tx.charge) || 0), 0);

    past7Days.push({
      dateStr,
      dayLabel,
      amount: dayExpense
    });
  }

  const maxExpense = Math.max(...past7Days.map((d) => d.amount), 500);

  // 2. Sort categories by spending descending
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  const categoryColors = [
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#64748B'  // Slate
  ];

  return (
    <div className="space-y-4">
      {/* 7-Day Expense Bar Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
            Past 7 Days Spending
          </h3>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {formatBDT(past7Days.reduce((a, b) => a + b.amount, 0))} Total
          </span>
        </div>

        <div className="flex items-end justify-between h-28 pt-4 pb-1 px-1">
          {past7Days.map((day, idx) => {
            const heightPercent = Math.max(4, Math.round((day.amount / maxExpense) * 100));
            const isToday = idx === past7Days.length - 1;
            return (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center mx-1 group">
                <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mb-1 opacity-80 group-hover:opacity-100">
                  {day.amount > 0 ? (day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount) : ''}
                </span>
                <div className="w-full max-w-[28px] bg-gray-100 dark:bg-slate-700 rounded-t-md h-20 flex items-end overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                        : 'bg-emerald-500/70 dark:bg-emerald-600/60'
                    }`}
                  />
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${
                  isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories This Month */}
      {sortedCategories.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Top Expenses This Month
            </h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {formatBDT(totalMonthlyExpense)}
            </span>
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-slate-700 mb-3">
            {sortedCategories.map(([cat, amt], idx) => {
              const pct = totalMonthlyExpense > 0 ? (amt / totalMonthlyExpense) * 100 : 0;
              return (
                <div
                  key={cat}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: categoryColors[idx % categoryColors.length]
                  }}
                  className="h-full transition-all duration-500"
                  title={`${cat}: ${formatBDT(amt)}`}
                />
              );
            })}
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {sortedCategories.map(([cat, amt], idx) => {
              const pct = totalMonthlyExpense > 0 ? Math.round((amt / totalMonthlyExpense) * 100) : 0;
              const color = categoryColors[idx % categoryColors.length];
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {cat}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      ({pct}%)
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatBDT(amt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
