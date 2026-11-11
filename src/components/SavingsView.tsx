// src/components/SavingsView.tsx
import React, { useState } from 'react';
import {
  Target,
  PiggyBank,
  Landmark,
  TrendingUp,
  Plus,
  X,
  Check,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { getTodayISO, formatDateToISO } from '../utils/date';
import { db } from '../db/db';
import type {
  SavingsGoal,
  DPS,
  FDR,
  Investment,
  Wallet,
  Transaction,
  InvestmentType
} from '../types/models';

interface SavingsViewProps {
  goals: SavingsGoal[];
  goalBalances: Record<string, number>;
  dpsList: DPS[];
  dpsStats: Record<string, { totalDeposited: number; installmentsPaid: number; estimatedMaturity: number }>;
  fdrList: FDR[];
  fdrStats: Record<string, { principal: number; estimatedMaturity: number; isMatured: boolean }>;
  investments: Investment[];
  wallets: Wallet[];
  defaultWalletId: string;
}

export const SavingsView: React.FC<SavingsViewProps> = ({
  goals,
  goalBalances,
  dpsList,
  dpsStats,
  fdrList,
  fdrStats,
  investments,
  wallets,
  defaultWalletId
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'dps' | 'fdr' | 'investments'>('goals');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDPSModalOpen, setIsDPSModalOpen] = useState(false);
  const [isFDRModalOpen, setIsFDRModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);

  // Goal Deposit / Withdraw Action
  const [goalAction, setGoalAction] = useState<{ goal: SavingsGoal; type: 'savings_deposit' | 'savings_withdraw' } | null>(null);
  const [goalActionAmount, setGoalActionAmount] = useState('');
  const [goalActionWallet, setGoalActionWallet] = useState(defaultWalletId);

  // DPS Installment Pay Action
  const [dpsPayTarget, setDpsPayTarget] = useState<DPS | null>(null);
  const [dpsPayWallet, setDpsPayWallet] = useState(defaultWalletId);

  // FDR Maturity Action (credit to wallet)
  const [fdrMatureTarget, setFdrMatureTarget] = useState<FDR | null>(null);
  const [fdrMatureWallet, setFdrMatureWallet] = useState(defaultWalletId);

  // Investment Value Update Action
  const [investUpdateTarget, setInvestUpdateTarget] = useState<Investment | null>(null);
  const [newInvestValue, setNewInvestValue] = useState('');

  // Form states
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  const [dpsBank, setDpsBank] = useState('');
  const [dpsInstallment, setDpsInstallment] = useState('');
  const [dpsTenure, setDpsTenure] = useState('36');
  const [dpsRate, setDpsRate] = useState('7.5');
  const [dpsStartDate, setDpsStartDate] = useState(getTodayISO());

  const [fdrBank, setFdrBank] = useState('');
  const [fdrPrincipal, setFdrPrincipal] = useState('');
  const [fdrRate, setFdrRate] = useState('8.5');
  const [fdrTenure, setFdrTenure] = useState('12');
  const [fdrStartDate, setFdrStartDate] = useState(getTodayISO());

  const [invType, setInvType] = useState<InvestmentType>('shares');
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrentValue, setInvCurrentValue] = useState('');

  const today = new Date();

  // Create Goal
  const handleCreateGoal = async () => {
    if (!goalName.trim() || !goalTarget) return;
    const newGoal: SavingsGoal = {
      id: 'goal_' + Math.random().toString(36).substring(2, 9),
      name: goalName.trim(),
      targetAmount: parseFloat(goalTarget) || 0,
      targetDate: goalTargetDate || undefined,
      createdAt: new Date().toISOString()
    };
    await db.goals.put(newGoal);
    setIsGoalModalOpen(false);
    setGoalName('');
    setGoalTarget('');
    setGoalTargetDate('');
  };

  // Submit Goal Deposit / Withdraw
  const handleSubmitGoalAction = async () => {
    if (!goalAction) return;
    const amt = parseFloat(goalActionAmount);
    if (!amt || amt <= 0) return;

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: goalAction.type,
      amount: amt,
      walletId: goalActionWallet,
      category: 'Savings',
      linkedEntityId: goalAction.goal.id,
      note: `${goalAction.type === 'savings_deposit' ? 'Saved to' : 'Withdrew from'} ${goalAction.goal.name}`,
      date: getTodayISO(),
      createdAt: now,
      updatedAt: now
    };
    await db.transactions.put(newTx);
    setGoalAction(null);
    setGoalActionAmount('');
  };

  // Create DPS
  const handleCreateDPS = async () => {
    if (!dpsBank.trim() || !dpsInstallment) return;
    const newDps: DPS = {
      id: 'dps_' + Math.random().toString(36).substring(2, 9),
      bank: dpsBank.trim(),
      monthlyInstallment: parseFloat(dpsInstallment) || 0,
      tenureMonths: parseInt(dpsTenure, 10) || 36,
      interestRate: parseFloat(dpsRate) || 7.5,
      startDate: dpsStartDate || getTodayISO(),
      createdAt: new Date().toISOString()
    };
    await db.dps.put(newDps);
    setIsDPSModalOpen(false);
    setDpsBank('');
    setDpsInstallment('');
  };

  // Pay DPS Installment
  const handlePayDPSInstallment = async () => {
    if (!dpsPayTarget) return;
    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: 'dps_installment',
      amount: dpsPayTarget.monthlyInstallment,
      walletId: dpsPayWallet,
      category: 'DPS',
      linkedEntityId: dpsPayTarget.id,
      note: `DPS installment for ${dpsPayTarget.bank}`,
      date: getTodayISO(),
      createdAt: now,
      updatedAt: now
    };
    await db.transactions.put(newTx);
    setDpsPayTarget(null);
  };

  // Create FDR
  const handleCreateFDR = async () => {
    if (!fdrBank.trim() || !fdrPrincipal) return;
    const principal = parseFloat(fdrPrincipal) || 0;
    const tenure = parseInt(fdrTenure, 10) || 12;
    const startDateObj = new Date(fdrStartDate || getTodayISO());
    const maturityDateObj = new Date(startDateObj);
    maturityDateObj.setMonth(maturityDateObj.getMonth() + tenure);

    const newFdr: FDR = {
      id: 'fdr_' + Math.random().toString(36).substring(2, 9),
      bank: fdrBank.trim(),
      principalAmount: principal,
      rate: parseFloat(fdrRate) || 8.5,
      startDate: fdrStartDate || getTodayISO(),
      tenureMonths: tenure,
      maturityDate: formatDateToISO(maturityDateObj),
      createdAt: new Date().toISOString()
    };

    // Also create initial fdr_open transaction deduction from default wallet
    const now = new Date().toISOString();
    const openTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: 'fdr_open',
      amount: principal,
      walletId: defaultWalletId,
      category: 'FDR',
      linkedEntityId: newFdr.id,
      note: `FDR opened at ${newFdr.bank}`,
      date: fdrStartDate || getTodayISO(),
      createdAt: now,
      updatedAt: now
    };

    await db.transaction('rw', [db.fdr, db.transactions], async () => {
      await db.fdr.put(newFdr);
      await db.transactions.put(openTx);
    });

    setIsFDRModalOpen(false);
    setFdrBank('');
    setFdrPrincipal('');
  };

  // Handle FDR Maturity Credit
  const handleCreditFDRMaturity = async () => {
    if (!fdrMatureTarget) return;
    const stat = fdrStats[fdrMatureTarget.id];
    const matureAmount = stat ? stat.estimatedMaturity : fdrMatureTarget.principalAmount;

    const now = new Date().toISOString();
    const matureTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: 'fdr_maturity',
      amount: matureAmount,
      walletId: fdrMatureWallet,
      category: 'FDR',
      linkedEntityId: fdrMatureTarget.id,
      note: `FDR matured from ${fdrMatureTarget.bank}`,
      date: getTodayISO(),
      createdAt: now,
      updatedAt: now
    };

    await db.transaction('rw', [db.fdr, db.transactions], async () => {
      fdrMatureTarget.isMatured = true;
      await db.fdr.put(fdrMatureTarget);
      await db.transactions.put(matureTx);
    });

    setFdrMatureTarget(null);
  };

  // Create Investment
  const handleCreateInvestment = async () => {
    if (!invName.trim() || !invAmount) return;
    const invested = parseFloat(invAmount) || 0;
    const current = invCurrentValue ? parseFloat(invCurrentValue) : invested;
    const now = new Date().toISOString();
    const todayStr = getTodayISO();

    const newInv: Investment = {
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      type: invType,
      name: invName.trim(),
      investedAmount: invested,
      currentValue: current,
      history: [{ date: todayStr, value: current }],
      createdAt: now,
      updatedAt: now
    };

    const buyTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: 'investment_buy',
      amount: invested,
      walletId: defaultWalletId,
      category: 'Investments',
      linkedEntityId: newInv.id,
      note: `Invested in ${newInv.name}`,
      date: todayStr,
      createdAt: now,
      updatedAt: now
    };

    await db.transaction('rw', [db.investments, db.transactions], async () => {
      await db.investments.put(newInv);
      await db.transactions.put(buyTx);
    });

    setIsInvestModalOpen(false);
    setInvName('');
    setInvAmount('');
    setInvCurrentValue('');
  };

  // Update Investment Valuation
  const handleUpdateInvestValuation = async () => {
    if (!investUpdateTarget || !newInvestValue) return;
    const val = parseFloat(newInvestValue);
    if (isNaN(val)) return;

    investUpdateTarget.currentValue = val;
    investUpdateTarget.updatedAt = new Date().toISOString();
    investUpdateTarget.history.push({
      date: getTodayISO(),
      value: val
    });

    await db.investments.put(investUpdateTarget);
    setInvestUpdateTarget(null);
    setNewInvestValue('');
  };

  return (
    <div className="space-y-4 pb-24 px-3 pt-2 max-w-md mx-auto">
      {/* Tab Switcher */}
      <div className="grid grid-cols-4 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('goals')}
          className={`min-h-touch py-2 rounded-xl transition-all ${
            activeTab === 'goals'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Goals ({goals.length})
        </button>

        <button
          onClick={() => setActiveTab('dps')}
          className={`min-h-touch py-2 rounded-xl transition-all ${
            activeTab === 'dps'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          DPS ({dpsList.length})
        </button>

        <button
          onClick={() => setActiveTab('fdr')}
          className={`min-h-touch py-2 rounded-xl transition-all ${
            activeTab === 'fdr'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          FDR ({fdrList.length})
        </button>

        <button
          onClick={() => setActiveTab('investments')}
          className={`min-h-touch py-2 rounded-xl transition-all ${
            activeTab === 'investments'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Invest ({investments.length})
        </button>
      </div>

      {/* 1. GOALS TAB */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Savings Goals
            </h3>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Goal</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-slate-700">
              <Target className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500">No savings goals yet.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">e.g. Bike Fund, Emergency Fund, Laptop</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {goals.map((g) => {
                const saved = goalBalances[g.id] || 0;
                const percent = Math.min(100, Math.round((saved / g.targetAmount) * 100));

                return (
                  <div
                    key={g.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          🎯
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                            {g.name}
                          </h4>
                          {g.targetDate && (
                            <span className="text-[10px] text-gray-400">
                              Target Date: {g.targetDate}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatBDT(saved)}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          of {formatBDT(g.targetAmount)} ({percent}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      />
                    </div>

                    {/* Quick Deposit & Withdraw Buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        onClick={() => setGoalAction({ goal: g, type: 'savings_withdraw' })}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 text-[11px] font-semibold"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => setGoalAction({ goal: g, type: 'savings_deposit' })}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-sm"
                      >
                        + Deposit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. DPS TAB */}
      {activeTab === 'dps' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Deposit Pension Scheme (DPS)
            </h3>
            <button
              onClick={() => setIsDPSModalOpen(true)}
              className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New DPS</span>
            </button>
          </div>

          {dpsList.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-slate-700">
              <PiggyBank className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500">No DPS accounts opened yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dpsList.map((d) => {
                const stat = dpsStats[d.id] || { totalDeposited: 0, installmentsPaid: 0, estimatedMaturity: 0 };
                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                          🏛️
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {d.bank}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            {formatBDT(d.monthlyInstallment)} / mo • {d.tenureMonths} mos @ {d.interestRate}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setDpsPayTarget(d)}
                        className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm active:scale-95 text-[11px]"
                      >
                        Pay Installment
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Paid So Far</span>
                        <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                          {formatBDT(stat.totalDeposited)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Installments</span>
                        <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                          {stat.installmentsPaid} / {d.tenureMonths}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Est. Maturity*</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {formatBDT(stat.estimatedMaturity)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 italic">
                      *Estimated maturity clearly calculated based on annual interest rate before taxes.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. FDR TAB */}
      {activeTab === 'fdr' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Fixed Deposit Receipt (FDR)
            </h3>
            <button
              onClick={() => setIsFDRModalOpen(true)}
              className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New FDR</span>
            </button>
          </div>

          {fdrList.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-slate-700">
              <Landmark className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500">No FDRs registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fdrList.map((f) => {
                const stat = fdrStats[f.id] || { principal: f.principalAmount, estimatedMaturity: f.principalAmount, isMatured: false };
                
                // Calculate days remaining
                const matDate = new Date(f.maturityDate);
                const diffTime = matDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isDueOrPast = diffDays <= 0;

                return (
                  <div
                    key={f.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                          📜
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {f.bank}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            Principal: {formatBDT(f.principalAmount)} @ {f.rate}%
                          </span>
                        </div>
                      </div>

                      {stat.isMatured ? (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 text-[10px] font-bold">
                          Matured
                        </span>
                      ) : (
                        <button
                          onClick={() => setFdrMatureTarget(f)}
                          className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold active:scale-95"
                        >
                          Credit to Wallet
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Maturity Date</span>
                        <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                          {f.maturityDate}
                        </span>
                        {!stat.isMatured && (
                          <span className={`text-[9px] font-semibold block mt-0.5 ${isDueOrPast ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isDueOrPast ? 'Matures now!' : `Matures in ${diffDays} days`}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 block">Est. Maturity Value</span>
                        <span className="font-extrabold text-teal-600 dark:text-teal-400 block mt-0.5">
                          {formatBDT(stat.estimatedMaturity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. INVESTMENTS TAB */}
      {activeTab === 'investments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Investments Portfolio
            </h3>
            <button
              onClick={() => setIsInvestModalOpen(true)}
              className="min-h-touch px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Invest</span>
            </button>
          </div>

          {investments.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-slate-700">
              <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500">No investments added yet.</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Shares, Sanchayapatra, Gold, Mutual Funds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map((inv) => {
                const profitLoss = (inv.currentValue || 0) - (inv.investedAmount || 0);
                const profitLossPct = inv.investedAmount > 0 ? (profitLoss / inv.investedAmount) * 100 : 0;
                const isProfitable = profitLoss >= 0;

                return (
                  <div
                    key={inv.id}
                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                          {inv.type}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white mt-1">
                          {inv.name}
                        </h4>
                      </div>

                      <button
                        onClick={() => {
                          setInvestUpdateTarget(inv);
                          setNewInvestValue(inv.currentValue.toString());
                        }}
                        className="px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-[11px] font-semibold active:scale-95"
                      >
                        Update Value
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Invested</span>
                        <span className="font-bold text-gray-900 dark:text-white block mt-0.5">
                          {formatBDT(inv.investedAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Current Value</span>
                        <span className="font-extrabold text-gray-900 dark:text-white block mt-0.5">
                          {formatBDT(inv.currentValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">P/L</span>
                        <span className={`font-extrabold block mt-0.5 ${isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {isProfitable ? '+' : ''}{formatBDT(profitLoss)} ({profitLossPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW GOAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Create Savings Goal
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Goal Name</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Bike Fund, Laptop, Emergency"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Target Amount (৳)</label>
                <input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Target Date (Optional)</label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setIsGoalModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GOAL DEPOSIT / WITHDRAW */}
      {goalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              {goalAction.type === 'savings_deposit' ? 'Deposit to' : 'Withdraw from'} {goalAction.goal.name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Amount (৳)</label>
                <input
                  type="number"
                  value={goalActionAmount}
                  onChange={(e) => setGoalActionAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  autoFocus
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold text-base"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Wallet</label>
                <select
                  value={goalActionWallet}
                  onChange={(e) => setGoalActionWallet(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setGoalAction(null)}
                  className="flex-1 py-2.5 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitGoalAction}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW DPS */}
      {isDPSModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Add DPS Account
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Bank / Institution Name</label>
                <input
                  type="text"
                  value={dpsBank}
                  onChange={(e) => setDpsBank(e.target.value)}
                  placeholder="e.g. City Bank, BRAC Bank"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Monthly Installment (৳)</label>
                  <input
                    type="number"
                    value={dpsInstallment}
                    onChange={(e) => setDpsInstallment(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Tenure (Months)</label>
                  <input
                    type="number"
                    value={dpsTenure}
                    onChange={(e) => setDpsTenure(e.target.value)}
                    placeholder="36"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dpsRate}
                    onChange={(e) => setDpsRate(e.target.value)}
                    placeholder="7.5"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={dpsStartDate}
                    onChange={(e) => setDpsStartDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setIsDPSModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleCreateDPS} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Save DPS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAY DPS INSTALLMENT */}
      {dpsPayTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Pay DPS Installment: {dpsPayTarget.bank}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Amount to deduct: <strong>{formatBDT(dpsPayTarget.monthlyInstallment)}</strong>
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Deduct from Wallet</label>
                <select
                  value={dpsPayWallet}
                  onChange={(e) => setDpsPayWallet(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setDpsPayTarget(null)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handlePayDPSInstallment} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW FDR */}
      {isFDRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Open Fixed Deposit (FDR)
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Bank Name</label>
                <input
                  type="text"
                  value={fdrBank}
                  onChange={(e) => setFdrBank(e.target.value)}
                  placeholder="e.g. BRAC Bank"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Principal Amount (৳)</label>
                  <input
                    type="number"
                    value={fdrPrincipal}
                    onChange={(e) => setFdrPrincipal(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Tenure (Months)</label>
                  <input
                    type="number"
                    value={fdrTenure}
                    onChange={(e) => setFdrTenure(e.target.value)}
                    placeholder="12"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fdrRate}
                    onChange={(e) => setFdrRate(e.target.value)}
                    placeholder="8.5"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Start Date</label>
                  <input
                    type="date"
                    value={fdrStartDate}
                    onChange={(e) => setFdrStartDate(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setIsFDRModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleCreateFDR} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Open FDR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FDR MATURITY CREDIT */}
      {fdrMatureTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Credit FDR to Wallet: {fdrMatureTarget.bank}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Maturity amount: <strong>{formatBDT(fdrStats[fdrMatureTarget.id]?.estimatedMaturity || fdrMatureTarget.principalAmount)}</strong>
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Credit to Wallet</label>
                <select
                  value={fdrMatureWallet}
                  onChange={(e) => setFdrMatureWallet(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setFdrMatureTarget(null)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleCreditFDRMaturity} className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold">
                  Credit & Close FDR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW INVESTMENT */}
      {isInvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Add Investment Asset
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Asset Type</label>
                <select
                  value={invType}
                  onChange={(e) => setInvType(e.target.value as InvestmentType)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl capitalize"
                >
                  <option value="shares">Stock / Shares</option>
                  <option value="sanchayapatra">Sanchayapatra</option>
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="gold">Gold</option>
                  <option value="business">Business / Startup</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Investment Name</label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="e.g. Beximco Pharma, 3M Sanchayapatra, 22K Gold"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Invested Amount (৳)</label>
                  <input
                    type="number"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-0.5">Current Value (৳)</label>
                  <input
                    type="number"
                    value={invCurrentValue}
                    onChange={(e) => setInvCurrentValue(e.target.value)}
                    placeholder="Leave blank if same"
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setIsInvestModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleCreateInvestment} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Save Investment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE INVEST VALUATION */}
      {investUpdateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
              Update Current Value: {investUpdateTarget.name}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Cost: {formatBDT(investUpdateTarget.investedAmount)}
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">New Valuation (৳)</label>
                <input
                  type="number"
                  value={newInvestValue}
                  onChange={(e) => setNewInvestValue(e.target.value)}
                  placeholder="e.g. 25000"
                  autoFocus
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border rounded-xl font-bold text-base"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button onClick={() => setInvestUpdateTarget(null)} className="flex-1 py-2.5 border rounded-xl font-semibold">
                  Cancel
                </button>
                <button onClick={handleUpdateInvestValuation} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold">
                  Save Value
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
