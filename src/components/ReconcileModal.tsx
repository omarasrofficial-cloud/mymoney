// src/components/ReconcileModal.tsx
import React, { useState } from 'react';
import { X, Scale, Check, ArrowRight } from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { reconcileWallet } from '../hooks/useFinanceData';
import type { Wallet } from '../types/models';

interface ReconcileModalProps {
  wallet: Wallet;
  currentDerivedBalance: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ReconcileModal: React.FC<ReconcileModalProps> = ({
  wallet,
  currentDerivedBalance,
  isOpen,
  onClose,
}) => {
  const [actualBalanceInput, setActualBalanceInput] = useState<string>('');
  const [note, setNote] = useState<string>('Balance reconcile adjustment');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const actualBalance = parseFloat(actualBalanceInput);
  const isValidNumber = !isNaN(actualBalance);
  const diff = isValidNumber ? actualBalance - currentDerivedBalance : 0;

  const handleConfirm = async () => {
    if (!isValidNumber) return;
    setIsSubmitting(true);
    try {
      await reconcileWallet(wallet.id, actualBalance, currentDerivedBalance, note);
      onClose();
    } catch (err) {
      console.error('Failed to reconcile balance:', err);
      alert('Error reconciling balance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Reconcile {wallet.name}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Match derived balance with actual reality
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State */}
        <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl mb-4 border border-gray-200 dark:border-slate-700 text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-500 dark:text-gray-400">Derived in app:</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {formatBDT(currentDerivedBalance)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            Calculated from all past transactions for this wallet.
          </p>
        </div>

        {/* Input Actual Balance */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Actual Real Balance (৳)
          </label>
          <input
            type="number"
            step="any"
            value={actualBalanceInput}
            onChange={(e) => setActualBalanceInput(e.target.value)}
            placeholder="e.g. 5200"
            autoFocus
            className="w-full text-base font-bold bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Difference Preview */}
        {isValidNumber && (
          <div className={`p-3 rounded-xl mb-4 text-xs border ${
            diff === 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : diff > 0
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}>
            <div className="flex items-center justify-between font-semibold">
              <span>Adjustment created:</span>
              <span>{diff >= 0 ? '+' : ''}{formatBDT(diff)}</span>
            </div>
            <p className="text-[10px] mt-1 opacity-90">
              {diff === 0
                ? 'Balances already match! No adjustment needed.'
                : diff > 0
                ? 'Adds a positive adjustment so your wallet balance increases to match.'
                : 'Adds a negative adjustment so your wallet balance decreases to match.'}
            </p>
          </div>
        )}

        {/* Note */}
        <div className="mb-5">
          <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            Adjustment Note
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="flex-1 min-h-touch py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidNumber || isSubmitting || diff === 0}
            className="flex-1 min-h-touch py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Adjustment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
