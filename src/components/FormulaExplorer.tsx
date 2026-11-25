import { useMemo, useState } from 'react';
import {
  Calculator,
  Calendar,
  GitBranch,
  Landmark,
  Layers,
  Search,
  Sigma,
  Type,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FORMULAS } from '../data/formulas';
import { FormulaCategory } from '../types/excel';
import { FormulaSimulator } from './FormulaSimulator';

const CATEGORIES: { label: FormulaCategory; icon: typeof Layers }[] = [
  { label: 'Semua', icon: Layers },
  { label: 'Matematika & Agregasi', icon: Sigma },
  { label: 'Logika & Kondisi', icon: GitBranch },
  { label: 'Pencarian (Lookup)', icon: Search },
  { label: 'Teks & Pembersihan', icon: Type },
  { label: 'Tanggal & Waktu', icon: Calendar },
  { label: 'Keuangan & Array', icon: Landmark },
];

interface FormulaExplorerProps {
  externalQuery?: string;
}

export function FormulaExplorer({ externalQuery = '' }: FormulaExplorerProps) {
  const [selectedCategory, setSelectedCategory] = useState<FormulaCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>(externalQuery);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(FORMULAS[0].id);

  const effectiveQuery = searchQuery || externalQuery;

  const filteredFormulas = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    return FORMULAS.filter((f) => {
      const matchesCat =
        selectedCategory === 'Semua' || f.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.tagline.toLowerCase().includes(q) ||
        f.practicalUse.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, effectiveQuery]);

  const activeFormula = useMemo(() => {
    return (
      filteredFormulas.find((f) => f.id === selectedFormulaId) ||
      filteredFormulas[0] ||
      FORMULAS[0]
    );
  }, [filteredFormulas, selectedFormulaId]);

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
  };

  return (
    <section
      id="katalog-rumus"
      className="py-16 bg-[#F5F6F6] dark:bg-[#041006] transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-7">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1.5">
              <Calculator className="h-4 w-4" aria-hidden="true" />
              <span>Katalog &amp; Praktik Langsung</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]">
              Katalog Rumus &amp;{' '}
              <span className="text-[#008120] dark:text-[#A2DF20]">
                Simulator Interaktif
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-2xl">
              Pilih rumus di sebelah kiri untuk mempelajari kapan dipakainya, menguji langsung di grid, atau mengunduh file latihan .xlsx.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5E7064] dark:text-[#8A9A8F]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rumus (misal VLOOKUP, IF, PMT)..."
              aria-label="Cari rumus Excel"
              className="w-full rounded-full border border-transparent bg-[#FEFEFE] dark:bg-[#cff2ca] py-2.5 pl-10 pr-10 text-sm text-[#07170B] placeholder:text-[#78887D] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none focus:ring-2 focus:ring-[#A2DF20]/30"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#5E7064] hover:text-[#07170B] dark:hover:text-[#A2DF20] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Kategori */}
        <div
          className="mb-7 flex max-w-full items-center gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Filter kategori rumus"
        >
          {CATEGORIES.map(({ label, icon: Icon }) => {
            const active = selectedCategory === label;
            return (
              <motion.button
                key={label}
                type="button"
                role="tab"
                aria-selected={active}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={() => setSelectedCategory(label)}
                className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#A2DF20] dark:text-[#07170B]'
                    : 'bg-[#FEFEFE] dark:bg-[#0A1815] text-[#3D4D42] dark:text-[#B5C4BA] hover:bg-[#EAF2EC]/80 dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="explorer-category-pill"
                    transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                  />
                )}
                <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="relative z-10">{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Dua Zona: Daftar Rumus + Simulator */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr] items-start">
          {/* Sidebar Daftar Rumus */}
          <aside className="min-w-0 w-full rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] overflow-hidden transition-colors duration-200">
            <div className="border-0 bg-[#EAF2EC]/75 dark:bg-[#003103] px-4 py-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-[#07170B] dark:text-[#FEFEFE]">
                Daftar Rumus Tersedia
              </span>
              <span className="font-mono text-xs text-[#3D4D42] dark:text-[#A2DF20] tabular-nums">
                {filteredFormulas.length} rumus
              </span>
            </div>

            {filteredFormulas.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                  Rumus tidak ditemukan
                </p>
                <p className="mt-1 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                  Coba kata kunci lain atau tampilkan semua kategori rumus.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 rounded-full bg-[#EAF2EC] dark:bg-[#07170B] px-4 py-1.5 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] hover:bg-[#DCE6DF] dark:hover:bg-[#13291C] cursor-pointer"
                >
                  Tampilkan Semua Rumus
                </button>
              </div>
            ) : (
              <ul className="p-2 space-y-1 max-h-[680px] overflow-y-auto dark:bg-[#011803]">
                {filteredFormulas.map((item) => {
                  const isSelected = activeFormula.id === item.id;
                  return (
                    <li key={item.id} className="relative">
                      <motion.button
                        type="button"
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setSelectedFormulaId(item.id)}
                        className={`relative w-full text-left rounded-xl px-3.5 py-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'text-[#07170B] dark:text-[#FEFEFE]'
                            : 'bg-transparent text-[#3D4D42] dark:text-[#B5C4BA] hover:bg-[#F5F6F6] dark:hover:bg-[#0E2117]'
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="explorer-active-formula"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                            className="absolute inset-0 rounded-xl bg-[#EAF2EC] dark:bg-[#003d03]"
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <span
                            className={`font-display text-sm font-bold ${
                              isSelected
                                ? 'text-[#008120] dark:text-[#A2DF20]'
                                : 'text-[#07170B] dark:text-[#FEFEFE]'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[11px] font-medium text-[#5E7064] dark:text-[#8A9A8F] whitespace-nowrap shrink-0">
                            {item.level}
                          </span>
                        </div>
                        <p className="relative z-10 mt-1 text-xs text-[#3D4D42] dark:text-[#B5C4BA] line-clamp-2 leading-relaxed">
                          {item.tagline}
                        </p>
                        <div className="relative z-10 mt-1.5 text-[11px] text-[#5E7064] dark:text-[#8A9A8F]">
                          {item.category}
                        </div>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Main Interactive Simulator Stage */}
          <div className="min-w-0">
            <FormulaSimulator formula={activeFormula} />
          </div>
        </div>
      </div>
    </section>
  );
}
