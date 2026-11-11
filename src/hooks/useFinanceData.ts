// src/hooks/useFinanceData.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type {
  Transaction,
  Wallet,
  Category,
  SavingsGoal,
  DPS,
  FDR,
  Investment,
  Budget,
  AppSettings,
  KeywordMapping
} from '../types/models';
import type { ParsedEntry } from '../parser/parser';
import {
  calculateWalletBalances,
  calculatePeopleLedger,
  calculateGoalBalances,
  calculateDPSStats,
  calculateFDRStats,
  calculateNetWorth,
  calculateSpendingTotals
} from '../utils/calculations';
import { getTodayISO, formatDateToISO } from '../utils/date';

export function useFinanceData() {
  const transactions = useLiveQuery(() => db.transactions.toArray()) ?? [];
  const wallets = useLiveQuery(() => db.wallets.filter(w => !w.isArchived).toArray()) ?? [];
  const allWallets = useLiveQuery(() => db.wallets.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const goals = useLiveQuery(() => db.goals.toArray()) ?? [];
  const dpsList = useLiveQuery(() => db.dps.toArray()) ?? [];
  const fdrList = useLiveQuery(() => db.fdr.toArray()) ?? [];
  const investments = useLiveQuery(() => db.investments.toArray()) ?? [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get('app_settings'));
  const keywords = useLiveQuery(() => db.keywords.toArray()) ?? [];
  const learnedWords = useLiveQuery(() => db.learnedWords.toArray()) ?? [];

  const todayStr = getTodayISO();

  // Keyword dictionary maps
  const keywordDict: Record<string, string> = {};
  keywords.forEach((k) => { keywordDict[k.word.toLowerCase()] = k.category; });

  const learnedDict: Record<string, string> = {};
  learnedWords.forEach((k) => { learnedDict[k.word.toLowerCase()] = k.category; });

  // Balances & Ledgers
  const walletBalances = calculateWalletBalances(transactions, allWallets);
  const peopleLedger = calculatePeopleLedger(transactions, todayStr);
  const goalBalances = calculateGoalBalances(transactions);
  const dpsStats = calculateDPSStats(dpsList, transactions);
  const fdrStats = calculateFDRStats(fdrList, transactions);
  
  const netWorthSummary = calculateNetWorth(
    transactions,
    allWallets,
    dpsList,
    fdrList,
    investments,
    todayStr
  );

  // Spending calculations for today, this week, this month
  const todayDate = new Date();
  
  // Start of this week (Sunday)
  const startOfWeek = new Date(todayDate);
  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
  const startOfWeekStr = formatDateToISO(startOfWeek);

  // Start of this month (1st of month)
  const startOfMonthStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`;
  const endOfMonthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
  const endOfMonthStr = formatDateToISO(endOfMonthDate);

  const spentToday = calculateSpendingTotals(transactions, todayStr, todayStr);
  const spentThisWeek = calculateSpendingTotals(transactions, startOfWeekStr, todayStr);
  const spentThisMonth = calculateSpendingTotals(transactions, startOfMonthStr, endOfMonthStr);

  // Check if any transaction exists today
  const hasTransactionToday = transactions.some((tx) => tx.date === todayStr);

  // Check if backup is older than 7 days
  let needBackupAlert = false;
  if (settings) {
    if (!settings.lastBackupDate) {
      if (transactions.length > 5) needBackupAlert = true;
    } else {
      const lastBackup = new Date(settings.lastBackupDate);
      const diffDays = (todayDate.getTime() - lastBackup.getTime()) / (1000 * 3600 * 24);
      if (diffDays >= 7) needBackupAlert = true;
    }
  }

  // Check upcoming / overdue loans or DPS
  const overduePeople = Object.values(peopleLedger).filter((p) => p.isOverdue && (p.owedToMe > 0 || p.iOwe > 0));
  const upcomingLoans = Object.values(peopleLedger).filter((p) => {
    if (!p.earliestDueDate || p.isOverdue) return false;
    const due = new Date(p.earliestDueDate);
    const diffDays = (due.getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7 && (p.owedToMe > 0 || p.iOwe > 0);
  });

  return {
    transactions,
    wallets,
    allWallets,
    categories,
    goals,
    dpsList,
    fdrList,
    investments,
    budgets,
    settings,
    keywords,
    learnedWords,
    keywordDict,
    learnedDict,
    walletBalances,
    peopleLedger,
    goalBalances,
    dpsStats,
    fdrStats,
    netWorthSummary,
    spentToday,
    spentThisWeek,
    spentThisMonth,
    hasTransactionToday,
    needBackupAlert,
    overduePeople,
    upcomingLoans,
    todayStr,
    startOfMonthStr,
    endOfMonthStr
  };
}

/**
 * Saves parsed entries with charges and learned mappings into Dexie
 */
export async function saveParsedEntriesBatch(
  entries: ParsedEntry[],
  learnedMappings: Record<string, string> = {}
): Promise<string[]> {
  const now = new Date().toISOString();
  const createdIds: string[] = [];

  await db.transaction('rw', [db.transactions, db.learnedWords], async () => {
    for (const entry of entries) {
      if (entry.isUnrecognized) continue;

      const parentTxId = 'tx_' + Math.random().toString(36).substring(2, 11);
      createdIds.push(parentTxId);

      const mainTx: Transaction = {
        id: parentTxId,
        type: entry.type,
        amount: entry.amount,
        charge: entry.charge,
        walletId: entry.walletId,
        toWalletId: entry.toWalletId,
        category: entry.category,
        personName: entry.personName,
        linkedEntityId: entry.linkedEntityName, // Or matched ID
        note: entry.note || entry.rawText,
        date: entry.date,
        rawText: entry.rawText,
        dueDate: entry.dueDate,
        createdAt: now,
        updatedAt: now
      };

      await db.transactions.put(mainTx);

      // If entry has a charge, create linked expense transaction in category "Wallet Fees"
      if (entry.charge && entry.charge > 0) {
        const feeTxId = 'fee_' + Math.random().toString(36).substring(2, 11);
        createdIds.push(feeTxId);

        const feeTx: Transaction = {
          id: feeTxId,
          type: 'expense',
          amount: entry.charge,
          walletId: entry.walletId,
          category: 'Wallet Fees',
          parentId: parentTxId,
          note: `Fee for ${entry.rawText}`,
          date: entry.date,
          createdAt: now,
          updatedAt: now
        };
        await db.transactions.put(feeTx);
      }
    }

    // Save newly learned word mappings
    for (const [word, category] of Object.entries(learnedMappings)) {
      if (word && category && category !== 'Uncategorized') {
        const cleanWord = word.toLowerCase().trim();
        await db.learnedWords.put({
          word: cleanWord,
          category,
          count: 1
        });
      }
    }
  });

  return createdIds;
}

/**
 * Undo a saved batch by IDs
 */
export async function undoBatch(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  await db.transactions.bulkDelete(ids);
}

/**
 * Delete a transaction and any linked charge fee
 */
export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction('rw', db.transactions, async () => {
    // Delete this transaction
    await db.transactions.delete(id);
    // Delete any linked child charges
    await db.transactions.where('parentId').equals(id).delete();
  });
}

/**
 * Update transaction and sync linked charge fee
 */
export async function updateTransaction(tx: Transaction): Promise<void> {
  const now = new Date().toISOString();
  await db.transaction('rw', db.transactions, async () => {
    tx.updatedAt = now;
    await db.transactions.put(tx);

    // Look for existing linked charge
    const childFee = await db.transactions.where('parentId').equals(tx.id).first();
    if (tx.charge && tx.charge > 0) {
      if (childFee) {
        childFee.amount = tx.charge;
        childFee.walletId = tx.walletId;
        childFee.date = tx.date;
        childFee.updatedAt = now;
        await db.transactions.put(childFee);
      } else {
        const feeTx: Transaction = {
          id: 'fee_' + Math.random().toString(36).substring(2, 11),
          type: 'expense',
          amount: tx.charge,
          walletId: tx.walletId,
          category: 'Wallet Fees',
          parentId: tx.id,
          note: `Fee for ${tx.note || tx.rawText || tx.category}`,
          date: tx.date,
          createdAt: now,
          updatedAt: now
        };
        await db.transactions.put(feeTx);
      }
    } else if (childFee) {
      await db.transactions.delete(childFee.id);
    }
  });
}

/**
 * Reconcile wallet balance:
 * Computes difference and creates an 'adjustment' transaction so derived balance equals actual
 */
export async function reconcileWallet(
  walletId: string,
  actualBalance: number,
  currentDerivedBalance: number,
  note = 'Balance reconcile adjustment'
): Promise<void> {
  const diff = actualBalance - currentDerivedBalance;
  if (Math.abs(diff) < 0.001) return;

  const now = new Date().toISOString();
  const today = getTodayISO();

  const adjTx: Transaction = {
    id: 'adj_' + Math.random().toString(36).substring(2, 11),
    type: 'adjustment',
    amount: diff,
    walletId,
    category: 'Adjustment',
    note: `${note} (${diff >= 0 ? '+' : ''}${diff})`,
    date: today,
    createdAt: now,
    updatedAt: now
  };

  await db.transactions.put(adjTx);
}
