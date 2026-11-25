import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  MessageCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import {
  buildWhatsAppChatUrl,
  buildWhatsAppPaymentMessage,
  formatRemainingHoursMinutes,
  usePaidPass,
} from '../hooks/usePaidPass';
import { usePromoConfig } from '../hooks/usePromoConfig';

export function PaywallModal() {
  const { user, authLoading, authError, signInWithGoogle } = useAuth();
  const { isAdmin } = usePromoConfig();
  const {
    hasActivePass,
    expiresAt,
    remainingSeconds,
    pendingOrder,
    priceIdr,
    passDurationHours,
    whatsappConfigured,
    whatsappNumber,
    paymentNote,
    statusLoading,
    actionLoading,
    paywallError,
    isPaywallOpen,
    paywallFeatureLabel,
    closePaywall,
    openTokenAdmin,
    createWhatsAppOrder,
    refreshPassStatus,
  } = usePaidPass();

  const [copiedMessage, setCopiedMessage] = useState(false);
  const [checkingNotice, setCheckingNotice] = useState('');

  useEffect(() => {
    if (!isPaywallOpen) {
      setCheckingNotice('');
      setCopiedMessage(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionLoading && !authLoading) {
        closePaywall();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaywallOpen, actionLoading, authLoading, closePaywall]);

  // Background poll every 5s while waiting for admin activation inside modal
  useEffect(() => {
    if (!isPaywallOpen || !user || hasActivePass || !pendingOrder) return;
    const interval = window.setInterval(() => {
      void refreshPassStatus();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaywallOpen, user, hasActivePass, pendingOrder, refreshPassStatus]);

  const formatExpiryIndo = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const whatsappMessage =
    user && pendingOrder
      ? buildWhatsAppPaymentMessage({
          orderId: pendingOrder.orderId,
          displayName: user.displayName || user.email || 'Pengguna GridRumus',
          email: user.email || '-',
          priceIdr: pendingOrder.amount,
          passDurationHours,
        })
      : '';

  const whatsappUrl =
    whatsappConfigured && whatsappMessage
      ? buildWhatsAppChatUrl(whatsappNumber, whatsappMessage)
      : '#';

  const handleCopyMessage = async () => {
    if (!whatsappMessage) return;
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedMessage(true);
      window.setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleManualCheckStatus = async () => {
    setCheckingNotice('');
    await refreshPassStatus();
    setCheckingNotice(
      'Status diperbarui. Jika Anda baru saja transfer lewat WhatsApp, tunggu admin mengaktifkan token lalu cek lagi.'
    );
  };

  return (
    <AnimatePresence>
      {isPaywallOpen && (
        <motion.div
          key="paywall-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => {
            if (!actionLoading && !authLoading) closePaywall();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#041006]/75 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div
            key="paywall-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-5 sm:p-7 text-[#07170B] dark:text-[#FEFEFE] shadow-2xl my-auto"
          >
            <button
              type="button"
              onClick={closePaywall}
              disabled={actionLoading || authLoading}
              aria-label="Tutup jendela aktivasi token"
              className="absolute right-4 top-4 rounded-full p-2 text-[#5E7064] hover:bg-[#EAF2EC] dark:text-[#8A9A8F] dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1.5">
              {hasActivePass ? (
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              <span>
                {hasActivePass
                  ? 'Token Harian Aktif'
                  : 'Pembayaran via Chat WhatsApp'}
              </span>
            </div>

            <h2
              id="paywall-modal-title"
              className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE] pr-8"
            >
              {hasActivePass
                ? 'Token Latihan 24 Jam Anda Sudah Aktif'
                : 'Buka Semua Arena Latihan Soal'}
            </h2>

            {!hasActivePass && (
              <p className="mt-1.5 text-xs sm:text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                Untuk mengakses{' '}
                <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                  {paywallFeatureLabel}
                </span>
                , pesan Token Harian Rp{priceIdr.toLocaleString('id-ID')} ({passDurationHours} jam penuh) melalui chat WhatsApp Admin.
              </p>
            )}

            {/* Ringkasan Harga & Manfaat */}
            {!hasActivePass && (
              <div className="mt-4 rounded-xl bg-[#EAF2EC]/75 dark:bg-[#041006] p-4 space-y-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-bold text-[#07170B] dark:text-[#FEFEFE]">
                    Token Latihan Harian
                  </span>
                  <span className="font-mono text-lg font-extrabold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                    Rp{priceIdr.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                      / {passDurationHours} jam
                    </span>
                  </span>
                </div>
                <ul className="space-y-1.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] shrink-0" aria-hidden="true" />
                    <span>Akses 130 soal latihan 26 rumus Excel + grid interaktif</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] shrink-0" aria-hidden="true" />
                    <span>Akses penuh 6 profesi kerja &amp; Mode Tantangan Acak</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] shrink-0" aria-hidden="true" />
                    <span>Simulasi Tes Kerja Berwaktu &amp; Sertifikat Skor (.png)</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Error Banner */}
            {(paywallError || authError) && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs leading-relaxed text-red-900 dark:text-red-200"
              >
                <p>{paywallError || authError}</p>
              </div>
            )}

            {/* State 1: Token Aktif */}
            {hasActivePass ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-[#EAF2EC]/80 dark:bg-[#041006] p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                    <span>Sisa Masa Aktif</span>
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatRemainingHoursMinutes(remainingSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                    <span>Berlaku Hingga</span>
                    <span className="font-mono font-semibold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                      {formatExpiryIndo(expiresAt)}
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={closePaywall}
                  className="w-full rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer"
                >
                  Mulai Latihan Sekarang
                </motion.button>
              </div>
            ) : !user ? (
              /* State 2: Belum Login Google */
              <div className="mt-5 space-y-3">
                <p className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                  Langkah 1 dari 2: Masuk dengan akun Google terlebih dahulu agar admin dapat mengaktifkan token 24 jam ke email akun Anda.
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={authLoading}
                  onClick={() => void signInWithGoogle()}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer disabled:opacity-65"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Menghubungkan ke Google...</span>
                    </>
                  ) : (
                    <span>Masuk dengan Google untuk Lanjut</span>
                  )}
                </motion.button>
              </div>
            ) : statusLoading && !pendingOrder ? (
              /* State 3: Loading status server */
              <div className="mt-6 flex items-center justify-center gap-2 py-4 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                <Loader2 className="h-4 w-4 animate-spin text-[#008120] dark:text-[#A2DF20]" />
                <span>Memeriksa status token akun Anda...</span>
              </div>
            ) : !whatsappConfigured ? (
              /* State 4: Nomor WhatsApp Admin belum diatur */
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200 space-y-1.5">
                  <p className="font-bold">Nomor WhatsApp Admin Belum Diatur</p>
                  <p>
                    Pemilik website perlu mengatur nomor WhatsApp tujuan terlebih dahulu melalui Panel Admin Token WA (atau variabel <code className="font-mono">WHATSAPP_ADMIN_NUMBER</code>).
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openTokenAdmin('settings')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer"
                  >
                    <Settings className="h-4 w-4" aria-hidden="true" />
                    <span>Atur Nomor WhatsApp di Admin Panel</span>
                  </button>
                )}
              </div>
            ) : pendingOrder ? (
              /* State 5: Pesanan dibuat -> Siap Chat WhatsApp & Menunggu Aktivasi */
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#07170B]/12 dark:border-[#EAF2EC]/14 bg-[#F5F6F6] dark:bg-[#041006] p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Kode Order</span>
                    <span className="font-mono font-bold text-[#07170B] dark:text-[#FEFEFE]">
                      {pendingOrder.orderId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Email Akun</span>
                    <span className="font-medium text-[#07170B] dark:text-[#FEFEFE] truncate max-w-[230px]">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Nominal</span>
                    <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      Rp{pendingOrder.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {paymentNote && (
                    <div className="pt-2 border-t border-[#07170B]/10 dark:border-[#EAF2EC]/10 text-[#3D4D42] dark:text-[#B5C4BA]">
                      <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                        Info Pembayaran:{' '}
                      </span>
                      <span>{paymentNote}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Chat Admin di WhatsApp Sekarang</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyMessage()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2.5 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors cursor-pointer"
                    >
                      {copiedMessage ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                          <span>Pesan Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Salin Format Chat</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={statusLoading}
                      onClick={() => void handleManualCheckStatus()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2.5 text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-55"
                    >
                      {statusLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          <span>Mengecek...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Cek Status Aktivasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {checkingNotice && (
                  <p className="text-[11px] text-center text-[#008120] dark:text-[#A2DF20]">
                    {checkingNotice}
                  </p>
                )}

                <p className="text-[11px] text-center text-[#5E7064] dark:text-[#8A9A8F]">
                  Kirim chat WhatsApp &amp; selesaikan transfer Rp{priceIdr.toLocaleString('id-ID')}. Setelah admin mengaktifkan token akun Anda, akses otomatis terbuka.
                </p>
              </div>
            ) : (
              /* State 6: Siap buat Kode Order & arahkan ke WhatsApp */
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#F5F6F6] dark:bg-[#041006] p-3.5 text-xs space-y-1">
                  <div className="text-[#5E7064] dark:text-[#8A9A8F]">
                    Akun Google terhubung:{' '}
                    <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                      {user.email}
                    </span>
                  </div>
                  {paymentNote && (
                    <div className="text-[#3D4D42] dark:text-[#B5C4BA]">
                      <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                        Info Pembayaran:{' '}
                      </span>
                      <span>{paymentNote}</span>
                    </div>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={actionLoading}
                  onClick={() => void createWhatsAppOrder()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Menyiapkan Pesanan WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Lanjut Bayar Rp{priceIdr.toLocaleString('id-ID')} via WhatsApp
                      </span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
