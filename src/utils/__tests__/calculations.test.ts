// src/utils/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateWalletBalances,
  calculatePeopleLedger,
  calculateGoalBalances,
  calculateDPSStats,
  calculateFDRStats,
  calculateNetWorth,
  calculateSpendingTotals
} from '../calculations';
import { formatBDT } from '../currency';
import type { Transaction, Wallet, DPS, FDR, Investment } from '../../types/models';

const mockWallets: Wallet[] = [
  { id: 'bkash', name: 'bKash', color: '#E2136E', icon: 'smartphone', createdAt: '' },
  { id: 'nagad', name: 'Nagad', color: '#F7941D', icon: 'smartphone', createdAt: '' },
  { id: 'bank', name: 'Bank', color: '#2563EB', icon: 'building-2', createdAt: '' },
  { id: 'cash', name: 'Cash', color: '#006A4E', icon: 'banknote', createdAt: '' },
];

describe('Calculations & Derived Ledger Verification', () => {

  describe('Bangladeshi Currency Grouping formatBDT', () => {
    it('formats single and triple digits', () => {
      expect(formatBDT(0)).toBe('৳ 0');
      expect(formatBDT(250)).toBe('৳ 250');
      expect(formatBDT(999)).toBe('৳ 999');
    });

    it('formats thousands: 1,000 and 12,500', () => {
      expect(formatBDT(1000)).toBe('৳ 1,000');
      expect(formatBDT(12500)).toBe('৳ 12,500');
    });

    it('formats 1.25 lakh as ৳ 1,25,000', () => {
      expect(formatBDT(125000)).toBe('৳ 1,25,000');
    });

    it('formats 15 lakh as ৳ 15,00,000', () => {
      expect(formatBDT(1500000)).toBe('৳ 15,00,000');
    });

    it('formats 1 crore as ৳ 1,00,00,000', () => {
      expect(formatBDT(10000000)).toBe('৳ 1,00,00,000');
    });

    it('formats negative amounts properly', () => {
      expect(formatBDT(-500)).toBe('-৳ 500');
      expect(formatBDT(-125000)).toBe('-৳ 1,25,000');
    });
  });

  describe('Core Principle: Balances Derived Dynamically & Effect Reversal', () => {
    it('correctly tracks wallet balances, loan balances and net worth across transactions', () => {
      const today = '2026-11-11';
      const transactions: Transaction[] = [];

      // Initial state: all balances 0
      let balances = calculateWalletBalances(transactions, mockWallets);
      expect(balances['bank']).toBe(0);
      expect(balances['bkash']).toBe(0);
      expect(balances['cash']).toBe(0);

      // 1. Initial income: Salary ৳ 50,000 to Bank
      const txIncome: Transaction = {
        id: 'tx_income',
        type: 'income',
        amount: 50000,
        walletId: 'bank',
        category: 'Salary',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txIncome);

      balances = calculateWalletBalances(transactions, mockWallets);
      expect(balances['bank']).toBe(50000);

      // 2. Add an expense: lunch 250 from cash
      const txExpense: Transaction = {
        id: 'tx_exp',
        type: 'expense',
        amount: 250,
        walletId: 'cash',
        category: 'Food',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txExpense);

      balances = calculateWalletBalances(transactions, mockWallets);
      expect(balances['cash']).toBe(-250);

      // 3. Add transfer with charge: 5,000 Bank to bKash with charge 20
      const txTransfer: Transaction = {
        id: 'tx_tr',
        type: 'transfer',
        amount: 5000,
        charge: 20,
        walletId: 'bank',
        toWalletId: 'bkash',
        category: 'Transfer',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txTransfer);

      balances = calculateWalletBalances(transactions, mockWallets);
      // Bank was 50,000 - 5,000 - 20 (charge) = 44,980
      expect(balances['bank']).toBe(44980);
      // bKash received 5,000
      expect(balances['bkash']).toBe(5000);

      // 4. Add loan given: Gave Rahim 3,000 loan from bKash
      const txLoanGiven: Transaction = {
        id: 'tx_loan_rahim',
        type: 'loan_given',
        amount: 3000,
        walletId: 'bkash',
        category: 'Loans',
        personName: 'Rahim',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txLoanGiven);

      balances = calculateWalletBalances(transactions, mockWallets);
      // bKash: 5,000 - 3,000 = 2,000
      expect(balances['bkash']).toBe(2000);

      let people = calculatePeopleLedger(transactions, today);
      expect(people['Rahim'].owedToMe).toBe(3000);
      expect(people['Rahim'].net).toBe(3000);

      // 5. Add repayment: Rahim paid back 1,000 to bKash
      const txRepay: Transaction = {
        id: 'tx_repay_rahim',
        type: 'repayment_received',
        amount: 1000,
        walletId: 'bkash',
        category: 'Repayments',
        personName: 'Rahim',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txRepay);

      balances = calculateWalletBalances(transactions, mockWallets);
      // bKash: 2,000 + 1,000 = 3,000
      expect(balances['bkash']).toBe(3000);

      people = calculatePeopleLedger(transactions, today);
      // Rahim now owes 3,000 - 1,000 = 2,000
      expect(people['Rahim'].owedToMe).toBe(2000);
      expect(people['Rahim'].net).toBe(2000);

      // 6. Add DPS installment: DPS 5,000 from Bank
      const mockDPS: DPS = {
        id: 'dps_1',
        bank: 'City Bank',
        monthlyInstallment: 5000,
        tenureMonths: 36,
        interestRate: 7.5,
        startDate: today,
        createdAt: ''
      };
      const txDPS: Transaction = {
        id: 'tx_dps',
        type: 'dps_installment',
        amount: 5000,
        walletId: 'bank',
        category: 'DPS',
        linkedEntityId: 'dps_1',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txDPS);

      balances = calculateWalletBalances(transactions, mockWallets);
      // Bank was 44,980 - 5,000 = 39,980
      expect(balances['bank']).toBe(39980);

      const dpsStats = calculateDPSStats([mockDPS], transactions);
      expect(dpsStats['dps_1'].totalDeposited).toBe(5000);
      expect(dpsStats['dps_1'].installmentsPaid).toBe(1);

      // 7. Add Goal deposit: Saved 2,000 bike fund from bKash
      const txGoal: Transaction = {
        id: 'tx_goal',
        type: 'savings_deposit',
        amount: 2000,
        walletId: 'bkash',
        category: 'Savings',
        linkedEntityId: 'goal_bike',
        date: today,
        createdAt: '',
        updatedAt: ''
      };
      transactions.push(txGoal);

      balances = calculateWalletBalances(transactions, mockWallets);
      // bKash was 3,000 - 2,000 = 1,000
      expect(balances['bkash']).toBe(1000);

      const goalBalances = calculateGoalBalances(transactions);
      expect(goalBalances['goal_bike']).toBe(2000);

      // Verify Net Worth calculation:
      // Wallets: Bank (39,980) + bKash (1,000) + Cash (-250) = 40,730
      // Owed to me: Rahim (2,000)
      // Savings in Goals: Bike fund (2,000)
      // DPS deposited: 5,000
      // FDR: 0
      // Investments: 0
      // Money I owe: 0
      // Total Net Worth = 40,730 + 2,000 + 2,000 + 5,000 = 49,730 (Initial 50,000 income - 250 lunch - 20 transfer fee)
      const netWorth = calculateNetWorth(transactions, mockWallets, [mockDPS], [], [], today);
      expect(netWorth.totalWallets).toBe(40730);
      expect(netWorth.totalOwedToMe).toBe(2000);
      expect(netWorth.totalSavingsInGoals).toBe(2000);
      expect(netWorth.totalDpsDeposited).toBe(5000);
      expect(netWorth.netWorth).toBe(49730);

      // Verify Spending Reports:
      // Transfers, loans, repayments, DPS, and savings must NEVER appear as expenses!
      // Only txExpense (250) and transfer fee (20) appear in spending!
      const spending = calculateSpendingTotals(transactions, today, today);
      expect(spending.totalExpense).toBe(270);
      expect(spending.totalWalletFees).toBe(20);

      // 8. TEST EFFECT REVERSAL UPON DELETION:
      // Delete the DPS transaction
      const idxDps = transactions.findIndex(t => t.id === 'tx_dps');
      transactions.splice(idxDps, 1);

      balances = calculateWalletBalances(transactions, mockWallets);
      // Bank balance reverses back by +5,000 to 44,980
      expect(balances['bank']).toBe(44980);

      // Delete the loan given to Rahim
      const idxLoan = transactions.findIndex(t => t.id === 'tx_loan_rahim');
      transactions.splice(idxLoan, 1);

      balances = calculateWalletBalances(transactions, mockWallets);
      // bKash balance reverses back by +3,000
      expect(balances['bkash']).toBe(4000);
    });
  });
});
