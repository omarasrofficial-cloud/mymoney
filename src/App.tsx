// src/App.tsx
import React, { useState, useEffect } from 'react';
import { initDatabase, db } from './db/db';
import { useFinanceData } from './hooks/useFinanceData';
import { Navbar } from './components/Navbar';
import { BottomNav, type TabKey } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { TransactionsView } from './components/TransactionsView';
import { PeopleView } from './components/PeopleView';
import { SavingsView } from './components/SavingsView';
import { MoreView } from './components/MoreView';
import { PinLockScreen } from './components/PinLockScreen';

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [moreSubTab, setMoreSubTab] = useState<'budgets' | 'reports' | 'settings'>('budgets');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize DB and Service Worker
  useEffect(() => {
    initDatabase().then(() => {
      setIsDbReady(true);
      // Check PIN
      db.settings.get('app_settings').then((settings) => {
        if (settings && settings.isPinEnabled && settings.pin) {
          setIsLocked(true);
        }
        if (settings && settings.theme) {
          if (settings.theme === 'dark') setDarkMode(true);
          else if (settings.theme === 'light') setDarkMode(false);
        }
      });
    });

    // Request persistent storage on startup
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    // Register PWA Service Worker
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('SW registered:', reg.scope);
        }).catch((err) => {
          console.log('SW registration failed:', err);
        });
      });
    }
  }, []);

  // Sync dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    const settings = await db.settings.get('app_settings');
    if (settings) {
      settings.theme = next ? 'dark' : 'light';
      await db.settings.put(settings);
    }
  };

  const financeData = useFinanceData();

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-2xl animate-pulse">
            ৳
          </div>
          <p className="text-sm font-semibold tracking-wide">Starting MyMoney...</p>
        </div>
      </div>
    );
  }

  // If PIN lock active
  if (isLocked && financeData.settings?.pin) {
    return (
      <PinLockScreen
        correctPin={financeData.settings.pin}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-gray-100 transition-colors">
      {/* Top iOS Navbar */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isPinEnabled={!!financeData.settings?.isPinEnabled}
        onLockApp={() => setIsLocked(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {activeTab === 'home' && (
          <HomeView
            data={financeData}
            onNavigateToPeople={() => setActiveTab('people')}
            onNavigateToHistory={() => setActiveTab('transactions')}
            onNavigateToAssets={() => setActiveTab('savings')}
            onNavigateToSettings={() => {
              setMoreSubTab('settings');
              setActiveTab('more');
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={financeData.transactions}
            wallets={financeData.allWallets}
            categories={financeData.categories}
            defaultWalletId={financeData.settings?.defaultWalletId || 'cash'}
          />
        )}

        {activeTab === 'people' && (
          <PeopleView
            peopleLedger={financeData.peopleLedger}
            wallets={financeData.wallets}
            defaultWalletId={financeData.settings?.defaultWalletId || 'cash'}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsView
            goals={financeData.goals}
            goalBalances={financeData.goalBalances}
            dpsList={financeData.dpsList}
            dpsStats={financeData.dpsStats}
            fdrList={financeData.fdrList}
            fdrStats={financeData.fdrStats}
            investments={financeData.investments}
            wallets={financeData.wallets}
            defaultWalletId={financeData.settings?.defaultWalletId || 'cash'}
          />
        )}

        {activeTab === 'more' && (
          <MoreView
            data={financeData}
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
            initialSubTab={moreSubTab}
          />
        )}
      </main>

      {/* Bottom iOS Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'more') setMoreSubTab('budgets');
        }}
      />
    </div>
  );
}

export default App;
