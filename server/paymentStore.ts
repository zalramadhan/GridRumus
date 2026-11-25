import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_TOKEN_PRICE_IDR = 5000;
export const DEFAULT_PASS_DURATION_HOURS = 24;
const RETENTION_PRUNE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AUDIT_LOGS = 100;

export type OrderStatus = 'pending' | 'paid' | 'expired';

export type AdminAuditAction =
  | 'settings_updated'
  | 'order_approved'
  | 'order_cancelled'
  | 'pass_granted_email'
  | 'pass_revoked';

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: AdminAuditAction;
  target: string;
  detail: string;
}

export interface PaymentOrderRecord {
  orderId: string;
  uid: string;
  email: string;
  displayName: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  passExpiresAt: string | null;
  approvedByEmail?: string | null;
}

export interface UserPassRecord {
  uid: string;
  email: string;
  expiresAt: string;
  lastOrderId: string;
  updatedAt: string;
}

export interface EmailGrantRecord {
  email: string;
  expiresAt: string;
  grantedByEmail: string;
  updatedAt: string;
}

export interface WhatsAppSettings {
  whatsappNumber: string;
  paymentNote: string;
  priceIdr: number;
  passDurationHours: number;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

interface PaymentLedgerData {
  settings: WhatsAppSettings;
  orders: Record<string, PaymentOrderRecord>;
  passes: Record<string, UserPassRecord>;
  emailGrants: Record<string, EmailGrantRecord>;
  auditLogs: AdminAuditLogEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LEDGER_PATH = path.join(DATA_DIR, 'payments.json');
const BACKUP_PATH = path.join(DATA_DIR, 'payments.bak.json');

let cache: PaymentLedgerData | null = null;

export function sanitizeControlText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function isValidOrderId(orderId: string): boolean {
  return /^GR-WA-\d{10,16}-[A-F0-9]{4,8}$/.test(orderId);
}

export function normalizeWhatsAppNumber(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 9 || digits.length > 15) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return `62${digits}`;
}

function sanitizePriceIdr(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 1000 || num > 1000000) {
    return DEFAULT_TOKEN_PRICE_IDR;
  }
  return Math.round(num);
}

function sanitizeDurationHours(raw: unknown): number {
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 1 || num > 720) {
    return DEFAULT_PASS_DURATION_HOURS;
  }
  return Math.round(num);
}

function getDefaultSettings(): WhatsAppSettings {
  const envWa = normalizeWhatsAppNumber(process.env.WHATSAPP_ADMIN_NUMBER || '');
  return {
    whatsappNumber: envWa,
    paymentNote: '',
    priceIdr: DEFAULT_TOKEN_PRICE_IDR,
    passDurationHours: DEFAULT_PASS_DURATION_HOURS,
    updatedAt: null,
    updatedByEmail: null,
  };
}

function parseLedgerFile(filePath: string, fallbackSettings: WhatsAppSettings): PaymentLedgerData | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as Partial<PaymentLedgerData>;
  const loadedSettings =
    parsed.settings && typeof parsed.settings === 'object'
      ? {
          whatsappNumber:
            normalizeWhatsAppNumber(parsed.settings.whatsappNumber) ||
            fallbackSettings.whatsappNumber,
          paymentNote: sanitizeControlText(parsed.settings.paymentNote, 300),
          priceIdr: sanitizePriceIdr(parsed.settings.priceIdr),
          passDurationHours: sanitizeDurationHours(parsed.settings.passDurationHours),
          updatedAt:
            typeof parsed.settings.updatedAt === 'string'
              ? parsed.settings.updatedAt
              : null,
          updatedByEmail:
            typeof parsed.settings.updatedByEmail === 'string'
              ? parsed.settings.updatedByEmail
              : null,
        }
      : fallbackSettings;

  return {
    settings: loadedSettings,
    orders:
      parsed.orders && typeof parsed.orders === 'object' ? parsed.orders : {},
    passes:
      parsed.passes && typeof parsed.passes === 'object' ? parsed.passes : {},
    emailGrants:
      parsed.emailGrants && typeof parsed.emailGrants === 'object'
        ? parsed.emailGrants
        : {},
    auditLogs: Array.isArray(parsed.auditLogs)
      ? parsed.auditLogs.slice(0, MAX_AUDIT_LOGS)
      : [],
  };
}

function ensureLedgerLoaded(): PaymentLedgerData {
  if (cache) return cache;
  const fallbackSettings = getDefaultSettings();

  try {
    const primary = parseLedgerFile(LEDGER_PATH, fallbackSettings);
    if (primary) {
      cache = primary;
      return cache;
    }
  } catch (err) {
    console.error('Primary payment ledger corrupted, attempting backup recovery:', err);
    try {
      const recovered = parseLedgerFile(BACKUP_PATH, fallbackSettings);
      if (recovered) {
        cache = recovered;
        flushLedger(cache);
        return cache;
      }
    } catch (backupErr) {
      console.error('Backup payment ledger recovery failed, starting fresh:', backupErr);
    }
  }

  cache = {
    settings: fallbackSettings,
    orders: {},
    passes: {},
    emailGrants: {},
    auditLogs: [],
  };
  return cache;
}

function pruneStaleRecords(data: PaymentLedgerData): void {
  const cutoffMs = Date.now() - RETENTION_PRUNE_MS;

  for (const [id, order] of Object.entries(data.orders)) {
    if (order.status === 'expired') {
      const expMs = Date.parse(order.expiresAt);
      if (!Number.isNaN(expMs) && expMs < cutoffMs) {
        delete data.orders[id];
      }
    }
  }

  for (const [uid, pass] of Object.entries(data.passes)) {
    const expMs = Date.parse(pass.expiresAt);
    if (!Number.isNaN(expMs) && expMs < cutoffMs) {
      delete data.passes[uid];
    }
  }

  for (const [email, grant] of Object.entries(data.emailGrants)) {
    const expMs = Date.parse(grant.expiresAt);
    if (!Number.isNaN(expMs) && expMs < cutoffMs) {
      delete data.emailGrants[email];
    }
  }

  if (data.auditLogs.length > MAX_AUDIT_LOGS) {
    data.auditLogs = data.auditLogs.slice(0, MAX_AUDIT_LOGS);
  }
}

function flushLedger(data: PaymentLedgerData): void {
  try {
    pruneStaleRecords(data);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
    } else {
      try {
        fs.chmodSync(DATA_DIR, 0o700);
      } catch {
        // ignore chmod failures on unsupported filesystems
      }
    }

    if (fs.existsSync(LEDGER_PATH)) {
      try {
        fs.copyFileSync(LEDGER_PATH, BACKUP_PATH);
        fs.chmodSync(BACKUP_PATH, 0o600);
      } catch {
        // ignore backup error if file is momentarily locked
      }
    }

    const tmpPath = `${LEDGER_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(tmpPath, LEDGER_PATH);
    try {
      fs.chmodSync(LEDGER_PATH, 0o600);
    } catch {
      // ignore chmod failures on unsupported filesystems
    }
  } catch (err) {
    console.error('Failed to persist payment ledger:', err);
  }
}

function appendAuditLog(
  data: PaymentLedgerData,
  adminEmail: string,
  action: AdminAuditAction,
  target: string,
  detail: string
): void {
  const entry: AdminAuditLogEntry = {
    id: `AUD-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    timestamp: new Date().toISOString(),
    adminEmail: sanitizeControlText(adminEmail, 120),
    action,
    target: sanitizeControlText(target, 160),
    detail: sanitizeControlText(detail, 240),
  };
  data.auditLogs = [entry, ...data.auditLogs].slice(0, MAX_AUDIT_LOGS);
}

export function getWhatsAppSettings(): WhatsAppSettings {
  return ensureLedgerLoaded().settings;
}

export function updateWhatsAppSettings(
  whatsappNumberRaw: string,
  paymentNoteRaw: string,
  adminEmail: string,
  priceIdrRaw?: unknown,
  passDurationHoursRaw?: unknown
): WhatsAppSettings {
  const data = ensureLedgerLoaded();
  const normalized = normalizeWhatsAppNumber(whatsappNumberRaw);
  const cleanNote = sanitizeControlText(paymentNoteRaw, 300);
  const nextPrice =
    priceIdrRaw !== undefined
      ? sanitizePriceIdr(priceIdrRaw)
      : data.settings.priceIdr;
  const nextHours =
    passDurationHoursRaw !== undefined
      ? sanitizeDurationHours(passDurationHoursRaw)
      : data.settings.passDurationHours;

  data.settings = {
    whatsappNumber: normalized,
    paymentNote: cleanNote,
    priceIdr: nextPrice,
    passDurationHours: nextHours,
    updatedAt: new Date().toISOString(),
    updatedByEmail: adminEmail,
  };

  appendAuditLog(
    data,
    adminEmail,
    'settings_updated',
    `WA ${normalized}`,
    `Harga Rp${nextPrice.toLocaleString('id-ID')} · Masa aktif ${nextHours} jam`
  );
  flushLedger(data);
  return data.settings;
}

export function getOrderById(orderId: string): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  return data.orders[orderId] ?? null;
}

export function getActivePendingOrderForUser(uid: string): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  const now = Date.now();
  const pending = Object.values(data.orders)
    .filter((order) => order.uid === uid && order.status === 'pending')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  let changed = false;
  let active: PaymentOrderRecord | null = null;
  for (const order of pending) {
    const expMs = Date.parse(order.expiresAt);
    if (!Number.isNaN(expMs) && expMs > now) {
      if (!active) active = order;
    } else {
      order.status = 'expired';
      changed = true;
    }
  }
  if (changed) {
    flushLedger(data);
  }
  return active;
}

export function getRecentOrdersForUser(uid: string): PaymentOrderRecord[] {
  const data = ensureLedgerLoaded();
  return Object.values(data.orders)
    .filter((order) => order.uid === uid)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);
}

export function saveOrder(order: PaymentOrderRecord): PaymentOrderRecord {
  const data = ensureLedgerLoaded();
  data.orders[order.orderId] = {
    ...order,
    displayName: sanitizeControlText(order.displayName, 100) || 'Pengguna GridRumus',
    email: sanitizeControlText(order.email, 254).toLowerCase(),
  };
  flushLedger(data);
  return data.orders[order.orderId];
}

export function approveOrderByAdmin(
  orderId: string,
  adminEmail: string
): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  const order = data.orders[orderId];
  if (!order) return null;

  if (order.status === 'paid') {
    return order;
  }

  const nowMs = Date.now();
  const durationHours = data.settings.passDurationHours;
  const durationMs = durationHours * 60 * 60 * 1000;
  const existingPass = data.passes[order.uid];
  const existingExpiryMs = existingPass ? Date.parse(existingPass.expiresAt) : 0;
  const baseMs =
    !Number.isNaN(existingExpiryMs) && existingExpiryMs > nowMs
      ? existingExpiryMs
      : nowMs;

  const passExpiresAt = new Date(baseMs + durationMs).toISOString();
  const paidAt = new Date(nowMs).toISOString();

  order.status = 'paid';
  order.paidAt = paidAt;
  order.passExpiresAt = passExpiresAt;
  order.approvedByEmail = adminEmail;

  data.passes[order.uid] = {
    uid: order.uid,
    email: order.email,
    expiresAt: passExpiresAt,
    lastOrderId: order.orderId,
    updatedAt: paidAt,
  };

  appendAuditLog(
    data,
    adminEmail,
    'order_approved',
    `${order.email} (${order.orderId})`,
    `Token diaktifkan ${durationHours} jam · Rp${order.amount.toLocaleString('id-ID')}`
  );
  flushLedger(data);
  return order;
}

export function cancelOrderByAdmin(orderId: string, adminEmail: string): boolean {
  const data = ensureLedgerLoaded();
  const order = data.orders[orderId];
  if (!order || order.status !== 'pending') return false;
  order.status = 'expired';
  appendAuditLog(
    data,
    adminEmail,
    'order_cancelled',
    `${order.email} (${order.orderId})`,
    'Order pending dibatalkan oleh admin'
  );
  flushLedger(data);
  return true;
}

export function grantPassByEmail(
  targetEmailRaw: string,
  adminEmail: string
): { email: string; expiresAt: string } {
  const data = ensureLedgerLoaded();
  const emailLower = sanitizeControlText(targetEmailRaw, 254).toLowerCase();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const durationHours = data.settings.passDurationHours;
  const durationMs = durationHours * 60 * 60 * 1000;

  const matchingPasses = Object.values(data.passes).filter(
    (p) => p.email.toLowerCase() === emailLower
  );
  const matchingOrders = Object.values(data.orders)
    .filter((o) => o.email.toLowerCase() === emailLower)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const knownUid = matchingPasses[0]?.uid || matchingOrders[0]?.uid || null;

  const existingGrant = data.emailGrants[emailLower];
  const grantExpMs = existingGrant ? Date.parse(existingGrant.expiresAt) : 0;
  const passExpMs =
    knownUid && data.passes[knownUid]
      ? Date.parse(data.passes[knownUid].expiresAt)
      : 0;

  const baseMs = Math.max(
    nowMs,
    !Number.isNaN(grantExpMs) ? grantExpMs : 0,
    !Number.isNaN(passExpMs) ? passExpMs : 0
  );
  const expiresAt = new Date(baseMs + durationMs).toISOString();

  const pendingForEmail = matchingOrders.find((o) => o.status === 'pending');
  if (pendingForEmail) {
    pendingForEmail.status = 'paid';
    pendingForEmail.paidAt = nowIso;
    pendingForEmail.passExpiresAt = expiresAt;
    pendingForEmail.approvedByEmail = adminEmail;
  }

  if (knownUid) {
    data.passes[knownUid] = {
      uid: knownUid,
      email: emailLower,
      expiresAt,
      lastOrderId: pendingForEmail?.orderId || `MANUAL-${Date.now()}`,
      updatedAt: nowIso,
    };
  } else {
    data.emailGrants[emailLower] = {
      email: emailLower,
      expiresAt,
      grantedByEmail: adminEmail,
      updatedAt: nowIso,
    };
  }

  appendAuditLog(
    data,
    adminEmail,
    'pass_granted_email',
    emailLower,
    `Aktivasi manual ${durationHours} jam`
  );
  flushLedger(data);
  return { email: emailLower, expiresAt };
}

export function revokePass(uidOrEmail: string, adminEmail: string): boolean {
  const data = ensureLedgerLoaded();
  const key = sanitizeControlText(uidOrEmail, 254);
  const lower = key.toLowerCase();
  let removed = false;
  let targetLabel = key;

  if (data.passes[key]) {
    targetLabel = data.passes[key].email || key;
    delete data.passes[key];
    removed = true;
  }
  for (const [uid, pass] of Object.entries(data.passes)) {
    if (pass.email.toLowerCase() === lower) {
      targetLabel = pass.email;
      delete data.passes[uid];
      removed = true;
    }
  }
  if (data.emailGrants[lower]) {
    targetLabel = data.emailGrants[lower].email;
    delete data.emailGrants[lower];
    removed = true;
  }
  if (removed) {
    appendAuditLog(
      data,
      adminEmail,
      'pass_revoked',
      targetLabel,
      'Token akses dinonaktifkan oleh admin'
    );
    flushLedger(data);
  }
  return removed;
}

export function getUserPassSummary(uid: string, email?: string) {
  const data = ensureLedgerLoaded();
  const nowMs = Date.now();
  const emailLower = (email || '').trim().toLowerCase();

  if (emailLower && data.emailGrants[emailLower]) {
    const grant = data.emailGrants[emailLower];
    const grantExpMs = Date.parse(grant.expiresAt);
    if (!Number.isNaN(grantExpMs) && grantExpMs > nowMs) {
      const existingPass = data.passes[uid];
      const existingExpMs = existingPass ? Date.parse(existingPass.expiresAt) : 0;
      const bestExp =
        !Number.isNaN(existingExpMs) && existingExpMs > grantExpMs
          ? existingPass.expiresAt
          : grant.expiresAt;
      data.passes[uid] = {
        uid,
        email: emailLower,
        expiresAt: bestExp,
        lastOrderId: existingPass?.lastOrderId || `WA-GRANT-${Date.now()}`,
        updatedAt: new Date(nowMs).toISOString(),
      };
    }
    delete data.emailGrants[emailLower];
    flushLedger(data);
  }

  const pass = data.passes[uid] ?? null;
  const expiresMs = pass ? Date.parse(pass.expiresAt) : 0;
  const hasActivePass = Boolean(
    pass && !Number.isNaN(expiresMs) && expiresMs > nowMs
  );
  const remainingSeconds = hasActivePass
    ? Math.max(0, Math.floor((expiresMs - nowMs) / 1000))
    : 0;

  return {
    hasActivePass,
    expiresAt: hasActivePass && pass ? pass.expiresAt : null,
    remainingSeconds,
    pendingOrder: getActivePendingOrderForUser(uid),
    recentOrders: getRecentOrdersForUser(uid),
  };
}

export function getAdminPaymentsOverview() {
  const data = ensureLedgerLoaded();
  const nowMs = Date.now();

  let changed = false;
  for (const order of Object.values(data.orders)) {
    if (order.status === 'pending') {
      const expMs = Date.parse(order.expiresAt);
      if (Number.isNaN(expMs) || expMs <= nowMs) {
        order.status = 'expired';
        changed = true;
      }
    }
  }
  if (changed) {
    flushLedger(data);
  }

  const allOrders = Object.values(data.orders);
  const pendingOrders = allOrders
    .filter((o) => o.status === 'pending')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const allPaidOrders = allOrders
    .filter((o) => o.status === 'paid')
    .sort(
      (a, b) =>
        Date.parse(b.paidAt || b.createdAt) - Date.parse(a.paidAt || a.createdAt)
    );

  const activePasses = [
    ...Object.values(data.passes)
      .filter((p) => Date.parse(p.expiresAt) > nowMs)
      .map((p) => ({
        id: p.uid,
        email: p.email,
        expiresAt: p.expiresAt,
        updatedAt: p.updatedAt,
        remainingSeconds: Math.max(
          0,
          Math.floor((Date.parse(p.expiresAt) - nowMs) / 1000)
        ),
      })),
    ...Object.values(data.emailGrants)
      .filter((g) => Date.parse(g.expiresAt) > nowMs)
      .map((g) => ({
        id: g.email,
        email: g.email,
        expiresAt: g.expiresAt,
        updatedAt: g.updatedAt,
        remainingSeconds: Math.max(
          0,
          Math.floor((Date.parse(g.expiresAt) - nowMs) / 1000)
        ),
      })),
  ].sort((a, b) => Date.parse(b.expiresAt) - Date.parse(a.expiresAt));

  const totalRevenueIdr = allPaidOrders.reduce(
    (sum, order) => sum + (Number(order.amount) || 0),
    0
  );

  return {
    settings: data.settings,
    pendingOrders,
    paidOrders: allPaidOrders.slice(0, 20),
    activePasses,
    auditLogs: data.auditLogs.slice(0, 50),
    stats: {
      pendingCount: pendingOrders.length,
      activePassCount: activePasses.length,
      totalPaidCount: allPaidOrders.length,
      totalRevenueIdr,
    },
    priceIdr: data.settings.priceIdr,
    passDurationHours: data.settings.passDurationHours,
  };
}
