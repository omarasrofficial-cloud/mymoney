// src/components/SettingsView.tsx
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Wallet as WalletIcon,
  Tags,
  BookOpen,
  Brain,
  Lock,
  Sun,
  Moon,
  Scale,
  Download,
  Upload,
  Database,
  Trash2,
  Plus,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { db, DEFAULT_WALLETS, DEFAULT_CATEGORIES, DEFAULT_KEYWORD_DICT } from '../db/db';
import { loadDemoData } from '../utils/demoData';
import { reconcileWallet } from '../hooks/useFinanceData';
import type { Wallet, Category, AppSettings, KeywordMapping } from '../types/models';

interface SettingsViewProps {
  settings?: AppSettings;
  wallets: Wallet[];
  allWallets: Wallet[];
  categories: Category[];
  keywords: KeywordMapping[];
  learnedWords: KeywordMapping[];
  walletBalances: Record<string, number>;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  wallets,
  allWallets,
  categories,
  keywords,
  learnedWords,
  walletBalances,
  darkMode,
  onToggleDarkMode
}) => {
  // Subsections toggle
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Default wallet state
  const defaultWalletId = settings?.defaultWalletId || 'cash';

  // Add wallet modal
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#2563EB');
  const [newWalletOpeningBalance, setNewWalletOpeningBalance] = useState('');

  // Add category modal
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Add keyword modal
  const [isAddKeywordOpen, setIsAddKeywordOpen] = useState(false);
  const [newKeywordWord, setNewKeywordWord] = useState('');
  const [newKeywordCat, setNewKeywordCat] = useState('Food');

  // PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Double confirmation for data deletion
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<number>(0);

  // Set default wallet
  const handleSetDefaultWallet = async (walletId: string) => {
    if (settings) {
      settings.defaultWalletId = walletId;
      await db.settings.put(settings);
    }
  };

  // Add Wallet
  const handleAddWallet = async () => {
    if (!newWalletName.trim()) return;
    const wId = newWalletName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newWallet: Wallet = {
      id: wId,
      name: newWalletName.trim(),
      color: newWalletColor,
      icon: 'banknote',
      createdAt: new Date().toISOString()
    };

    await db.wallets.put(newWallet);

    // If opening balance given, create an adjustment transaction
    const openingBal = parseFloat(newWalletOpeningBalance);
    if (!isNaN(openingBal) && openingBal !== 0) {
      await reconcileWallet(wId, openingBal, 0, 'Opening balance');
    }

    setIsAddWalletOpen(false);
    setNewWalletName('');
    setNewWalletOpeningBalance('');
  };

  // Archive Wallet
  const handleToggleArchiveWallet = async (wallet: Wallet) => {
    wallet.isArchived = !wallet.isArchived;
    await db.wallets.put(wallet);
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const catId = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCat: Category = {
      id: catId,
      name: newCatName.trim(),
      isDefault: false
    };
    await db.categories.put(newCat);
    setIsAddCatOpen(false);
    setNewCatName('');
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    await db.categories.delete(catId);
  };

  // Add Keyword
  const handleAddKeyword = async () => {
    if (!newKeywordWord.trim()) return;
    const cleanWord = newKeywordWord.toLowerCase().trim();
    await db.keywords.put({
      word: cleanWord,
      category: newKeywordCat,
      count: 1
    });
    setIsAddKeywordOpen(false);
    setNewKeywordWord('');
  };

  // Delete Keyword / Learned Word
  const handleDeleteKeyword = async (word: string, isLearned = false) => {
    if (isLearned) {
      await db.learnedWords.delete(word);
    } else {
      await db.keywords.delete(word);
    }
  };

  // Reset Keyword Dictionary
  const handleResetKeywords = async () => {
    if (confirm('Reset keyword dictionary to original defaults?')) {
      await db.keywords.clear();
      const list: KeywordMapping[] = Object.entries(DEFAULT_KEYWORD_DICT).map(([word, category]) => ({
        word,
        category,
        count: 1
      }));
      await db.keywords.bulkPut(list);
      alert('Keywords reset successfully.');
    }
  };

  // Toggle PIN
  const handleTogglePin = async () => {
    if (settings?.isPinEnabled) {
      // Disable
      settings.isPinEnabled = false;
      settings.pin = undefined;
      await db.settings.put(settings);
    } else {
      setIsPinModalOpen(true);
      setNewPin('');
    }
  };

  const handleSavePin = async () => {
    if (newPin.length !== 4) {
      alert('PIN must be 4 digits.');
      return;
    }
    if (settings) {
      settings.isPinEnabled = true;
      settings.pin = newPin;
      await db.settings.put(settings);
    }
    setIsPinModalOpen(false);
    setNewPin('');
  };

  // Backup Export JSON
  const handleExportJSON = async () => {
    const allData = {
      version: 1,
      exportDate: new Date().toISOString(),
      transactions: await db.transactions.toArray(),
      wallets: await db.wallets.toArray(),
      categories: await db.categories.toArray(),
      goals: await db.goals.toArray(),
      dps: await db.dps.toArray(),
      fdr: await db.fdr.toArray(),
      investments: await db.investments.toArray(),
      budgets: await db.budgets.toArray(),
      keywords: await db.keywords.toArray(),
      learnedWords: await db.learnedWords.toArray(),
      settings: await db.settings.get('app_settings')
    };

    const jsonString = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyMoney_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update last backup date
    if (settings) {
      settings.lastBackupDate = new Date().toISOString();
      await db.settings.put(settings);
    }
    alert('Backup exported successfully! Keep this JSON file safe.');
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data || !data.transactions) {
          throw new Error('Invalid MyMoney backup JSON format.');
        }

        if (confirm(`Restore ${data.transactions.length} transactions and settings from backup? Existing data will be replaced.`)) {
          await db.transaction('rw', [
            db.transactions,
            db.wallets,
            db.categories,
            db.goals,
            db.dps,
            db.fdr,
            db.investments,
            db.budgets,
            db.keywords,
            db.learnedWords,
            db.settings
          ], async () => {
            if (data.transactions) {
              await db.transactions.clear();
              await db.transactions.bulkPut(data.transactions);
            }
            if (data.wallets) {
              await db.wallets.clear();
              await db.wallets.bulkPut(data.wallets);
            }
            if (data.categories) {
              await db.categories.clear();
              await db.categories.bulkPut(data.categories);
            }
            if (data.goals) {
              await db.goals.clear();
              await db.goals.bulkPut(data.goals);
            }
            if (data.dps) {
              await db.dps.clear();
              await db.dps.bulkPut(data.dps);
            }
            if (data.fdr) {
              await db.fdr.clear();
              await db.fdr.bulkPut(data.fdr);
            }
            if (data.investments) {
              await db.investments.clear();
              await db.investments.bulkPut(data.investments);
            }
            if (data.budgets) {
              await db.budgets.clear();
              await db.budgets.bulkPut(data.budgets);
            }
            if (data.keywords) {
              await db.keywords.clear();
              await db.keywords.bulkPut(data.keywords);
            }
            if (data.learnedWords) {
              await db.learnedWords.clear();
              await db.learnedWords.bulkPut(data.learnedWords);
            }
            if (data.settings) {
              await db.settings.put(data.settings);
            }
          });

          alert('Data restored successfully!');
          window.location.reload();
        }
      } catch (err) {
        console.error('Import error:', err);
        alert('Failed to parse backup JSON. Please check the file.');
      }
    };
    reader.readAsText(file);
  };

  // Load Demo Data
  const handleLoadDemo = async () => {
    if (confirm('Load sample Bangladeshi demo data (bKash, Nagad, Bank, Salary, DPS, FDR, Goals)? Existing entries will be reset.')) {
      await loadDemoData();
      alert('Demo data loaded successfully!');
    }
  };

  // Delete All Data (Double confirmation)
  const handleDeleteAllData = async () => {
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
    } else if (deleteConfirmStep === 1) {
      await db.transaction('rw', [
        db.transactions,
        db.goals,
        db.dps,
        db.fdr,
        db.investments,
        db.budgets,
        db.learnedWords
      ], async () => {
        await db.transactions.clear();
        await db.goals.clear();
        await db.dps.clear();
        await db.fdr.clear();
        await db.investments.clear();
        await db.budgets.clear();
        await db.learnedWords.clear();
      });
      setDeleteConfirmStep(0);
      alert('All transactions and ledger data have been wiped.');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. GENERAL & PREFERENCES */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
          Preferences & Security
        </h4>

        {/* Default Wallet */}
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white block">
              Default Wallet
            </span>
            <span className="text-[10px] text-gray-400">
              Used when freeform input doesn't mention a wallet
            </span>
          </div>

          <select
            value={defaultWalletId}
            onChange={(e) => handleSetDefaultWallet(e.target.value)}
            className="p-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-xs"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between py-1 border-t border-gray-100 dark:border-slate-700/60">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white block">
              Appearance Theme
            </span>
            <span className="text-[10px] text-gray-400">
              Toggle Light / Dark mode
            </span>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="min-h-touch px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center space-x-1.5 font-bold active:scale-95"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            <span>{darkMode ? 'Dark' : 'Light'}</span>
          </button>
        </div>

        {/* 4-Digit PIN Lock */}
        <div className="flex items-center justify-between py-1 border-t border-gray-100 dark:border-slate-700/60">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white block">
              Passcode PIN Lock
            </span>
            <span className="text-[10px] text-gray-400">
              {settings?.isPinEnabled ? 'PIN lock active on startup' : 'Protect with 4-digit PIN'}
            </span>
          </div>

          <button
            onClick={handleTogglePin}
            className={`min-h-touch px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 active:scale-95 ${
              settings?.isPinEnabled
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                : 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{settings?.isPinEnabled ? 'Enabled' : 'Set PIN'}</span>
          </button>
        </div>
      </div>

      {/* 2. WALLETS MANAGER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
            Manage Wallets ({allWallets.length})
          </h4>
          <button
            onClick={() => setIsAddWalletOpen(true)}
            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>

        <div className="space-y-2">
          {allWallets.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                <span className="font-bold text-gray-900 dark:text-white">{w.name}</span>
                {w.isArchived && <span className="text-[9px] text-gray-400 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.2 rounded">Archived</span>}
              </div>

              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-gray-900 dark:text-white">
                  {formatBDT(walletBalances[w.id] || 0)}
                </span>
                <button
                  onClick={() => handleToggleArchiveWallet(w)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                >
                  {w.isArchived ? 'Restore' : 'Archive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. KEYWORD DICTIONARY & LEARNED WORDS */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
              Parser Keywords & Self-Learning
            </h4>
            <p className="text-[10px] text-gray-400">
              {keywords.length} built-in keywords • {learnedWords.length} self-learned
            </p>
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => setIsAddKeywordOpen(true)}
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
            <button
              onClick={handleResetKeywords}
              className="p-1 rounded-lg border text-gray-400 hover:text-gray-600"
              title="Reset to defaults"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Self-learned Words List */}
        {learnedWords.length > 0 && (
          <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-1.5">
            <span className="font-bold text-blue-900 dark:text-blue-300 text-[11px] block">
              Self-Learned Words ({learnedWords.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {learnedWords.map((lw) => (
                <span
                  key={lw.word}
                  className="inline-flex items-center space-x-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[10px] font-semibold text-blue-800 dark:text-blue-200"
                >
                  <span>"{lw.word}" ➔ {lw.category}</span>
                  <button onClick={() => handleDeleteKeyword(lw.word, true)} className="text-gray-400 hover:text-red-500">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. BACKUP & RESTORE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
          Data Backup & Offline Portability
        </h4>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          MyMoney is 100% private and offline on your device. Export a JSON backup regularly so your financial data is always safe.
        </p>

        {settings?.lastBackupDate && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Last backup exported: {new Date(settings.lastBackupDate).toLocaleDateString()}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportJSON}
            className="min-h-touch py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="min-h-touch py-2.5 px-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 text-center">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. DEMO DATA & DANGER ZONE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
          Demo Data & Reset
        </h4>

        <div className="flex items-center justify-between py-1">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white block">
              Sample Demo Data
            </span>
            <span className="text-[10px] text-gray-400">
              Pre-populates bKash, Salary, City Bank DPS, FDR, and loans
            </span>
          </div>

          <button
            onClick={handleLoadDemo}
            className="min-h-touch px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-xs active:scale-95"
          >
            Load Demo
          </button>
        </div>

        {/* Delete All Data with Double Confirmation */}
        <div className="pt-2 border-t border-red-100 dark:border-red-950/60">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-red-600 dark:text-red-400 block">
                Delete All Data
              </span>
              <span className="text-[10px] text-gray-400">
                Wipes all transactions and balances permanently
              </span>
            </div>

            {deleteConfirmStep === 0 ? (
              <button
                onClick={handleDeleteAllData}
                className="min-h-touch px-3 py-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs active:scale-95"
              >
                Delete Data
              </button>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setDeleteConfirmStep(0)}
                  className="px-2.5 py-1 text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="min-h-touch px-3 py-1.5 bg-red-600 text-white rounded-xl font-extrabold text-xs animate-pulse active:scale-95"
                >
                  Confirm Delete!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: ADD WALLET */}
      {isAddWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Custom Wallet</h3>
              <button onClick={() => setIsAddWalletOpen(false)} className="min-w-touch min-h-touch flex items-center justify-center text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Wallet Name</label>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder="e.g. Upay, City Bank, Vault"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Opening Balance (Optional ৳)</label>
                <input
                  type="number"
                  value={newWalletOpeningBalance}
                  onChange={(e) => setNewWalletOpeningBalance(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Accent Color</label>
                <div className="flex space-x-2">
                  {['#E2136E', '#F7941D', '#2563EB', '#006A4E', '#8B5CF6', '#F59E0B'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewWalletColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${newWalletColor === c ? 'scale-125 ring-2 ring-emerald-500' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setIsAddWalletOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleAddWallet} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Save Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD KEYWORD */}
      {isAddKeywordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add Keyword Mapping</h3>
              <button onClick={() => setIsAddKeywordOpen(false)} className="min-w-touch min-h-touch flex items-center justify-center text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Keyword / Phrase</label>
                <input
                  type="text"
                  value={newKeywordWord}
                  onChange={(e) => setNewKeywordWord(e.target.value)}
                  placeholder="e.g. moghlai, shwapno, fuel"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Category</label>
                <select
                  value={newKeywordCat}
                  onChange={(e) => setNewKeywordCat(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setIsAddKeywordOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleAddKeyword} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Save Keyword
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SET 4-DIGIT PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Set 4-Digit Passcode PIN</h3>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              This PIN will be requested when opening the app.
            </p>
            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4 digits (e.g. 1234)"
                autoFocus
                className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl text-center text-xl tracking-widest font-bold text-gray-900 dark:text-white"
              />
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 min-h-touch py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl font-semibold text-gray-700 dark:text-gray-300 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePin}
                  disabled={newPin.length !== 4}
                  className="flex-1 min-h-touch py-2.5 bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 active:scale-95"
                >
                  Save PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
