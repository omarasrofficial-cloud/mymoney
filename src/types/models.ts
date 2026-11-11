// src/types/models.ts

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'loan_given'
  | 'loan_taken'
  | 'repayment_received'
  | 'repayment_paid'
  | 'savings_deposit'
  | 'savings_withdraw'
  | 'dps_installment'
  | 'dps_maturity'
  | 'fdr_open'
  | 'fdr_maturity'
  | 'investment_buy'
  | 'investment_sell'
  | 'investment_income'
  | 'adjustment';

export interface Wallet {
  id: string;
  name: string;
  color: string;
  icon: string;
  isArchived?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  charge?: number; // Optional wallet fee
  walletId: string;
  toWalletId?: string; // For transfers
  category: string;
  personName?: string; // For loans and repayments
  linkedEntityId?: string; // ID of Goal, DPS, FDR, or Investment
  linkedEntityType?: 'goal' | 'dps' | 'fdr' | 'investment';
  parentId?: string; // ID of parent transaction if this is a linked charge
  note?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  rawText?: string; // Original typed/dictated text
  dueDate?: string; // Optional due date for loans
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate?: string;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface DPS {
  id: string;
  bank: string;
  monthlyInstallment: number;
  tenureMonths: number;
  interestRate: number; // Annual %
  startDate: string; // YYYY-MM-DD
  nextDueDate?: string;
  createdAt: string;
}

export interface FDR {
  id: string;
  bank: string;
  principalAmount: number;
  rate: number; // Annual %
  startDate: string;
  tenureMonths: number;
  maturityDate: string;
  isMatured?: boolean;
  createdAt: string;
}

export type InvestmentType = 'sanchayapatra' | 'shares' | 'mutual_fund' | 'gold' | 'business' | 'other';

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  investedAmount: number;
  currentValue: number;
  history: { date: string; value: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number; // 0 or unset means no budget
}

export interface AppSettings {
  id: string; // 'app_settings'
  defaultWalletId: string;
  theme: 'light' | 'dark' | 'system';
  pin?: string;
  isPinEnabled: boolean;
  lastBackupDate?: string;
  installedPwaDismissed?: boolean;
}

export interface KeywordMapping {
  word: string;
  category: string;
  count: number;
}
