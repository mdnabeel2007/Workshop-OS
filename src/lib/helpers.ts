export type AnyRow = Record<string, any>;

export const n = (v: unknown) => Number(v ?? 0);
export const money = (v: unknown) => `₹${n(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateTime = (v: unknown) => v ? new Date(String(v)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";
export const dateOnly = (v: unknown) => v ? new Date(String(v)).toLocaleDateString("en-IN") : "—";
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));

export function discountAmount(base: number, type: string, value: number): number {
  return type === "percent" ? base * value / 100 : value;
}

export function lineAmount(qty: number, rate: number, discountType = "fixed", discountValue = 0): number {
  const base = Math.max(0, qty) * Math.max(0, rate);
  return Math.max(0, base - discountAmount(base, discountType, Math.max(0, discountValue)));
}

export function downloadBlob(data: BlobPart, filename: string, type = "application/octet-stream") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csv(rows: AnyRow[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(q).join(","), ...rows.map(r => headers.map(h => q(r[h])).join(","))].join("\n");
}

export function printHTML(title: string, html: string, paper: "A4" | "80mm" = "A4") {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;padding:24px}
  .sheet{max-width:${paper==="80mm" ? "76mm" : "190mm"};margin:auto}
  table{width:100%;border-collapse:collapse}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left;font-size:12px}
  .right{text-align:right}.center{text-align:center}.muted{color:#666}.total{font-size:18px;font-weight:700}
  .head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:15px}
  @media print{@page{size:${paper==="80mm" ? "80mm auto" : "A4"};margin:8mm}body{padding:0}.no-print{display:none}}
  </style></head><body><div class="sheet">${html}</div><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export function statusClass(status: string): string {
  const s = status.toLowerCase().replace(/\s+/g,"-");
  return `status status-${s}`;
}
