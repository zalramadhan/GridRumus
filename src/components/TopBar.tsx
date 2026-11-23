import { useState } from 'react';
import { Check, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { downloadPracticePack } from '../utils/xlsxGenerator';

export function TopBar() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadMaster = () => {
    downloadPracticePack(
      'master-all-formulas',
      'Paket_Lengkap_Semua_Rumus_GridRumus.xlsx'
    );
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1800);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors duration-200">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#beranda"
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-400"
        >
          GridRumus
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#katalog-rumus"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Rumus Excel
          </a>
          <a
            href="#simulator-grid"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Simulasi Grid
          </a>
          <a
            href="#trik-shortcut"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Trik &amp; Shortcut
          </a>
          <a
            href="#file-latihan"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
          >
            File Latihan
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleDownloadMaster}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-400"
          >
            {downloaded ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Terunduh (.xlsx)</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unduh Paket .xlsx</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}
