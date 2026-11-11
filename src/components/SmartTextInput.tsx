// src/components/SmartTextInput.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Plus,
  HelpCircle,
  X
} from 'lucide-react';
import { parseEntries, type ParsedEntry, type ParserContext } from '../parser/parser';
import { saveParsedEntriesBatch, undoBatch } from '../hooks/useFinanceData';
import { formatBDT } from '../utils/currency';
import type { Wallet, Category, TransactionType } from '../types/models';

interface SmartTextInputProps {
  defaultWalletId: string;
  wallets: Wallet[];
  categories: Category[];
  keywordDict: Record<string, string>;
  learnedDict: Record<string, string>;
  existingTodayEntries: { amount: number; walletId: string; category: string }[];
  onSaved?: () => void;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export const SmartTextInput: React.FC<SmartTextInputProps> = ({
  defaultWalletId,
  wallets,
  categories,
  keywordDict,
  learnedDict,
  existingTodayEntries,
  onSaved,
  isOpenModal = false,
  onCloseModal
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedEntry[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [learnedSelections, setLearnedSelections] = useState<Record<string, string>>({});
  
  // Undo Toast state
  const [lastSavedBatchIds, setLastSavedBatchIds] = useState<string[] | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(10);

  // Available transaction types for preview selector
  const transactionTypes: { type: TransactionType; label: string }[] = [
    { type: 'expense', label: 'Expense' },
    { type: 'income', label: 'Income' },
    { type: 'transfer', label: 'Transfer' },
    { type: 'loan_given', label: 'Loan Given' },
    { type: 'loan_taken', label: 'Loan Taken' },
    { type: 'repayment_received', label: 'Repay Recv' },
    { type: 'repayment_paid', label: 'Repay Paid' },
    { type: 'savings_deposit', label: 'Savings' },
    { type: 'dps_installment', label: 'DPS' },
    { type: 'fdr_open', label: 'FDR' },
    { type: 'investment_buy', label: 'Investment' },
    { type: 'adjustment', label: 'Adjustment' }
  ];

  const handleParse = () => {
    if (!inputText.trim()) return;

    const ctx: ParserContext = {
      defaultWalletId,
      wallets,
      categories,
      keywordDict,
      learnedDict,
      existingTodayEntries
    };

    const results = parseEntries(inputText, ctx);
    setParsedRows(results);
    setIsPreviewOpen(true);
  };

  const handleUpdateRow = (id: string, updates: Partial<ParsedEntry>) => {
    setParsedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates, isUnrecognized: false } : row))
    );
  };

  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleCategoryChange = (rowId: string, category: string, unknownWord?: string) => {
    handleUpdateRow(rowId, { category });
    if (unknownWord) {
      setLearnedSelections((prev) => ({
        ...prev,
        [unknownWord.toLowerCase()]: category
      }));
    }
  };

  const handleSaveAll = async () => {
    // Filter out rows that are still completely unrecognized
    const validRows = parsedRows.filter((r) => !r.isUnrecognized && r.amount > 0);
    if (validRows.length === 0) {
      alert('Please fill in or correct the entries before saving.');
      return;
    }

    try {
      const savedIds = await saveParsedEntriesBatch(validRows, learnedSelections);
      setLastSavedBatchIds(savedIds);
      setUndoToastVisible(true);
      setUndoCountdown(10);

      // Start 10-second countdown
      const interval = setInterval(() => {
        setUndoCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            setUndoToastVisible(false);
            setLastSavedBatchIds(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      // Reset form
      setInputText('');
      setParsedRows([]);
      setIsPreviewOpen(false);
      setLearnedSelections({});
      if (onSaved) onSaved();
      if (onCloseModal) onCloseModal();
    } catch (err) {
      console.error('Failed to save entries:', err);
      alert('Error saving entries. Please try again.');
    }
  };

  const handleUndo = async () => {
    if (lastSavedBatchIds && lastSavedBatchIds.length > 0) {
      await undoBatch(lastSavedBatchIds);
      setUndoToastVisible(false);
      setLastSavedBatchIds(null);
      alert('Entries successfully undone.');
    }
  };

  return (
    <div className="w-full">
      {/* Main Textarea Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Smart Freeform Input</span>
          </label>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Dictate 🎙️ or Type
          </span>
        </div>

        {/* Textarea: standard text area for iPhone keyboard dictation mic */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write today's entries, one per line or separated by commas (e.g. lunch 250, rickshaw 60, bkash fee 37, lent Rahim 1000)"
          rows={3}
          className="w-full text-sm bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
        />

        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center space-x-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Supports BDT ৳, 5k, 2 lakh, fees, transfers, loans</span>
          </div>

          <button
            onClick={handleParse}
            disabled={!inputText.trim()}
            className="min-h-touch px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-emerald-600/30 active:scale-95 transition-all"
          >
            <span>Parse & Preview</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PREVIEW MODAL / LIST */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-all animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>Confirm Entries ({parsedRows.length})</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Review & edit before saving to ledger
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of preview cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {parsedRows.map((row) => (
                <div
                  key={row.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    row.isUnrecognized
                      ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                      : row.isDuplicateWarning
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {/* Top row: original text + delete button */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[240px]">
                      "{row.rawText}"
                    </span>
                    <button
                      onClick={() => handleDeleteRow(row.id)}
                      className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 active:scale-95"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Warning badges */}
                  {row.isUnrecognized && (
                    <div className="mb-2 p-2 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>Unrecognized line. Please enter amount and category below.</span>
                    </div>
                  )}

                  {row.isDuplicateWarning && (
                    <div className="mb-2 p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Duplicate warning: Similar entry already added today!</span>
                    </div>
                  )}

                  {/* Self-learning prompt if category was unknown */}
                  {row.unknownWord && !row.isUnrecognized && row.category === 'Uncategorized' && (
                    <div className="mb-2.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs">
                      <div className="flex items-center space-x-1 font-semibold mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Unknown word: "{row.unknownWord}"</span>
                      </div>
                      <p className="text-[11px] mb-1.5 text-blue-700 dark:text-blue-300/90">
                        Pick a category once, and MyMoney will remember it next time!
                      </p>
                    </div>
                  )}

                  {/* Editable Fields Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Type Selector */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        Type
                      </label>
                      <select
                        value={row.type}
                        onChange={(e) =>
                          handleUpdateRow(row.id, { type: e.target.value as TransactionType })
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                      >
                        {transactionTypes.map((t) => (
                          <option key={t.type} value={t.type}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        Amount (৳)
                      </label>
                      <input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) =>
                          handleUpdateRow(row.id, { amount: parseFloat(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100 font-semibold"
                      />
                    </div>

                    {/* Source Wallet */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        {row.type === 'transfer' ? 'From Wallet' : 'Wallet'}
                      </label>
                      <select
                        value={row.walletId}
                        onChange={(e) => handleUpdateRow(row.id, { walletId: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* To Wallet (Transfers only) or Category */}
                    {row.type === 'transfer' ? (
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          To Wallet
                        </label>
                        <select
                          value={row.toWalletId || defaultWalletId}
                          onChange={(e) => handleUpdateRow(row.id, { toWalletId: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          Category
                        </label>
                        <select
                          value={row.category}
                          onChange={(e) => handleCategoryChange(row.id, e.target.value, row.unknownWord)}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                        >
                          {row.category === 'Uncategorized' && (
                            <option value="Uncategorized">Select Category...</option>
                          )}
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Person Name (for loans & repayments) */}
                    {(row.type === 'loan_given' ||
                      row.type === 'loan_taken' ||
                      row.type === 'repayment_received' ||
                      row.type === 'repayment_paid') && (
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          Person Name
                        </label>
                        <input
                          type="text"
                          value={row.personName || ''}
                          onChange={(e) => handleUpdateRow(row.id, { personName: e.target.value })}
                          placeholder="e.g. Rahim"
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    )}

                    {/* Charge / Wallet Fee */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        Charge / Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={row.charge || ''}
                        onChange={(e) =>
                          handleUpdateRow(row.id, { charge: parseFloat(e.target.value) || undefined })
                        }
                        placeholder="Optional fee"
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                        Date
                      </label>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleUpdateRow(row.id, { date: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Due Date (Loans only) */}
                    {(row.type === 'loan_given' || row.type === 'loan_taken') && (
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                          Due Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={row.dueDate || ''}
                          onChange={(e) => handleUpdateRow(row.id, { dueDate: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-2 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer: Action Buttons */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 rounded-b-3xl sm:rounded-b-2xl">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="min-h-touch px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-xs font-semibold active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="min-h-touch px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All ({parsedRows.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10-SECOND UNDO TOAST */}
      {undoToastVisible && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-gray-700 dark:border-gray-200 animate-slideUp">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">Entries saved to ledger</span>
          </div>
          <button
            onClick={handleUndo}
            className="min-h-touch px-3 py-1 bg-emerald-600 text-white dark:bg-emerald-600 text-xs font-bold rounded-xl flex items-center space-x-1 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo ({undoCountdown}s)</span>
          </button>
        </div>
      )}
    </div>
  );
};
