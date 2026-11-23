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
      className="py-12 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
              <Calculator className="h-4 w-4" aria-hidden="true" />
              <span>Katalog &amp; Praktik Langsung</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Katalog Rumus &amp; Simulator Interaktif
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-2xl">
              Pilih rumus di sebelah kiri untuk mempelajari kapan dipakainya, menguji langsung di grid, atau mengunduh file latihan .xlsx.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rumus (misal VLOOKUP, IF, PMT)..."
              aria-label="Cari rumus Excel"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-9 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-700 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 dark:focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Kategori */}
        <div
          className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-2"
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
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Dua Zona: Daftar Rumus + Simulator */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr] items-start">
          {/* Sidebar Daftar Rumus */}
          <aside className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Daftar Rumus Tersedia
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {filteredFormulas.length} rumus
              </span>
            </div>

            {filteredFormulas.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  Rumus tidak ditemukan
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Coba kata kunci lain atau tampilkan semua kategori rumus.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Tampilkan Semua Rumus
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[680px] overflow-y-auto">
                {filteredFormulas.map((item) => {
                  const isSelected = activeFormula.id === item.id;
                  return (
                    <li key={item.id}>
                      <motion.button
                        type="button"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setSelectedFormulaId(item.id)}
                        className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/75 dark:bg-emerald-950/50 text-slate-900 dark:text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-display text-sm font-bold ${
                              isSelected
                                ? 'text-emerald-900 dark:text-emerald-300'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                            {item.level}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.tagline}
                        </p>
                        <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
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
