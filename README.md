# COOPER Complex Hub

> **EXACT PLATFORM NAME**: **COOPER Complex Hub** (Spelling: **C-O-O-P-E-R**)

A secure, institutional-grade, full-stack financial technology platform where verified users access and monitor structured cryptocurrency and foreign-exchange strategies with transparent account management, verified double-entry ledger accounting, and active risk awareness.

---

## Key Principles & Anti-Fraud Architecture

* **Legitimate Financial Platform**: Built strictly around real asset allocation and disciplined risk limits.
* **No Ponzi or Pyramid Mechanics**: Capital returns are never paid from new member recruitment or principal deposits.
* **No Guaranteed Returns**: Strictly adheres to the statutory investment disclosure:
  > *"Investments involve risk. The value of an investment can rise or fall, and past performance does not guarantee future results."*
* **No Fabricated Performance**: If verified trading history does not yet exist for a strategy, the platform transparently displays:
  > **"No verified performance data available yet."**
* **Double-Entry Financial Ledger**: Frontend clients cannot determine account balances. Balances are mathematically derived from verified cryptographic ledger entries in SQLite / PostgreSQL.
* **Payment rails**: Integrated abstraction layers for **MTN Mobile Money**, **Airtel Money**, **Bank Transfer (Corporate Escrow)**, **Visa**, and **Mastercard**.
* **Emergency Kill Switch**: Trading management maintains a direct **"STOP ALL TRADING"** circuit breaker.
* **Production Safety Checklist**: 12 mandatory legal, regulatory, custody, banking, and compliance items required before switching from `DEMO` to `LIVE` mode.

---

## Default Roles & Demo Accounts

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Demo Investor** | `investor@coopercomplexhub.com` | `Investor@2026!` | Investor Dashboard, Portfolio, Deposits, Allocations, Withdrawals, Referrals |
| **Super Admin** | `admin@coopercomplexhub.com` | `CooperAdmin@2026!` | Full System Access, Emergency Kill Switch, User Management, Reports |
| **Compliance Officer** | `compliance@coopercomplexhub.com` | `Compliance@2026!` | KYC Review, Identity Approvals, Sanctions Checks, Live Checklist |
| **Finance Officer** | `finance@coopercomplexhub.com` | `Finance@2026!` | Deposits Reconciliation, Withdrawal Approvals, Escrow Releases |
| **Trading Manager** | `trading@coopercomplexhub.com` | `Trading@2026!` | Risk Limits, Adapter Configurations, "STOP ALL TRADING" Circuit Breaker |

*Note: In the authentication dialog, you can use the **1-Click Demo Profiles** selector to automatically prefill any of the above credentials.*

---

## Technology Stack

* **Frontend**: React 19 + TypeScript + Vite + Lucide Icons + Custom Institutional Design System (Vanilla CSS with deep slate/navy palette `#060b13`, `#0a1120`, `#0284c7`, glassmorphism, responsive mobile & desktop).
* **Backend**: Node.js + Express + TypeScript + `node:sqlite` (Built-in zero-dependency ACID SQL engine) + JWT + Bcryptjs + UUID.
* **Database Schema**: Full PostgreSQL 14+ DDL (`backend/src/database/schema-postgres.sql`) and SQLite DDL (`backend/src/database/schema.sql`).
* **Testing**: Automated test suite (`backend/tests/run-tests.ts`) covering Authentication, Double-Entry Ledger, Idempotency, and Risk Circuit Breakers.

---

## Quick Start & Running Locally

### 1. Prerequisites
* Node.js v20+ (Node v24 recommended)
* npm v10+

### 2. Start Both Backend & Frontend Concurrently
From the project root (`d:\cooper`):
```bash
npm run dev
```
* Backend starts at: `http://localhost:5000`
* Frontend starts at: `http://localhost:5173`

### 3. Run Automated Tests
```bash
npm run test
```
Executes the comprehensive test suite verifying:
- Password hashing & role security
- Strict double-entry ledger calculation
- Deposit idempotency (prevents double-crediting)
- Emergency trading halt ("STOP ALL TRADING")
- Maximum position size limits
- Strategy disclosure integrity (no fabricated returns)

---

## Project Structure

```text
cooper/
├── backend/
│   ├── src/
│   │   ├── config/              # App config, DEMO mode, risk limits, live checklist
│   │   ├── database/            # SQLite client (node:sqlite), schema.sql, schema-postgres.sql, seed.ts
│   │   ├── middleware/          # auth, authorize roles, auditLogger, errorHandler
│   │   ├── modules/
│   │   │   ├── auth/            # Registration, login, 2FA, profile
│   │   │   ├── kyc/             # KYC submission, compliance officer reviews
│   │   │   ├── payments/        # Provider abstraction (MTN, Airtel, Bank, Cards)
│   │   │   ├── deposits/        # Deposit flow, server verification, simulation
│   │   │   ├── withdrawals/     # Withdrawal request, 2FA, escrow holding, approval
│   │   │   ├── ledger/          # Double-entry accounting engine & balance sync
│   │   │   ├── investments/     # Crypto, Forex & Combined strategies, allocations
│   │   │   ├── trading/         # Crypto & Forex adapters, risk engine, kill switch
│   │   │   ├── referrals/       # Single-tier marketing commission dashboard
│   │   │   ├── notifications/   # In-app alerts and notifications
│   │   │   ├── support/         # Customer support tickets & threads
│   │   │   ├── admin/           # Admin portal dashboard, user management, audit
│   │   │   └── reports/         # CSV report exports (users, deposits, withdrawals, ledger)
│   │   └── server.ts            # Main Express entrypoint
│   ├── tests/
│   │   └── run-tests.ts         # Automated test suite
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, Footer, AuthModal, LegalModal
│   │   ├── context/             # AuthContext (user, balances, role helpers)
│   │   ├── pages/
│   │   │   ├── public/          # LandingPage, AboutPage, StrategiesPage, SecurityPage, FAQPage
│   │   │   ├── user/            # UserDashboard (Portfolio, Invest, Deposits, Withdrawals, etc.)
│   │   │   └── admin/           # AdminPortal (KPIs, Kill Switch, KYC, Finance, Risk, Reports)
│   │   ├── services/            # api.ts client
│   │   ├── App.tsx              # Main routing & layout
│   │   ├── main.tsx
│   │   └── index.css            # Institutional fintech design tokens
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── package.json                 # Monorepo unified dev & test scripts
└── README.md
```

---

## API Endpoints Reference

### Public & Authentication
* `GET  /api/health` — System status and APP_MODE
* `GET  /api/config/info` — System branding and demo notices
* `POST /api/auth/register` — Investor registration
* `POST /api/auth/login` — Investor & staff authentication
* `GET  /api/auth/me` — Authenticated profile & ledger balances
* `POST /api/auth/2fa/toggle` — Toggle 2FA simulation

### Strategies & Investments
* `GET  /api/strategies` — List available investment strategies
* `GET  /api/strategies/:id` — Strategy composition & terms
* `POST /api/investments/allocate` — Allocate available funds to strategy
* `POST /api/investments/redeem` — Redeem strategy allocation back to available
* `GET  /api/investments/portfolio` — Active allocations & portfolio valuation

### Payments & Financial Ledger
* `POST /api/deposits/initiate` — Generate unique reference (`CPH-YYYYMMDD-XXXXXX`)
* `POST /api/deposits/simulate-confirm` — Simulated gateway confirmation (DEMO mode)
* `GET  /api/deposits` — List user's deposits
* `POST /api/payments/webhook/:provider` — Universal webhook handler with idempotency
* `POST /api/withdrawals/request` — Place withdrawal request (escrow locked)
* `GET  /api/withdrawals` — List user's withdrawal status

### Administration & Compliance
* `GET  /api/admin/stats` — Real-time database KPIs
* `GET  /api/admin/users` — Search and inspect investor accounts
* `POST /api/admin/users/:id/suspend` — Suspend or reactivate user account
* `GET  /api/admin/kyc` — List pending KYC identity documents
* `POST /api/admin/kyc/:id/review` — Approve, reject, or request information with audit log
* `GET  /api/admin/withdrawals` — List escrowed withdrawals for finance review
* `POST /api/admin/withdrawals/:id/review` — Approve payout or reject & refund
* `POST /api/admin/trading/halt` — **"STOP ALL TRADING"** Emergency Kill Switch
* `GET  /api/admin/audit-logs` — Chronological administrative action history
* `GET  /api/admin/live-checklist` — 12-item production safety checklist
* `GET  /api/admin/reports/:type/csv` — Export CSV report (users, deposits, withdrawals, ledger, audit)
