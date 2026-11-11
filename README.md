# MyMoney — Personal Finance Tracker PWA

**MyMoney** is a mobile-first Progressive Web App designed specifically for **ONE user on ONE device** (tailored for iPhone 8, Safari, iOS 16, 375×667 screen). Currency is Bangladeshi Taka (**BDT ৳**) with authentic South Asian grouping (`৳ 1,25,000`).

> 🌐 **Live Netlify URL**: [https://mymoney-tracker-fhyo.netlify.app](https://mymoney-tracker-fhyo.netlify.app)
> 
> ⚙️ **Netlify Project Dashboard**: [https://app.netlify.com/projects/mymoney-tracker-fhyo](https://app.netlify.com/projects/mymoney-tracker-fhyo)

---

## 🌟 Key Features

1. **Derived Ledger (Core Principle)**
   - **Balances are NEVER stored directly.** Every wallet balance, loan balance, asset value, and net worth is dynamically derived from the transaction ledger.
   - Editing or deleting any transaction immediately reverses its effect across all wallets and ledgers.

2. **Smart Freeform Text Parser (Voice-Friendly)**
   - Accepts multi-line or comma-separated natural English sentences.
   - Optimized for iPhone keyboard dictation mic (standard textarea, no battery-draining Web Speech API).
   - **Preview Confirmation List**: Shows each parsed row with type, amount, wallet, category, person, date, and charge.
   - **Zero Silent Drops**: Unrecognized lines stay highlighted in red with an inline Edit option.
   - **10-Second Undo Toast**: Gives you 10 seconds to reverse any batch with one tap.
   - **Duplicate Warning**: Alerts if an identical entry (same amount + wallet + category) was recorded today.
   - **Self-Learning**: Prompts once for unfamiliar words and remembers them for future inputs.

3. **Authentic Bangladeshi Currency Grouping**
   - Numbers are grouped in hundreds, lakhs, and crores: `৳ 1,25,000`, `৳ 15,00,000`, `৳ 1,00,00,000`.
   - Recognizes notations: `5k`, `1.5k`, `5 thousand`, `2 lakh`, `1.5 lakh`, `1 crore`, `tk 500`, `500 tk`, `500 taka`, `৳500`.

4. **Wallets & Reconcile ("Check Balance")**
   - Defaults: **bKash**, **Nagad**, **Bank**, **Cash** (all separate wallets).
   - User can add custom wallets, rename, archive, pick accent colors, and set opening balances.
   - **Reconcile Tool**: Enter your actual physical/app balance; MyMoney computes the exact difference and generates an `adjustment` transaction so derived numbers remain consistent with reality.

5. **Charges & Wallet Fees**
   - Supports transaction charges (e.g. `cashout 2000 bkash fee 37`, `transfer 5000 bank to bkash charge 20`).
   - Automatically deducts fee from source wallet as a linked expense under `"Wallet Fees"`.
   - Reports show fees paid per wallet and per month.

6. **People Ledger (Loans & Repayments)**
   - Distinguishes loans from expenses.
   - Tracks **Owed To Me** (money given) and **I Owe** (money borrowed).
   - Chronological contact ledger supporting partial repayments and due dates (`due 25 Nov`, `Overdue` badges).

7. **Savings & Investments**
   - **Goals**: Target amount, saved so far, progress bar, target date.
   - **DPS**: Monthly installment, tenure, annual interest rate, installments count, next due date, estimated maturity amount.
   - **FDR**: Principal amount, interest rate, tenure, maturity date, "matures in X days" badge, and one-tap credit to wallet.
   - **Investments**: Shares, Sanchayapatra, Mutual Funds, Gold, Business with valuation history, profit/loss (৳ and %).

8. **Budgets & Spending Reports**
   - **Quiet by Default**: All limits are unset until you configure them.
   - Progress bar turns **amber at 80%** and **red at 100%**.
   - Spending reports strictly exclude transfers, loans, savings, and investments.
   - One-tap **CSV Export** for Excel / Google Sheets.

9. **Security & Offline PWA**
   - Optional **4-Digit Passcode PIN Lock**.
   - Fully offline via Service Worker cache (`sw.js`).
   - Calls `navigator.storage.persist()` on startup.
   - Full JSON Export & Import backup.

---

## 🛠️ Tech Stack & iOS 16 Compatibility

- **Framework**: React 18 + Vite 5 + TypeScript
- **Styling**: Tailwind CSS (dark mode support, safe area insets `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`, minimum 44px touch targets)
- **Database**: Dexie.js (IndexedDB) — zero backend, zero login, zero external API keys
- **Build Target**: Configured in `vite.config.ts` with `target: ['safari14']` and `cssTarget: ['safari14']` for 100% iOS 16 / Safari compatibility.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or v20+ recommended)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Parser & Calculations Unit Tests
```bash
npm test
```
Runs 48 Vitest tests covering all 35+ parser sentences, edge cases, Bangladeshi number grouping, and derived balance effect reversal.

### 4. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.

### 5. Preview Production Build Locally
```bash
npm run preview
```
Serves the build on `http://localhost:4173`.

---

## 📱 How to Install on iPhone (Safari iOS 16)

1. Deploy the app to any free HTTPS host (instructions below) or open your hosted URL in **Safari** on your iPhone.
2. In Safari, tap the **Share** button (box with an upward arrow) in the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name **"MyMoney"** and tap **Add**.
5. Launch **MyMoney** directly from your Home Screen like a native app.
   - Works full-screen without Safari browser address bars (`standalone` mode).
   - All data stays locally in IndexedDB with persistent storage.
   - Loads instantly offline after the first visit.

---

## 🌐 Deploy to Free HTTPS Hosts

Because MyMoney is a client-side PWA with IndexedDB, it can be hosted on any static HTTPS hosting provider for free:

### A. Netlify (Recommended - Simplest)
1. Run `npm run build` to generate the `dist` folder.
2. Log in to [Netlify](https://app.netlify.com/).
3. Drag and drop the `dist/` folder into the Netlify dashboard.
   *(Or connect your GitHub repository with Build command `npm run build` and Publish directory `dist`).*

### B. Vercel
1. Install Vercel CLI: `npm i -g vercel`.
2. Run `vercel` in the project directory and select defaults (Framework: Vite).
3. Vercel will build and assign a free HTTPS URL.

### C. GitHub Pages
1. Install `gh-pages`: `npm i -D gh-pages`.
2. In `package.json`, add:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run `npm run deploy`.

---

## 🧪 Unit Test Coverage

MyMoney comes with a comprehensive test suite executed with Vitest:
- **Amount parsing**: `5000`, `5,000`, `5k`, `1.5k`, `5 thousand`, `2 lakh`, `1.5 lakh`, `1 crore`, `tk 500`, `500 tk`, `500 taka`, `৳500`.
- **Wallets & default fallback**: `bkash`, `b-kash`, `nagad`, `bank`, `cash`.
- **Transfers & charges**: `transfer 5000 bank to nagad`, `cashout 2000 bkash fee 37`, `transfer 5000 bank to bkash charge 20`.
- **Loans & repayments**: `gave Rahim 3000 loan`, `lent Rahim 3000`, `borrowed 10000 from Karim`, `Rahim paid back 1000`, `paid back Karim 2000`.
- **Due dates**: `due 25 Nov`, `due tomorrow`.
- **DPS, FDR, Investments**: `dps 5000 bank`, `fdr 100000 bank`, `invested 20000 shares`, `saved 2000 bike fund`.
- **Self-learning & duplicate detection**: Remembers unknown word categories and flags duplicates added today.
- **Derived balance reversal**: Asserts that deleting or editing any entry reverses wallet balances, loan ledgers, and net worth.

---

## 🔒 Privacy & Data Ownership
- **No analytics, no cookies, no third-party tracking, no external APIs.**
- All records exist solely on your physical device.
- Use the **Export JSON** feature in Settings to create backups anytime.
