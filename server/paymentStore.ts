import fs from 'node:fs';
import path from 'node:path';

export const TOKEN_PRICE_IDR = 5000;
export const PASS_DURATION_MS = 24 * 60 * 60 * 1000;

export type OrderStatus = 'pending' | 'paid' | 'expired';

export interface PaymentOrderRecord {
  orderId: string;
  uid: string;
  email: string;
  displayName: string;
  mobile: string;
  amount: number;
  status: OrderStatus;
  mayarInvoiceId: string;
  mayarTransactionId: string;
  paymentUrl: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  passExpiresAt: string | null;
}

export interface UserPassRecord {
  uid: string;
  email: string;
  expiresAt: string;
  lastOrderId: string;
  updatedAt: string;
}

interface PaymentLedgerData {
  orders: Record<string, PaymentOrderRecord>;
  passes: Record<string, UserPassRecord>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LEDGER_PATH = path.join(DATA_DIR, 'payments.json');

let cache: PaymentLedgerData | null = null;

function ensureLedgerLoaded(): PaymentLedgerData {
  if (cache) return cache;
  try {
    if (fs.existsSync(LEDGER_PATH)) {
      const raw = fs.readFileSync(LEDGER_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PaymentLedgerData>;
      cache = {
        orders:
          parsed.orders && typeof parsed.orders === 'object' ? parsed.orders : {},
        passes:
          parsed.passes && typeof parsed.passes === 'object' ? parsed.passes : {},
      };
      return cache;
    }
  } catch (err) {
    console.error('Failed to read payment ledger, starting fresh:', err);
  }
  cache = { orders: {}, passes: {} };
  return cache;
}

function flushLedger(data: PaymentLedgerData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${LEDGER_PATH}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, LEDGER_PATH);
  } catch (err) {
    console.error('Failed to persist payment ledger:', err);
  }
}

export function getOrderById(orderId: string): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  return data.orders[orderId] ?? null;
}

export function findOrderByMayarIdentifiers(
  invoiceId?: string,
  transactionId?: string,
  orderId?: string
): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  if (orderId && data.orders[orderId]) {
    return data.orders[orderId];
  }
  const all = Object.values(data.orders);
  for (const order of all) {
    if (invoiceId && order.mayarInvoiceId === invoiceId) return order;
    if (transactionId && order.mayarTransactionId === transactionId) return order;
  }
  return null;
}

export function getActivePendingOrderForUser(uid: string): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  const now = Date.now();
  const pending = Object.values(data.orders)
    .filter((order) => order.uid === uid && order.status === 'pending')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  for (const order of pending) {
    const expMs = Date.parse(order.expiresAt);
    if (!Number.isNaN(expMs) && expMs > now) {
      return order;
    }
    order.status = 'expired';
  }
  flushLedger(data);
  return null;
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
  data.orders[order.orderId] = order;
  flushLedger(data);
  return order;
}

export function activatePassForOrder(
  orderId: string,
  mayarTransactionId?: string
): PaymentOrderRecord | null {
  const data = ensureLedgerLoaded();
  const order = data.orders[orderId];
  if (!order) return null;

  // Idempotent guard: never extend twice for the same paid invoice
  if (order.status === 'paid') {
    if (mayarTransactionId && !order.mayarTransactionId) {
      order.mayarTransactionId = mayarTransactionId;
      flushLedger(data);
    }
    return order;
  }

  const nowMs = Date.now();
  const existingPass = data.passes[order.uid];
  const existingExpiryMs = existingPass ? Date.parse(existingPass.expiresAt) : 0;
  const baseMs =
    !Number.isNaN(existingExpiryMs) && existingExpiryMs > nowMs
      ? existingExpiryMs
      : nowMs;

  const passExpiresAt = new Date(baseMs + PASS_DURATION_MS).toISOString();
  const paidAt = new Date(nowMs).toISOString();

  order.status = 'paid';
  order.paidAt = paidAt;
  order.passExpiresAt = passExpiresAt;
  if (mayarTransactionId) {
    order.mayarTransactionId = mayarTransactionId;
  }

  data.passes[order.uid] = {
    uid: order.uid,
    email: order.email,
    expiresAt: passExpiresAt,
    lastOrderId: order.orderId,
    updatedAt: paidAt,
  };

  flushLedger(data);
  return order;
}

export function getUserPassSummary(uid: string) {
  const data = ensureLedgerLoaded();
  const pass = data.passes[uid] ?? null;
  const nowMs = Date.now();
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
