// src/utils/demoData.ts
import { db } from '../db/db';
import type {
  Transaction,
  SavingsGoal,
  DPS,
  FDR,
  Investment,
  Budget
} from '../types/models';
import { getTodayISO } from './date';

export async function loadDemoData(): Promise<void> {
  const today = getTodayISO();
  const now = new Date().toISOString();

  // 1. Goals
  const demoGoals: SavingsGoal[] = [
    {
      id: 'goal_bike',
      name: 'Bike Fund',
      targetAmount: 50000,
      targetDate: '2027-06-30',
      icon: 'bike',
      color: '#3B82F6',
      createdAt: now
    },
    {
      id: 'goal_emergency',
      name: 'Emergency Fund',
      targetAmount: 100000,
      targetDate: '2027-12-31',
      icon: 'shield-alert',
      color: '#10B981',
      createdAt: now
    }
  ];

  // 2. DPS
  const demoDPS: DPS[] = [
    {
      id: 'dps_city',
      bank: 'City Bank',
      monthlyInstallment: 5000,
      tenureMonths: 36,
      interestRate: 7.5,
      startDate: '2026-01-10',
      nextDueDate: '2026-11-20',
      createdAt: now
    }
  ];

  // 3. FDR
  const demoFDR: FDR[] = [
    {
      id: 'fdr_brac',
      bank: 'BRAC Bank',
      principalAmount: 100000,
      rate: 8.5,
      startDate: '2026-06-01',
      tenureMonths: 12,
      maturityDate: '2027-06-01',
      isMatured: false,
      createdAt: now
    }
  ];

  // 4. Investments
  const demoInvestments: Investment[] = [
    {
      id: 'inv_shares',
      type: 'shares',
      name: 'Square Pharma Shares',
      investedAmount: 35000,
      currentValue: 39500,
      history: [
        { date: '2026-09-01', value: 35000 },
        { date: '2026-11-01', value: 39500 }
      ],
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'inv_sanchayapatra',
      type: 'sanchayapatra',
      name: '3-Month Profit Sanchayapatra',
      investedAmount: 50000,
      currentValue: 50000,
      history: [
        { date: '2026-08-15', value: 50000 }
      ],
      createdAt: now,
      updatedAt: now
    }
  ];

  // 5. Budgets (quiet by default, set for 2 categories only)
  const demoBudgets: Budget[] = [
    {
      id: 'b_food',
      category: 'Food',
      monthlyLimit: 12000
    },
    {
      id: 'b_transport',
      category: 'Transport',
      monthlyLimit: 4000
    }
  ];

  // 6. Transactions
  // Calculate relative dates
  const dToday = new Date();
  const dYesterday = new Date(dToday);
  dYesterday.setDate(dYesterday.getDate() - 1);
  const yesterdayStr = dYesterday.toISOString().split('T')[0];

  const dThreeDaysAgo = new Date(dToday);
  dThreeDaysAgo.setDate(dThreeDaysAgo.getDate() - 3);
  const threeDaysAgoStr = dThreeDaysAgo.toISOString().split('T')[0];

  const dSevenDaysAgo = new Date(dToday);
  dSevenDaysAgo.setDate(dSevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = dSevenDaysAgo.toISOString().split('T')[0];

  const demoTransactions: Transaction[] = [
    // Initial opening income / balances
    {
      id: 'tx_salary',
      type: 'income',
      amount: 65000,
      walletId: 'bank',
      category: 'Salary',
      note: 'Monthly salary from Acme Ltd',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_cash_opening',
      type: 'adjustment',
      amount: 8000,
      walletId: 'cash',
      category: 'Adjustment',
      note: 'Initial cash in hand',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_bkash_opening',
      type: 'adjustment',
      amount: 5000,
      walletId: 'bkash',
      category: 'Adjustment',
      note: 'Initial bKash balance',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_nagad_opening',
      type: 'adjustment',
      amount: 3000,
      walletId: 'nagad',
      category: 'Adjustment',
      note: 'Initial Nagad balance',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },

    // Transfer with charge
    {
      id: 'tx_tr_1',
      type: 'transfer',
      amount: 5000,
      charge: 20,
      walletId: 'bank',
      toWalletId: 'bkash',
      category: 'Transfer',
      note: 'transfer 5000 bank to bkash charge 20',
      rawText: 'transfer 5000 bank to bkash charge 20',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'fee_tr_1',
      type: 'expense',
      amount: 20,
      walletId: 'bank',
      category: 'Wallet Fees',
      parentId: 'tx_tr_1',
      note: 'Fee for transfer 5000 bank to bkash',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },

    // Expenses
    {
      id: 'tx_exp_1',
      type: 'expense',
      amount: 1450,
      walletId: 'cash',
      category: 'Groceries',
      note: 'Shwapno supermarket groceries',
      rawText: 'bazar 1450',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_exp_2',
      type: 'expense',
      amount: 180,
      walletId: 'bkash',
      category: 'Transport',
      note: 'Pathao ride to Banani',
      rawText: 'pathao 180 bkash',
      date: yesterdayStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_exp_3',
      type: 'expense',
      amount: 350,
      walletId: 'cash',
      category: 'Food',
      note: 'Kacchi biryani lunch',
      rawText: 'lunch 350',
      date: today,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_exp_4',
      type: 'expense',
      amount: 2500,
      walletId: 'bank',
      category: 'Bills',
      note: 'Electricity bill DESCO',
      rawText: 'desco bill 2500 bank',
      date: yesterdayStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_exp_5',
      type: 'expense',
      amount: 2000,
      charge: 37,
      walletId: 'bkash',
      category: 'Wallet Fees',
      note: 'cashout 2000 bkash fee 37',
      rawText: 'cashout 2000 bkash fee 37',
      date: yesterdayStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'fee_exp_5',
      type: 'expense',
      amount: 37,
      walletId: 'bkash',
      category: 'Wallet Fees',
      parentId: 'tx_exp_5',
      note: 'Fee for cashout 2000 bkash',
      date: yesterdayStr,
      createdAt: now,
      updatedAt: now
    },

    // Loans and Repayments
    {
      id: 'tx_loan_1',
      type: 'loan_given',
      amount: 5000,
      walletId: 'cash',
      category: 'Loans',
      personName: 'Rahim',
      dueDate: '2026-11-25',
      note: 'gave Rahim 5000 loan due 25 Nov',
      rawText: 'gave Rahim 5000 loan due 25 Nov',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_repay_1',
      type: 'repayment_received',
      amount: 2000,
      walletId: 'cash',
      category: 'Repayments',
      personName: 'Rahim',
      note: 'Rahim paid back 2000',
      rawText: 'Rahim paid back 2000',
      date: yesterdayStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_loan_2',
      type: 'loan_taken',
      amount: 10000,
      walletId: 'bank',
      category: 'Loans',
      personName: 'Karim',
      dueDate: '2026-11-30',
      note: 'borrowed 10000 from Karim',
      rawText: 'borrowed 10000 from Karim',
      date: sevenDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'tx_repay_2',
      type: 'repayment_paid',
      amount: 4000,
      walletId: 'bank',
      category: 'Repayments',
      personName: 'Karim',
      note: 'paid back Karim 4000',
      rawText: 'paid back Karim 4000',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },

    // Savings Goal deposit
    {
      id: 'tx_goal_1',
      type: 'savings_deposit',
      amount: 5000,
      walletId: 'bank',
      category: 'Savings',
      linkedEntityId: 'goal_bike',
      note: 'saved 5000 bike fund',
      rawText: 'saved 5000 bike fund',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },

    // DPS Installment
    {
      id: 'tx_dps_1',
      type: 'dps_installment',
      amount: 5000,
      walletId: 'bank',
      category: 'DPS',
      linkedEntityId: 'dps_city',
      note: 'dps 5000 bank',
      rawText: 'dps 5000 bank',
      date: threeDaysAgoStr,
      createdAt: now,
      updatedAt: now
    },

    // FDR Open
    {
      id: 'tx_fdr_1',
      type: 'fdr_open',
      amount: 100000,
      walletId: 'bank',
      category: 'FDR',
      linkedEntityId: 'fdr_brac',
      note: 'fdr 100000 bank',
      rawText: 'fdr 100000 bank',
      date: '2026-06-01',
      createdAt: now,
      updatedAt: now
    },

    // Investment Buy
    {
      id: 'tx_inv_1',
      type: 'investment_buy',
      amount: 35000,
      walletId: 'bank',
      category: 'Investments',
      linkedEntityId: 'inv_shares',
      note: 'invested 35000 shares',
      rawText: 'invested 35000 shares',
      date: '2026-09-01',
      createdAt: now,
      updatedAt: now
    }
  ];

  await db.transaction('rw', [
    db.goals,
    db.dps,
    db.fdr,
    db.investments,
    db.budgets,
    db.transactions
  ], async () => {
    await db.goals.clear();
    await db.goals.bulkPut(demoGoals);

    await db.dps.clear();
    await db.dps.bulkPut(demoDPS);

    await db.fdr.clear();
    await db.fdr.bulkPut(demoFDR);

    await db.investments.clear();
    await db.investments.bulkPut(demoInvestments);

    await db.budgets.clear();
    await db.budgets.bulkPut(demoBudgets);

    await db.transactions.clear();
    await db.transactions.bulkPut(demoTransactions);
  });
}
