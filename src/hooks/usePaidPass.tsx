import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from './useAuth';

export interface PaidOrderSummary {
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
  paymentUrl: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  passExpiresAt: string | null;
}

interface PassStatusResponse {
  hasActivePass: boolean;
  expiresAt: string | null;
  remainingSeconds: number;
  pendingOrder: PaidOrderSummary | null;
  recentOrders: PaidOrderSummary[];
  priceIdr?: number;
  passDurationHours?: number;
  mayarConfigured?: boolean;
  mayarEnv?: 'sandbox' | 'production';
}

interface PaidPassContextValue {
  hasActivePass: boolean;
  expiresAt: string | null;
  remainingSeconds: number;
  pendingOrder: PaidOrderSummary | null;
  recentOrders: PaidOrderSummary[];
  priceIdr: number;
  passDurationHours: number;
  mayarConfigured: boolean;
  mayarEnv: 'sandbox' | 'production';
  statusLoading: boolean;
  actionLoading: boolean;
  paywallError: string | null;
  paywallErrorCode: string | null;
  isPaywallOpen: boolean;
  paywallFeatureLabel: string;
  openPaywall: (featureLabel?: string) => void;
  closePaywall: () => void;
  clearPaywallError: () => void;
  refreshPassStatus: () => Promise<void>;
  createInvoice: (mobile: string) => Promise<boolean>;
  verifyPendingPayment: (orderId?: string) => Promise<boolean>;
}

const PaidPassContext = createContext<PaidPassContextValue | null>(null);

export function formatRemainingHoursMinutes(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours} jam ${mins} menit`;
  }
  if (mins > 0) {
    return `${mins} menit ${secs} detik`;
  }
  return `${secs} detik`;
}

export function PaidPassProvider({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth();

  const [hasActivePass, setHasActivePass] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [pendingOrder, setPendingOrder] = useState<PaidOrderSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<PaidOrderSummary[]>([]);
  const [priceIdr, setPriceIdr] = useState(5000);
  const [passDurationHours, setPassDurationHours] = useState(24);
  const [mayarConfigured, setMayarConfigured] = useState(true);
  const [mayarEnv, setMayarEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paywallError, setPaywallError] = useState<string | null>(null);
  const [paywallErrorCode, setPaywallErrorCode] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallFeatureLabel, setPaywallFeatureLabel] = useState(
    'Seluruh Mode Arena Latihan Soal'
  );

  const checkedRedirectRef = useRef(false);

  const applyServerSummary = useCallback((data: PassStatusResponse) => {
    setHasActivePass(Boolean(data.hasActivePass));
    setExpiresAt(data.expiresAt ?? null);
    setRemainingSeconds(data.remainingSeconds ?? 0);
    setPendingOrder(data.pendingOrder ?? null);
    setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
    if (typeof data.priceIdr === 'number') setPriceIdr(data.priceIdr);
    if (typeof data.passDurationHours === 'number') {
      setPassDurationHours(data.passDurationHours);
    }
    if (typeof data.mayarConfigured === 'boolean') {
      setMayarConfigured(data.mayarConfigured);
    }
    if (data.mayarEnv === 'production' || data.mayarEnv === 'sandbox') {
      setMayarEnv(data.mayarEnv);
    }
  }, []);

  const refreshPassStatus = useCallback(async () => {
    if (!user) {
      setHasActivePass(false);
      setExpiresAt(null);
      setRemainingSeconds(0);
      setPendingOrder(null);
      setRecentOrders([]);
      return;
    }

    setStatusLoading(true);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        return;
      }
      const data = (await resp.json()) as PassStatusResponse;
      applyServerSummary(data);
    } catch (err) {
      console.error('Failed to check token pass status:', err);
    } finally {
      setStatusLoading(false);
    }
  }, [user, applyServerSummary]);

  const verifyPendingPayment = useCallback(
    async (orderId?: string): Promise<boolean> => {
      if (!user) return false;
      setActionLoading(true);
      setPaywallError(null);
      setPaywallErrorCode(null);
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId || pendingOrder?.orderId || '',
          }),
        });
        const data = (await resp.json()) as {
          verified?: boolean;
          remoteStatus?: string;
          error?: string;
          code?: string;
          passStatus?: PassStatusResponse;
        };

        if (data.passStatus) {
          applyServerSummary(data.passStatus);
        }

        if (!resp.ok) {
          setPaywallErrorCode(data.code ?? null);
          setPaywallError(data.error || 'Gagal memeriksa status pembayaran.');
          return false;
        }

        if (!data.verified) {
          setPaywallError(
            'Pembayaran belum berstatus lunas di Mayar.id. Jika Anda baru saja transfer/scan QRIS, tunggu beberapa detik lalu cek ulang.'
          );
          return false;
        }

        return true;
      } catch {
        setPaywallError('Tidak dapat terhubung ke server untuk memverifikasi pembayaran.');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [user, pendingOrder?.orderId, applyServerSummary]
  );

  useEffect(() => {
    if (!authReady) return;
    void refreshPassStatus();
  }, [authReady, user, refreshPassStatus]);

  // Auto-handle Mayar redirect callback (?payment=checking&orderId=...)
  useEffect(() => {
    if (!authReady || !user || checkedRedirectRef.current) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'checking') {
      checkedRedirectRef.current = true;
      const orderId = params.get('orderId') || undefined;
      const cleanUrl = `${window.location.pathname}${window.location.hash || '#latihan-soal'}`;
      window.history.replaceState({}, '', cleanUrl);
      setIsPaywallOpen(true);
      void verifyPendingPayment(orderId);
    }
  }, [authReady, user, verifyPendingPayment]);

  // Keep live countdown synchronized with expiresAt
  useEffect(() => {
    if (!hasActivePass || !expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTick = () => {
      const diffSec = Math.max(
        0,
        Math.floor((Date.parse(expiresAt) - Date.now()) / 1000)
      );
      setRemainingSeconds(diffSec);
      if (diffSec === 0) {
        setHasActivePass(false);
        setExpiresAt(null);
      }
    };

    updateTick();
    const timer = window.setInterval(updateTick, 1000);
    return () => window.clearInterval(timer);
  }, [hasActivePass, expiresAt]);

  const openPaywall = useCallback((featureLabel?: string) => {
    setPaywallError(null);
    setPaywallErrorCode(null);
    if (featureLabel) {
      setPaywallFeatureLabel(featureLabel);
    } else {
      setPaywallFeatureLabel('Seluruh Mode Arena Latihan Soal');
    }
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
    setPaywallError(null);
    setPaywallErrorCode(null);
  }, []);

  const clearPaywallError = useCallback(() => {
    setPaywallError(null);
    setPaywallErrorCode(null);
  }, []);

  const createInvoice = useCallback(
    async (mobile: string): Promise<boolean> => {
      if (!user) return false;
      setActionLoading(true);
      setPaywallError(null);
      setPaywallErrorCode(null);
      try {
        const token = await user.getIdToken();
        const resp = await fetch('/api/payments/create-invoice', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mobile }),
        });

        const data = (await resp.json()) as {
          order?: PaidOrderSummary;
          passStatus?: PassStatusResponse;
          error?: string;
          code?: string;
        };

        if (data.passStatus) {
          applyServerSummary(data.passStatus);
        } else if (data.order) {
          setPendingOrder(data.order);
        }

        if (!resp.ok) {
          setPaywallErrorCode(data.code ?? null);
          setPaywallError(data.error || 'Gagal membuat invoice pembayaran Mayar.id.');
          return false;
        }

        return true;
      } catch {
        setPaywallError('Gagal menghubungi server pembayaran. Coba beberapa saat lagi.');
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [user, applyServerSummary]
  );

  const value = useMemo<PaidPassContextValue>(
    () => ({
      hasActivePass,
      expiresAt,
      remainingSeconds,
      pendingOrder,
      recentOrders,
      priceIdr,
      passDurationHours,
      mayarConfigured,
      mayarEnv,
      statusLoading,
      actionLoading,
      paywallError,
      paywallErrorCode,
      isPaywallOpen,
      paywallFeatureLabel,
      openPaywall,
      closePaywall,
      clearPaywallError,
      refreshPassStatus,
      createInvoice,
      verifyPendingPayment,
    }),
    [
      hasActivePass,
      expiresAt,
      remainingSeconds,
      pendingOrder,
      recentOrders,
      priceIdr,
      passDurationHours,
      mayarConfigured,
      mayarEnv,
      statusLoading,
      actionLoading,
      paywallError,
      paywallErrorCode,
      isPaywallOpen,
      paywallFeatureLabel,
      openPaywall,
      closePaywall,
      clearPaywallError,
      refreshPassStatus,
      createInvoice,
      verifyPendingPayment,
    ]
  );

  return <PaidPassContext.Provider value={value}>{children}</PaidPassContext.Provider>;
}

export function usePaidPass() {
  const ctx = useContext(PaidPassContext);
  if (!ctx) {
    throw new Error('usePaidPass must be used within PaidPassProvider');
  }
  return ctx;
}
