// src/db/db.ts
import Dexie, { type Table } from 'dexie';
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

export class MyMoneyDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  wallets!: Table<Wallet, string>;
  categories!: Table<Category, string>;
  goals!: Table<SavingsGoal, string>;
  dps!: Table<DPS, string>;
  fdr!: Table<FDR, string>;
  investments!: Table<Investment, string>;
  budgets!: Table<Budget, string>;
  settings!: Table<AppSettings, string>;
  keywords!: Table<KeywordMapping, string>;
  learnedWords!: Table<KeywordMapping, string>;

  constructor() {
    super('MyMoneyDB');

    this.version(1).stores({
      transactions: 'id, type, date, walletId, toWalletId, category, personName, linkedEntityId, parentId, createdAt',
      wallets: 'id, name, isArchived',
      categories: 'id, name',
      goals: 'id, name',
      dps: 'id, bank',
      fdr: 'id, bank',
      investments: 'id, name, type',
      budgets: 'id, category',
      settings: 'id',
      keywords: 'word, category',
      learnedWords: 'word, category'
    });
  }
}

export const db = new MyMoneyDatabase();

export const DEFAULT_WALLETS: Wallet[] = [
  { id: 'bkash', name: 'bKash', color: '#E2136E', icon: 'smartphone', createdAt: new Date().toISOString() },
  { id: 'nagad', name: 'Nagad', color: '#F7941D', icon: 'smartphone', createdAt: new Date().toISOString() },
  { id: 'bank', name: 'Bank', color: '#2563EB', icon: 'building-2', createdAt: new Date().toISOString() },
  { id: 'cash', name: 'Cash', color: '#006A4E', icon: 'banknote', createdAt: new Date().toISOString() },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: 'utensils', color: '#F97316', isDefault: true },
  { id: 'groceries', name: 'Groceries', icon: 'shopping-cart', color: '#10B981', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#3B82F6', isDefault: true },
  { id: 'bills', name: 'Bills', icon: 'receipt', color: '#EF4444', isDefault: true },
  { id: 'mobile', name: 'Mobile', icon: 'smartphone', color: '#8B5CF6', isDefault: true },
  { id: 'health', name: 'Health', icon: 'heart-pulse', color: '#EC4899', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#6366F1', isDefault: true },
  { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#14B8A6', isDefault: true },
  { id: 'family', name: 'Family', icon: 'users', color: '#A855F7', isDefault: true },
  { id: 'rent', name: 'Rent', icon: 'home', color: '#64748B', isDefault: true },
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#059669', isDefault: true },
  { id: 'business', name: 'Business', icon: 'trending-up', color: '#0284C7', isDefault: true },
  { id: 'wallet_fees', name: 'Wallet Fees', icon: 'percent', color: '#94A3B8', isDefault: true },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#6B7280', isDefault: true },
];

export const DEFAULT_KEYWORD_DICT: Record<string, string> = {
  // Food
  'lunch': 'Food', 'dinner': 'Food', 'breakfast': 'Food', 'food': 'Food', 'restaurant': 'Food',
  'burger': 'Food', 'pizza': 'Food', 'snack': 'Food', 'snacks': 'Food', 'coffee': 'Food',
  'tea': 'Food', 'cha': 'Food', 'biryani': 'Food', 'kacchi': 'Food', 'sweets': 'Food',
  'bakery': 'Food', 'roti': 'Food', 'paratha': 'Food', 'morog polao': 'Food',
  
  // Groceries
  'grocery': 'Groceries', 'groceries': 'Groceries', 'bazar': 'Groceries', 'bazaar': 'Groceries',
  'vegetables': 'Groceries', 'fish': 'Groceries', 'meat': 'Groceries', 'chicken': 'Groceries',
  'rice': 'Groceries', 'oil': 'Groceries', 'supermarket': 'Groceries', 'shwapno': 'Groceries',
  'agora': 'Groceries', 'meenabazar': 'Groceries', 'kitchen': 'Groceries', 'dal': 'Groceries',
  'egg': 'Groceries', 'eggs': 'Groceries', 'milk': 'Groceries',
  
  // Transport
  'bus': 'Transport', 'uber': 'Transport', 'pathao': 'Transport', 'rickshaw': 'Transport',
  'cng': 'Transport', 'fuel': 'Transport', 'petrol': 'Transport', 'octane': 'Transport',
  'cng auto': 'Transport', 'fare': 'Transport', 'train': 'Transport', 'metro': 'Transport',
  'metrorail': 'Transport', 'taxi': 'Transport',
  
  // Bills
  'electricity': 'Bills', 'gas': 'Bills', 'water': 'Bills', 'internet': 'Bills', 'wifi': 'Bills',
  'bill': 'Bills', 'desco': 'Bills', 'dpdc': 'Bills', 'titas': 'Bills', 'utility': 'Bills',
  'wasa': 'Bills', 'current bill': 'Bills',
  
  // Mobile
  'recharge': 'Mobile', 'data pack': 'Mobile', 'flexiload': 'Mobile', 'minute pack': 'Mobile',
  'gp': 'Mobile', 'banglalink': 'Mobile', 'robi': 'Mobile', 'airtel': 'Mobile', 'teletalk': 'Mobile',
  'topup': 'Mobile',
  
  // Health
  'medicine': 'Health', 'doctor': 'Health', 'pharmacy': 'Health', 'prescription': 'Health',
  'test': 'Health', 'hospital': 'Health', 'dental': 'Health', 'pharma': 'Health',
  'clinic': 'Health', 'dentist': 'Health', 'bandage': 'Health',
  
  // Shopping
  'clothes': 'Shopping', 'shirt': 'Shopping', 'pant': 'Shopping', 'shoes': 'Shopping',
  'bag': 'Shopping', 'daraz': 'Shopping', 'electronics': 'Shopping', 'gadget': 'Shopping',
  'dress': 'Shopping',
  
  // Entertainment
  'movie': 'Entertainment', 'cinema': 'Entertainment', 'netflix': 'Entertainment',
  'spotify': 'Entertainment', 'game': 'Entertainment', 'outing': 'Entertainment',
  
  // Education
  'book': 'Education', 'tuition': 'Education', 'course': 'Education', 'fees': 'Education',
  'exam': 'Education', 'university': 'Education', 'school': 'Education', 'college': 'Education',
  
  // Family
  'parents': 'Family', 'kids': 'Family', 'family': 'Family', 'gift': 'Family',
  'donation': 'Family', 'zakat': 'Family',
  
  // Rent
  'rent': 'Rent', 'house rent': 'Rent', 'flat rent': 'Rent', 'office rent': 'Rent'
};

/**
 * Initializes database with default data if empty
 */
export async function initDatabase() {
  // Check settings
  const settings = await db.settings.get('app_settings');
  if (!settings) {
    await db.settings.put({
      id: 'app_settings',
      defaultWalletId: 'cash',
      theme: 'system',
      isPinEnabled: false,
      installedPwaDismissed: false
    });
  }

  // Check wallets
  const walletCount = await db.wallets.count();
  if (walletCount === 0) {
    await db.wallets.bulkPut(DEFAULT_WALLETS);
  }

  // Check categories
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }

  // Check keywords
  const keywordCount = await db.keywords.count();
  if (keywordCount === 0) {
    const list: KeywordMapping[] = Object.entries(DEFAULT_KEYWORD_DICT).map(([word, category]) => ({
      word,
      category,
      count: 1
    }));
    await db.keywords.bulkPut(list);
  }
}
