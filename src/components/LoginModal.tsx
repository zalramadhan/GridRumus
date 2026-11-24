import { useEffect } from 'react';
import { Download, Loader2, Lock, Play, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LoginReason, useAuth } from '../hooks/useAuth';

const REASON_COPY: Record<
  LoginReason,
  { title: string; description: string; badge: string }
> = {
  download: {
    badge: 'Akses Unduhan .xlsx',
    title: 'Masuk untuk Mengunduh File Latihan',
    description:
      'Silakan login menggunakan akun Google terlebih dahulu untuk mengunduh file Microsoft Excel (.xlsx) dengan rumus aktif.',
  },
  practice: {
    badge: 'Akses Arena Latihan',
    title: 'Masuk untuk Memulai Latihan Soal',
    description:
      'Silakan login terlebih dahulu agar progres penyelesaian 130 soal praktek dan riwayat skor tantangan Anda tersimpan aman ke akun.',
  },
  general: {
    badge: 'Akun GridRumus',
    title: 'Masuk ke Akun GridRumus',
    description:
      'Masuk dengan akun Google untuk mengunduh seluruh workbook latihan (.xlsx) serta menyimpan progres latihan rumus Excel Anda.',
  },
};

export function LoginModal() {
  const {
    isLoginModalOpen,
    loginModalReason,
    authLoading,
    authError,
    closeLoginModal,
    signInWithGoogle,
  } = useAuth();

  useEffect(() => {
    if (!isLoginModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !authLoading) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLoginModalOpen, authLoading, closeLoginModal]);

  const copy = REASON_COPY[loginModalReason];

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          key="login-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => {
            if (!authLoading) closeLoginModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#041006]/70 backdrop-blur-sm p-4"
        >
          <motion.div
            key="login-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-6 sm:p-7 text-[#07170B] dark:text-[#FEFEFE] shadow-2xl"
          >
            <button
              type="button"
              onClick={closeLoginModal}
              disabled={authLoading}
              aria-label="Tutup jendela login"
              className="absolute right-4 top-4 rounded-full p-2 text-[#5E7064] hover:bg-[#EAF2EC] dark:text-[#8A9A8F] dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-2">
              {loginModalReason === 'download' ? (
                <Download className="h-4 w-4" aria-hidden="true" />
              ) : loginModalReason === 'practice' ? (
                <Play className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{copy.badge}</span>
            </div>

            <h2
              id="login-modal-title"
              className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE] pr-8"
            >
              {copy.title}
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
              {copy.description}
            </p>

            {authError && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs leading-relaxed text-red-800 dark:text-red-200"
              >
                {authError}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.14 }}
                disabled={authLoading}
                onClick={() => void signInWithGoogle()}
                className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] active:bg-[#84BD12] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer disabled:opacity-65 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07170B] dark:focus-visible:outline-[#A2DF20]"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Menghubungkan ke Google...</span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shrink-0">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        shapeRendering="geometricPrecision"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </span>
                    <span>Masuk dengan Google</span>
                  </>
                )}
              </motion.button>

              <button
                type="button"
                disabled={authLoading}
                onClick={closeLoginModal}
                className="w-full rounded-full bg-[#F5F6F6] hover:bg-[#EAF2EC] dark:bg-[#041006] dark:hover:bg-[#11281B] px-5 py-2.5 text-xs font-semibold text-[#3D4D42] dark:text-[#B5C4BA] transition-colors cursor-pointer disabled:opacity-50"
              >
                Nanti Saja
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] shrink-0" aria-hidden="true" />
              <span>Login aman via Google · Progres latihan tersinkronisasi otomatis.</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
