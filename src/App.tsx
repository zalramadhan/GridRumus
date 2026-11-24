import { useEffect, useState } from 'react';
import {
  ArrowDown,
  Calculator,
  Download,
  FileSpreadsheet,
  Keyboard,
  Moon,
  Play,
  Sun,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { TopBar } from './components/TopBar';
import { FormulaExplorer } from './components/FormulaExplorer';
import { PracticeArena } from './components/PracticeArena';
import { TipsSection } from './components/TipsSection';
import { DownloadCenter } from './components/DownloadCenter';
import { PracticeProgressProvider } from './hooks/usePracticeProgress';
import { FORMULAS } from './data/formulas';
import { PRACTICE_PACKS, TIPS } from './data/tips';
import { downloadPracticePack } from './utils/xlsxGenerator';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('gridrumus-theme', theme);
    } catch {
      // ignore storage failure
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <MotionConfig reducedMotion="user">
      <PracticeProgressProvider>
        <div
          id="beranda"
          className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200"
        >
        <TopBar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-white dark:bg-slate-900 py-10 lg:py-16 transition-colors duration-200">
            <div className="mx-auto max-w-[1320px] px-6">
              {/* Baris Kontrol Tema & Konteks */}
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400">
                  Referensi Kerja Spreadsheet · Simulator Rumus · File Latihan .xlsx
                </p>

                <div
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1"
                  role="group"
                  aria-label="Pengaturan tema tampilan"
                >
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    aria-pressed={theme === 'light'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Terang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    aria-pressed={theme === 'dark'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Gelap</span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Ganti tema cepat"
                    className="sr-only"
                  >
                    Ganti Tema
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
                <div className="flex flex-col justify-center">
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance max-w-2xl">
                    Kuasai Rumus &amp; Trik Excel dengan Penjelasan Praktis dan Contoh Siap Pakai
                  </h1>

                  <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-xl">
                    Pelajari rumus paling penting di dunia kerja—mulai dari SUMIFS, IF bertingkat, VLOOKUP, XLOOKUP, DATEDIF, hingga FILTER—uji langsung pada grid interaktif, dan unduh file Excel (.xlsx) dengan rumus aktif.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <motion.a
                      href="#katalog-rumus"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Jelajahi Rumus &amp; Simulator</span>
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </motion.a>

                    <motion.button
                      type="button"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() =>
                        downloadPracticePack(
                          'master-all-formulas',
                          'Paket_Lengkap_Semua_Rumus_GridRumus.xlsx'
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download
                        className="h-4 w-4 text-emerald-700 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      <span>Unduh Semua Contoh (.xlsx)</span>
                    </motion.button>
                  </div>
                </div>

                {/* Right Column: Clean Interactive Preview Card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 p-5 flex flex-col justify-between transition-colors duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <FileSpreadsheet
                          className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
                          aria-hidden="true"
                        />
                        <span>Contoh Cepat: Rekap Penjualan</span>
                      </span>
                      <span className="font-mono text-xs text-emerald-800 dark:text-emerald-300">
                        =SUMIFS(...)
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            <th className="py-2 px-3 text-left font-semibold">Cabang</th>
                            <th className="py-2 px-3 text-left font-semibold">Status</th>
                            <th className="py-2 px-3 text-right font-semibold">Nominal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                          <tr>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-200">Jakarta</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-200">Lunas</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                              Rp 8.500.000
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300">Jakarta</td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400">Piutang</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                              Rp 4.200.000
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-200">Jakarta</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-200">Lunas</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900 dark:text-white">
                              Rp 6.200.000
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/80 dark:bg-emerald-950/60 font-semibold text-emerald-950 dark:text-emerald-200">
                            <td className="py-2.5 px-3" colSpan={2}>
                              Hasil Jakarta + Lunas
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              Rp 14.700.000
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>Mendukung Excel Windows (,) maupun Regional ID (;)</span>
                    <a
                      href="#file-latihan"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Lihat 5 Studi Kasus</span>
                    </a>
                  </div>
                </motion.div>
              </div>

              {/* Full-width summary strip below Hero split */}
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-200 dark:border-slate-800 pt-8 sm:grid-cols-4">
                <div className="flex items-start gap-3">
                  <Calculator
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {FORMULAS.length}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Rumus Kerja Esensial &amp; Lanjutan
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Play
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {FORMULAS.length * 5}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Soal Praktek Langsung (5 per Rumus)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Keyboard
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {TIPS.length}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Trik Cepat &amp; Shortcut Win/Mac
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileSpreadsheet
                    className="h-5 w-5 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {PRACTICE_PACKS.length}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      Workbook Latihan .xlsx Aktif
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <FormulaExplorer />
          <PracticeArena />
          <TipsSection />
          <DownloadCenter />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors duration-200">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-display font-bold text-slate-800 dark:text-slate-100">
                GridRumus
              </span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              <span>Panduan Rumus, Trik Excel &amp; File Latihan .xlsx</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <a
                href="#katalog-rumus"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Katalog Rumus
              </a>
              <a
                href="#latihan-soal"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Latihan Soal
              </a>
              <a
                href="#trik-shortcut"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Trik &amp; Shortcut
              </a>
              <a
                href="#file-latihan"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Unduhan .xlsx
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.span
                      key="sun-footer"
                      initial={{ opacity: 0, rotate: -30 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 30 }}
                      transition={{ duration: 0.16 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mode Terang</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon-footer"
                      initial={{ opacity: 0, rotate: -30 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 30 }}
                      transition={{ duration: 0.16 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mode Gelap</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </footer>
      </div>
      </PracticeProgressProvider>
    </MotionConfig>
  );
}
