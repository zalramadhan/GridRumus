import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  History,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Megaphone,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import {
  AdminPanelTab,
  buildWhatsAppPaymentMessage,
  formatRemainingHoursMinutes,
  usePaidPass,
} from '../hooks/usePaidPass';
import {
  DEFAULT_PROMO_CONFIG,
  DEFAULT_SHOPEE_BANNER_IMAGE,
  isValidHttpsUrl,
  PromoBannerConfig,
  usePromoConfig,
} from '../hooks/usePromoConfig';

interface AdminOrderItem {
  orderId: string;
  uid: string;
  email: string;
  displayName: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  passExpiresAt: string | null;
  approvedByEmail?: string | null;
}

interface AdminActivePass {
  id: string;
  email: string;
  expiresAt: string;
  updatedAt: string;
  remainingSeconds: number;
}

interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  action:
    | 'settings_updated'
    | 'order_approved'
    | 'order_cancelled'
    | 'pass_granted_email'
    | 'pass_revoked';
  target: string;
  detail: string;
}

interface AdminOverviewResponse {
  settings: {
    whatsappNumber: string;
    paymentNote: string;
    priceIdr: number;
    passDurationHours: number;
    updatedAt: string | null;
    updatedByEmail: string | null;
  };
  pendingOrders: AdminOrderItem[];
  paidOrders: AdminOrderItem[];
  activePasses: AdminActivePass[];
  auditLogs?: AdminAuditLogEntry[];
  stats: {
    pendingCount: number;
    activePassCount: number;
    totalPaidCount: number;
    totalRevenueIdr: number;
  };
  priceIdr: number;
  passDurationHours: number;
}

export function AdminPanelModal() {
  const { user } = useAuth();
  const {
    isAdmin,
    promoConfig,
    triggerPreviewPopup,
    savePromoConfig,
  } = usePromoConfig();
  const {
    isTokenAdminOpen,
    adminPanelTab,
    setAdminPanelTab,
    closeTokenAdmin,
    refreshPassStatus,
  } = usePaidPass();

  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [grantingEmail, setGrantingEmail] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Payment & WhatsApp state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [priceIdrInput, setPriceIdrInput] = useState('5000');
  const [durationHoursInput, setDurationHoursInput] = useState('24');
  const [manualEmail, setManualEmail] = useState('');

  const [pendingOrders, setPendingOrders] = useState<AdminOrderItem[]>([]);
  const [paidOrders, setPaidOrders] = useState<AdminOrderItem[]>([]);
  const [activePasses, setActivePasses] = useState<AdminActivePass[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    activePassCount: 0,
    totalPaidCount: 0,
    totalRevenueIdr: 0,
  });

  // Promo Banner state
  const [promoDraft, setPromoDraft] = useState<PromoBannerConfig>(promoConfig);
  const [previewImgError, setPreviewImgError] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyOverview = useCallback((overview: AdminOverviewResponse) => {
    setWhatsappNumber(overview.settings.whatsappNumber || '');
    setPaymentNote(overview.settings.paymentNote || '');
    setPriceIdrInput(String(overview.settings.priceIdr ?? 5000));
    setDurationHoursInput(String(overview.settings.passDurationHours ?? 24));
    setPendingOrders(overview.pendingOrders || []);
    setPaidOrders(overview.paidOrders || []);
    setActivePasses(overview.activePasses || []);
    setAuditLogs(overview.auditLogs || []);
    if (overview.stats) {
      setStats(overview.stats);
    }
  }, []);

  const loadOverview = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await resp.json()) as AdminOverviewResponse & { error?: string };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal memuat data Admin Panel.');
        return;
      }
      applyOverview(data);
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server untuk memuat Admin Panel.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, applyOverview]);

  useEffect(() => {
    if (isTokenAdminOpen && isAdmin) {
      setPromoDraft(promoConfig);
      setPreviewImgError(false);
      setFeedbackMsg(null);
      setErrorMsg(null);
      void loadOverview();
    }
  }, [isTokenAdminOpen, isAdmin, promoConfig, loadOverview]);

  useEffect(() => {
    setPreviewImgError(false);
  }, [promoDraft.bannerImageUrl]);

  useEffect(() => {
    if (!isTokenAdminOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !savingSettings && !savingPromo) {
        closeTokenAdmin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isTokenAdminOpen, savingSettings, savingPromo, closeTokenAdmin]);

  if (!isAdmin) return null;

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingSettings(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsappNumber,
          paymentNote,
          priceIdr: Number(priceIdrInput),
          passDurationHours: Number(durationHoursInput),
        }),
      });
      const data = (await resp.json()) as {
        overview?: AdminOverviewResponse;
        error?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan pengaturan WhatsApp.');
        return;
      }
      if (data.overview) applyOverview(data.overview);
      await refreshPassStatus();
      setFeedbackMsg('Pengaturan WhatsApp, harga token, dan masa aktif berhasil disimpan.');
    } catch {
      setErrorMsg('Gagal menyimpan pengaturan ke server.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!user) return;
    setBusyId(orderId);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/approve-order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      const data = (await resp.json()) as {
        overview?: AdminOverviewResponse;
        error?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal mengaktifkan order.');
        return;
      }
      if (data.overview) applyOverview(data.overview);
      await refreshPassStatus();
      setFeedbackMsg(`Order ${orderId} disetujui · Token akses pengguna telah aktif!`);
    } catch {
      setErrorMsg('Gagal menghubungi server saat menyetujui order.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    setBusyId(orderId);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/cancel-order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      const data = (await resp.json()) as {
        overview?: AdminOverviewResponse;
        error?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal membatalkan order.');
        return;
      }
      if (data.overview) applyOverview(data.overview);
      await refreshPassStatus();
      setFeedbackMsg(`Order pending ${orderId} dibatalkan.`);
    } catch {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setBusyId(null);
    }
  };

  const handleGrantByEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGrantingEmail(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/grant-by-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: manualEmail }),
      });
      const data = (await resp.json()) as {
        granted?: { email: string };
        overview?: AdminOverviewResponse;
        error?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal mengaktifkan token via email.');
        return;
      }
      if (data.overview) applyOverview(data.overview);
      await refreshPassStatus();
      setManualEmail('');
      setFeedbackMsg(
        `Token berhasil diaktifkan untuk ${data.granted?.email || 'pengguna'}.`
      );
    } catch {
      setErrorMsg('Gagal menghubungi server saat aktivasi manual.');
    } finally {
      setGrantingEmail(false);
    }
  };

  const handleRevokePass = async (id: string, email: string) => {
    if (!user) return;
    setBusyId(id);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const token = await user.getIdToken();
      const resp = await fetch('/api/payments/admin/revoke-pass', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      const data = (await resp.json()) as {
        overview?: AdminOverviewResponse;
        error?: string;
      };
      if (!resp.ok) {
        setErrorMsg(data.error || 'Gagal menonaktifkan token.');
        return;
      }
      if (data.overview) applyOverview(data.overview);
      await refreshPassStatus();
      setFeedbackMsg(`Token untuk ${email} dinonaktifkan.`);
    } catch {
      setErrorMsg('Gagal menghubungi server.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSavePromo = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPromo(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      await savePromoConfig(promoDraft);
      setFeedbackMsg('Perubahan popup iklan Shopee Affiliate berhasil disimpan ke Firestore.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan promo.');
    } finally {
      setSavingPromo(false);
    }
  };

  const formatShortTime = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const previewBannerSrc = promoDraft.bannerImageUrl.trim() || DEFAULT_SHOPEE_BANNER_IMAGE;
  const isPromoUrlValid = isValidHttpsUrl(promoDraft.affiliateUrl);
  const parsedPreviewPrice = Math.max(1000, Number(priceIdrInput) || 5000);
  const parsedPreviewHours = Math.max(1, Number(durationHoursInput) || 24);
  const sampleWaMessage = buildWhatsAppPaymentMessage({
    orderId: 'GR-WA-CONTOH123',
    displayName: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    priceIdr: parsedPreviewPrice,
    passDurationHours: parsedPreviewHours,
  });

  const tabs: { id: AdminPanelTab; label: string; icon: typeof ClipboardList; badge?: number }[] = [
    {
      id: 'orders',
      label: 'Order & Token',
      icon: ClipboardList,
      badge: stats.pendingCount > 0 ? stats.pendingCount : undefined,
    },
    {
      id: 'settings',
      label: 'WhatsApp & Harga',
      icon: Settings,
    },
    {
      id: 'promo',
      label: 'Popup Iklan Shopee',
      icon: Megaphone,
    },
  ];

  return (
    <AnimatePresence>
      {isTokenAdminOpen && (
        <motion.div
          key="admin-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => {
            if (!savingSettings && !savingPromo) closeTokenAdmin();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#041006]/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        >
          <motion.div
            key="admin-panel-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-panel-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] p-5 sm:p-7 text-[#07170B] dark:text-[#FEFEFE] shadow-2xl"
          >
            <button
              type="button"
              onClick={closeTokenAdmin}
              aria-label="Tutup Admin Panel"
              className="absolute right-4 top-4 rounded-full p-2 text-[#5E7064] hover:bg-[#EAF2EC] dark:text-[#8A9A8F] dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Header */}
            <div className="mb-5 pr-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008120] dark:text-[#A2DF20]">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Admin Panel · {user?.email}</span>
                </div>
                <h2
                  id="admin-panel-title"
                  className="mt-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]"
                >
                  Pusat Kontrol GridRumus
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                  Kelola pesanan WhatsApp, aktivasi token 24 jam, harga paket, dan popup iklan Shopee di satu tempat.
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => void loadOverview()}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#041006] dark:hover:bg-[#11281B] px-3.5 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-55 shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Navigasi Admin Panel"
              className="mb-5 flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#EAF2EC] dark:bg-[#041006] p-1.5"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = adminPanelTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setFeedbackMsg(null);
                      setErrorMsg(null);
                      setAdminPanelTab(tab.id);
                    }}
                    className={`relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                        : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-mono font-extrabold tabular-nums ${
                          active
                            ? 'bg-[#A2DF20] text-[#07170B] dark:bg-[#07170B] dark:text-[#A2DF20]'
                            : 'bg-[#008120] text-white dark:bg-[#A2DF20] dark:text-[#07170B]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs text-red-800 dark:text-red-200"
              >
                {errorMsg}
              </div>
            )}

            {feedbackMsg && (
              <div
                role="status"
                className="mb-4 inline-flex w-full items-center gap-2 rounded-xl bg-[#EAF2EC] dark:bg-[#0D2114] px-4 py-2.5 text-xs font-semibold text-[#008120] dark:text-[#A2DF20]"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* TAB 1: ORDER & TOKEN */}
            {adminPanelTab === 'orders' && (
              <div className="space-y-5">
                {!whatsappNumber && (
                  <div className="rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/90 dark:bg-amber-950/35 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-bold">Nomor WhatsApp Admin belum diisi</p>
                        <p className="mt-0.5 opacity-90">
                          Atur nomor WhatsApp tujuan agar pembeli bisa mengirim order pembayaran langsung dari modal latihan.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminPanelTab('settings')}
                      className="rounded-full bg-amber-900 text-white dark:bg-amber-300 dark:text-[#07170B] px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Atur Nomor WA
                    </button>
                  </div>
                )}

                {/* 4 Summary Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-3.5">
                    <div className="text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      Order Pending
                    </div>
                    <div className="mt-1 font-display text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                      {stats.pendingCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-3.5">
                    <div className="text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      Token Aktif
                    </div>
                    <div className="mt-1 font-display text-xl font-extrabold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      {stats.activePassCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-3.5">
                    <div className="text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      Order Disetujui
                    </div>
                    <div className="mt-1 font-display text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                      {stats.totalPaidCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-3.5">
                    <div className="text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      Total Tercatat
                    </div>
                    <div className="mt-1 font-display text-xl font-extrabold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      Rp{stats.totalRevenueIdr.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {/* Aktivasi Manual Cepat */}
                <form
                  onSubmit={(e) => void handleGrantByEmail(e)}
                  className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-4 space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                    <KeyRound className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                    <span>Aktivasi Token Cepat via Email Google</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      required
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder="Masukkan email Google pembeli (mis. budi@gmail.com)"
                      className="flex-1 rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-2.5 text-xs sm:text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={grantingEmail}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2.5 text-xs font-bold text-[#07170B] whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      {grantingEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>Aktifkan {durationHoursInput} Jam</span>
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 items-start">
                  {/* Pending Orders */}
                  <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] overflow-hidden">
                    <div className="bg-[#EAF2EC]/85 dark:bg-[#0A1815] px-4 py-3 flex items-center justify-between text-xs font-bold">
                      <span>Antrean Order WhatsApp ({pendingOrders.length})</span>
                      <span className="font-mono text-[#008120] dark:text-[#A2DF20] tabular-nums">
                        Menunggu Konfirmasi
                      </span>
                    </div>
                    {pendingOrders.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                        Belum ada order pending saat ini.
                      </div>
                    ) : (
                      <ul className="divide-y divide-[#DCE6DF] dark:divide-[#173322]">
                        {pendingOrders.map((order) => (
                          <li
                            key={order.orderId}
                            className="p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                  {order.displayName}
                                </div>
                                <div className="text-[11px] text-[#3D4D42] dark:text-[#B5C4BA] truncate">
                                  {order.email}
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-[#5E7064] dark:text-[#8A9A8F] tabular-nums">
                                  {order.orderId} · {formatShortTime(order.createdAt)}
                                </div>
                              </div>
                              <span className="font-mono text-xs font-bold text-[#008120] dark:text-[#A2DF20] shrink-0 tabular-nums">
                                Rp{order.amount.toLocaleString('id-ID')}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={busyId === order.orderId}
                                onClick={() => void handleApproveOrder(order.orderId)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-3.5 py-1.5 text-xs font-bold text-[#07170B] cursor-pointer disabled:opacity-55"
                              >
                                {busyId === order.orderId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                <span>Aktifkan Token</span>
                              </button>
                              <button
                                type="button"
                                disabled={busyId === order.orderId}
                                onClick={() => void handleCancelOrder(order.orderId)}
                                className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-3 py-1.5 text-xs font-semibold text-[#5E7064] dark:text-[#B5C4BA] cursor-pointer disabled:opacity-55"
                              >
                                <span>Batalkan</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Token Aktif & Riwayat */}
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] overflow-hidden">
                      <div className="bg-[#EAF2EC]/85 dark:bg-[#0A1815] px-4 py-3 flex items-center justify-between text-xs font-bold">
                        <span>Token Aktif Saat Ini ({activePasses.length})</span>
                        <Clock className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                      </div>
                      {activePasses.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                          Belum ada pengguna dengan token aktif.
                        </div>
                      ) : (
                        <ul className="divide-y divide-[#DCE6DF] dark:divide-[#173322]">
                          {activePasses.map((pass) => (
                            <li
                              key={pass.id}
                              className="p-3.5 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                  {pass.email}
                                </div>
                                <div className="text-[11px] text-[#008120] dark:text-[#A2DF20] font-mono tabular-nums">
                                  Sisa {formatRemainingHoursMinutes(pass.remainingSeconds)} (s.d.{' '}
                                  {formatShortTime(pass.expiresAt)})
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={busyId === pass.id}
                                onClick={() => void handleRevokePass(pass.id, pass.email)}
                                aria-label={`Cabut token ${pass.email}`}
                                className="inline-flex items-center gap-1 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/70 px-3 py-1.5 text-[11px] font-semibold text-red-800 dark:text-red-200 shrink-0 cursor-pointer disabled:opacity-55"
                              >
                                <Trash2 className="h-3 w-3" aria-hidden="true" />
                                <span>Cabut</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] overflow-hidden">
                      <div className="bg-[#EAF2EC]/85 dark:bg-[#0A1815] px-4 py-3 flex items-center justify-between text-xs font-bold">
                        <span>Riwayat Persetujuan Terbaru ({paidOrders.length})</span>
                        <span className="font-mono text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                          Lunas
                        </span>
                      </div>
                      {paidOrders.length === 0 ? (
                        <div className="p-5 text-center text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                          Belum ada riwayat order yang disetujui.
                        </div>
                      ) : (
                        <ul className="divide-y divide-[#DCE6DF] dark:divide-[#173322] max-h-56 overflow-y-auto">
                          {paidOrders.map((order) => (
                            <li
                              key={order.orderId}
                              className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                  {order.email}
                                </div>
                                <div className="font-mono text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                                  {order.orderId} · {formatShortTime(order.paidAt)}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20] shrink-0 tabular-nums">
                                Rp{order.amount.toLocaleString('id-ID')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Log Aktivitas Admin */}
                <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] overflow-hidden">
                  <div className="bg-[#EAF2EC]/85 dark:bg-[#0A1815] px-4 py-3 flex items-center justify-between text-xs font-bold">
                    <span className="inline-flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                      <span>Log Aktivitas Admin ({auditLogs.length})</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      Catatan Server
                    </span>
                  </div>
                  {auditLogs.length === 0 ? (
                    <div className="p-5 text-center text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                      Belum ada aktivitas admin yang tercatat.
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#DCE6DF] dark:divide-[#173322] max-h-60 overflow-y-auto">
                      {auditLogs.map((log) => {
                        const actionLabel =
                          log.action === 'order_approved'
                            ? 'Order Disetujui'
                            : log.action === 'order_cancelled'
                            ? 'Order Dibatalkan'
                            : log.action === 'pass_granted_email'
                            ? 'Aktivasi Manual'
                            : log.action === 'pass_revoked'
                            ? 'Token Dicabut'
                            : 'Pengaturan Diubah';

                        const actionTone =
                          log.action === 'pass_revoked' || log.action === 'order_cancelled'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-[#008120] dark:text-[#A2DF20]';

                        return (
                          <li
                            key={log.id}
                            className="px-4 py-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className={`font-bold ${actionTone}`}>
                                  {actionLabel}
                                </span>
                                <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                  {log.target}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#3D4D42] dark:text-[#B5C4BA]">
                                {log.detail}
                              </div>
                            </div>
                            <div className="font-mono text-[11px] text-[#5E7064] dark:text-[#8A9A8F] shrink-0 tabular-nums">
                              {formatShortTime(log.timestamp)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: WHATSAPP & HARGA */}
            {adminPanelTab === 'settings' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                <form
                  onSubmit={(e) => void handleSaveSettings(e)}
                  className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-5 space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                    <MessageCircle className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                    <span>Konfigurasi WhatsApp &amp; Paket Token</span>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-wa-number"
                      className="block text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] mb-1"
                    >
                      Nomor WhatsApp Admin (Tujuan Chat Pembeli)
                    </label>
                    <input
                      id="admin-wa-number"
                      type="tel"
                      required
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Contoh: 081234567890 atau 6281234567890"
                      className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-2.5 font-mono text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="admin-token-price"
                        className="block text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] mb-1"
                      >
                        Harga Token (Rp)
                      </label>
                      <input
                        id="admin-token-price"
                        type="number"
                        min={1000}
                        max={1000000}
                        step={500}
                        required
                        value={priceIdrInput}
                        onChange={(e) => setPriceIdrInput(e.target.value)}
                        className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-2.5 font-mono text-sm text-[#07170B] dark:text-[#FEFEFE] tabular-nums focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="admin-token-hours"
                        className="block text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] mb-1"
                      >
                        Masa Aktif (Jam)
                      </label>
                      <input
                        id="admin-token-hours"
                        type="number"
                        min={1}
                        max={720}
                        required
                        value={durationHoursInput}
                        onChange={(e) => setDurationHoursInput(e.target.value)}
                        className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-2.5 font-mono text-sm text-[#07170B] dark:text-[#FEFEFE] tabular-nums focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-payment-note"
                      className="block text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] mb-1"
                    >
                      Catatan Transfer / QRIS di Modal Bayar (Opsional)
                    </label>
                    <textarea
                      id="admin-payment-note"
                      rows={3}
                      maxLength={300}
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="Contoh: Transfer BCA 1234567890 a.n. Rizaldy atau DANA 0812xxx, lalu kirim bukti di chat WhatsApp."
                      className="w-full resize-none rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-2.5 text-xs text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-xs sm:text-sm font-bold text-[#07170B] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Menyimpan Pengaturan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" aria-hidden="true" />
                        <span>Simpan Pengaturan Pembayaran</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Live Preview WhatsApp Order Message */}
                <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-5 space-y-3">
                  <div className="text-xs font-bold text-[#07170B] dark:text-[#FEFEFE]">
                    Pratinjau Pesan Otomatis ke WhatsApp Anda
                  </div>
                  <p className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                    Saat pembeli klik tombol bayar di Arena Latihan, format pesan berikut akan otomatis terisi di WhatsApp mereka:
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] p-3.5 font-mono text-[11px] leading-relaxed text-[#07170B] dark:text-[#EAF2EC]">
                    {sampleWaMessage}
                  </pre>
                  {paymentNote.trim() && (
                    <div className="rounded-xl bg-[#EAF2EC] dark:bg-[#0D2114] p-3 text-xs text-[#07170B] dark:text-[#EAF2EC]">
                      <span className="font-bold">Info Pembayaran tampil di modal: </span>
                      <span>{paymentNote}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: POPUP IKLAN SHOPEE */}
            {adminPanelTab === 'promo' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                <form onSubmit={(e) => void handleSavePromo(e)} className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] px-4 py-3">
                    <div>
                      <div className="text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        Tampilkan Popup Saat Web Dibuka
                      </div>
                      <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                        Muncul 1x per sesi dengan syarat klik iklan sebelum tutup.
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={promoDraft.isActive}
                      onClick={() =>
                        setPromoDraft((prev) => ({ ...prev, isActive: !prev.isActive }))
                      }
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors cursor-pointer ${
                        promoDraft.isActive
                          ? 'bg-[#008120] dark:bg-[#A2DF20]'
                          : 'bg-[#C4D1C8] dark:bg-[#1A3524]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white dark:bg-[#041006] transition-transform ${
                          promoDraft.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="promo-affiliate-url"
                        className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                      >
                        Link Shopee Affiliate (https://...)
                      </label>
                      <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                        {promoDraft.affiliateUrl.length}/500
                      </span>
                    </div>
                    <input
                      id="promo-affiliate-url"
                      type="url"
                      required
                      maxLength={500}
                      value={promoDraft.affiliateUrl}
                      onChange={(e) =>
                        setPromoDraft((prev) => ({ ...prev, affiliateUrl: e.target.value }))
                      }
                      placeholder="https://s.shopee.co.id/..."
                      className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="promo-highlight"
                          className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                        >
                          Teks Sorotan Atas
                        </label>
                        <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                          {promoDraft.highlightText.length}/40
                        </span>
                      </div>
                      <input
                        id="promo-highlight"
                        type="text"
                        required
                        maxLength={40}
                        value={promoDraft.highlightText}
                        onChange={(e) =>
                          setPromoDraft((prev) => ({ ...prev, highlightText: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="promo-cta-label"
                          className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                        >
                          Teks Tombol CTA
                        </label>
                        <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                          {promoDraft.ctaLabel.length}/40
                        </span>
                      </div>
                      <input
                        id="promo-cta-label"
                        type="text"
                        required
                        maxLength={40}
                        value={promoDraft.ctaLabel}
                        onChange={(e) =>
                          setPromoDraft((prev) => ({ ...prev, ctaLabel: e.target.value }))
                        }
                        className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="promo-title"
                        className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                      >
                        Judul Banner Promo
                      </label>
                      <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                        {promoDraft.title.length}/80
                      </span>
                    </div>
                    <input
                      id="promo-title"
                      type="text"
                      required
                      maxLength={80}
                      value={promoDraft.title}
                      onChange={(e) =>
                        setPromoDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="promo-subtitle"
                        className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                      >
                        Deskripsi Singkat
                      </label>
                      <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                        {promoDraft.subtitle.length}/200
                      </span>
                    </div>
                    <textarea
                      id="promo-subtitle"
                      rows={3}
                      required
                      maxLength={200}
                      value={promoDraft.subtitle}
                      onChange={(e) =>
                        setPromoDraft((prev) => ({ ...prev, subtitle: e.target.value }))
                      }
                      className="w-full resize-none rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="promo-banner-url"
                        className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                      >
                        URL Gambar Banner Kustom (Opsional)
                      </label>
                      <span className="text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                        Kosongkan = Banner bawaan
                      </span>
                    </div>
                    <input
                      id="promo-banner-url"
                      type="text"
                      maxLength={500}
                      value={promoDraft.bannerImageUrl}
                      onChange={(e) =>
                        setPromoDraft((prev) => ({ ...prev, bannerImageUrl: e.target.value }))
                      }
                      placeholder="https://... (kosongkan untuk memakai ilustrasi bawaan)"
                      className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={savingPromo}
                      className="inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-65"
                    >
                      {savingPromo ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" aria-hidden="true" />
                          <span>Simpan Perubahan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={savingPromo}
                      onClick={() => {
                        closeTokenAdmin();
                        triggerPreviewPopup(promoDraft);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#041006] dark:hover:bg-[#11281B] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                      <span>Uji Tampilkan Popup</span>
                    </button>

                    <button
                      type="button"
                      disabled={savingPromo}
                      onClick={() => setPromoDraft(DEFAULT_PROMO_CONFIG)}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-[#5E7064] hover:text-[#07170B] dark:text-[#8A9A8F] dark:hover:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </form>

                {/* Live Promo Preview */}
                <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-4">
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#3D4D42] dark:text-[#B5C4BA]">
                      Pratinjau Tampilan Popup
                    </span>
                    <span
                      className={`font-semibold ${
                        promoDraft.isActive
                          ? 'text-[#008120] dark:text-[#A2DF20]'
                          : 'text-[#5E7064] dark:text-[#8A9A8F]'
                      }`}
                    >
                      {promoDraft.isActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815]">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EAF2EC] dark:bg-[#041006]">
                      {!previewImgError ? (
                        <img
                          src={previewBannerSrc}
                          alt={promoDraft.title || 'Preview banner promo'}
                          referrerPolicy="no-referrer"
                          onError={() => setPreviewImgError(true)}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#EE4D2D]/15 via-[#EAF2EC] to-[#A2DF20]/20 dark:from-[#EE4D2D]/25 dark:via-[#07170B] dark:to-[#008120]/25 p-4 text-center">
                          <ShoppingBag className="h-7 w-7 text-[#EE4D2D]" aria-hidden="true" />
                          <span className="text-xs font-semibold text-[#3D4D42] dark:text-[#B5C4BA]">
                            URL gambar tidak dapat dimuat
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-[11px] font-semibold text-[#EE4D2D] dark:text-[#FF734F]">
                        {promoDraft.highlightText || 'Promo Pilihan Shopee'}
                      </p>
                      <h3 className="mt-1 font-display text-base font-extrabold text-[#07170B] dark:text-[#FEFEFE] leading-snug">
                        {promoDraft.title || 'Judul Promo'}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                        {promoDraft.subtitle || 'Deskripsi singkat penawaran Shopee Affiliate.'}
                      </p>

                      <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EE4D2D] px-4 py-2.5 text-xs font-bold text-white">
                        <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{promoDraft.ctaLabel || 'Lihat Promo di Shopee'}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </div>

                      <div className="mt-2.5 truncate text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                        {isPromoUrlValid
                          ? `Tujuan: ${promoDraft.affiliateUrl}`
                          : 'Link tujuan harus diawali https://'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
