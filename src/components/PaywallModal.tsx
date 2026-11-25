import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { formatRemainingHoursMinutes, usePaidPass } from '../hooks/usePaidPass';

export function PaywallModal() {
  const { user, authLoading, authError, signInWithGoogle } = useAuth();
  const {
    hasActivePass,
    expiresAt,
    remainingSeconds,
    pendingOrder,
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
    closePaywall,
    clearPaywallError,
    createInvoice,
    verifyPendingPayment,
    refreshPassStatus,
  } = usePaidPass();

  const [mobileInput, setMobileInput] = useState('');
  const [localValidationError, setLocalValidationError] = useState('');

  useEffect(() => {
    if (!isPaywallOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !actionLoading && !authLoading) {
        closePaywall();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPaywallOpen, actionLoading, authLoading, closePaywall]);

  // Background poll every 5s while waiting on a pending Mayar invoice inside modal
  useEffect(() => {
    if (!isPaywallOpen || !user || hasActivePass || !pendingOrder) return;
    const interval = window.setInterval(() => {
      void refreshPassStatus();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isPaywallOpen, user, hasActivePass, pendingOrder, refreshPassStatus]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = mobileInput.replace(/[^\d]/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setLocalValidationError('Masukkan nomor WhatsApp / HP aktif (9–15 digit angka).');
      return;
    }
    setLocalValidationError('');
    await createInvoice(mobileInput);
  };

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
                  : 'Akses Berbayar · Mayar.id'}
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
                , aktifkan Token Harian Rp{priceIdr.toLocaleString('id-ID')} yang berlaku{' '}
                <span className="font-semibold">{passDurationHours} jam penuh</span>.
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
            {(paywallError || localValidationError || authError) && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs leading-relaxed text-red-900 dark:text-red-200 space-y-1"
              >
                <p>{localValidationError || paywallError || authError}</p>
                {paywallErrorCode === 'MAYAR_NOT_CONFIGURED' && (
                  <p className="opacity-85">
                    Tips pemilik aplikasi: daftar gratis di Mayar.id/Mayar.io, salin API Key ke Secret{' '}
                    <code className="font-mono">MAYAR_API_KEY</code> dan isi{' '}
                    <code className="font-mono">MAYAR_WEBHOOK_TOKEN</code> di panel Secrets AI Studio.
                  </p>
                )}
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
                  Langkah 1 dari 2: Masuk dengan akun Google agar masa aktif 24 jam tercatat aman untuk akun Anda.
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
            ) : statusLoading ? (
              /* State 3: Loading status server */
              <div className="mt-6 flex items-center justify-center gap-2 py-4 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                <Loader2 className="h-4 w-4 animate-spin text-[#008120] dark:text-[#A2DF20]" />
                <span>Memeriksa status token akun Anda...</span>
              </div>
            ) : pendingOrder ? (
              /* State 4: Menunggu Pembayaran Mayar.id */
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#07170B]/12 dark:border-[#EAF2EC]/14 bg-[#F5F6F6] dark:bg-[#041006] p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Kode Tagihan</span>
                    <span className="font-mono font-bold text-[#07170B] dark:text-[#FEFEFE]">
                      {pendingOrder.orderId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Status</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-300">
                      Menunggu Pembayaran (QRIS / VA / E-Wallet)
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[#5E7064] dark:text-[#8A9A8F]">Nominal</span>
                    <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      Rp{pendingOrder.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <a
                    href={pendingOrder.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors"
                  >
                    <span>Buka Halaman Bayar Mayar.id</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void verifyPendingPayment(pendingOrder.orderId)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-5 py-2.5 text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-55"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Mengecek ke Mayar.id...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Saya Sudah Bayar · Cek Status</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-[#5E7064] dark:text-[#8A9A8F]">
                  Halaman ini otomatis memeriksa pembayaran setiap beberapa detik setelah Anda selesai membayar di Mayar.id.
                </p>
              </div>
            ) : (
              /* State 5: Form Pembuatan Tagihan Mayar.id */
              <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
                <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                  Akun terhubung:{' '}
                  <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                    {user.email}
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="paywall-mobile-input"
                    className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-1.5"
                  >
                    Nomor WhatsApp / HP Aktif (Wajib untuk Invoice Mayar.id)
                  </label>
                  <input
                    id="paywall-mobile-input"
                    type="tel"
                    inputMode="numeric"
                    value={mobileInput}
                    onChange={(e) => {
                      setMobileInput(e.target.value);
                      if (localValidationError) setLocalValidationError('');
                      if (paywallError) clearPaywallError();
                    }}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-[#07170B]/15 dark:border-[#EAF2EC]/18 bg-[#F5F6F6] dark:bg-[#041006] px-4 py-2.5 font-mono text-sm text-[#07170B] dark:text-[#FEFEFE] placeholder:text-[#78887D] dark:placeholder:text-[#6E8074] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                  />
                </div>

                {!mayarConfigured && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Catatan: Kunci server <code className="font-mono">MAYAR_API_KEY</code> ({mayarEnv}) belum diisi di Secrets AI Studio.
                  </p>
                )}

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={actionLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Membuat Invoice Mayar.id...</span>
                    </>
                  ) : (
                    <span>Bayar Rp{priceIdr.toLocaleString('id-ID')} via Mayar.id</span>
                  )}
                </motion.button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
