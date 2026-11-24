import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import defaultShopeeBanner from '../assets/images/shopee_promo_banner_1795536330570.jpg';
import { db, OperationType } from '../lib/firebase';
import { useAuth } from './useAuth';

export const ADMIN_EMAIL = 'rizaldyramadhan@gmail.com';
export const PROMO_SESSION_KEY = 'gridrumus_shopee_popup_seen';
export const DEFAULT_SHOPEE_BANNER_IMAGE = defaultShopeeBanner;

export interface PromoBannerConfig {
  isActive: boolean;
  highlightText: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  affiliateUrl: string;
  bannerImageUrl: string;
}

export const DEFAULT_PROMO_CONFIG: PromoBannerConfig = {
  isActive: true,
  highlightText: 'Promo Pilihan Shopee',
  title: 'Diskon Perlengkapan Kerja & Produktivitas',
  subtitle:
    'Lengkapi meja kerjamu dengan keyboard mekanik, mouse ergonomis, buku panduan Excel, serta voucher gratis ongkir dan promo harian Shopee.',
  ctaLabel: 'Lihat Promo di Shopee',
  affiliateUrl: 'https://shopee.co.id',
  bannerImageUrl: '',
};

export function isValidHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export function isValidBannerImageValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/assets/') || trimmed.startsWith('/src/assets/')) {
    return trimmed.length <= 500;
  }
  return isValidHttpsUrl(trimmed) && trimmed.length <= 500;
}

export function sanitizePromoConfig(
  raw: Partial<PromoBannerConfig> | null | undefined
): PromoBannerConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROMO_CONFIG;

  const highlightText =
    typeof raw.highlightText === 'string' && raw.highlightText.trim().length > 0
      ? raw.highlightText.trim().slice(0, 40)
      : DEFAULT_PROMO_CONFIG.highlightText;

  const title =
    typeof raw.title === 'string' && raw.title.trim().length > 0
      ? raw.title.trim().slice(0, 80)
      : DEFAULT_PROMO_CONFIG.title;

  const subtitle =
    typeof raw.subtitle === 'string' && raw.subtitle.trim().length > 0
      ? raw.subtitle.trim().slice(0, 200)
      : DEFAULT_PROMO_CONFIG.subtitle;

  const ctaLabel =
    typeof raw.ctaLabel === 'string' && raw.ctaLabel.trim().length > 0
      ? raw.ctaLabel.trim().slice(0, 40)
      : DEFAULT_PROMO_CONFIG.ctaLabel;

  const affiliateUrl =
    typeof raw.affiliateUrl === 'string' &&
    isValidHttpsUrl(raw.affiliateUrl) &&
    raw.affiliateUrl.trim().length <= 500
      ? raw.affiliateUrl.trim()
      : DEFAULT_PROMO_CONFIG.affiliateUrl;

  const bannerImageUrl =
    typeof raw.bannerImageUrl === 'string' && isValidBannerImageValue(raw.bannerImageUrl)
      ? raw.bannerImageUrl.trim().slice(0, 500)
      : '';

  return {
    isActive: typeof raw.isActive === 'boolean' ? raw.isActive : DEFAULT_PROMO_CONFIG.isActive,
    highlightText,
    title,
    subtitle,
    ctaLabel,
    affiliateUrl,
    bannerImageUrl,
  };
}

interface PromoConfigContextValue {
  promoConfig: PromoBannerConfig;
  activePopupConfig: PromoBannerConfig;
  promoLoaded: boolean;
  isAdmin: boolean;
  isPopupOpen: boolean;
  isPreviewMode: boolean;
  hasClickedAd: boolean;
  isAdminModalOpen: boolean;
  markAdClicked: () => void;
  closePopup: () => void;
  openAdminModal: () => void;
  closeAdminModal: () => void;
  triggerPreviewPopup: (draft?: PromoBannerConfig) => void;
  savePromoConfig: (nextConfig: PromoBannerConfig) => Promise<void>;
}

const PromoConfigContext = createContext<PromoConfigContextValue | null>(null);

export function PromoConfigProvider({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuth();
  const [promoConfig, setPromoConfig] = useState<PromoBannerConfig>(DEFAULT_PROMO_CONFIG);
  const [previewDraft, setPreviewDraft] = useState<PromoBannerConfig | null>(null);
  const [promoLoaded, setPromoLoaded] = useState(false);
  const [hasAdminRecord, setHasAdminRecord] = useState(false);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasClickedAd, setHasClickedAd] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Verify optional /admins/{uid} record when signed in
  useEffect(() => {
    let cancelled = false;
    if (!authReady || !user || !user.emailVerified) {
      setHasAdminRecord(false);
      return;
    }
    if (user.email?.toLowerCase() === ADMIN_EMAIL) {
      setHasAdminRecord(true);
      return;
    }

    getDoc(doc(db, 'admins', user.uid))
      .then((snap) => {
        if (!cancelled) {
          setHasAdminRecord(snap.exists());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasAdminRecord(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authReady]);

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (user.email?.toLowerCase() === ADMIN_EMAIL || hasAdminRecord)
  );

  // Fetch public promo config once on page load
  useEffect(() => {
    let cancelled = false;

    async function loadPromo() {
      let resolved = DEFAULT_PROMO_CONFIG;
      try {
        const snap = await getDoc(doc(db, 'promotions', 'shopee_popup'));
        if (snap.exists()) {
          resolved = sanitizePromoConfig(snap.data() as Partial<PromoBannerConfig>);
        }
      } catch (err) {
        console.warn('Menggunakan konfigurasi promo bawaan:', err);
      }

      if (cancelled) return;
      setPromoConfig(resolved);
      setPromoLoaded(true);

      let alreadySeen = false;
      try {
        alreadySeen = window.sessionStorage.getItem(PROMO_SESSION_KEY) === '1';
      } catch {
        alreadySeen = false;
      }

      if (resolved.isActive && !alreadySeen) {
        setHasClickedAd(false);
        setIsPreviewMode(false);
        setPreviewDraft(null);
        setIsPopupOpen(true);
      }
    }

    void loadPromo();

    return () => {
      cancelled = true;
    };
  }, []);

  const markAdClicked = useCallback(() => {
    setHasClickedAd(true);
    if (!isPreviewMode) {
      try {
        window.sessionStorage.setItem(PROMO_SESSION_KEY, '1');
      } catch {
        // ignore storage failure
      }
    }
    window.setTimeout(() => {
      setIsPopupOpen(false);
      setIsPreviewMode(false);
      setPreviewDraft(null);
    }, 320);
  }, [isPreviewMode]);

  const closePopup = useCallback(() => {
    if (!hasClickedAd) return;
    setIsPopupOpen(false);
    setIsPreviewMode(false);
    setPreviewDraft(null);
  }, [hasClickedAd]);

  const openAdminModal = useCallback(() => {
    if (!isAdmin) return;
    setIsAdminModalOpen(true);
  }, [isAdmin]);

  const closeAdminModal = useCallback(() => {
    setIsAdminModalOpen(false);
  }, []);

  const triggerPreviewPopup = useCallback(
    (draft?: PromoBannerConfig) => {
      if (!isAdmin) return;
      setIsAdminModalOpen(false);
      setPreviewDraft(draft ? sanitizePromoConfig(draft) : null);
      setIsPreviewMode(true);
      setHasClickedAd(false);
      setIsPopupOpen(true);
    },
    [isAdmin]
  );

  const savePromoConfig = useCallback(
    async (nextConfig: PromoBannerConfig) => {
      if (!user || !isAdmin) {
        throw new Error('Hanya akun admin terverifikasi yang dapat mengubah promo.');
      }

      const highlightText = nextConfig.highlightText.trim();
      const title = nextConfig.title.trim();
      const subtitle = nextConfig.subtitle.trim();
      const ctaLabel = nextConfig.ctaLabel.trim();
      const affiliateUrl = nextConfig.affiliateUrl.trim();
      const bannerImageUrl = nextConfig.bannerImageUrl.trim();

      if (!highlightText || highlightText.length > 40) {
        throw new Error('Teks sorotan wajib diisi (maksimal 40 karakter).');
      }
      if (!title || title.length > 80) {
        throw new Error('Judul promo wajib diisi (maksimal 80 karakter).');
      }
      if (!subtitle || subtitle.length > 200) {
        throw new Error('Deskripsi promo wajib diisi (maksimal 200 karakter).');
      }
      if (!ctaLabel || ctaLabel.length > 40) {
        throw new Error('Teks tombol CTA wajib diisi (maksimal 40 karakter).');
      }
      if (!isValidHttpsUrl(affiliateUrl) || affiliateUrl.length > 500) {
        throw new Error(
          'Link Shopee Affiliate harus berupa URL https:// yang valid (maksimal 500 karakter).'
        );
      }
      if (!isValidBannerImageValue(bannerImageUrl)) {
        throw new Error(
          'URL gambar banner harus kosong atau berupa URL https:// yang valid (maksimal 500 karakter).'
        );
      }

      const cleanConfig: PromoBannerConfig = {
        isActive: Boolean(nextConfig.isActive),
        highlightText,
        title,
        subtitle,
        ctaLabel,
        affiliateUrl,
        bannerImageUrl,
      };

      const promoPath = 'promotions/shopee_popup';
      try {
        await setDoc(doc(db, 'promotions', 'shopee_popup'), {
          ...cleanConfig,
          updatedByUid: user.uid,
          updatedAt: serverTimestamp(),
        });
        setPromoConfig(cleanConfig);
      } catch (error) {
        console.error('Firestore Error:', {
          operationType: OperationType.WRITE,
          path: promoPath,
          error,
        });
        throw new Error(
          'Gagal menyimpan ke server Firestore. Pastikan akun Google admin sudah terverifikasi.'
        );
      }
    },
    [user, isAdmin]
  );

  const activePopupConfig = previewDraft ?? promoConfig;

  const value = useMemo<PromoConfigContextValue>(
    () => ({
      promoConfig,
      activePopupConfig,
      promoLoaded,
      isAdmin,
      isPopupOpen,
      isPreviewMode,
      hasClickedAd,
      isAdminModalOpen,
      markAdClicked,
      closePopup,
      openAdminModal,
      closeAdminModal,
      triggerPreviewPopup,
      savePromoConfig,
    }),
    [
      promoConfig,
      activePopupConfig,
      promoLoaded,
      isAdmin,
      isPopupOpen,
      isPreviewMode,
      hasClickedAd,
      isAdminModalOpen,
      markAdClicked,
      closePopup,
      openAdminModal,
      closeAdminModal,
      triggerPreviewPopup,
      savePromoConfig,
    ]
  );

  return <PromoConfigContext.Provider value={value}>{children}</PromoConfigContext.Provider>;
}

export function usePromoConfig() {
  const ctx = useContext(PromoConfigContext);
  if (!ctx) {
    throw new Error('usePromoConfig must be used within PromoConfigProvider');
  }
  return ctx;
}
