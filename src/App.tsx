import { useEffect, useState } from 'react';
import {
  ArrowDown,
  Calculator,
  Download,
  FileSpreadsheet,
  Globe,
  Instagram,
  Keyboard,
  Play,
} from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { TopBar } from './components/TopBar';
import { HandCursorEffect } from './components/HandCursorEffect';
import { MagneticDotGrid } from './components/MagneticDotGrid';
import { FormulaExplorer } from './components/FormulaExplorer';
import { PracticeArena } from './components/PracticeArena';
import { TipsSection } from './components/TipsSection';
import { DownloadCenter } from './components/DownloadCenter';
import { LoginModal } from './components/LoginModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { PracticeProgressProvider } from './hooks/usePracticeProgress';
import { FORMULAS } from './data/formulas';
import { PRACTICE_PACKS, TIPS } from './data/tips';
import { downloadPracticePack } from './utils/xlsxGenerator';

function AppShell() {
  const { requireAuth } = useAuth();
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

  return (
    <div
      id="beranda"
      className="min-h-screen flex flex-col bg-[#FEFEFE] dark:bg-[#041006] text-[#07170B] dark:text-[#F5F6F6] transition-colors duration-200"
    >
      <HandCursorEffect />
      <TopBar theme={theme} onSetTheme={setTheme} />
      <LoginModal />

          <main className="flex-1">
            {/* Hero Section with Magnetic Dot Grid */}
            <section className="relative overflow-hidden bg-[#FEFEFE] dark:bg-[#041006] py-10 lg:py-16 transition-colors duration-200">
              <MagneticDotGrid theme={theme} />
              <div className="relative z-10 mx-auto max-w-[1320px] px-6">
                <p className="mb-5 text-xs font-medium text-[#008120] dark:text-[#A2DF20]">
                  Referensi Kerja Spreadsheet · Simulator Rumus · File Latihan .xlsx
                </p>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
                  <div className="flex flex-col justify-center">
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-[3rem] font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE] leading-[1.12] text-balance max-w-2xl">
                      Kuasai Rumus &amp; Trik Excel dengan{' '}
                      <span className="text-[#008120] dark:text-[#A2DF20]">
                        Penjelasan Praktis dan Contoh Siap Pakai
                      </span>
                    </h1>

                    <p className="mt-5 text-base leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-xl">
                      Pelajari rumus paling penting di dunia kerja—mulai dari SUMIFS, IF bertingkat, VLOOKUP, XLOOKUP, DATEDIF, hingga FILTER—uji langsung pada grid interaktif, kerjakan 130 soal praktek, dan unduh file Excel (.xlsx) berumus aktif.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3.5">
                      <motion.a
                        href="#katalog-rumus"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="group inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Jelajahi Rumus &amp; Simulator</span>
                        <ArrowDown
                          className="h-4 w-4 transition-transform duration-150 group-hover:translate-y-0.5"
                          aria-hidden="true"
                        />
                      </motion.a>

                      <motion.button
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() =>
                          requireAuth('download', () =>
                            downloadPracticePack(
                              'master-all-formulas',
                              'Paket_Lengkap_Semua_Rumus_GridRumus.xlsx'
                            )
                          )
                        }
                        className="group inline-flex items-center gap-2 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#0A1815] dark:hover:bg-[#11281B] px-6 py-3 text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download
                          className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] transition-transform duration-150 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                        <span>Unduh Semua Contoh (.xlsx)</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Right Column: Arivexa Deep Forest Interactive Preview Showcase */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl bg-[#07170B] dark:bg-[#0A1815] p-6 text-[#F5F6F6] flex flex-col justify-between transition-colors duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-4">
                        <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#EAF2EC]">
                          <FileSpreadsheet
                            className="h-4 w-4 text-[#A2DF20]"
                            aria-hidden="true"
                          />
                          <span>Contoh Cepat: Rekap Penjualan</span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#A2DF20]">
                          =SUMIFS(...)
                        </span>
                      </div>

                      <div className="overflow-hidden rounded-xl bg-[#041006]">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#0D2114] text-[#B5C4BA] font-mono">
                              <th className="py-2.5 px-3.5 text-left font-semibold">Cabang</th>
                              <th className="py-2.5 px-3.5 text-left font-semibold">Status</th>
                              <th className="py-2.5 px-3.5 text-right font-semibold">Nominal</th>
                            </tr>
                          </thead>
                          <tbody className="tabular-nums">
                            <tr className="transition-colors duration-150 hover:bg-[#11281B]/70">
                              <td className="py-2.5 px-3.5 text-[#F5F6F6]">Jakarta</td>
                              <td className="py-2.5 px-3.5 text-[#F5F6F6]">Lunas</td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-[#FEFEFE]">
                                Rp 8.500.000
                              </td>
                            </tr>
                            <tr className="bg-[#0A1815]/70 transition-colors duration-150 hover:bg-[#11281B]/70">
                              <td className="py-2.5 px-3.5 text-[#B5C4BA]">Jakarta</td>
                              <td className="py-2.5 px-3.5 text-[#8A9A8F]">Piutang</td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-[#8A9A8F]">
                                Rp 4.200.000
                              </td>
                            </tr>
                            <tr className="transition-colors duration-150 hover:bg-[#11281B]/70">
                              <td className="py-2.5 px-3.5 text-[#F5F6F6]">Jakarta</td>
                              <td className="py-2.5 px-3.5 text-[#F5F6F6]">Lunas</td>
                              <td className="py-2.5 px-3.5 text-right font-mono text-[#FEFEFE]">
                                Rp 6.200.000
                              </td>
                            </tr>
                            <tr className="bg-[#A2DF20]/15 font-semibold text-[#A2DF20] transition-colors duration-150 hover:bg-[#A2DF20]/25">
                              <td className="py-3 px-3.5" colSpan={2}>
                                Hasil Jakarta + Lunas
                              </td>
                              <td className="py-3 px-3.5 text-right font-mono">
                                Rp 14.700.000
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#B5C4BA]">
                      <span>Mendukung Excel Windows (,) maupun Regional ID (;)</span>
                      <a
                        href="#file-latihan"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#A2DF20] hover:underline whitespace-nowrap shrink-0"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Lihat 5 Studi Kasus</span>
                      </a>
                    </div>
                  </motion.div>
                </div>

                {/* Full-width summary strip below Hero split */}
                <div className="mt-12 grid grid-cols-2 gap-6 py-4 sm:grid-cols-4">
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-start gap-3"
                  >
                    <Calculator
                      className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                        {FORMULAS.length}
                      </div>
                      <div className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                        Rumus Kerja Esensial &amp; Lanjutan
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-start gap-3"
                  >
                    <Play
                      className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                        {FORMULAS.length * 5}
                      </div>
                      <div className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                        Soal Praktek Langsung (5 per Rumus)
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-start gap-3"
                  >
                    <Keyboard
                      className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                        {TIPS.length}
                      </div>
                      <div className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                        Trik Cepat &amp; Shortcut Win/Mac
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="group flex items-start gap-3"
                  >
                    <FileSpreadsheet
                      className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                        {PRACTICE_PACKS.length}
                      </div>
                      <div className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                        Workbook Latihan .xlsx Aktif
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            <FormulaExplorer />
            <PracticeArena />
            <TipsSection />
            <DownloadCenter />
          </main>

          <footer className="bg-[#07170B] dark:bg-[#011608] text-[#B5C4BA] py-10 transition-colors duration-200">
            <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs">
                <span className="font-display text-sm font-extrabold text-[#98ff00]">
                  GridRumus
                </span>
                <span className="mx-2 text-[#5E7064]" aria-hidden="true">
                  ·
                </span>
                <span>Panduan Rumus, Trik Excel &amp; File Latihan .xlsx</span>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                <span className="font-medium text-[#F5F6F6]">
                  Made by Studio Heroic / Zal
                </span>
                <a
                  href="https://instagram.com/zalsomeone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#A2DF20] transition-colors whitespace-nowrap shrink-0"
                >
                  <Instagram className="h-3.5 w-3.5 text-[#A2DF20] shrink-0" aria-hidden="true" />
                  <span>instagram.com/zalsomeone</span>
                </a>
                <a
                  href="https://studioheroic.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#A2DF20] transition-colors whitespace-nowrap shrink-0"
                >
                  <Globe className="h-3.5 w-3.5 text-[#A2DF20] shrink-0" aria-hidden="true" />
                  <span>studioheroic.my.id</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <PracticeProgressProvider>
            <AppShell />
          </PracticeProgressProvider>
        </AuthProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
