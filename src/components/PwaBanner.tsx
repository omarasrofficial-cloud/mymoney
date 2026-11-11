// src/components/PwaBanner.tsx
import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Compass, ExternalLink, Smartphone, Check } from 'lucide-react';
import { db } from '../db/db';

export const PwaBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 1. Request persistent storage on startup
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    // 2. Check if running in standalone mode (already installed on Home Screen)
    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Detect if inside an in-app browser (WhatsApp, Telegram, Messenger, Instagram, etc.)
    const ua = navigator.userAgent || '';
    const inApp = /FBAN|FBAV|Instagram|WhatsApp|Telegram|Messenger|Line|MicroMessenger|Snapchat|Twitter|Electron/i.test(ua);
    setIsInAppBrowser(inApp);

    // If not standalone, show banner
    db.settings.get('app_settings').then((settings) => {
      if (!isStandalone && (!settings || !settings.installedPwaDismissed)) {
        setShowBanner(true);
      }
    });
  }, []);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    const settings = await db.settings.get('app_settings');
    if (settings) {
      settings.installedPwaDismissed = true;
      await db.settings.put(settings);
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Top Dismissible Banner */}
      <div
        onClick={() => setShowInstallGuide(true)}
        className="cursor-pointer mx-1 my-2 p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl shadow-lg border border-emerald-600/60 flex items-center justify-between space-x-2 animate-fadeIn text-xs active:scale-[0.99] transition-all"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <PlusSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white flex items-center space-x-1.5">
              <span>Install MyMoney on iPhone</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-normal">
                Tap for instructions
              </span>
            </p>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              {isInAppBrowser
                ? '⚠️ In-app browser detected: Tap here to open in Safari & install.'
                : 'Tap Share ➔ Add to Home Screen so data is never deleted.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="min-w-touch min-h-touch -mr-1 flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* DETAILED INSTALL GUIDE MODAL */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn text-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    How to Install on iPhone
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Safari & iOS 16 Instructions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInstallGuide(false)}
                className="min-w-touch min-h-touch flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-App Browser Warning if applicable */}
            {isInAppBrowser && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Compass className="w-4 h-4 text-amber-600" />
                  <span>Open in Safari First</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Apple <strong>does not allow</strong> "Add to Home Screen" inside chat apps (WhatsApp/Telegram/Messenger).
                  <br />
                  👉 Tap the <strong>three dots (...)</strong> or <strong>Compass icon 🧭</strong> in your chat bar and select <strong>"Open in Safari"</strong>.
                </p>
              </div>
            )}

            {/* 3 Step Guide */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">
                    Open in Safari
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Make sure the website is open in the standard Apple <strong>Safari</strong> browser.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                    <span>Tap the Share Button</span>
                    <Share className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Tap the square icon with the upward arrow <strong>[ ⎋ ]</strong> at the bottom of Safari. <em>(If the toolbar is hidden, tap the bottom address bar to show it).</em>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                    <span>Tap "Add to Home Screen"</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Scroll down the share menu, tap <strong>"Add to Home Screen"</strong>, then tap <strong>"Add"</strong> at the top right.
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full min-h-touch py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-center active:scale-95 shadow-md shadow-emerald-600/30"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
