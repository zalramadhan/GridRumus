import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  approveOrderByAdmin,
  cancelOrderByAdmin,
  getActivePendingOrderForUser,
  getAdminPaymentsOverview,
  getUserPassSummary,
  getWhatsAppSettings,
  grantPassByEmail,
  isValidOrderId,
  normalizeWhatsAppNumber,
  revokePass,
  saveOrder,
  updateWhatsAppSettings,
} from './server/paymentStore.ts';

const ADMIN_EMAIL = 'rizaldyramadhan@gmail.com';

interface FirebaseAppletConfig {
  projectId?: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    name: string;
  };
}

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

// Periodically prune expired rate-limit entries to prevent unbounded memory growth
const pruneTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000);
pruneTimer.unref();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 64);
  }
  return (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 64);
}

function createRateLimiter(bucketName: string, maxRequests: number, windowMs: number) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const identity = req.authUser?.uid || getClientIp(req);
    const key = `${bucketName}:${identity}`;
    const existing = rateBuckets.get(key);

    if (!existing || existing.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        error: 'Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu sebentar lalu coba lagi.',
      });
      return;
    }

    existing.count += 1;
    next();
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
  if (!token || token.length > 4096) {
    res.status(401).json({ error: 'Token autentikasi tidak valid.' });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.uid || !decoded.email || decoded.email_verified !== true) {
      res.status(401).json({ error: 'Akun Google harus memiliki email yang terverifikasi.' });
      return;
    }
    req.authUser = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: true,
      name:
        (typeof decoded.name === 'string' && decoded.name.trim()) ||
        decoded.email.split('@')[0] ||
        'Pengguna GridRumus',
    };
    next();
  } catch (err) {
    console.error('Firebase token verification error:', err);
    res.status(401).json({
      error: 'Sesi login tidak valid atau kedaluwarsa. Silakan masuk ulang.',
    });
  }
}

function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const user = req.authUser;
  if (!user || !user.emailVerified || user.email.toLowerCase() !== ADMIN_EMAIL) {
    res.status(403).json({ error: 'Akses ditolak. Khusus akun admin terverifikasi.' });
    return;
  }
  next();
}

function requireJsonContentType(req: Request, res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    if (!ct.toLowerCase().includes('application/json')) {
      res.status(415).json({ error: 'Permintaan harus menggunakan Content-Type application/json.' });
      return;
    }
  }
  next();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers compatible with iframe preview & Google Sign-In popup
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  app.use('/api/*', requireJsonContentType);
  app.use('/api/*', express.json({ limit: '64kb' }));

  // Malformed JSON error handler
  app.use(
    (err: unknown, req: Request, res: Response, next: NextFunction): void => {
      if (err instanceof SyntaxError && req.path.startsWith('/api/')) {
        res.status(400).json({ error: 'Format data JSON tidak valid.' });
        return;
      }
      next(err);
    }
  );

  const statusRateLimit = createRateLimiter('status', 60, 60 * 1000);
  const createOrderRateLimit = createRateLimiter('create-order', 10, 60 * 1000);
  const adminRateLimit = createRateLimiter('admin', 60, 60 * 1000);

  // 1. Cek status token harian milik user saat ini + info WhatsApp admin
  app.get(
    '/api/payments/status',
    requireFirebaseAuth,
    statusRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const { uid, email } = req.authUser!;
      const summary = getUserPassSummary(uid, email);
      const waSettings = getWhatsAppSettings();
      res.json({
        ...summary,
        priceIdr: waSettings.priceIdr,
        passDurationHours: waSettings.passDurationHours,
        whatsappConfigured: Boolean(waSettings.whatsappNumber),
        whatsappNumber: waSettings.whatsappNumber,
        paymentNote: waSettings.paymentNote,
      });
    }
  );

  // 2. Buat pesanan Token Harian untuk diteruskan ke chat WhatsApp Admin
  app.post(
    '/api/payments/create-whatsapp-order',
    requireFirebaseAuth,
    createOrderRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const waSettings = getWhatsAppSettings();
      if (!waSettings.whatsappNumber) {
        res.status(503).json({
          code: 'WHATSAPP_NOT_CONFIGURED',
          error:
            'Nomor WhatsApp Admin belum diatur. Pemilik aplikasi dapat mengaturnya di Admin Panel.',
        });
        return;
      }

      const { uid, email, name } = req.authUser!;
      const existingPending = getActivePendingOrderForUser(uid);
      if (existingPending) {
        res.json({
          order: existingPending,
          passStatus: getUserPassSummary(uid, email),
          whatsappNumber: waSettings.whatsappNumber,
          paymentNote: waSettings.paymentNote,
          priceIdr: waSettings.priceIdr,
          passDurationHours: waSettings.passDurationHours,
        });
        return;
      }

      const orderId = `GR-WA-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const createdOrder = saveOrder({
        orderId,
        uid,
        email,
        displayName: name,
        amount: waSettings.priceIdr,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt,
        paidAt: null,
        passExpiresAt: null,
        approvedByEmail: null,
      });

      res.json({
        order: createdOrder,
        passStatus: getUserPassSummary(uid, email),
        whatsappNumber: waSettings.whatsappNumber,
        paymentNote: waSettings.paymentNote,
        priceIdr: waSettings.priceIdr,
        passDurationHours: waSettings.passDurationHours,
      });
    }
  );

  // 3. Admin: Ambil ringkasan dashboard, pengaturan WhatsApp, antrean order, token aktif, dan audit log
  app.get(
    '/api/payments/admin/overview',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (_req: AuthenticatedRequest, res: Response) => {
      res.json(getAdminPaymentsOverview());
    }
  );

  // 4. Admin: Simpan nomor WhatsApp tujuan, catatan pembayaran, harga token, dan masa aktif
  app.post(
    '/api/payments/admin/settings',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const rawNumber = typeof req.body?.whatsappNumber === 'string' ? req.body.whatsappNumber : '';
      const rawNote = typeof req.body?.paymentNote === 'string' ? req.body.paymentNote : '';
      const rawPrice = req.body?.priceIdr;
      const rawHours = req.body?.passDurationHours;
      const normalized = normalizeWhatsAppNumber(rawNumber);

      if (!normalized) {
        res.status(400).json({
          error:
            'Masukkan nomor WhatsApp Admin yang valid (9–15 digit, mis. 081234567890 atau 6281234567890).',
        });
        return;
      }

      const numPrice = Number(rawPrice);
      if (rawPrice !== undefined && (!Number.isFinite(numPrice) || numPrice < 1000 || numPrice > 1000000)) {
        res.status(400).json({
          error: 'Harga token harus antara Rp1.000 hingga Rp1.000.000.',
        });
        return;
      }

      const numHours = Number(rawHours);
      if (rawHours !== undefined && (!Number.isFinite(numHours) || numHours < 1 || numHours > 720)) {
        res.status(400).json({
          error: 'Masa aktif token harus antara 1 hingga 720 jam.',
        });
        return;
      }

      const updated = updateWhatsAppSettings(
        normalized,
        rawNote,
        req.authUser!.email,
        rawPrice,
        rawHours
      );
      res.json({
        settings: updated,
        overview: getAdminPaymentsOverview(),
      });
    }
  );

  // 5. Admin: Setujui & aktifkan token dari daftar order WhatsApp
  app.post(
    '/api/payments/admin/approve-order',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
      if (!isValidOrderId(orderId)) {
        res.status(400).json({ error: 'Format kode order tidak valid.' });
        return;
      }

      const approved = approveOrderByAdmin(orderId, req.authUser!.email);
      if (!approved) {
        res.status(404).json({ error: 'Order tidak ditemukan.' });
        return;
      }

      res.json({
        order: approved,
        overview: getAdminPaymentsOverview(),
      });
    }
  );

  // 6. Admin: Batalkan / bersihkan order pending yang tidak dibayar
  app.post(
    '/api/payments/admin/cancel-order',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId.trim() : '';
      if (!isValidOrderId(orderId)) {
        res.status(400).json({ error: 'Format kode order tidak valid.' });
        return;
      }

      const cancelled = cancelOrderByAdmin(orderId, req.authUser!.email);
      if (!cancelled) {
        res.status(404).json({ error: 'Order pending tidak ditemukan.' });
        return;
      }

      res.json({
        ok: true,
        overview: getAdminPaymentsOverview(),
      });
    }
  );

  // 7. Admin: Aktifkan token langsung via Email Google pengguna
  app.post(
    '/api/payments/admin/grant-by-email',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const targetEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      if (!isValidEmail(targetEmail)) {
        res.status(400).json({ error: 'Masukkan alamat email Google pengguna yang valid.' });
        return;
      }

      const granted = grantPassByEmail(targetEmail, req.authUser!.email);
      res.json({
        granted,
        overview: getAdminPaymentsOverview(),
      });
    }
  );

  // 8. Admin: Nonaktifkan token aktif jika terjadi kesalahan input
  app.post(
    '/api/payments/admin/revoke-pass',
    requireFirebaseAuth,
    requireAdminAuth,
    adminRateLimit,
    (req: AuthenticatedRequest, res: Response) => {
      const targetId = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
      if (!targetId || targetId.length > 254) {
        res.status(400).json({ error: 'ID atau email token wajib diisi dengan benar.' });
        return;
      }

      revokePass(targetId, req.authUser!.email);
      res.json({
        ok: true,
        overview: getAdminPaymentsOverview(),
      });
    }
  );

  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint API tidak ditemukan.' });
  });

  // Final sanitized API error handler (prevents leaking stack traces)
  app.use((err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith('/api/')) {
      console.error('Unhandled API error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
      }
      return;
    }
    next(err);
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
