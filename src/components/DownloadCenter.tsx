import { useState } from 'react';
import { Check, Download, FileSpreadsheet, FolderDown } from 'lucide-react';
import { motion } from 'motion/react';
import { PRACTICE_PACKS } from '../data/tips';
import { downloadPracticePack } from '../utils/xlsxGenerator';

export function DownloadCenter() {
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const handleDownload = (id: string, filename: string) => {
    downloadPracticePack(id, filename);
    setDownloadedId(id);
    setTimeout(() => {
      setDownloadedId((current) => (current === id ? null : current));
    }, 1800);
  };

  return (
    <section
      id="file-latihan"
      className="py-14 border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
            <FolderDown className="h-4 w-4" aria-hidden="true" />
            <span>Materi Praktik Offline</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            File Contoh &amp; Workbook Latihan (.xlsx)
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 dark:tracking-[0.01em]">
            Seluruh file di bawah ini dibuat langsung dalam format asli Microsoft Excel (.xlsx) lengkap dengan rumus aktif yang langsung menghitung di Excel maupun Google Sheets.
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
          {PRACTICE_PACKS.map((pack, index) => {
            const isDone = downloadedId === pack.id;
            return (
              <div
                key={pack.id}
                className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-mono font-semibold text-emerald-800 dark:text-emerald-400">
                      0{index + 1}.
                    </span>
                    <span>{pack.targetRole}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{pack.sheetsCount} worksheet</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {pack.filename}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {pack.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-3xl">
                    {pack.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Rumus di dalam file:
                    </span>
                    <span className="font-mono text-emerald-800 dark:text-emerald-300">
                      {pack.formulasIncluded.join(' · ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => handleDownload(pack.id, pack.filename)}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 dark:border-emerald-600 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-400"
                  >
                    <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                    <span>{isDone ? 'Berhasil Diunduh' : 'Unduh .xlsx'}</span>
                    {isDone ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
