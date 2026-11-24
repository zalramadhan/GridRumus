import { FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DEFAULT_PROMO_CONFIG,
  DEFAULT_SHOPEE_BANNER_IMAGE,
  isValidHttpsUrl,
  PromoBannerConfig,
  usePromoConfig,
} from '../hooks/usePromoConfig';

export function PromoAdminModal() {
  const {
    isAdmin,
    promoConfig,
    isAdminModalOpen,
    closeAdminModal,
    triggerPreviewPopup,
    savePromoConfig,
  } = usePromoConfig();

  const [draft, setDraft] = useState<PromoBannerConfig>(promoConfig);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [previewImgError, setPreviewImgError] = useState(false);

  useEffect(() => {
    if (isAdminModalOpen) {
      setDraft(promoConfig);
      setErrorMsg(null);
      setSavedNotice(false);
      setPreviewImgError(false);
    }
  }, [isAdminModalOpen, promoConfig]);

  useEffect(() => {
    setPreviewImgError(false);
  }, [draft.bannerImageUrl]);

  useEffect(() => {
    if (!isAdminModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        closeAdminModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAdminModalOpen, saving, closeAdminModal]);

  if (!isAdmin) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSavedNotice(false);
    try {
      await savePromoConfig(draft);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan promo.');
    } finally {
      setSaving(false);
    }
  };

  const previewBannerSrc = draft.bannerImageUrl.trim() || DEFAULT_SHOPEE_BANNER_IMAGE;
  const isUrlValidPreview = isValidHttpsUrl(draft.affiliateUrl);

  return (
    <AnimatePresence>
      {isAdminModalOpen && (
        <motion.div
          key="promo-admin-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => {
            if (!saving) closeAdminModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#041006]/75 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div
            key="promo-admin-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-admin-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] p-6 sm:p-7 text-[#07170B] dark:text-[#FEFEFE] shadow-2xl"
          >
            <button
              type="button"
              disabled={saving}
              onClick={closeAdminModal}
              aria-label="Tutup panel admin promo"
              className="absolute right-4 top-4 rounded-full p-2 text-[#5E7064] hover:bg-[#EAF2EC] dark:text-[#8A9A8F] dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="mb-6 pr-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008120] dark:text-[#A2DF20]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Panel Admin · Shopee Affiliate</span>
              </div>
              <h2
                id="promo-admin-title"
                className="mt-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]"
              >
                Kelola Popup Iklan Shopee Affiliate
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                Ubah link afiliasi, judul promo, deskripsi, atau status tayang popup yang muncul saat pengunjung membuka website.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              {/* Left Column: Editor Form */}
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {/* Active Toggle */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] px-4 py-3">
                  <div>
                    <div className="text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                      Tampilkan Popup Saat Web Dibuka
                    </div>
                    <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                      Muncul 1x per sesi dengan syarat wajib klik iklan sebelum tutup.
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.isActive}
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors cursor-pointer ${
                      draft.isActive
                        ? 'bg-[#008120] dark:bg-[#A2DF20]'
                        : 'bg-[#C4D1C8] dark:bg-[#1A3524]'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white dark:bg-[#041006] transition-transform ${
                        draft.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Affiliate URL */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="promo-affiliate-url"
                      className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                    >
                      Link Shopee Affiliate (https://...)
                    </label>
                    <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                      {draft.affiliateUrl.length}/500
                    </span>
                  </div>
                  <input
                    id="promo-affiliate-url"
                    type="url"
                    required
                    maxLength={500}
                    value={draft.affiliateUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, affiliateUrl: e.target.value }))
                    }
                    placeholder="https://s.shopee.co.id/..."
                    className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                  />
                </div>

                {/* Highlight Kicker & CTA Label */}
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
                        {draft.highlightText.length}/40
                      </span>
                    </div>
                    <input
                      id="promo-highlight"
                      type="text"
                      required
                      maxLength={40}
                      value={draft.highlightText}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, highlightText: e.target.value }))
                      }
                      placeholder="Promo Pilihan Shopee"
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
                        {draft.ctaLabel.length}/40
                      </span>
                    </div>
                    <input
                      id="promo-cta-label"
                      type="text"
                      required
                      maxLength={40}
                      value={draft.ctaLabel}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, ctaLabel: e.target.value }))
                      }
                      placeholder="Lihat Promo di Shopee"
                      className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="promo-title"
                      className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                    >
                      Judul Banner Promo
                    </label>
                    <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                      {draft.title.length}/80
                    </span>
                  </div>
                  <input
                    id="promo-title"
                    type="text"
                    required
                    maxLength={80}
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Diskon Perlengkapan Kerja & Produktivitas"
                    className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="promo-subtitle"
                      className="text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE]"
                    >
                      Deskripsi Singkat
                    </label>
                    <span className="text-[11px] tabular-nums text-[#5E7064] dark:text-[#8A9A8F]">
                      {draft.subtitle.length}/200
                    </span>
                  </div>
                  <textarea
                    id="promo-subtitle"
                    rows={3}
                    required
                    maxLength={200}
                    value={draft.subtitle}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder="Jelaskan penawaran promo Shopee..."
                    className="w-full resize-none rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                  />
                </div>

                {/* Optional Banner Image URL */}
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
                    value={draft.bannerImageUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, bannerImageUrl: e.target.value }))
                    }
                    placeholder="https://... (kosongkan untuk memakai ilustrasi bawaan)"
                    className="w-full rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#041006] px-3.5 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <div
                    role="alert"
                    className="rounded-xl bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs leading-relaxed text-red-800 dark:text-red-200"
                  >
                    {errorMsg}
                  </div>
                )}

                {savedNotice && (
                  <div
                    role="status"
                    className="inline-flex w-full items-center gap-2 rounded-xl bg-[#EAF2EC] dark:bg-[#0D2114] px-4 py-2.5 text-xs font-semibold text-[#008120] dark:text-[#A2DF20]"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Perubahan promo Shopee Affiliate berhasil disimpan ke Firestore.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] active:bg-[#84BD12] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-65"
                  >
                    {saving ? (
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
                    disabled={saving}
                    onClick={() => triggerPreviewPopup(draft)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#041006] dark:hover:bg-[#11281B] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                    <span>Uji Tampilkan Popup</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setDraft(DEFAULT_PROMO_CONFIG)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-medium text-[#5E7064] hover:text-[#07170B] dark:text-[#8A9A8F] dark:hover:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reset Default</span>
                  </button>
                </div>
              </form>

              {/* Right Column: Live Card Preview */}
              <div className="rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#F5F6F6] dark:bg-[#041006] p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#3D4D42] dark:text-[#B5C4BA]">
                    Pratinjau Tampilan Popup
                  </span>
                  <span
                    className={`font-semibold ${
                      draft.isActive
                        ? 'text-[#008120] dark:text-[#A2DF20]'
                        : 'text-[#5E7064] dark:text-[#8A9A8F]'
                    }`}
                  >
                    {draft.isActive ? 'Status: Aktif' : 'Status: Nonaktif'}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815]">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EAF2EC] dark:bg-[#041006]">
                    {!previewImgError ? (
                      <img
                        src={previewBannerSrc}
                        alt={draft.title || 'Preview banner promo'}
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
                      {draft.highlightText || 'Promo Pilihan Shopee'}
                    </p>
                    <h3 className="mt-1 font-display text-base font-extrabold text-[#07170B] dark:text-[#FEFEFE] leading-snug">
                      {draft.title || 'Judul Promo'}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                      {draft.subtitle || 'Deskripsi singkat penawaran Shopee Affiliate.'}
                    </p>

                    <div className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#EE4D2D] px-4 py-2.5 text-xs font-bold text-white">
                      <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{draft.ctaLabel || 'Lihat Promo di Shopee'}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </div>

                    <div className="mt-2.5 truncate text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                      {isUrlValidPreview
                        ? `Tujuan: ${draft.affiliateUrl}`
                        : 'Link tujuan harus diawali https://'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
