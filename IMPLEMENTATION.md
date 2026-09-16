# Implementation notes

## What is included

- React + TypeScript + Vite application
- SQLite database using sql.js
- IndexedDB persistence for the local SQLite binary
- Login with SHA-256 password hashes
- Admin / Manager / Service Advisor / Mechanic roles in the navigation
- Customer and vehicle CRUD
- Vehicle service history
- Job cards and inspection checklist
- Services / labour catalogue
- Spare parts and inventory ledger
- Estimates with estimate → job card conversion
- Invoice creation from job cards
- Invoice snapshots for historical pricing
- Stock deduction during invoicing
- Invoice cancellation with stock restoration and payment reversal
- Payments and outstanding balances
- Purchases and supplier balances
- Expenses
- Reports and CSV export
- A4 / 80mm print layouts
- PDF invoice export
- Local database backup / restore
- Daily automatic backup policy
- Audit log
- Keyboard shortcuts
- GST ON/OFF architecture, default OFF

## Local data model

The database is SQLite and is persisted as a binary in IndexedDB. This keeps the core application local-first without requiring a hosted API.

## Production hardening

Before deploying to a real workshop, add:
- Native Tauri packaging if a desktop installer is required
- OS-level secret/key storage
- Stronger password policy / optional PIN
- Automated end-to-end browser tests
- More granular role permissions
- Optional Google Drive sync
- Native thermal-printer integration if direct USB printing is required
- Formal migration versioning for future schema releases
