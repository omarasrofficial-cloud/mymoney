// src/parser/parser.ts
import { parseRelativeDate, getTodayISO, formatDateToISO } from '../utils/date';
import type { TransactionType } from '../types/models';

export interface ParsedEntry {
  id: string; // Temporary ID for preview
  type: TransactionType;
  amount: number;
  charge?: number;
  walletId: string;
  toWalletId?: string;
  category: string;
  personName?: string;
  linkedEntityName?: string;
  note?: string;
  date: string;
  dueDate?: string;
  rawText: string;
  unknownWord?: string;
  isUnrecognized: boolean;
  isDuplicateWarning?: boolean;
}

export interface ParserContext {
  defaultWalletId: string;
  wallets: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  keywordDict: Record<string, string>; // word -> category
  learnedDict: Record<string, string>; // word -> category
  existingTodayEntries?: { amount: number; walletId: string; category: string }[];
  baseDate?: Date;
}

/**
 * Splits text into individual entry lines by newline or comma
 * but preserves commas within numbers like 5,000
 */
export function splitInputLines(input: string): string[] {
  if (!input) return [];

  // Replace commas between digits with a temporary placeholder
  const protectedText = input.replace(/(\d),(\d)/g, '$1__COMMA__$2');

  // Split by newline or comma
  const rawLines = protectedText.split(/[\n,]+/);

  return rawLines
    .map((line) => line.replace(/__COMMA__/g, ',').trim())
    .filter((line) => line.length > 0);
}

/**
 * Parse an amount string supporting:
 * 5000, 5,000, 5k, 5 thousand, 1.5k, 2 lakh, 1.5 lakh, 1 crore, "tk 500", "500 tk", "500 taka", "৳500"
 */
export function extractAmount(text: string): { amount: number; matchedText: string } | null {
  // Regex to detect amounts with various Bangladeshi suffixes and currency notations
  // Matches e.g. 1.5 lakh, 2 crore, 5k, 5 thousand, ৳500, 500 tk, 5,000
  const patterns: { regex: RegExp; multiplier: number; captureIdx: number }[] = [
    // 1.5 crore, 1 crore
    { regex: /(?:৳|tk|taka)?\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/i, multiplier: 10000000, captureIdx: 1 },
    // 1.5 lakh, 2 lakh, 2 lac
    { regex: /(?:৳|tk|taka)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lac|lacs)\b/i, multiplier: 100000, captureIdx: 1 },
    // 5 thousand
    { regex: /(?:৳|tk|taka)?\s*(\d+(?:\.\d+)?)\s*(?:thousand)\b/i, multiplier: 1000, captureIdx: 1 },
    // 5k, 1.5k
    { regex: /(?:৳|tk|taka)?\s*(\d+(?:\.\d+)?)\s*k\b/i, multiplier: 1000, captureIdx: 1 },
    // ৳ 500 or ৳500
    { regex: /৳\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i, multiplier: 1, captureIdx: 1 },
    // 500 tk, 500 taka, 500tk, 500/-
    { regex: /\b(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*(?:tk|taka|\/-)\b/i, multiplier: 1, captureIdx: 1 },
    // tk 500, taka 500
    { regex: /\b(?:tk|taka)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?|\d+(?:\.\d+)?)\b/i, multiplier: 1, captureIdx: 1 },
    // Standard number 5,000 or 5000 or 250 (must be isolated or surrounded by space/boundary)
    { regex: /\b(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|\d+(?:\.\d+)?)\b/, multiplier: 1, captureIdx: 1 }
  ];

  for (const { regex, multiplier, captureIdx } of patterns) {
    const match = text.match(regex);
    if (match) {
      const rawNum = match[captureIdx].replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        return {
          amount: Math.round(parsed * multiplier * 100) / 100,
          matchedText: match[0]
        };
      }
    }
  }

  return null;
}

/**
 * Extract wallet fee / charge:
 * e.g. "fee 37", "charge 5", "bkash fee 15", "fee: 20", "charge: 10"
 */
export function extractCharge(text: string): { charge: number; matchedText: string } | null {
  const chargeRegex = /\b(?:fee|charge|cost)\s*[:=]?\s*(?:৳|tk|taka)?\s*(\d+(?:\.\d+)?)\b/i;
  const match = text.match(chargeRegex);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) {
      return { charge: val, matchedText: match[0] };
    }
  }

  // Suffix format: "37 fee", "5 charge"
  const suffixRegex = /\b(\d+(?:\.\d+)?)\s*(?:tk|taka)?\s*(?:fee|charge)\b/i;
  const matchSuffix = text.match(suffixRegex);
  if (matchSuffix) {
    const val = parseFloat(matchSuffix[1]);
    if (!isNaN(val) && val > 0) {
      return { charge: val, matchedText: matchSuffix[0] };
    }
  }

  return null;
}

/**
 * Extract due date for loans:
 * e.g. "due 25 Nov", "due 25/11", "due tomorrow"
 */
export function extractDueDate(text: string, baseDate = new Date()): { dueDateStr: string; matchedText: string } | null {
  const match = text.match(/\bdue\s+([a-zA-Z0-9\/\-]+(?:\s+[a-zA-Z]+)?)/i);
  if (match) {
    const rawDue = match[1].trim();
    if (rawDue.toLowerCase() === 'tomorrow') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 1);
      return { dueDateStr: formatDateToISO(d), matchedText: match[0] };
    }
    const parsed = parseRelativeDate(rawDue, baseDate);
    if (parsed) {
      return { dueDateStr: parsed.dateStr, matchedText: match[0] };
    }
  }
  return null;
}

/**
 * Match a wallet by name / alias in the text
 */
export function findWalletInText(
  text: string,
  wallets: { id: string; name: string }[]
): { walletId: string; matchedText: string } | null {
  const lower = text.toLowerCase();

  // Known standard aliases
  const aliases: Record<string, string> = {
    'bkash': 'bkash',
    'b-kash': 'bkash',
    'b_kash': 'bkash',
    'bikash': 'bkash',
    'nagad': 'nagad',
    'bank': 'bank',
    'brac': 'bank',
    'city bank': 'bank',
    'ebl': 'bank',
    'dbbl': 'bank',
    'islami bank': 'bank',
    'cash': 'cash',
  };

  // Add custom wallet names
  wallets.forEach((w) => {
    aliases[w.name.toLowerCase()] = w.id;
  });

  // Check aliases sorted by length descending
  const sortedKeys = Object.keys(aliases).sort((a, b) => b.length - a.length);
  for (const alias of sortedKeys) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    const match = lower.match(regex);
    if (match) {
      return { walletId: aliases[alias], matchedText: match[0] };
    }
  }

  return null;
}

/**
 * Checks for wallet-to-wallet transfer:
 * "transfer 5000 bank to nagad", "bank to bkash 2000", "transfer 1000 cash to bkash"
 */
export function detectTransfer(
  text: string,
  wallets: { id: string; name: string }[]
): { fromWalletId: string; toWalletId: string; matchedText: string } | null {
  const lower = text.toLowerCase();

  const walletNames = ['bkash', 'b-kash', 'nagad', 'bank', 'cash', ...wallets.map((w) => w.name.toLowerCase())];
  const walletPattern = `(${walletNames.join('|')})`;

  // Pattern: "transfer ... [walletA] to [walletB]" or "[walletA] to [walletB]"
  const transferRegex = new RegExp(`(?:transfer\\s+)?(?:from\\s+)?${walletPattern}\\s+to\\s+${walletPattern}`, 'i');
  const match = lower.match(transferRegex);
  if (match) {
    const fromW = findWalletInText(match[1], wallets);
    const toW = findWalletInText(match[2], wallets);
    if (fromW && toW) {
      return {
        fromWalletId: fromW.walletId,
        toWalletId: toW.walletId,
        matchedText: match[0]
      };
    }
  }

  return null;
}

/**
 * Pure rule-based parser for a single line
 */
export function parseLine(line: string, context: ParserContext): ParsedEntry {
  const rawText = line.trim();
  const baseDate = context.baseDate || new Date();
  const todayStr = getTodayISO();

  let remaining = rawText;

  // 1. Extract Charge / Fee first (so fee number is not mistaken for main amount)
  let charge: number | undefined = undefined;
  const chargeResult = extractCharge(remaining);
  if (chargeResult) {
    charge = chargeResult.charge;
    remaining = remaining.replace(chargeResult.matchedText, ' ');
  }

  // 2. Extract Due Date (for loans)
  let dueDate: string | undefined = undefined;
  const dueResult = extractDueDate(remaining, baseDate);
  if (dueResult) {
    dueDate = dueResult.dueDateStr;
    remaining = remaining.replace(dueResult.matchedText, ' ');
  }

  // 3. Extract Date
  let date = todayStr;
  const dateResult = parseRelativeDate(remaining, baseDate);
  if (dateResult && dateResult.matchedText) {
    date = dateResult.dateStr;
    remaining = remaining.replace(new RegExp(`\\b${dateResult.matchedText}\\b`, 'i'), ' ');
  }

  // 4. Check for Transfer
  let fromWalletId = context.defaultWalletId;
  let toWalletId: string | undefined = undefined;
  let isTransfer = false;

  const transferResult = detectTransfer(remaining, context.wallets);
  if (transferResult) {
    isTransfer = true;
    fromWalletId = transferResult.fromWalletId;
    toWalletId = transferResult.toWalletId;
    remaining = remaining.replace(transferResult.matchedText, ' ');
  }

  // 5. Extract main Amount
  const amountResult = extractAmount(remaining);
  if (!amountResult) {
    // Cannot parse amount: mark as unrecognized
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'expense',
      amount: 0,
      charge,
      walletId: context.defaultWalletId,
      category: 'Uncategorized',
      date,
      rawText,
      isUnrecognized: true
    };
  }

  const amount = amountResult.amount;
  remaining = remaining.replace(amountResult.matchedText, ' ');

  // 6. If not transfer, check for specific wallet in remaining text
  if (!isTransfer) {
    const walletResult = findWalletInText(remaining, context.wallets);
    if (walletResult) {
      fromWalletId = walletResult.walletId;
      remaining = remaining.replace(new RegExp(`\\b${walletResult.matchedText}\\b`, 'i'), ' ');
    }
  }

  // If transfer, we are done with type detection!
  if (isTransfer) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'transfer',
      amount,
      charge,
      walletId: fromWalletId,
      toWalletId,
      category: 'Transfer',
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 7. Clean remaining text for verbs and keywords
  const cleanRemaining = remaining.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

  // 8. Loans & Repayments Detection
  // loan_given: "gave Rahim 3000 loan", "lent Rahim 3000", "loan to Rahim 3000", "loan given to Selim"
  const lentMatch = rawText.match(/\blent\s+([A-Za-z]+)\b/i) ||
                    rawText.match(/\bloan\s+(?:given\s+)?to\s+([A-Za-z]+)\b/i) ||
                    rawText.match(/\bgave\s+([A-Za-z]+)\b.*?\bloan\b/i) ||
                    rawText.match(/\bgave\b.*?\bloan\s+to\s+([A-Za-z]+)\b/i);
  if (lentMatch) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'loan_given',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Loans',
      personName: lentMatch[1],
      dueDate,
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // loan_taken: "borrowed 10000 from Karim", "took loan 10000 from Karim", "loan from Karim 5000"
  const borrowMatch = rawText.match(/\bborrowed\b.*?\bfrom\s+([A-Za-z]+)\b/i) ||
                      rawText.match(/\btook\s+loan\b.*?\bfrom\s+([A-Za-z]+)\b/i) ||
                      rawText.match(/\bloan\s+taken\s+from\s+([A-Za-z]+)\b/i) ||
                      rawText.match(/\bloan\s+from\s+([A-Za-z]+)\b/i);
  if (borrowMatch) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'loan_taken',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Loans',
      personName: borrowMatch[1],
      dueDate,
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // repayment_received: "Rahim paid back 1000", "Rahim returned 1000", "Rahim repaid 1000", "received 1000 back from Rahim"
  const repayRecvMatch = rawText.match(/\b([A-Za-z]+)\s+(?:paid\s+back|returned|repaid)\b/i) ||
                         rawText.match(/\breceived\b.*?\bback\s+from\s+([A-Za-z]+)\b/i) ||
                         rawText.match(/\b([A-Za-z]+)\s+paid\b.*?\bloan\b/i);
  if (repayRecvMatch) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'repayment_received',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Repayments',
      personName: repayRecvMatch[1],
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // repayment_paid: "paid back Karim 2000", "returned 2000 to Karim", "repaid Karim 2000", "paid Karim 2000 loan"
  const repayPaidMatch = rawText.match(/\b(?:paid\s+back|returned|repaid)\b.*?\b(?:to\s+)?([A-Za-z]+)\b/i) ||
                         rawText.match(/\bpaid\s+([A-Za-z]+)\b.*?\bloan\b/i);
  if (repayPaidMatch && !repayRecvMatch) {
    // Avoid matching if person is actually a wallet name or verb
    const candidateName = repayPaidMatch[1];
    if (!findWalletInText(candidateName, context.wallets)) {
      return {
        id: Math.random().toString(36).substring(2, 9),
        type: 'repayment_paid',
        amount,
        charge,
        walletId: fromWalletId,
        category: 'Repayments',
        personName: candidateName,
        date,
        rawText,
        isUnrecognized: false
      };
    }
  }

  // 9. Savings / Goals: "saved 2000 bike fund", "save 2000 for emergency fund"
  if (/\b(?:saved?|savings|goal|fund)\b/i.test(cleanRemaining) && !/\bmutual\s+fund\b/i.test(cleanRemaining)) {
    // Extract goal name if any: e.g. "bike fund" -> "Bike Fund"
    const goalMatch = rawText.match(/\b(?:for|to)?\s*([a-zA-Z\s]+?\s*(?:fund|goal))\b/i) ||
                      rawText.match(/\bsaved?\s+\d+k?\s+([a-zA-Z\s]+)/i);
    const goalName = goalMatch ? goalMatch[1].trim() : 'Savings Goal';
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'savings_deposit',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Savings',
      linkedEntityName: goalName,
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 10. DPS: "dps 5000 bank", "dps installment 5000"
  if (/\bdps\b/i.test(cleanRemaining)) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'dps_installment',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'DPS',
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 11. FDR: "fdr 100000 bank", "opened fdr 100000"
  if (/\bfdr\b/i.test(cleanRemaining)) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'fdr_open',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'FDR',
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 12. Investments: "invested 20000 shares", "bought shares 20000", "sanchayapatra 50000 bank"
  if (/\b(?:invested?|investment|shares|stock|sanchayapatra|mutual\s+fund|gold)\b/i.test(cleanRemaining)) {
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'investment_buy',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Investments',
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 13. Income: "received 50000 salary", "got bonus 10000", "salary 60000", "freelance earned 5000"
  const incomeVerbs = /\b(?:salary|earned|income|bonus|freelance|dividend|profit)\b/i;
  const receivedIncome = /\b(?:received|got)\b/i;
  if (incomeVerbs.test(cleanRemaining) || (receivedIncome.test(cleanRemaining) && !repayRecvMatch)) {
    let cat = 'Salary';
    if (/\bbonus\b/i.test(cleanRemaining)) cat = 'Bonus';
    else if (/\b(?:freelance|freelancing)\b/i.test(cleanRemaining)) cat = 'Business';
    else if (/\bdividend\b/i.test(cleanRemaining)) cat = 'Income';
    else if (/\bincome\b/i.test(cleanRemaining)) cat = 'Income';

    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'income',
      amount,
      charge,
      walletId: fromWalletId,
      category: cat,
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // 14. Expense matching:
  // Words in cleaned text
  const words = cleanRemaining.split(/\s+/).filter(w => w.length > 1);

  // Check learned words first
  for (const w of words) {
    if (context.learnedDict && context.learnedDict[w]) {
      return {
        id: Math.random().toString(36).substring(2, 9),
        type: 'expense',
        amount,
        charge,
        walletId: fromWalletId,
        category: context.learnedDict[w],
        date,
        rawText,
        isUnrecognized: false
      };
    }
  }

  // Check built-in and user keyword dictionary
  // Check exact phrases first (e.g. 'cng auto', 'current bill', 'data pack')
  for (const [kw, cat] of Object.entries(context.keywordDict)) {
    const kwRegex = new RegExp(`\\b${kw}\\b`, 'i');
    if (kwRegex.test(cleanRemaining)) {
      return {
        id: Math.random().toString(36).substring(2, 9),
        type: 'expense',
        amount,
        charge,
        walletId: fromWalletId,
        category: cat,
        date,
        rawText,
        isUnrecognized: false
      };
    }
  }

  // Check expense verbs: "paid 500 for lunch", "spent 300 on books", "bought 400"
  // If there are words besides generic verbs ("paid", "spent", "bought", "for", "on")
  const stopWords = new Set(['paid', 'spent', 'bought', 'cost', 'for', 'on', 'at', 'in', 'cashout', 'send', 'money']);
  const meaningfulWords = words.filter(w => !stopWords.has(w));
  
  if (meaningfulWords.length > 0) {
    const unknownWord = meaningfulWords[0];
    return {
      id: Math.random().toString(36).substring(2, 9),
      type: 'expense',
      amount,
      charge,
      walletId: fromWalletId,
      category: 'Uncategorized',
      unknownWord,
      date,
      rawText,
      isUnrecognized: false
    };
  }

  // If only generic expense words like "paid 500", "spent 1000", "cashout 2000"
  let defaultExpenseCat = 'Other';
  if (charge && charge > 0) {
    defaultExpenseCat = 'Wallet Fees';
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    type: 'expense',
    amount,
    charge,
    walletId: fromWalletId,
    category: defaultExpenseCat,
    date,
    rawText,
    isUnrecognized: false
  };
}

/**
 * Parses multi-line input and checks for duplicates against today's existing entries
 */
export function parseEntries(input: string, context: ParserContext): ParsedEntry[] {
  const lines = splitInputLines(input);
  const results: ParsedEntry[] = [];

  for (const line of lines) {
    const parsed = parseLine(line, context);

    // Check duplicate warning: same amount + wallet + category today
    if (
      !parsed.isUnrecognized &&
      parsed.date === getTodayISO() &&
      context.existingTodayEntries
    ) {
      const isDuplicate = context.existingTodayEntries.some(
        (e) =>
          e.amount === parsed.amount &&
          e.walletId === parsed.walletId &&
          e.category.toLowerCase() === parsed.category.toLowerCase()
      );
      if (isDuplicate) {
        parsed.isDuplicateWarning = true;
      }
    }

    results.push(parsed);
  }

  return results;
}
