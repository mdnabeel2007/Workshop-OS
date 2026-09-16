import initSqlJs, { type Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const DB_KEY = "workshopos-sqlite-v1";
const BACKUP_STORE = "workshopos-backups-v1";

let db: Database | null = null;

export type Row = Record<string, unknown>;

const now = () => new Date().toISOString();

function openStore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("WorkshopOS", 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("db")) d.createObjectStore("db");
      if (!d.objectStoreNames.contains("backups")) d.createObjectStore("backups", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const d = await openStore();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(storeName: string, value: unknown, key?: IDBValidKey): Promise<void> {
  const d = await openStore();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, "readwrite");
    const req = key === undefined ? tx.objectStore(storeName).put(value as never) : tx.objectStore(storeName).put(value as never, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const schema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY CHECK (id=1),
  workshop_name TEXT NOT NULL DEFAULT 'My Car Workshop',
  owner TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  upi_id TEXT DEFAULT '',
  bank_details TEXT DEFAULT '',
  logo_data TEXT DEFAULT '',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  job_card_prefix TEXT NOT NULL DEFAULT 'JC',
  estimate_prefix TEXT NOT NULL DEFAULT 'EST',
  receipt_prefix TEXT NOT NULL DEFAULT 'REC',
  currency TEXT NOT NULL DEFAULT '₹',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  terms TEXT DEFAULT 'Thank you for choosing our workshop.',
  footer TEXT DEFAULT 'Computer generated document.',
  gst_enabled INTEGER NOT NULL DEFAULT 0,
  allow_negative_stock INTEGER NOT NULL DEFAULT 0,
  credit_limit REAL NOT NULL DEFAULT 0,
  automatic_backup INTEGER NOT NULL DEFAULT 1,
  invoice_format TEXT NOT NULL DEFAULT 'A4',
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Admin','Manager','Service Advisor','Mechanic')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT DEFAULT '',
  year INTEGER,
  fuel TEXT DEFAULT 'Petrol',
  transmission TEXT DEFAULT 'Manual',
  odometer REAL DEFAULT 0,
  engine_number TEXT DEFAULT '',
  chassis_number TEXT DEFAULT '',
  color TEXT DEFAULT '',
  insurance_expiry TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mechanics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  joining_date TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  labour_charge REAL NOT NULL DEFAULT 0,
  estimated_time REAL NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  outstanding REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_name TEXT NOT NULL,
  part_number TEXT DEFAULT '',
  barcode TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  category TEXT DEFAULT '',
  compatible_vehicle TEXT DEFAULT '',
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  stock REAL NOT NULL DEFAULT 0,
  minimum_stock REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  rack_location TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  odometer REAL DEFAULT 0,
  opened_at TEXT NOT NULL,
  assigned_mechanic_id INTEGER REFERENCES mechanics(id) ON DELETE SET NULL,
  service_advisor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expected_delivery TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Waiting',
  complaints TEXT DEFAULT '',
  inspection_summary TEXT DEFAULT '',
  recommended_work TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  next_service_date TEXT DEFAULT '',
  next_service_odometer REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  complaint TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Checked',
  remarks TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_card_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  qty REAL NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_card_parts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  part_id INTEGER REFERENCES parts(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  part_number_snapshot TEXT DEFAULT '',
  cost_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  qty REAL NOT NULL DEFAULT 1,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_card_charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  charge_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estimate_code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  job_card_id INTEGER REFERENCES job_cards(id) ON DELETE SET NULL,
  estimate_date TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Draft',
  total REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('service','part','charge')),
  item_id INTEGER,
  name_snapshot TEXT NOT NULL,
  part_number_snapshot TEXT DEFAULT '',
  qty REAL NOT NULL DEFAULT 1,
  rate REAL NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  job_card_id INTEGER REFERENCES job_cards(id) ON DELETE SET NULL,
  invoice_date TEXT NOT NULL,
  odometer REAL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  additional_charges REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL DEFAULT 0,
  paid_total REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  payment_method TEXT DEFAULT '',
  mechanic_id INTEGER REFERENCES mechanics(id) ON DELETE SET NULL,
  next_service_date TEXT DEFAULT '',
  next_service_odometer REAL,
  notes TEXT DEFAULT '',
  terms TEXT DEFAULT '',
  cancelled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK(item_type IN ('service','part','charge')),
  source_id INTEGER,
  name_snapshot TEXT NOT NULL,
  part_number_snapshot TEXT DEFAULT '',
  cost_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  qty REAL NOT NULL DEFAULT 1,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value REAL NOT NULL DEFAULT 0,
  amount REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_code TEXT NOT NULL UNIQUE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  reference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  reversed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_invoice TEXT DEFAULT '',
  purchase_date TEXT NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  paid REAL NOT NULL DEFAULT 0,
  balance REAL NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  qty REAL NOT NULL,
  purchase_price REAL NOT NULL,
  amount REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_code TEXT NOT NULL UNIQUE,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
  transaction_date TEXT NOT NULL,
  type TEXT NOT NULL,
  reference TEXT DEFAULT '',
  quantity REAL NOT NULL,
  balance REAL NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount REAL NOT NULL,
  payment_method TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT DEFAULT '',
  details TEXT DEFAULT '',
  timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  label TEXT DEFAULT '',
  automatic INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_job_cards_status ON job_cards(status);
CREATE INDEX IF NOT EXISTS idx_job_cards_customer ON job_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_vehicle ON job_cards(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_parts_barcode ON parts(barcode);
CREATE INDEX IF NOT EXISTS idx_parts_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_part ON inventory_transactions(part_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_invoice_job ON invoices(job_card_id) WHERE job_card_id IS NOT NULL AND cancelled=0;
`;

export async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function initDB(): Promise<void> {
  if (db) return;
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const saved = await idbGet<Uint8Array>( "db", DB_KEY);
  db = saved ? new SQL.Database(saved) : new SQL.Database();
  db.run(schema);
  const settings = query("SELECT id FROM business_settings WHERE id=1");
  if (!settings.length) {
    const t = now();
    run(`INSERT INTO business_settings (id, workshop_name, created_at, updated_at) VALUES (1,?,?,?)`, ["My Car Workshop", t, t]);
  }
  const admin = query("SELECT id FROM users WHERE username='admin'");
  if (!admin.length) {
    const t = now();
    run(`INSERT INTO users (username,password_hash,role,active,created_at,updated_at) VALUES (?,?,?,?,?,?)`,
      ["admin", await hashPassword("admin123"), "Admin", 1, t, t]);
  }
  const serviceCount = Number(scalar("SELECT COUNT(*) FROM services") || 0);
  if (serviceCount === 0) {
    const t = now();
    const defaults = [
      ["General Service","Maintenance",1200,2,"Routine inspection and service"],
      ["Oil Change","Maintenance",500,0.5,"Engine oil and basic checks"],
      ["Brake Service","Brakes",800,1.5,"Brake inspection and service"],
      ["AC Service","AC",1000,2,"Air-conditioning diagnosis and service"],
      ["Electrical Diagnosis","Electrical",700,1,"Electrical fault diagnosis"],
      ["Wheel Alignment","Tyres",600,1,"Alignment check and adjustment"],
      ["Car Wash","Cleaning",300,0.75,"Exterior wash"]
    ];
    for (const s of defaults) run("INSERT INTO services(name,category,labour_charge,estimated_time,description,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",[...s,1,t,t]);
  }
  await saveDB();
}

export function getDB(): Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export function query(sql: string, params: unknown[] = []): Row[] {
  const d = getDB();
  const stmt = d.prepare(sql);
  stmt.bind(params as never[]);
  const rows: Row[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as Row);
  stmt.free();
  return rows;
}

export function scalar<T = unknown>(sql: string, params: unknown[] = []): T | null {
  const rows = query(sql, params);
  if (!rows.length) return null;
  return Object.values(rows[0])[0] as T;
}

export function run(sql: string, params: unknown[] = []): void {
  getDB().run(sql, params as never[]);
}

export function transaction<T>(fn: () => T): T {
  const d = getDB();
  d.run("BEGIN");
  try {
    const value = fn();
    d.run("COMMIT");
    return value;
  } catch (e) {
    d.run("ROLLBACK");
    throw e;
  }
}

export async function saveDB(): Promise<void> {
  const data = getDB().export();
  await idbPut("db", data, DB_KEY);
}

export async function replaceDB(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  db = new SQL.Database(data);
  db.run("PRAGMA foreign_keys = ON");
  await saveDB();
}

export async function createBackup(label = "Manual backup", automatic = false): Promise<string> {
  const data = getDB().export();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  await idbPut("backups", { id, created_at: now(), size_bytes: data.byteLength, label, automatic, data });
  run("INSERT OR REPLACE INTO backups (id,created_at,size_bytes,label,automatic) VALUES (?,?,?,?,?)",
    [id, now(), data.byteLength, label, automatic ? 1 : 0]);
  await saveDB();
  return id;
}

export async function getBackups(): Promise<Row[]> {
  return query("SELECT * FROM backups ORDER BY created_at DESC LIMIT 100");
}

export async function getBackupData(id: string): Promise<Uint8Array | null> {
  const item = await idbGet<{data: Uint8Array}>("backups", id);
  return item?.data ?? null;
}

export function nextCode(prefix: string, table: string, column: string): string {
  const year = new Date().getFullYear();
  const rows = query(`SELECT ${column} AS code FROM ${table} WHERE ${column} LIKE ? ORDER BY id DESC LIMIT 1`, [`${prefix}-${year}-%`]);
  const last = rows[0]?.code as string | undefined;
  const n = last ? (Number(last.split("-").pop()) || 0) + 1 : 1;
  return `${prefix}-${year}-${String(n).padStart(5, "0")}`;
}

export function audit(userId: number | null, action: string, module: string, recordId = "", details = ""): void {
  run("INSERT INTO audit_logs(user_id,action,module,record_id,details,timestamp) VALUES(?,?,?,?,?,?)",
    [userId, action, module, recordId, details, now()]);
}

export async function persist(): Promise<void> {
  await saveDB();
}
