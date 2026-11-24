import { useState } from 'react';
import {
  Calculator,
  Check,
  Download,
  FolderDown,
  LogIn,
  LogOut,
  Megaphone,
  Moon,
  Sun,
  Table2,
  Target,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { usePromoConfig } from '../hooks/usePromoConfig';
import { downloadPracticePack } from '../utils/xlsxGenerator';

interface TopBarProps {
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
}

export function TopBar({ theme, onSetTheme }: TopBarProps) {
  const [downloaded, setDownloaded] = useState(false);
  const { user, openLoginModal, requireAuth, signOutUser } = useAuth();
  const { isAdmin, openAdminModal } = usePromoConfig();

  const handleDownloadMaster = () => {
    requireAuth('download', () => {
      downloadPracticePack(
        'master-all-formulas',
        'Paket_Lengkap_Semua_Rumus_GridRumus.xlsx'
      );
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1800);
    });
  };

  const navLinkClass =
    'group relative inline-flex items-center gap-1.5 hover:text-[#07170B] dark:hover:text-[#A2DF20] transition-colors whitespace-nowrap shrink-0 py-1 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-[#008120] dark:after:bg-[#A2DF20] after:transition-transform after:duration-150';

  const firstName =
    user?.displayName?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Akun';

  return (
    <header className="sticky top-0 z-40 bg-[#FEFEFE]/92 dark:bg-[#041006]/92 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 py-3.5">
        <motion.a
          href="#beranda"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.14 }}
          className="font-display text-lg font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#008120] dark:focus-visible:outline-[#A2DF20]"
        >
          GridRumus
        </motion.a>

        <nav
          aria-label="Navigasi utama"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-[#3D4D42] dark:text-[#B5C4BA]"
        >
          <a href="#katalog-rumus" className={navLinkClass}>
            <Calculator
              className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:scale-110 shrink-0"
              aria-hidden="true"
            />
            <span>Rumus Excel</span>
          </a>
          <a href="#simulator-grid" className={navLinkClass}>
            <Table2
              className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:scale-110 shrink-0"
              aria-hidden="true"
            />
            <span>Simulasi Grid</span>
          </a>
          <a href="#latihan-soal" className={navLinkClass}>
            <Target
              className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:scale-110 shrink-0"
              aria-hidden="true"
            />
            <span>Latihan Soal</span>
          </a>
          <a href="#trik-shortcut" className={navLinkClass}>
            <Zap
              className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:scale-110 shrink-0"
              aria-hidden="true"
            />
            <span>Trik &amp; Shortcut</span>
          </a>
          <a href="#file-latihan" className={navLinkClass}>
            <FolderDown
              className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:scale-110 shrink-0"
              aria-hidden="true"
            />
            <span>File Latihan</span>
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Icon-only Light/Dark theme switch */}
          <div
            className="inline-flex items-center gap-0.5 rounded-full bg-[#EAF2EC] dark:bg-[#0A1815] p-1 shrink-0"
            role="group"
            aria-label="Pengaturan tema tampilan"
          >
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              aria-pressed={theme === 'light'}
              aria-label="Mode Terang"
              title="Mode Terang"
              className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer ${
                theme === 'light'
                  ? 'text-[#FEFEFE]'
                  : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {theme === 'light' && (
                <motion.span
                  layoutId="topbar-theme-pill"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#07170B]"
                />
              )}
              <Sun className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              aria-pressed={theme === 'dark'}
              aria-label="Mode Gelap"
              title="Mode Gelap"
              className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors shrink-0 cursor-pointer ${
                theme === 'dark'
                  ? 'text-[#07170B]'
                  : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {theme === 'dark' && (
                <motion.span
                  layoutId="topbar-theme-pill"
                  transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#A2DF20]"
                />
              )}
              <Moon className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </button>
          </div>

          {/* Login / Account button */}
          {user ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] dark:bg-[#0A1815] pl-1.5 pr-1 py-1 shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={firstName}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#07170B] dark:bg-[#A2DF20] text-[11px] font-bold text-[#FEFEFE] dark:text-[#07170B] shrink-0">
                  {firstName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden md:inline max-w-[96px] truncate text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] px-1">
                {firstName}
              </span>
              {isAdmin && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={openAdminModal}
                  aria-label="Kelola popup iklan Shopee"
                  title="Kelola Popup Iklan Shopee"
                  className="inline-flex items-center gap-1 rounded-full bg-[#EE4D2D] hover:bg-[#D93E1F] px-2.5 py-1 text-[11px] font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Megaphone className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Iklan</span>
                </motion.button>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => void signOutUser()}
                aria-label="Keluar dari akun"
                title="Keluar"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#3D4D42] dark:text-[#B5C4BA] hover:bg-[#DCE6DF] dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#A2DF20] transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => openLoginModal('general')}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#0A1815] dark:hover:bg-[#11281B] px-3.5 sm:px-4 py-2 text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008120] dark:focus-visible:outline-[#A2DF20]"
            >
              <LogIn
                className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20] shrink-0"
                aria-hidden="true"
              />
              <span>Login</span>
            </motion.button>
          )}

          {/* Download Master .xlsx button (requires auth) */}
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleDownloadMaster}
            className="inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] active:bg-[#84BD12] px-3.5 sm:px-5 py-2.5 text-xs font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07170B] dark:focus-visible:outline-[#A2DF20]"
          >
            <AnimatePresence mode="wait" initial={false}>
              {downloaded ? (
                <motion.span
                  key="dl-done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.14 }}
                  className="inline-flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Terunduh (.xlsx)</span>
                </motion.span>
              ) : (
                <motion.span
                  key="dl-idle"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.14 }}
                  className="inline-flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">Unduh Paket .xlsx</span>
                  <span className="sm:hidden">Unduh .xlsx</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
