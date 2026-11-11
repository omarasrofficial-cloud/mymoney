// src/components/TransactionsView.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar,
  Tag,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Clock,
  FileText,
  User,
  Check,
  ChevronDown
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { formatDateLabel, getTodayISO } from '../utils/date';
import { deleteTransaction, updateTransaction } from '../hooks/useFinanceData';
import { db } from '../db/db';
import type { Transaction, Wallet, Category, TransactionType } from '../types/models';

interface TransactionsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  defaultWalletId: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  wallets,
  categories,
  defaultWalletId
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal state
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});

  // Add Manual Transaction Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addFormData, setAddFormData] = useState<Partial<Transaction>>({
    type: 'expense',
    amount: undefined,
    walletId: defaultWalletId,
    category: 'Food',
    date: getTodayISO()
  });

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactions.filter((tx) => {
      // Exclude linked child fee records from primary list (they are displayed on their parent)
      if (tx.parentId) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNote = tx.note?.toLowerCase().includes(term);
        const matchesPerson = tx.personName?.toLowerCase().includes(term);
        const matchesCategory = tx.category.toLowerCase().includes(term);
        const matchesRaw = tx.rawText?.toLowerCase().includes(term);
        const matchesAmt = tx.amount.toString().includes(term);
        if (!matchesNote && !matchesPerson && !matchesCategory && !matchesRaw && !matchesAmt) {
          return false;
        }
      }

      // Wallet filter
      if (selectedWallet !== 'all' && tx.walletId !== selectedWallet && tx.toWalletId !== selectedWallet) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && tx.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by date descending, then createdAt descending
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [transactions, searchTerm, selectedWallet, selectedCategory, selectedType]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[] }[] = [];
    filteredList.forEach((tx) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === tx.date) {
        lastGroup.items.push(tx);
      } else {
        groups.push({ date: tx.date, items: [tx] });
      }
    });
    return groups;
  }, [filteredList]);

  // Wallets map for quick name lookup
  const walletMap = useMemo(() => {
    const map: Record<string, string> = {};
    wallets.forEach((w) => { map[w.id] = w.name; });
    return map;
  }, [wallets]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction? Balances and net worth will be reversed.')) {
      await deleteTransaction(id);
      setDetailTx(null);
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditFormData({ ...tx });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.id || !editFormData.amount) return;
    await updateTransaction(editFormData as Transaction);
    setIsEditing(false);
    setDetailTx(editFormData as Transaction);
  };

  const handleManualAdd = async () => {
    if (!addFormData.amount || addFormData.amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const now = new Date().toISOString();
    const newTxId = 'tx_' + Math.random().toString(36).substring(2, 11);

    const newTx: Transaction = {
      id: newTxId,
      type: addFormData.type || 'expense',
      amount: Number(addFormData.amount),
      charge: addFormData.charge ? Number(addFormData.charge) : undefined,
      walletId: addFormData.walletId || defaultWalletId,
      toWalletId: addFormData.toWalletId,
      category: addFormData.category || 'Other',
      personName: addFormData.personName,
      note: addFormData.note || addFormData.category,
      date: addFormData.date || getTodayISO(),
      dueDate: addFormData.dueDate,
      createdAt: now,
      updatedAt: now
    };

    await db.transaction('rw', db.transactions, async () => {
      await db.transactions.put(newTx);
      if (newTx.charge && newTx.charge > 0) {
        const feeTx: Transaction = {
          id: 'fee_' + Math.random().toString(36).substring(2, 11),
          type: 'expense',
          amount: newTx.charge,
          walletId: newTx.walletId,
          category: 'Wallet Fees',
          parentId: newTxId,
          note: `Fee for ${newTx.note}`,
          date: newTx.date,
          createdAt: now,
          updatedAt: now
        };
        await db.transactions.put(feeTx);
      }
    });

    setIsAddOpen(false);
    setAddFormData({
      type: 'expense',
      amount: undefined,
      walletId: defaultWalletId,
      category: 'Food',
      date: getTodayISO()
    });
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">Income</span>;
      case 'transfer':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">Transfer</span>;
      case 'loan_given':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">Loan Given</span>;
      case 'loan_taken':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">Loan Taken</span>;
      case 'repayment_received':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">Repay Recv</span>;
      case 'repayment_paid':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">Repay Paid</span>;
      case 'savings_deposit':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold">Savings</span>;
      case 'dps_installment':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold">DPS</span>;
      case 'fdr_open':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold">FDR</span>;
      case 'investment_buy':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">Invest</span>;
      case 'adjustment':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold">Reconcile</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 font-bold">Expense</span>;
    }
  };

  return (
    <div className="space-y-3 pb-24 px-3 pt-2 max-w-md mx-auto">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Transactions History
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {filteredList.length} record{filteredList.length === 1 ? '' : 's'} found
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Manual Add</span>
        </button>
      </div>

      {/* Search Bar & Filter Toggle */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search note, category, person, amount..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`min-h-touch min-w-touch px-3 py-2 rounded-xl border flex items-center justify-center space-x-1 text-xs font-semibold active:scale-95 transition-all ${
            showFilters || selectedWallet !== 'all' || selectedCategory !== 'all' || selectedType !== 'all'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-white border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Filter Options Expandable */}
      {showFilters && (
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2 text-xs animate-fadeIn">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Wallet</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Wallets</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Types</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
                <option value="loan_given">Loan Given</option>
                <option value="loan_taken">Loan Taken</option>
                <option value="repayment_received">Repayment Recv</option>
                <option value="repayment_paid">Repayment Paid</option>
                <option value="savings_deposit">Savings</option>
                <option value="dps_installment">DPS</option>
                <option value="fdr_open">FDR</option>
                <option value="investment_buy">Investment</option>
                <option value="adjustment">Reconcile</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {(selectedWallet !== 'all' || selectedCategory !== 'all' || selectedType !== 'all') && (
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  setSelectedWallet('all');
                  setSelectedCategory('all');
                  setSelectedType('all');
                }}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Grouped List by Date */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No transactions match your search or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map((group) => {
            const dateLabel = formatDateLabel(group.date);
            const dayTotalExpense = group.items
              .filter((tx) => tx.type === 'expense')
              .reduce((sum, tx) => sum + (tx.amount || 0) + (tx.charge || 0), 0);

            return (
              <div key={group.date} className="space-y-1.5">
                {/* Date header */}
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span>{dateLabel}</span>
                  {dayTotalExpense > 0 && (
                    <span className="text-[11px] font-medium">
                      Spent: {formatBDT(dayTotalExpense)}
                    </span>
                  )}
                </div>

                {/* Items in date */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700/60 shadow-sm overflow-hidden">
                  {group.items.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        onClick={() => {
                          setDetailTx(tx);
                          setIsEditing(false);
                        }}
                        className="p-3.5 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="shrink-0">
                            {getTypeBadge(tx.type)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {tx.note || tx.category || tx.rawText}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center space-x-1 mt-0.5">
                              <span>{walletMap[tx.walletId] || tx.walletId}</span>
                              {tx.toWalletId && <span>➔ {walletMap[tx.toWalletId] || tx.toWalletId}</span>}
                              {tx.personName && <span>• {tx.personName}</span>}
                              {tx.charge && tx.charge > 0 && <span>• Fee: {formatBDT(tx.charge)}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className={`text-xs font-extrabold block ${
                            isExpense
                              ? 'text-red-600 dark:text-red-400'
                              : isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {isExpense ? '-' : isIncome ? '+' : ''}{formatBDT(tx.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL (Showing ALL Fields) */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800 mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <span>Transaction Detail</span>
                  {getTypeBadge(detailTx.type)}
                </h3>
                <p className="text-[11px] text-gray-400">ID: {detailTx.id}</p>
              </div>
              <button
                onClick={() => {
                  setDetailTx(null);
                  setIsEditing(false);
                }}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read / Edit Mode */}
            {isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Amount (৳)</label>
                  <input
                    type="number"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Charge Fee (৳)</label>
                  <input
                    type="number"
                    value={editFormData.charge || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, charge: parseFloat(e.target.value) || undefined })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Wallet</label>
                  <select
                    value={editFormData.walletId}
                    onChange={(e) => setEditFormData({ ...editFormData, walletId: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Category</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Note</label>
                  <input
                    type="text"
                    value={editFormData.note || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 min-h-touch py-2 rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 min-h-touch py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center space-x-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {/* Amount display */}
                <div className="p-3 bg-gray-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Amount</span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                      {formatBDT(detailTx.amount)}
                    </span>
                  </div>
                  {detailTx.charge && detailTx.charge > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block font-medium">Wallet Fee</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {formatBDT(detailTx.charge)}
                      </span>
                    </div>
                  )}
                </div>

                {/* All fields table */}
                <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-800/50 space-y-1.5">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Wallet</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {walletMap[detailTx.walletId] || detailTx.walletId}
                      {detailTx.toWalletId && ` ➔ ${walletMap[detailTx.toWalletId] || detailTx.toWalletId}`}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Category</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {detailTx.category}
                    </span>
                  </div>

                  {detailTx.personName && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Person</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {detailTx.personName}
                      </span>
                    </div>
                  )}

                  {detailTx.dueDate && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Due Date</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {detailTx.dueDate}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Date</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {detailTx.date}
                    </span>
                  </div>

                  {detailTx.note && (
                    <div className="py-1">
                      <span className="text-gray-400 block mb-0.5">Note</span>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {detailTx.note}
                      </p>
                    </div>
                  )}

                  {detailTx.rawText && (
                    <div className="py-1">
                      <span className="text-gray-400 block mb-0.5">Original Typed Text</span>
                      <p className="font-mono text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 p-2 rounded-lg">
                        {detailTx.rawText}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between py-1 text-[10px] text-gray-400">
                    <span>Created At</span>
                    <span>{detailTx.createdAt ? new Date(detailTx.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>

                  {detailTx.updatedAt && (
                    <div className="flex justify-between py-1 text-[10px] text-gray-400">
                      <span>Edited At</span>
                      <span>{new Date(detailTx.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Edit and Delete */}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => handleDelete(detailTx.id)}
                    className="min-h-touch px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold flex items-center justify-center space-x-1.5 active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(detailTx)}
                    className="flex-1 min-h-touch py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Entry</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUAL ADD TRANSACTION MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Manual Transaction Entry
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Type</label>
                  <select
                    value={addFormData.type}
                    onChange={(e) => setAddFormData({ ...addFormData, type: e.target.value as TransactionType })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                    <option value="loan_given">Loan Given</option>
                    <option value="loan_taken">Loan Taken</option>
                    <option value="repayment_received">Repay Recv</option>
                    <option value="repayment_paid">Repay Paid</option>
                    <option value="savings_deposit">Savings Goal</option>
                    <option value="dps_installment">DPS Installment</option>
                    <option value="fdr_open">FDR Open</option>
                    <option value="investment_buy">Investment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Amount (৳)</label>
                  <input
                    type="number"
                    value={addFormData.amount || ''}
                    onChange={(e) => setAddFormData({ ...addFormData, amount: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g. 500"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">
                    {addFormData.type === 'transfer' ? 'From Wallet' : 'Wallet'}
                  </label>
                  <select
                    value={addFormData.walletId}
                    onChange={(e) => setAddFormData({ ...addFormData, walletId: e.target.value })}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {addFormData.type === 'transfer' ? (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-0.5">To Wallet</label>
                    <select
                      value={addFormData.toWalletId || defaultWalletId}
                      onChange={(e) => setAddFormData({ ...addFormData, toWalletId: e.target.value })}
                      className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Category</label>
                    <select
                      value={addFormData.category}
                      onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                      className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {(addFormData.type === 'loan_given' ||
                addFormData.type === 'loan_taken' ||
                addFormData.type === 'repayment_received' ||
                addFormData.type === 'repayment_paid') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Person Name</label>
                    <input
                      type="text"
                      value={addFormData.personName || ''}
                      onChange={(e) => setAddFormData({ ...addFormData, personName: e.target.value })}
                      placeholder="e.g. Rahim"
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Due Date (Optional)</label>
                    <input
                      type="date"
                      value={addFormData.dueDate || ''}
                      onChange={(e) => setAddFormData({ ...addFormData, dueDate: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Charge Fee (Optional ৳)</label>
                  <input
                    type="number"
                    value={addFormData.charge || ''}
                    onChange={(e) => setAddFormData({ ...addFormData, charge: parseFloat(e.target.value) || undefined })}
                    placeholder="e.g. 15"
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={addFormData.date}
                    onChange={(e) => setAddFormData({ ...addFormData, date: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Note</label>
                <input
                  type="text"
                  value={addFormData.note || ''}
                  onChange={(e) => setAddFormData({ ...addFormData, note: e.target.value })}
                  placeholder="e.g. Lunch at Khanas"
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 min-h-touch py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAdd}
                  className="flex-1 min-h-touch py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
