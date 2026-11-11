// src/components/BudgetsView.tsx
import React, { useState } from 'react';
import { Target, Plus, Trash2, Edit2, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { db } from '../db/db';
import type { Budget, Category } from '../types/models';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  categoryExpensesThisMonth: Record<string, number>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  categoryExpensesThisMonth
}) => {
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState<string>('');
  const [selectedCatToAdd, setSelectedCatToAdd] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Active budgets (where monthlyLimit > 0)
  const activeBudgets = budgets.filter((b) => b.monthlyLimit > 0);

  const handleSaveBudget = async (categoryName: string, limitVal: number) => {
    if (limitVal <= 0) {
      // Remove budget
      const existing = budgets.find((b) => b.category.toLowerCase() === categoryName.toLowerCase());
      if (existing) await db.budgets.delete(existing.id);
    } else {
      const existing = budgets.find((b) => b.category.toLowerCase() === categoryName.toLowerCase());
      const bObj: Budget = {
        id: existing ? existing.id : 'b_' + Math.random().toString(36).substring(2, 9),
        category: categoryName,
        monthlyLimit: limitVal
      };
      await db.budgets.put(bObj);
    }
    setEditingBudgetCategory(null);
    setBudgetLimitInput('');
    setIsAddingNew(false);
  };

  const handleDeleteBudget = async (id: string) => {
    await db.budgets.delete(id);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Monthly Category Budgets
          </h3>
          <p className="text-[11px] text-gray-400">
            Quiet by default. Set limits only where you want to control spending.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddingNew(true);
            setSelectedCatToAdd(categories[0]?.name || 'Food');
            setBudgetLimitInput('');
          }}
          className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Add New Budget Box */}
      {isAddingNew && (
        <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-3 animate-fadeIn">
          <h4 className="font-bold text-gray-900 dark:text-white">
            Set Monthly Limit
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Category</label>
              <select
                value={selectedCatToAdd}
                onChange={(e) => setSelectedCatToAdd(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Monthly Limit (৳)</label>
              <input
                type="number"
                value={budgetLimitInput}
                onChange={(e) => setBudgetLimitInput(e.target.value)}
                placeholder="e.g. 10000"
                autoFocus
                className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-3 py-1.5 border rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveBudget(selectedCatToAdd, parseFloat(budgetLimitInput) || 0)}
              disabled={!budgetLimitInput || parseFloat(budgetLimitInput) <= 0}
              className="px-4 py-1.5 bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-bold"
            >
              Save Limit
            </button>
          </div>
        </div>
      )}

      {/* Active Budgets List */}
      {activeBudgets.length === 0 && !isAddingNew ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-slate-700">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-gray-500">No category limits set.</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Tap "Set Budget" to track monthly limits with color-coded warnings (amber at 80%, red at 100%).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeBudgets.map((b) => {
            const spent = categoryExpensesThisMonth[b.category] || 0;
            const percent = Math.round((spent / b.monthlyLimit) * 100);
            const remaining = b.monthlyLimit - spent;
            const isExceeded = percent >= 100;
            const isWarning = percent >= 80 && percent < 100;

            const progressBarColor = isExceeded
              ? 'bg-red-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {b.category}
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      Spent {formatBDT(spent)} of {formatBDT(b.monthlyLimit)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
                      isExceeded
                        ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300'
                        : isWarning
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {percent}%
                    </span>

                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-red-500"
                      aria-label="Remove budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar: turns amber at 80% and red at 100% */}
                <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, percent)}%` }}
                    className={`h-full ${progressBarColor} transition-all duration-500`}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className={remaining >= 0 ? 'text-gray-500 dark:text-gray-400' : 'text-red-500 font-bold'}>
                    {remaining >= 0 ? `Remaining: ${formatBDT(remaining)}` : `Over by: ${formatBDT(Math.abs(remaining))}`}
                  </span>
                  {isExceeded && (
                    <span className="text-red-500 font-bold flex items-center space-x-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Budget Exceeded</span>
                    </span>
                  )}
                  {isWarning && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Near 80% Limit</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
