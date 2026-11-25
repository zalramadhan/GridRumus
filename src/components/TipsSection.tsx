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
      className="py-16 bg-[#FEFEFE] dark:bg-[#002b05] transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1.5">
              <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Efisiensi &amp; Pintasan</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]">
              Trik Kerja Cepat &amp;{' '}
              <span className="text-[#008120] dark:text-[#A2DF20]">
                Shortcut Wajib
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-2xl">
              Teknik praktis sehari-hari untuk membersihkan data kotor, menghindari salah geser rumus, dan mempercepat pekerjaan kantor hingga berkali lipat.
            </p>
          </div>

          <div
            className="inline-flex max-w-full flex-wrap sm:flex-nowrap items-center rounded-2xl sm:rounded-full bg-[#EAF2EC] dark:bg-[#001a04] p-1 self-start shrink-0"
            role="group"
            aria-label="Pilih sistem operasi shortcut"
          >
            <button
              type="button"
              onClick={() => setOsMode('win')}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                osMode === 'win'
                  ? 'text-[#FEFEFE] dark:text-[#07170B]'
                  : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {osMode === 'win' && (
                <motion.span
                  layoutId="tips-os-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                />
              )}
              <Monitor className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">Shortcut Windows</span>
            </button>
            <button
              type="button"
              onClick={() => setOsMode('mac')}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                osMode === 'mac'
                  ? 'text-[#FEFEFE] dark:text-[#07170B]'
                  : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {osMode === 'mac' && (
                <motion.span
                  layoutId="tips-os-pill"
                  transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                />
              )}
              <Command className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">Shortcut macOS</span>
            </button>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
          {TIP_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <motion.button
                key={cat}
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSelectedCategory(cat)}
                className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#A2DF20] dark:text-[#07170B]'
                    : 'bg-[#F5F6F6] dark:bg-[#001a04] text-[#3D4D42] dark:text-[#B5C4BA] hover:bg-[#EAF2EC]/80 dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="tips-category-pill"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                  />
                )}
                <span className="relative z-10">{cat}</span>
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
                className="group min-w-0 flex flex-col justify-between rounded-2xl bg-[#F5F6F6] dark:bg-[#021302] p-5 sm:p-6 transition-colors duration-200"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F] mb-2.5">
                    <span>{tip.category}</span>
                    <kbd className="inline-flex max-w-full items-center gap-1.5 font-mono text-[11px] font-semibold text-[#07170B] dark:text-[#FEFEFE] bg-[#FEFEFE] dark:bg-[#041006] rounded-md px-2.5 py-1 whitespace-nowrap shrink-0 transition-transform duration-150 group-hover:scale-[1.04]">
                      <Keyboard className="h-3 w-3 text-[#008120] dark:text-[#A2DF20] shrink-0" aria-hidden="true" />
                      <span className="truncate">{osMode === 'win' ? tip.shortcutWin : tip.shortcutMac}</span>
                    </kbd>
                  </div>

                  <h3 className="font-display text-base font-bold text-[#07170B] dark:text-[#98ff00] leading-snug">
                    {tip.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em]">
                    {tip.summary}
                  </p>

                  <ol className="mt-4 space-y-1.5 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] list-decimal list-inside">
                    {tip.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="mt-5">
                  {tip.beforeAfter ? (
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="rounded-lg bg-[#FEFEFE] dark:bg-[#041006] px-2.5 py-1.5 text-[#5E7064] dark:text-[#8A9A8F] truncate">
                        Sebelum: {tip.beforeAfter.before}
                      </div>
                      <div className="rounded-lg bg-[#EAF2EC] dark:bg-[#A2DF20]/15 px-2.5 py-1.5 text-[#008120] dark:text-[#A2DF20] font-semibold truncate">
                        Sesudah: {tip.beforeAfter.after}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#5E7064] dark:text-[#8A9A8F] leading-relaxed">
                      <span className="font-semibold text-[#07170B] dark:text-[#FEFEFE]">
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
