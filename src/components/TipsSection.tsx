import { useMemo, useState } from 'react';
import { Command, Keyboard, Monitor, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { TIPS } from '../data/tips';
import { TipCategory } from '../types/excel';

const TIP_CATEGORIES: TipCategory[] = [
  'Semua',
  'Navigasi & Seleksi',
  'Pembersihan Data',
  'Formula & Audit',
  'Produktivitas Kerja',
];

export function TipsSection() {
  const [selectedCategory, setSelectedCategory] = useState<TipCategory>('Semua');
  const [osMode, setOsMode] = useState<'win' | 'mac'>('win');

  const filteredTips = useMemo(() => {
    if (selectedCategory === 'Semua') return TIPS;
    return TIPS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <section
      id="trik-shortcut"
      className="py-14 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>Efisiensi &amp; Pintasan</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Trik Kerja Cepat &amp; Shortcut Wajib
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-2xl">
              Teknik praktis sehari-hari untuk membersihkan data kotor, menghindari salah geser rumus, dan mempercepat pekerjaan kantor hingga berkali lipat.
            </p>
          </div>

          <div
            className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 self-start shrink-0"
            role="group"
            aria-label="Pilih sistem operasi shortcut"
          >
            <button
              type="button"
              onClick={() => setOsMode('win')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                osMode === 'win'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Shortcut Windows</span>
            </button>
            <button
              type="button"
              onClick={() => setOsMode('mac')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                osMode === 'mac'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Command className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Shortcut macOS</span>
            </button>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-2">
          {TIP_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-emerald-700 dark:bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </motion.button>
            );
          })}
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip) => (
              <motion.article
                key={tip.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-slate-950/60 p-5 transition-colors duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>{tip.category}</span>
                    <kbd className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 whitespace-nowrap shrink-0">
                      <Keyboard className="h-3 w-3 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span>{osMode === 'win' ? tip.shortcutWin : tip.shortcutMac}</span>
                    </kbd>
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {tip.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 dark:tracking-[0.01em]">
                    {tip.summary}
                  </p>

                  <ol className="mt-4 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 list-decimal list-inside border-t border-slate-200/80 dark:border-slate-800 pt-3">
                    {tip.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 border-t border-slate-200/80 dark:border-slate-800 pt-3">
                  {tip.beforeAfter ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-slate-500 dark:text-slate-400 truncate">
                        Sebelum: {tip.beforeAfter.before}
                      </div>
                      <div className="rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 px-2.5 py-1.5 text-emerald-900 dark:text-emerald-200 font-medium truncate">
                        Sesudah: {tip.beforeAfter.after}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Kasus nyata:
                      </span>{' '}
                      {tip.realExample}
                    </p>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
