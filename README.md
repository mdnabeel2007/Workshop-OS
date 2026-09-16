# WorkshopOS — Offline Car Workshop Management

A local-first car workshop management system built with React + TypeScript + Vite + SQLite (sql.js).

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

### First login

- Username: `admin`
- Password: `admin123`

Change the password from **Settings → Users** after first login.

## Build

```bash
npm run build
npm run preview
```

## Data

The SQLite database is persisted in the browser's IndexedDB. It works offline after the app assets are available. Use **Backup → Export Database** regularly.

The app defaults to **GST OFF**. When GST is off, GSTIN, HSN/SAC and tax fields are not rendered.

## Core flow

Customer → Vehicle → Job Card → Inspection → Mechanic → Services + Parts → Estimate/Approval → Repair → Invoice → Payment → Delivery → Service History.

## Notes

- Browser print supports A4 and 80mm layouts via the print stylesheet.
- PDF export uses jsPDF for invoice snapshots.
- CSV exports are generated locally.
- Restore creates a safety backup before replacing the current database.
- No cloud service is required for core functionality.
