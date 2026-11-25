import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  activatePassForOrder,
  findOrderByMayarIdentifiers,
  getActivePendingOrderForUser,
  getOrderById,
  getUserPassSummary,
  PASS_DURATION_MS,
  saveOrder,
  TOKEN_PRICE_IDR,
} from './server/paymentStore.ts';

interface FirebaseAppletConfig {
  projectId?: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    name: string;
  };
}

function loadFirebaseProjectId(): string {
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    const raw = fs.readFileSync(cfgPath, 'utf8');
    const parsed = JSON.parse(raw) as FirebaseAppletConfig;
    return parsed.projectId?.trim() || '';
  } catch {
    return '';
  }
}

const FIREBASE_PROJECT_ID = loadFirebaseProjectId();
const adminApp = getApps().length
  ? getApp()
  : initializeApp(FIREBASE_PROJECT_ID ? { projectId: FIREBASE_PROJECT_ID } : {});
const adminAuth = getAuth(adminApp);

const MAYAR_ENV = process.env.MAYAR_ENV?.trim().toLowerCase() === 'production'
  ? 'production'
  : 'sandbox';
const MAYAR_BASE_URL =
  MAYAR_ENV === 'production' ? 'https://api.mayar.id' : 'https://api.mayar.io';
const MAYAR_API_KEY = process.env.MAYAR_API_KEY?.trim() || '';
const MAYAR_WEBHOOK_TOKEN = process.env.MAYAR_WEBHOOK_TOKEN?.trim() || '';

function safeCompareTokens(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizePhoneNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.startsWith('62')) {
    return `0${digits.slice(2)}`;
  }
  return digits.startsWith('0') ? digits : `0${digits}`;
}

function resolveTrustedOrigin(req: Request): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl && /^https?:\/\//i.test(envUrl) && !envUrl.includes('MY_APP_URL')) {
    return envUrl.replace(/\/+$/, '');
  }
  const forwardedProto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const proto = forwardedProto === 'http' ? 'http' : 'https';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000')
    .split(',')[0]
    .trim();
  return `${proto}://${host}`;
}

function isPaidStatus(statusValue: unknown): boolean {
  if (typeof statusValue !== 'string') return false;
  const s = statusValue.trim().toLowerCase();
  return s === 'paid' || s === 'settled' || s === 'success' || s === 'completed';
}

async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Silakan masuk dengan Google terlebih dahulu.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Token autentikasi tidak ditemukan.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.uid || !decoded.email) {
      res.status(401).json({ error: 'Akun Google tidak memiliki email terverifikasi.' });
      return;
    }
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email,
      name:
        (typeof decoded.name === 'string' && decoded.name.trim()) ||
        decoded.email.split('@')[0] ||
        'Pengguna GridRumus',
    };
    next();
  } catch (err) {
    console.error('Firebase token verification error:', err);
    res.status(401).json({ error: 'Sesi login tidak valid atau kedaluwarsa. Silakan masuk ulang.' });
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '256kb' }));

  // 1. Cek status token harian 24 jam milik user saat ini
  app.get(
    '/api/payments/status',
    requireFirebaseAuth,
    (req: AuthenticatedRequest, res: Response) => {
      const uid = req.authUser!.uid;
      const summary = getUserPassSummary(uid);
      res.json({
        ...summary,
        priceIdr: TOKEN_PRICE_IDR,
        passDurationHours: Math.round(PASS_DURATION_MS / (60 * 60 * 1000)),
        mayarConfigured: Boolean(MAYAR_API_KEY),
        mayarEnv: MAYAR_ENV,
      });
    }
  );

  // 2. Buat tagihan Rp5.000 otomatis via Mayar.id Headless API
  app.post(
    '/api/payments/create-invoice',
    requireFirebaseAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!MAYAR_API_KEY) {
        res.status(503).json({
          code: 'MAYAR_NOT_CONFIGURED',
          error:
            'Kunci API Mayar (MAYAR_API_KEY) belum diatur pada konfigurasi server. Tambahkan MAYAR_API_KEY di panel Secrets.',
        });
        return;
      }

      const { uid, email, name } = req.authUser!;
      const normalizedMobile = normalizePhoneNumber(req.body?.mobile);
      if (!normalizedMobile) {
        res.status(400).json({
          error: 'Masukkan nomor WhatsApp/HP aktif (9–15 digit angka) untuk pembuatan tagihan Mayar.id.',
        });
        return;
      }

      // Reuse active pending order created within the last 30 mins to prevent duplicate invoices
      const existingPending = getActivePendingOrderForUser(uid);
      if (existingPending) {
        res.json({
          order: existingPending,
          passStatus: getUserPassSummary(uid),
        });
        return;
      }

      const orderId = `GR-PASS-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const invoiceExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const origin = resolveTrustedOrigin(req);
      const redirectUrl = `${origin}/?payment=checking&orderId=${encodeURIComponent(orderId)}#latihan-soal`;

      try {
        const mayarResp = await fetch(`${MAYAR_BASE_URL}/hl/v1/invoice/create`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${MAYAR_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name.slice(0, 100),
            email: email.slice(0, 120),
            mobile: normalizedMobile,
            redirectUrl,
            description: `Token Harian GridRumus 24 Jam (${orderId})`,
            expiredAt: invoiceExpiresAt,
            items: [
              {
                quantity: 1,
                rate: TOKEN_PRICE_IDR,
                description: 'Token Akses Penuh Arena Latihan Soal GridRumus (24 Jam)',
              },
            ],
            extraData: {
              orderId,
              uid,
              product: 'gridrumus-daily-pass-24h',
            },
          }),
        });

        const rawText = await mayarResp.text();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          parsed = {};
        }

        const dataObj =
          parsed.data && typeof parsed.data === 'object'
            ? (parsed.data as Record<string, unknown>)
            : {};

        const mayarInvoiceId = typeof dataObj.id === 'string' ? dataObj.id : '';
        const mayarTxId =
          typeof dataObj.transactionId === 'string' ? dataObj.transactionId : '';
        const paymentUrl =
          typeof dataObj.link === 'string'
            ? dataObj.link
            : typeof dataObj.paymentUrl === 'string'
            ? dataObj.paymentUrl
            : '';

        if (!mayarResp.ok || !mayarInvoiceId || !paymentUrl) {
          console.error('Mayar create-invoice failed:', mayarResp.status, rawText);
          res.status(502).json({
            error:
              (typeof parsed.messages === 'string' && parsed.messages) ||
              (typeof parsed.message === 'string' && parsed.message) ||
              'Gagal membuat tagihan pembayaran ke Mayar.id. Periksa MAYAR_API_KEY dan mode MAYAR_ENV.',
          });
          return;
        }

        const createdOrder = saveOrder({
          orderId,
          uid,
          email,
          displayName: name,
          mobile: normalizedMobile,
          amount: TOKEN_PRICE_IDR,
          status: 'pending',
          mayarInvoiceId,
          mayarTransactionId: mayarTxId,
          paymentUrl,
          createdAt: new Date().toISOString(),
          expiresAt: invoiceExpiresAt,
          paidAt: null,
          passExpiresAt: null,
        });

        res.json({
          order: createdOrder,
          passStatus: getUserPassSummary(uid),
        });
      } catch (err) {
        console.error('Error calling Mayar create-invoice:', err);
        res.status(502).json({
          error: 'Tidak dapat terhubung ke server Mayar.id saat membuat invoice.',
        });
      }
    }
  );

  // 3. Verifikasi langsung status invoice ke Mayar API (fallback bila webhook belum masuk)
  app.post(
    '/api/payments/verify',
    requireFirebaseAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      const uid = req.authUser!.uid;
      const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';

      const order = orderId
        ? getOrderById(orderId)
        : getActivePendingOrderForUser(uid);

      if (!order || order.uid !== uid) {
        res.status(404).json({ error: 'Tagihan pembayaran tidak ditemukan untuk akun ini.' });
        return;
      }

      if (order.status === 'paid') {
        res.json({
          verified: true,
          order,
          passStatus: getUserPassSummary(uid),
        });
        return;
      }

      if (!MAYAR_API_KEY) {
        res.status(503).json({
          code: 'MAYAR_NOT_CONFIGURED',
          error: 'MAYAR_API_KEY belum diatur pada konfigurasi server.',
        });
        return;
      }

      try {
        const detailResp = await fetch(
          `${MAYAR_BASE_URL}/hl/v1/invoice/${encodeURIComponent(order.mayarInvoiceId)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${MAYAR_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const rawText = await detailResp.text();
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(rawText) as Record<string, unknown>;
        } catch {
          parsed = {};
        }

        const dataNode = Array.isArray(parsed.data)
          ? (parsed.data[0] as Record<string, unknown> | undefined)
          : parsed.data && typeof parsed.data === 'object'
          ? (parsed.data as Record<string, unknown>)
          : undefined;

        const remoteStatus =
          dataNode && typeof dataNode.status === 'string' ? dataNode.status : 'unpaid';
        const remoteAmount =
          dataNode && typeof dataNode.amount === 'number' ? dataNode.amount : order.amount;
        const remoteTxId =
          dataNode && typeof dataNode.transactionId === 'string'
            ? dataNode.transactionId
            : order.mayarTransactionId;

        if (detailResp.ok && isPaidStatus(remoteStatus) && remoteAmount >= TOKEN_PRICE_IDR) {
          const updatedOrder = activatePassForOrder(order.orderId, remoteTxId);
          res.json({
            verified: true,
            order: updatedOrder,
            passStatus: getUserPassSummary(uid),
          });
          return;
        }

        res.json({
          verified: false,
          remoteStatus,
          order,
          passStatus: getUserPassSummary(uid),
        });
      } catch (err) {
        console.error('Error verifying invoice with Mayar:', err);
        res.status(502).json({
          error: 'Gagal memeriksa status tagihan ke server Mayar.id.',
        });
      }
    }
  );

  // 4. Webhook otomatis dari Mayar.id (event: payment.received)
  app.post('/api/payments/mayar/webhook', (req: Request, res: Response) => {
    if (!MAYAR_WEBHOOK_TOKEN) {
      res.status(503).json({
        error: 'MAYAR_WEBHOOK_TOKEN belum dikonfigurasi pada server.',
      });
      return;
    }

    const queryToken = typeof req.query.token === 'string' ? req.query.token.trim() : '';
    const headerCallbackToken =
      typeof req.headers['x-callback-token'] === 'string'
        ? req.headers['x-callback-token'].trim()
        : '';
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    const candidateToken = queryToken || headerCallbackToken || bearerToken;
    if (!candidateToken || !safeCompareTokens(candidateToken, MAYAR_WEBHOOK_TOKEN)) {
      res.status(401).json({ error: 'Token webhook tidak valid.' });
      return;
    }

    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<
      string,
      unknown
    >;
    const eventName = typeof body.event === 'string' ? body.event.trim() : '';
    const data = (
      body.data && typeof body.data === 'object' ? body.data : body
    ) as Record<string, unknown>;

    const statusValue = data.status ?? body.status;
    if (eventName && eventName !== 'payment.received') {
      res.status(200).json({ ok: true, ignored: true, event: eventName });
      return;
    }
    if (statusValue && !isPaidStatus(statusValue)) {
      res.status(200).json({ ok: true, ignored: true, status: statusValue });
      return;
    }

    const extraData =
      data.extraData && typeof data.extraData === 'object'
        ? (data.extraData as Record<string, unknown>)
        : {};
    const extraOrderId =
      typeof extraData.orderId === 'string' ? extraData.orderId : undefined;
    const descMatch =
      typeof data.productDescription === 'string'
        ? data.productDescription.match(/GR-PASS-[A-Z0-9-]+/)
        : typeof data.description === 'string'
        ? data.description.match(/GR-PASS-[A-Z0-9-]+/)
        : null;

    const orderId = extraOrderId || (descMatch ? descMatch[0] : undefined);
    const invoiceId =
      typeof data.paymentLinkId === 'string'
        ? data.paymentLinkId
        : typeof data.id === 'string'
        ? data.id
        : undefined;
    const txId =
      typeof data.transactionId === 'string'
        ? data.transactionId
        : typeof data.id === 'string'
        ? data.id
        : undefined;

    const matchedOrder = findOrderByMayarIdentifiers(invoiceId, txId, orderId);
    if (!matchedOrder) {
      res.status(202).json({ ok: true, matched: false });
      return;
    }

    const numericAmount =
      typeof data.amount === 'number'
        ? data.amount
        : typeof data.nettAmount === 'number'
        ? data.nettAmount
        : matchedOrder.amount;

    if (numericAmount < TOKEN_PRICE_IDR) {
      res.status(400).json({ error: 'Nominal pembayaran kurang dari harga token.' });
      return;
    }

    const activated = activatePassForOrder(matchedOrder.orderId, txId);
    res.status(200).json({
      ok: true,
      matched: true,
      orderId: activated?.orderId,
      passExpiresAt: activated?.passExpiresAt,
    });
  });

  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`GridRumus server running on http://0.0.0.0:${port}`);
  });
}

void startServer();
