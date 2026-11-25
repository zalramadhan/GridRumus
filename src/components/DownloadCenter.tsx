import { useState } from 'react';
import { Check, Download, FileSpreadsheet, FolderDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PRACTICE_PACKS } from '../data/tips';
import { useAuth } from '../hooks/useAuth';
import { downloadPracticePack } from '../utils/xlsxGenerator';

export function DownloadCenter() {
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const { requireAuth } = useAuth();

  const handleDownload = (id: string, filename: string) => {
    requireAuth('download', () => {
      downloadPracticePack(id, filename);
      setDownloadedId(id);
      setTimeout(() => {
        setDownloadedId((current) => (current === id ? null : current));
      }, 1800);
    });
  };

  return (
    <section
      id="file-latihan"
      className="py-16 bg-[#F5F6F6] dark:bg-[#011004] transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1.5">
            <FolderDown className="h-4 w-4" aria-hidden="true" />
            <span>Materi Praktik Offline</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]">
            File Contoh &amp;{' '}
            <span className="text-[#008120] dark:text-[#A2DF20]">
              Workbook Latihan (.xlsx)
            </span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em]">
            Seluruh file di bawah ini dibuat langsung dalam format asli Microsoft Excel (.xlsx) lengkap dengan rumus aktif yang langsung menghitung di Excel maupun Google Sheets.
          </p>
        </div>

        <div className="space-y-3">
          {PRACTICE_PACKS.map((pack, index) => {
            const isDone = downloadedId === pack.id;
            return (
              <motion.div
                key={pack.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col gap-4 rounded-2xl bg-[#FEFEFE] p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between hover:bg-[#EAF2EC]/65 dark:hover:bg-[#0F2418] transition-colors ${
                  index % 2 === 0 ? 'dark:bg-[#00280a]' : 'dark:bg-[#001a04]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F] mb-1.5">
                    <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20]">
                      0{index + 1}.
                    </span>
                    <span>{pack.targetRole}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{pack.sheetsCount} worksheet</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#3D4D42] dark:text-[#B5C4BA] break-all sm:break-normal">
                      {pack.filename}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#07170B] dark:text-[#98ff00]">
                    {pack.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-3xl">
                    {pack.description}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                    <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                      Rumus di dalam file:
                    </span>
                    <span className="font-mono text-[#008120] dark:text-[#A2DF20] break-words">
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
                    className="inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2.5 text-xs font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07170B] dark:focus-visible:outline-[#A2DF20]"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isDone ? (
                        <motion.span
                          key="pack-done"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.14 }}
                          className="inline-flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                          <span>Berhasil Diunduh</span>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="pack-idle"
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          transition={{ duration: 0.14 }}
                          className="inline-flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                          <span>Unduh .xlsx</span>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
