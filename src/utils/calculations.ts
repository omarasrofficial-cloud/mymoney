// src/utils/calculations.ts
import type {
  Transaction,
  Wallet,
  DPS,
  FDR,
  Investment,
  SavingsGoal
} from '../types/models';

export interface WalletBalanceSummary {
  walletId: string;
  name: string;
  color: string;
  icon: string;
  balance: number;
}

/**
 * Calculates derived balance for every wallet from the transaction ledger.
 */
export function calculateWalletBalances(
  transactions: Transaction[],
  wallets: Wallet[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  
  wallets.forEach((w) => {
    balances[w.id] = 0;
  });

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const charge = Number(tx.charge) || 0;

    switch (tx.type) {
      case 'expense':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'income':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'transfer':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        if (tx.toWalletId) balances[tx.toWalletId] = (balances[tx.toWalletId] || 0) + amt;
        break;

      case 'loan_given':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'loan_taken':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'repayment_received':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'repayment_paid':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'savings_deposit':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'savings_withdraw':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'dps_installment':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'dps_maturity':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'fdr_open':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'fdr_maturity':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'investment_buy':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) - amt;
        break;

      case 'investment_sell':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'investment_income':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;

      case 'adjustment':
        if (tx.walletId) balances[tx.walletId] = (balances[tx.walletId] || 0) + amt;
        break;
    }

    // Deduct charge fee from source wallet if present on this transaction
    if (charge > 0 && tx.walletId) {
      balances[tx.walletId] = (balances[tx.walletId] || 0) - charge;
    }
  });

  return balances;
}

export interface PersonLedgerSummary {
  name: string;
  owedToMe: number; // Rahim owes me
  iOwe: number;     // I owe Karim
  net: number;       // >0 means they owe me, <0 means I owe them
  lastActivityDate: string;
  transactions: Transaction[];
  earliestDueDate?: string;
  isOverdue?: boolean;
}

/**
 * Calculates loan balances for every person.
 * Full history, partial repayments, due badges.
 */
export function calculatePeopleLedger(
  transactions: Transaction[],
  todayStr: string
): Record<string, PersonLedgerSummary> {
  const people: Record<string, PersonLedgerSummary> = {};

  // Sort transactions by date ascending for chronological calculation
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach((tx) => {
    if (!tx.personName) return;
    const name = tx.personName.trim();
    if (!name) return;

    if (!people[name]) {
      people[name] = {
        name,
        owedToMe: 0,
        iOwe: 0,
        net: 0,
        lastActivityDate: tx.date,
        transactions: [],
      };
    }

    const amt = Number(tx.amount) || 0;
    people[name].transactions.push(tx);
    people[name].lastActivityDate = tx.date;

    if (tx.type === 'loan_given') {
      people[name].owedToMe += amt;
    } else if (tx.type === 'repayment_received') {
      people[name].owedToMe = Math.max(0, people[name].owedToMe - amt);
    } else if (tx.type === 'loan_taken') {
      people[name].iOwe += amt;
    } else if (tx.type === 'repayment_paid') {
      people[name].iOwe = Math.max(0, people[name].iOwe - amt);
    }

    // Check due dates
    if (tx.dueDate && (tx.type === 'loan_given' || tx.type === 'loan_taken')) {
      if (!people[name].earliestDueDate || tx.dueDate < people[name].earliestDueDate!) {
        people[name].earliestDueDate = tx.dueDate;
        if (tx.dueDate < todayStr && (people[name].owedToMe > 0 || people[name].iOwe > 0)) {
          people[name].isOverdue = true;
        }
      }
    }
  });

  // Calculate net for each person
  Object.values(people).forEach((p) => {
    p.net = p.owedToMe - p.iOwe;
    // Check overdue flag against today
    if (p.earliestDueDate && p.earliestDueDate < todayStr && (p.owedToMe > 0 || p.iOwe > 0)) {
      p.isOverdue = true;
    }
  });

  return people;
}

/**
 * Calculates current savings balance for goals
 */
export function calculateGoalBalances(
  transactions: Transaction[]
): Record<string, number> {
  const goalBalances: Record<string, number> = {};

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const entityId = tx.linkedEntityId;
    if (!entityId) return;

    if (tx.type === 'savings_deposit') {
      goalBalances[entityId] = (goalBalances[entityId] || 0) + amt;
    } else if (tx.type === 'savings_withdraw') {
      goalBalances[entityId] = (goalBalances[entityId] || 0) - amt;
    }
  });

  return goalBalances;
}

/**
 * Calculates DPS deposits & expected maturity amount
 */
export function calculateDPSStats(
  dpsList: DPS[],
  transactions: Transaction[]
): Record<string, { totalDeposited: number; installmentsPaid: number; estimatedMaturity: number }> {
  const result: Record<string, { totalDeposited: number; installmentsPaid: number; estimatedMaturity: number }> = {};

  dpsList.forEach((d) => {
    const dpsTx = transactions.filter(
      (tx) => tx.linkedEntityId === d.id && tx.type === 'dps_installment'
    );
    const totalDeposited = dpsTx.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const installmentsPaid = dpsTx.length;

    // Estimate maturity value:
    // Future value of a monthly annuity
    // FV = P * (((1 + r/12)^n - 1) / (r/12))
    const n = d.tenureMonths;
    const r = (d.interestRate || 7) / 100 / 12;
    const p = d.monthlyInstallment;
    let estimatedMaturity = p * n;
    if (r > 0) {
      estimatedMaturity = Math.round(p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    }

    result[d.id] = {
      totalDeposited,
      installmentsPaid,
      estimatedMaturity
    };
  });

  return result;
}

/**
 * Calculates FDR principal and estimated maturity
 */
export function calculateFDRStats(
  fdrList: FDR[],
  transactions: Transaction[]
): Record<string, { principal: number; estimatedMaturity: number; isMatured: boolean }> {
  const result: Record<string, { principal: number; estimatedMaturity: number; isMatured: boolean }> = {};

  fdrList.forEach((f) => {
    const hasMaturityTx = transactions.some(
      (tx) => tx.linkedEntityId === f.id && tx.type === 'fdr_maturity'
    );
    const principal = f.principalAmount;
    // Estimated maturity = P * (1 + (r * t / 12))
    const t = f.tenureMonths || 12;
    const r = (f.rate || 8) / 100;
    const estimatedMaturity = Math.round(principal * (1 + (r * t / 12)));

    result[f.id] = {
      principal,
      estimatedMaturity,
      isMatured: hasMaturityTx || !!f.isMatured
    };
  });

  return result;
}

/**
 * Calculates Net Worth:
 * Net Worth = Wallets + Money owed to me + Savings/DPS/FDR/Investment values - Money I owe
 */
export function calculateNetWorth(
  transactions: Transaction[],
  wallets: Wallet[],
  dpsList: DPS[],
  fdrList: FDR[],
  investments: Investment[],
  todayStr: string
): {
  netWorth: number;
  totalWallets: number;
  totalOwedToMe: number;
  totalIOwe: number;
  totalSavingsInGoals: number;
  totalDpsDeposited: number;
  totalFdrValue: number;
  totalInvestments: number;
} {
  const walletBalances = calculateWalletBalances(transactions, wallets);
  const totalWallets = Object.values(walletBalances).reduce((a, b) => a + b, 0);

  const people = calculatePeopleLedger(transactions, todayStr);
  let totalOwedToMe = 0;
  let totalIOwe = 0;
  Object.values(people).forEach((p) => {
    totalOwedToMe += p.owedToMe;
    totalIOwe += p.iOwe;
  });

  const goalBalances = calculateGoalBalances(transactions);
  const totalSavingsInGoals = Object.values(goalBalances).reduce((a, b) => a + Math.max(0, b), 0);

  const dpsStats = calculateDPSStats(dpsList, transactions);
  const totalDpsDeposited = Object.values(dpsStats).reduce((a, b) => a + b.totalDeposited, 0);

  const fdrStats = calculateFDRStats(fdrList, transactions);
  let totalFdrValue = 0;
  Object.entries(fdrStats).forEach(([id, stat]) => {
    // If not matured yet, FDR value is an asset
    if (!stat.isMatured) {
      totalFdrValue += stat.principal;
    }
  });

  const totalInvestments = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

  const netWorth = totalWallets + totalOwedToMe + totalSavingsInGoals + totalDpsDeposited + totalFdrValue + totalInvestments - totalIOwe;

  return {
    netWorth,
    totalWallets,
    totalOwedToMe,
    totalIOwe,
    totalSavingsInGoals,
    totalDpsDeposited,
    totalFdrValue,
    totalInvestments
  };
}

/**
 * Calculates spending reports (ONLY 'expense' transactions, strictly excluding transfers, loans, savings, etc.)
 * Includes linked charges as 'Wallet Fees' expenses.
 */
export function calculateSpendingTotals(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): {
  totalExpense: number;
  totalIncome: number;
  categoryExpenses: Record<string, number>;
  totalWalletFees: number;
  feesPerWallet: Record<string, number>;
} {
  let totalExpense = 0;
  let totalIncome = 0;
  const categoryExpenses: Record<string, number> = {};
  let totalWalletFees = 0;
  const feesPerWallet: Record<string, number> = {};

  transactions.forEach((tx) => {
    if (tx.date < startDate || tx.date > endDate) return;
    const amt = Number(tx.amount) || 0;
    const charge = Number(tx.charge) || 0;

    if (tx.type === 'expense') {
      totalExpense += amt;
      const cat = tx.category || 'Other';
      categoryExpenses[cat] = (categoryExpenses[cat] || 0) + amt;
    } else if (tx.type === 'income') {
      totalIncome += amt;
    }

    // Process charge fee as Wallet Fees expense
    if (charge > 0) {
      totalExpense += charge;
      categoryExpenses['Wallet Fees'] = (categoryExpenses['Wallet Fees'] || 0) + charge;
      totalWalletFees += charge;
      if (tx.walletId) {
        feesPerWallet[tx.walletId] = (feesPerWallet[tx.walletId] || 0) + charge;
      }
    }
  });

  return {
    totalExpense,
    totalIncome,
    categoryExpenses,
    totalWalletFees,
    feesPerWallet
  };
}
