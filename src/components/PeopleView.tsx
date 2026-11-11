// src/components/PeopleView.tsx
import React, { useState } from 'react';
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  Clock,
  Plus,
  X,
  CheckCircle,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { formatBDT } from '../utils/currency';
import { formatDateLabel, getTodayISO } from '../utils/date';
import { db } from '../db/db';
import type { PersonLedgerSummary } from '../utils/calculations';
import type { Wallet, Transaction } from '../types/models';

interface PeopleViewProps {
  peopleLedger: Record<string, PersonLedgerSummary>;
  wallets: Wallet[];
  defaultWalletId: string;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  peopleLedger,
  wallets,
  defaultWalletId
}) => {
  const [selectedPerson, setSelectedPerson] = useState<PersonLedgerSummary | null>(null);
  const [actionModal, setActionModal] = useState<{
    personName: string;
    type: 'loan_given' | 'repayment_received' | 'loan_taken' | 'repayment_paid';
  } | null>(null);

  const [formAmount, setFormAmount] = useState<string>('');
  const [formWalletId, setFormWalletId] = useState<string>(defaultWalletId);
  const [formDate, setFormDate] = useState<string>(getTodayISO());
  const [formDueDate, setFormDueDate] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  const peopleList = Object.values(peopleLedger).sort((a, b) => {
    // Sort active balances first (highest net abs amount)
    const absA = Math.abs(a.net);
    const absB = Math.abs(b.net);
    if (absA !== absB) return absB - absA;
    return a.name.localeCompare(b.name);
  });

  const totalOwedToMe = peopleList.reduce((sum, p) => sum + p.owedToMe, 0);
  const totalIOwe = peopleList.reduce((sum, p) => sum + p.iOwe, 0);

  const handleOpenAction = (
    personName: string,
    type: 'loan_given' | 'repayment_received' | 'loan_taken' | 'repayment_paid'
  ) => {
    setActionModal({ personName, type });
    setFormAmount('');
    setFormWalletId(defaultWalletId);
    setFormDate(getTodayISO());
    setFormDueDate('');
    setFormNote('');
  };

  const handleSubmitAction = async () => {
    if (!actionModal) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      type: actionModal.type,
      amount,
      walletId: formWalletId,
      category: actionModal.type.startsWith('loan') ? 'Loans' : 'Repayments',
      personName: actionModal.personName,
      date: formDate,
      dueDate: formDueDate || undefined,
      note: formNote || `${actionModal.type} - ${actionModal.personName}`,
      createdAt: now,
      updatedAt: now
    };

    await db.transactions.put(newTx);
    setActionModal(null);

    // Update selected person view if open
    if (selectedPerson) {
      const updatedPerson = peopleLedger[selectedPerson.name];
      if (updatedPerson) setSelectedPerson(updatedPerson);
    }
  };

  return (
    <div className="space-y-4 pb-24 px-3 pt-2 max-w-md mx-auto">
      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            People Ledger Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
              Total Owed To Me
            </span>
            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {formatBDT(totalOwedToMe)}
            </span>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl">
            <span className="text-[10px] text-red-700 dark:text-red-300 font-semibold block">
              Total I Owe
            </span>
            <span className="text-base font-extrabold text-red-700 dark:text-red-300 mt-0.5 block">
              {formatBDT(totalIOwe)}
            </span>
          </div>
        </div>
      </div>

      {/* People List */}
      <div>
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 px-1">
          Contacts ({peopleList.length})
        </h3>

        {peopleList.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-slate-700">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No loans or debts recorded yet.
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Type "lent Rahim 3000" or "borrowed 5000 from Karim" on Home.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {peopleList.map((person) => {
              const owesMe = person.owedToMe > 0;
              const iOwe = person.iOwe > 0;
              const isSettled = person.net === 0;

              return (
                <div
                  key={person.name}
                  onClick={() => setSelectedPerson(person)}
                  className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {person.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {person.transactions.length} record{person.transactions.length === 1 ? '' : 's'} • Last: {person.lastActivityDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {isSettled ? (
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        Settled
                      </span>
                    ) : person.net > 0 ? (
                      <div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
                          +{formatBDT(person.net)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Owes you
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs font-extrabold text-red-500 dark:text-red-400 block">
                          -{formatBDT(Math.abs(person.net))}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          You owe
                        </span>
                      </div>
                    )}

                    {/* Due badge */}
                    {person.isOverdue && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-red-600 bg-red-100 dark:bg-red-950/70 dark:text-red-300 px-1.5 py-0.2 rounded">
                        Overdue ({person.earliestDueDate})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PERSON HISTORY LEDGER MODAL */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedPerson.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedPerson.name}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Net Balance: <strong className={selectedPerson.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                      {selectedPerson.net >= 0 ? `+${formatBDT(selectedPerson.net)} (Owes you)` : `-${formatBDT(Math.abs(selectedPerson.net))} (You owe)`}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <button
                onClick={() => handleOpenAction(selectedPerson.name, 'loan_given')}
                className="min-h-touch py-2 px-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Give Loan</span>
              </button>

              <button
                onClick={() =>
                  handleOpenAction(
                    selectedPerson.name,
                    selectedPerson.net >= 0 ? 'repayment_received' : 'repayment_paid'
                  )
                }
                className="min-h-touch py-2 px-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 active:scale-95"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Record Repay</span>
              </button>
            </div>

            {/* Ledger Transactions Timeline */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Transaction History
              </h4>

              {selectedPerson.transactions.map((tx) => {
                const isLoanGiven = tx.type === 'loan_given';
                const isRepayRecv = tx.type === 'repayment_received';
                const isLoanTaken = tx.type === 'loan_taken';
                const isRepayPaid = tx.type === 'repayment_paid';

                return (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isLoanGiven
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                            : isRepayRecv
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : isLoanTaken
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {isLoanGiven ? 'Loan Given' : isRepayRecv ? 'Repay Received' : isLoanTaken ? 'Loan Taken' : 'Repay Paid'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {tx.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1">
                        {tx.note || tx.rawText || 'No note'}
                      </p>
                      {tx.dueDate && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Due: {tx.dueDate}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {formatBDT(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* QUICK LOAN / REPAYMENT MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                {actionModal.type.replace('_', ' ')}: {actionModal.personName}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Amount (৳)</label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  autoFocus
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Wallet</label>
                <select
                  value={formWalletId}
                  onChange={(e) => setFormWalletId(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {actionModal.type.startsWith('loan') && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-0.5">Note</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Partial repayment"
                  className="w-full p-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="flex-1 min-h-touch py-2 rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAction}
                  className="flex-1 min-h-touch py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
