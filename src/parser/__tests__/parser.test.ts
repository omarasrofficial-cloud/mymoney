// src/parser/__tests__/parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseLine, parseEntries, extractAmount, splitInputLines, type ParserContext } from '../parser';
import { DEFAULT_KEYWORD_DICT } from '../../db/db';

const mockContext: ParserContext = {
  defaultWalletId: 'cash',
  wallets: [
    { id: 'bkash', name: 'bKash' },
    { id: 'nagad', name: 'Nagad' },
    { id: 'bank', name: 'Bank' },
    { id: 'cash', name: 'Cash' },
  ],
  categories: [
    { id: 'food', name: 'Food' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'transport', name: 'Transport' },
    { id: 'bills', name: 'Bills' },
    { id: 'mobile', name: 'Mobile' },
    { id: 'health', name: 'Health' },
    { id: 'loans', name: 'Loans' },
    { id: 'repayments', name: 'Repayments' },
    { id: 'savings', name: 'Savings' },
    { id: 'dps', name: 'DPS' },
    { id: 'fdr', name: 'FDR' },
    { id: 'investments', name: 'Investments' },
    { id: 'salary', name: 'Salary' },
  ],
  keywordDict: DEFAULT_KEYWORD_DICT,
  learnedDict: {
    'shawarma': 'Food',
    'shampoo': 'Groceries'
  },
  baseDate: new Date('2026-11-11T12:00:00Z'),
  existingTodayEntries: [
    { amount: 250, walletId: 'cash', category: 'Food' }
  ]
};

describe('Parser Unit Tests - 35+ English Test Cases', () => {

  describe('Amount parsing rules', () => {
    it('1. parses 5000 standard integer', () => {
      const res = parseLine('lunch 5000', mockContext);
      expect(res.amount).toBe(5000);
      expect(res.category).toBe('Food');
    });

    it('2. parses comma-formatted 5,000', () => {
      const res = parseLine('dinner 5,000', mockContext);
      expect(res.amount).toBe(5000);
    });

    it('3. parses 5k notation', () => {
      const res = parseLine('groceries 5k', mockContext);
      expect(res.amount).toBe(5000);
      expect(res.category).toBe('Groceries');
    });

    it('4. parses 1.5k decimal notation', () => {
      const res = parseLine('medicine 1.5k', mockContext);
      expect(res.amount).toBe(1500);
      expect(res.category).toBe('Health');
    });

    it('5. parses "5 thousand" notation', () => {
      const res = parseLine('rent 5 thousand', mockContext);
      expect(res.amount).toBe(5000);
      expect(res.category).toBe('Rent');
    });

    it('6. parses "2 lakh" Bangladeshi notation', () => {
      const res = parseLine('fdr 2 lakh bank', mockContext);
      expect(res.amount).toBe(200000);
      expect(res.type).toBe('fdr_open');
      expect(res.walletId).toBe('bank');
    });

    it('7. parses "1.5 lakh" Bangladeshi notation', () => {
      const res = parseLine('savings 1.5 lakh', mockContext);
      expect(res.amount).toBe(150000);
      expect(res.type).toBe('savings_deposit');
    });

    it('8. parses "1 crore" Bangladeshi notation', () => {
      const res = parseLine('invested 1 crore shares', mockContext);
      expect(res.amount).toBe(10000000);
      expect(res.type).toBe('investment_buy');
    });

    it('9. parses "tk 500" prefix', () => {
      const res = parseLine('tk 500 lunch', mockContext);
      expect(res.amount).toBe(500);
      expect(res.category).toBe('Food');
    });

    it('10. parses "500 tk" suffix', () => {
      const res = parseLine('breakfast 500 tk', mockContext);
      expect(res.amount).toBe(500);
      expect(res.category).toBe('Food');
    });

    it('11. parses "500 taka" suffix', () => {
      const res = parseLine('rickshaw 500 taka', mockContext);
      expect(res.amount).toBe(500);
      expect(res.category).toBe('Transport');
    });

    it('12. parses "৳500" symbol prefix', () => {
      const res = parseLine('৳500 recharge', mockContext);
      expect(res.amount).toBe(500);
      expect(res.category).toBe('Mobile');
    });
  });

  describe('Wallets & Default Wallet', () => {
    it('13. detects bkash wallet', () => {
      const res = parseLine('lunch 300 bkash', mockContext);
      expect(res.walletId).toBe('bkash');
    });

    it('14. detects b-kash hyphenated alias', () => {
      const res = parseLine('b-kash recharge 100', mockContext);
      expect(res.walletId).toBe('bkash');
    });

    it('15. detects nagad wallet', () => {
      const res = parseLine('nagad grocery 1200', mockContext);
      expect(res.walletId).toBe('nagad');
    });

    it('16. detects bank wallet', () => {
      const res = parseLine('electricity bill 2500 bank', mockContext);
      expect(res.walletId).toBe('bank');
      expect(res.category).toBe('Bills');
    });

    it('17. falls back to default wallet (cash) when none specified', () => {
      const res = parseLine('lunch 250', mockContext);
      expect(res.walletId).toBe('cash');
    });
  });

  describe('Charges and Wallet Fees', () => {
    it('18. parses "cashout 2000 bkash fee 37"', () => {
      const res = parseLine('cashout 2000 bkash fee 37', mockContext);
      expect(res.amount).toBe(2000);
      expect(res.charge).toBe(37);
      expect(res.walletId).toBe('bkash');
    });

    it('19. parses "send money 1000 nagad charge 5"', () => {
      const res = parseLine('send money 1000 nagad charge 5', mockContext);
      expect(res.amount).toBe(1000);
      expect(res.charge).toBe(5);
      expect(res.walletId).toBe('nagad');
    });

    it('20. parses "transfer 5000 bank to bkash charge 20"', () => {
      const res = parseLine('transfer 5000 bank to bkash charge 20', mockContext);
      expect(res.type).toBe('transfer');
      expect(res.amount).toBe(5000);
      expect(res.walletId).toBe('bank');
      expect(res.toWalletId).toBe('bkash');
      expect(res.charge).toBe(20);
    });
  });

  describe('Transfers', () => {
    it('21. parses "transfer 5000 bank to nagad"', () => {
      const res = parseLine('transfer 5000 bank to nagad', mockContext);
      expect(res.type).toBe('transfer');
      expect(res.amount).toBe(5000);
      expect(res.walletId).toBe('bank');
      expect(res.toWalletId).toBe('nagad');
    });

    it('22. parses shorthand "bank to bkash 2000"', () => {
      const res = parseLine('bank to bkash 2000', mockContext);
      expect(res.type).toBe('transfer');
      expect(res.amount).toBe(2000);
      expect(res.walletId).toBe('bank');
      expect(res.toWalletId).toBe('bkash');
    });
  });

  describe('Loans & Repayments', () => {
    it('23. parses "gave Rahim 3000 loan"', () => {
      const res = parseLine('gave Rahim 3000 loan', mockContext);
      expect(res.type).toBe('loan_given');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(3000);
    });

    it('24. parses "lent Rahim 3000"', () => {
      const res = parseLine('lent Rahim 3000', mockContext);
      expect(res.type).toBe('loan_given');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(3000);
    });

    it('25. parses "loan to Rahim 3000"', () => {
      const res = parseLine('loan to Rahim 3000', mockContext);
      expect(res.type).toBe('loan_given');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(3000);
    });

    it('26. parses "borrowed 10000 from Karim"', () => {
      const res = parseLine('borrowed 10000 from Karim', mockContext);
      expect(res.type).toBe('loan_taken');
      expect(res.personName).toBe('Karim');
      expect(res.amount).toBe(10000);
    });

    it('27. parses "took loan 10000 from Karim"', () => {
      const res = parseLine('took loan 10000 from Karim', mockContext);
      expect(res.type).toBe('loan_taken');
      expect(res.personName).toBe('Karim');
      expect(res.amount).toBe(10000);
    });

    it('28. parses "Rahim paid back 1000"', () => {
      const res = parseLine('Rahim paid back 1000', mockContext);
      expect(res.type).toBe('repayment_received');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(1000);
    });

    it('29. parses "Rahim returned 1000"', () => {
      const res = parseLine('Rahim returned 1000', mockContext);
      expect(res.type).toBe('repayment_received');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(1000);
    });

    it('30. parses "paid back Karim 2000"', () => {
      const res = parseLine('paid back Karim 2000', mockContext);
      expect(res.type).toBe('repayment_paid');
      expect(res.personName).toBe('Karim');
      expect(res.amount).toBe(2000);
    });

    it('31. parses "returned 2000 to Karim"', () => {
      const res = parseLine('returned 2000 to Karim', mockContext);
      expect(res.type).toBe('repayment_paid');
      expect(res.personName).toBe('Karim');
      expect(res.amount).toBe(2000);
    });

    it('32. parses loan with due date "gave Rahim 5000 loan due 25 Nov"', () => {
      const res = parseLine('gave Rahim 5000 loan due 25 Nov', mockContext);
      expect(res.type).toBe('loan_given');
      expect(res.personName).toBe('Rahim');
      expect(res.amount).toBe(5000);
      expect(res.dueDate).toBe('2026-11-25');
    });
  });

  describe('Savings, DPS, FDR, Investments', () => {
    it('33. parses "saved 2000 bike fund"', () => {
      const res = parseLine('saved 2000 bike fund', mockContext);
      expect(res.type).toBe('savings_deposit');
      expect(res.amount).toBe(2000);
      expect(res.category).toBe('Savings');
    });

    it('34. parses "dps 5000 bank"', () => {
      const res = parseLine('dps 5000 bank', mockContext);
      expect(res.type).toBe('dps_installment');
      expect(res.amount).toBe(5000);
      expect(res.walletId).toBe('bank');
    });

    it('35. parses "fdr 100000 bank"', () => {
      const res = parseLine('fdr 100000 bank', mockContext);
      expect(res.type).toBe('fdr_open');
      expect(res.amount).toBe(100000);
      expect(res.walletId).toBe('bank');
    });

    it('36. parses "invested 20000 shares"', () => {
      const res = parseLine('invested 20000 shares', mockContext);
      expect(res.type).toBe('investment_buy');
      expect(res.amount).toBe(20000);
      expect(res.category).toBe('Investments');
    });
  });

  describe('Dates, Income, Learned Words & Duplicate Warning', () => {
    it('37. parses yesterday date relative', () => {
      const res = parseLine('yesterday grocery 850', mockContext);
      expect(res.amount).toBe(850);
      expect(res.category).toBe('Groceries');
      expect(res.date).toBe('2026-11-10');
    });

    it('38. parses income "received salary 50000 bank"', () => {
      const res = parseLine('received salary 50000 bank', mockContext);
      expect(res.type).toBe('income');
      expect(res.amount).toBe(50000);
      expect(res.walletId).toBe('bank');
      expect(res.category).toBe('Salary');
    });

    it('39. uses self-learned dictionary mapping', () => {
      const res = parseLine('shawarma 180', mockContext);
      expect(res.amount).toBe(180);
      expect(res.category).toBe('Food');
    });

    it('40. flags duplicate warning for identical entry today', () => {
      const results = parseEntries('lunch 250', mockContext);
      expect(results[0].isDuplicateWarning).toBe(true);
    });

    it('41. flags unrecognized line if amount missing', () => {
      const res = parseLine('just random text with no number', mockContext);
      expect(res.isUnrecognized).toBe(true);
    });
  });
});
