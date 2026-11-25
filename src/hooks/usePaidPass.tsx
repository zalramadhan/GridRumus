import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './useAuth';

export interface PaidOrderSummary {
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
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
  whatsappConfigured?: boolean;
  whatsappNumber?: string;
  paymentNote?: string;
}

export type AdminPanelTab = 'orders' | 'settings' | 'promo';

interface PaidPassContextValue {
  hasActivePass: boolean;
  expiresAt: string | null;
  remainingSeconds: number;
  pendingOrder: PaidOrderSummary | null;
  recentOrders: PaidOrderSummary[];
  priceIdr: number;
  passDurationHours: number;
  whatsappConfigured: boolean;
  whatsappNumber: string;
  paymentNote: string;
  statusLoading: boolean;
  actionLoading: boolean;
  paywallError: string | null;
  paywallErrorCode: string | null;
  isPaywallOpen: boolean;
  paywallFeatureLabel: string;
  isTokenAdminOpen: boolean;
  adminPanelTab: AdminPanelTab;
  setAdminPanelTab: (tab: AdminPanelTab) => void;
  openPaywall: (featureLabel?: string) => void;
  closePaywall: () => void;
  openTokenAdmin: (tab?: AdminPanelTab) => void;
  closeTokenAdmin: () => void;
  clearPaywallError: () => void;
  refreshPassStatus: () => Promise<void>;
  createWhatsAppOrder: () => Promise<boolean>;
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

export function buildWhatsAppPaymentMessage(params: {
  orderId: string;
  displayName: string;
  email: string;
  priceIdr: number;
  passDurationHours: number;
}): string {
  const lines = [
    'Halo Admin GridRumus, saya ingin beli Token Latihan Soal:',
    `- Kode Order: ${params.orderId}`,
    `- Nama: ${params.displayName}`,
    `- Email Google: ${params.email}`,
    `- Paket: Token Harian ${params.passDurationHours} Jam (Rp${params.priceIdr.toLocaleString('id-ID')})`,
    '',
    'Mohon info metode transfer/QRIS agar token akun saya bisa diaktifkan. Terima kasih!',
  ];
  return lines.join('\n');
}

export function buildWhatsAppChatUrl(
  whatsappNumber: string,
  message: string
): string {
  const cleanNumber = whatsappNumber.replace(/[^\d]/g, '');
  if (!cleanNumber) return '#';
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
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
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [paywallError, setPaywallError] = useState<string | null>(null);
  const [paywallErrorCode, setPaywallErrorCode] = useState<string | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isTokenAdminOpen, setIsTokenAdminOpen] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<AdminPanelTab>('orders');
  const [paywallFeatureLabel, setPaywallFeatureLabel] = useState(
    'Seluruh Mode Arena Latihan Soal'
  );

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
    if (typeof data.whatsappConfigured === 'boolean') {
      setWhatsappConfigured(data.whatsappConfigured);
    }
    if (typeof data.whatsappNumber === 'string') {
      setWhatsappNumber(data.whatsappNumber);
    }
    if (typeof data.paymentNote === 'string') {
      setPaymentNote(data.paymentNote);
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

  useEffect(() => {
    if (!authReady) return;
    void refreshPassStatus();
  }, [authReady, user, refreshPassStatus]);

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

  const openTokenAdmin = useCallback((tab: AdminPanelTab = 'orders') => {
    setIsPaywallOpen(false);
    setAdminPanelTab(tab);
    setIsTokenAdminOpen(true);
  }, []);

  const closeTokenAdmin = useCallback(() => {
    setIsTokenAdminOpen(false);
  }, []);

  const clearPaywallError = useCallback(() => {
    setPaywallError(null);
    setPaywallErrorCode(null);
  }, []);

  const createWhatsAppOrder = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    setActionLoading(true);
    setPaywallError(null);
    setPaywallErrorCode(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/create-whatsapp-order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = (await resp.json()) as {
        order?: PaidOrderSummary;
        passStatus?: PassStatusResponse;
        whatsappNumber?: string;
        paymentNote?: string;
        error?: string;
        code?: string;
      };

      if (data.passStatus) {
        applyServerSummary({
          ...data.passStatus,
          whatsappNumber: data.whatsappNumber ?? whatsappNumber,
          paymentNote: data.paymentNote ?? paymentNote,
          whatsappConfigured: Boolean(data.whatsappNumber ?? whatsappNumber),
        });
      } else if (data.order) {
        setPendingOrder(data.order);
      }

      if (!resp.ok) {
        setPaywallErrorCode(data.code ?? null);
        setPaywallError(data.error || 'Gagal menyiapkan pesanan WhatsApp.');
        return false;
      }

      return true;
    } catch {
      setPaywallError('Gagal menghubungi server. Coba beberapa saat lagi.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [user, applyServerSummary, whatsappNumber, paymentNote]);

  const value = useMemo<PaidPassContextValue>(
    () => ({
      hasActivePass,
      expiresAt,
      remainingSeconds,
      pendingOrder,
      recentOrders,
      priceIdr,
      passDurationHours,
      whatsappConfigured,
      whatsappNumber,
      paymentNote,
      statusLoading,
      actionLoading,
      paywallError,
      paywallErrorCode,
      isPaywallOpen,
      paywallFeatureLabel,
      isTokenAdminOpen,
      adminPanelTab,
      setAdminPanelTab,
      openPaywall,
      closePaywall,
      openTokenAdmin,
      closeTokenAdmin,
      clearPaywallError,
      refreshPassStatus,
      createWhatsAppOrder,
    }),
    [
      hasActivePass,
      expiresAt,
      remainingSeconds,
      pendingOrder,
      recentOrders,
      priceIdr,
      passDurationHours,
      whatsappConfigured,
      whatsappNumber,
      paymentNote,
      statusLoading,
      actionLoading,
      paywallError,
      paywallErrorCode,
      isPaywallOpen,
      paywallFeatureLabel,
      isTokenAdminOpen,
      adminPanelTab,
      openPaywall,
      closePaywall,
      openTokenAdmin,
      closeTokenAdmin,
      clearPaywallError,
      refreshPassStatus,
      createWhatsAppOrder,
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
