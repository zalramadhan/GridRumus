import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Lock,
  MousePointerClick,
  ShoppingBag,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  DEFAULT_SHOPEE_BANNER_IMAGE,
  isValidHttpsUrl,
  usePromoConfig,
} from '../hooks/usePromoConfig';

export function ShopeePromoPopup() {
  const {
    activePopupConfig,
    isPopupOpen,
    isPreviewMode,
    hasClickedAd,
    markAdClicked,
    closePopup,
  } = usePromoConfig();

  const [nudgeActive, setNudgeActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const bannerSrc = activePopupConfig.bannerImageUrl || DEFAULT_SHOPEE_BANNER_IMAGE;
  const safeHref = isValidHttpsUrl(activePopupConfig.affiliateUrl)
    ? activePopupConfig.affiliateUrl
    : 'https://shopee.co.id';

  useEffect(() => {
    setImageFailed(false);
  }, [bannerSrc]);

  const triggerNudge = () => {
    setNudgeActive(true);
    window.setTimeout(() => setNudgeActive(false), 480);
  };

  useEffect(() => {
    if (!isPopupOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hasClickedAd) {
          closePopup();
        } else {
          triggerNudge();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPopupOpen, hasClickedAd, closePopup]);

  const handleCloseAttempt = () => {
    if (!hasClickedAd) {
      triggerNudge();
      return;
    }
    closePopup();
  };

  return (
    <AnimatePresence>
      {isPopupOpen && (
        <motion.div
          key="shopee-promo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={handleCloseAttempt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#041006]/75 backdrop-blur-sm p-4"
        >
          <motion.div
            key="shopee-promo-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopee-promo-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={
              nudgeActive
                ? {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    x: [0, -7, 7, -5, 5, 0],
                  }
                : { opacity: 1, scale: 1, y: 0, x: 0 }
            }
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: nudgeActive ? 0.34 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[540px] overflow-hidden rounded-2xl border border-[#DCE6DF] dark:border-[#173322] bg-[#FEFEFE] dark:bg-[#0A1815] text-[#07170B] dark:text-[#FEFEFE] shadow-2xl"
          >
            {/* Close / Lock Button */}
            <button
              type="button"
              onClick={handleCloseAttempt}
              aria-disabled={!hasClickedAd}
              aria-label={
                hasClickedAd
                  ? 'Tutup jendela promo'
                  : 'Terkunci: klik iklan promo Shopee terlebih dahulu untuk menutup'
              }
              title={
                hasClickedAd
                  ? 'Tutup'
                  : 'Klik iklan Shopee terlebih dahulu untuk menutup'
              }
              className={`absolute right-3.5 top-3.5 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer ${
                hasClickedAd
                  ? 'bg-[#FEFEFE] text-[#07170B] hover:bg-[#EAF2EC] shadow-md'
                  : 'bg-[#041006]/75 text-[#FEFEFE]/90 hover:bg-[#041006]/90'
              }`}
            >
              {hasClickedAd ? (
                <>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tutup</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-[#FF8A65]" aria-hidden="true" />
                  <span>Tutup</span>
                </>
              )}
            </button>

            {/* Clickable 16:9 Promo Banner Visual */}
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markAdClicked}
              aria-label={`Buka ${activePopupConfig.title} di Shopee`}
              className="group relative block aspect-[16/9] w-full overflow-hidden bg-[#EAF2EC] dark:bg-[#041006]"
            >
              {!imageFailed ? (
                <img
                  src={bannerSrc}
                  alt={activePopupConfig.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-[#EE4D2D]/15 via-[#EAF2EC] to-[#A2DF20]/20 dark:from-[#EE4D2D]/25 dark:via-[#07170B] dark:to-[#008120]/25 p-6 text-center">
                  <ShoppingBag
                    className="h-10 w-10 text-[#EE4D2D]"
                    aria-hidden="true"
                  />
                  <span className="font-display text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                    {activePopupConfig.highlightText}
                  </span>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#041006]/80 via-[#041006]/35 to-transparent" />
              <div className="pointer-events-none absolute bottom-3 left-5 right-5 flex items-center justify-between text-xs font-semibold text-[#FEFEFE]">
                <span className="inline-flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#FF8A65]" aria-hidden="true" />
                  <span>Shopee Affiliate · Penawaran Resmi</span>
                </span>
                {isPreviewMode && (
                  <span className="text-[#A2DF20]">Mode Pratinjau Admin</span>
                )}
              </div>
            </a>

            {/* Card Body */}
            <div className="p-5 sm:p-6">
              <p className="text-xs font-semibold text-[#EE4D2D] dark:text-[#FF734F]">
                {activePopupConfig.highlightText}
              </p>

              <h2
                id="shopee-promo-title"
                className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE] leading-snug text-balance"
              >
                {activePopupConfig.title}
              </h2>

              <p className="mt-2.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em]">
                {activePopupConfig.subtitle}
              </p>

              {/* Mandatory Ad-Click Guidance Notice */}
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed transition-colors ${
                  hasClickedAd
                    ? 'border-[#008120]/30 bg-[#EAF2EC] text-[#008120] dark:border-[#A2DF20]/30 dark:bg-[#0D2114] dark:text-[#A2DF20]'
                    : nudgeActive
                    ? 'border-[#EE4D2D] bg-[#EE4D2D]/15 text-[#B92B0F] dark:border-[#FF734F] dark:bg-[#EE4D2D]/20 dark:text-[#FFD2C7]'
                    : 'border-[#DCE6DF] bg-[#F5F6F6] text-[#3D4D42] dark:border-[#173322] dark:bg-[#041006] dark:text-[#B5C4BA]'
                }`}
              >
                {hasClickedAd ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <MousePointerClick
                    className="h-4 w-4 shrink-0 mt-0.5 text-[#EE4D2D] dark:text-[#FF734F]"
                    aria-hidden="true"
                  />
                )}
                <span>
                  {hasClickedAd
                    ? 'Penawaran Shopee dibuka di tab baru. Menutup jendela promo...'
                    : 'Klik gambar banner atau tombol promo Shopee di bawah untuk membuka penawaran dan menutup jendela ini.'}
                </span>
              </div>

              {/* Primary Affiliate CTA */}
              <div className="mt-5">
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={markAdClicked}
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#EE4D2D] hover:bg-[#D93E1F] active:bg-[#C63519] px-6 py-3.5 text-sm font-bold text-white transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE4D2D]"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{activePopupConfig.ctaLabel}</span>
                  <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </div>

              <p className="mt-3.5 text-center text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                Muncul sekali per sesi kunjungan · Tautan menuju halaman resmi Shopee
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
