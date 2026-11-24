import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  History,
  Play,
  RotateCcw,
  Shuffle,
  Target,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FORMULAS } from '../data/formulas';
import { PRACTICE_QUESTIONS_BY_FORMULA } from '../data/practice';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { FormulaCategory, PracticeRunnerQuestion } from '../types/excel';
import { PracticeMode } from './PracticeMode';

const CATEGORIES: FormulaCategory[] = [
  'Semua',
  'Matematika & Agregasi',
  'Logika & Kondisi',
  'Pencarian (Lookup)',
  'Teks & Pembersihan',
  'Tanggal & Waktu',
  'Keuangan & Array',
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type ActiveArenaSession =
  | {
      type: 'formula';
      sessionKey: string;
      formulaId: string;
      formulaName: string;
      questions: PracticeRunnerQuestion[];
    }
  | {
      type: 'challenge';
      sessionKey: string;
      category: FormulaCategory;
      count: number;
      questions: PracticeRunnerQuestion[];
    };

export function PracticeArena() {
  const {
    progress,
    totalQuestionsCount,
    solvedTotalCount,
    completedFormulasCount,
    bestChallengePercent,
    getFormulaSolvedCount,
    resetAllProgress,
  } = usePracticeProgress();

  const [arenaTab, setArenaTab] = useState<'per-formula' | 'challenge'>('per-formula');
  const [selectedCategory, setSelectedCategory] = useState<FormulaCategory>('Semua');
  const [challengeCategory, setChallengeCategory] = useState<FormulaCategory>('Semua');
  const [challengeCount, setChallengeCount] = useState<5 | 10>(10);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveArenaSession | null>(null);

  const allRunnerQuestions = useMemo<PracticeRunnerQuestion[]>(() => {
    const list: PracticeRunnerQuestion[] = [];
    for (const formula of FORMULAS) {
      const qs = PRACTICE_QUESTIONS_BY_FORMULA[formula.id] ?? [];
      for (const q of qs) {
        list.push({
          ...q,
          formulaId: formula.id,
          formulaName: formula.name,
          category: formula.category,
        });
      }
    }
    return list;
  }, []);

  const filteredFormulas = useMemo(() => {
    if (selectedCategory === 'Semua') return FORMULAS;
    return FORMULAS.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  const startFormulaPractice = (formulaId: string) => {
    const formula = FORMULAS.find((f) => f.id === formulaId);
    if (!formula) return;
    const qs = (PRACTICE_QUESTIONS_BY_FORMULA[formulaId] ?? []).map((q) => ({
      ...q,
      formulaId: formula.id,
      formulaName: formula.name,
      category: formula.category,
    }));
    if (qs.length === 0) return;

    setActiveSession({
      type: 'formula',
      sessionKey: `arena-formula-${formula.id}-${Date.now()}`,
      formulaId: formula.id,
      formulaName: formula.name,
      questions: qs,
    });
  };

  const startRandomChallenge = (
    cat: FormulaCategory = challengeCategory,
    count: number = challengeCount
  ) => {
    const pool =
      cat === 'Semua'
        ? allRunnerQuestions
        : allRunnerQuestions.filter((q) => q.category === cat);
    const picked = shuffleArray(pool).slice(0, Math.min(count, pool.length));
    if (picked.length === 0) return;

    setActiveSession({
      type: 'challenge',
      sessionKey: `arena-challenge-${cat}-${count}-${Date.now()}`,
      category: cat,
      count: picked.length,
      questions: picked,
    });
  };

  const formatDateShort = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section
      id="latihan-soal"
      className="py-14 border-t border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        {/* Header Arena Latihan */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5">
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>Praktek Langsung di Web</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Arena Latihan Soal &amp; Tantangan Acak
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-2xl">
              Uji kemampuan menulis rumus Excel langsung di grid interaktif. Pilih latihan terfokus 5 soal per rumus atau tantang diri dengan soal acak lintas kategori.
            </p>
          </div>

          {/* Kontrol Reset Progres Aman */}
          {!activeSession && (
            <div className="flex items-center gap-2 shrink-0">
              {confirmReset ? (
                <div className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900/70 bg-red-50/70 dark:bg-red-950/30 px-3 py-1.5">
                  <span className="text-xs font-medium text-red-900 dark:text-red-200">
                    Hapus semua skor?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllProgress();
                      setConfirmReset(false);
                    }}
                    className="rounded bg-red-700 hover:bg-red-800 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
                  >
                    Ya, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={solvedTotalCount === 0 && progress.challengeHistory.length === 0}
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset Progres</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ringkasan Progres Browser */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total Soal Dikuasai
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {solvedTotalCount}{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  / {totalQuestionsCount}
                </span>
              </div>
            </div>
            <CheckCircle2
              className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Rumus Tuntas (5/5)
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {completedFormulasCount}{' '}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  / {FORMULAS.length}
                </span>
              </div>
            </div>
            <Award
              className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Skor Tantangan Terbaik
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                {progress.challengeHistory.length > 0 ? `${bestChallengePercent}%` : '—'}
              </div>
            </div>
            <Shuffle
              className="h-5 w-5 text-emerald-700 dark:text-emerald-400 shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeSession ? (
            <motion.div
              key={activeSession.sessionKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeSession.type === 'formula' ? (
                <PracticeMode
                  sessionKey={activeSession.sessionKey}
                  mode="formula"
                  title={`Latihan ${activeSession.formulaName}`}
                  subtitle={`Latihan Praktek Langsung · ${activeSession.formulaName}`}
                  formulaIdForScore={activeSession.formulaId}
                  questions={activeSession.questions}
                  exitLabel="Kembali ke Lobi Latihan"
                  onExit={() => setActiveSession(null)}
                />
              ) : (
                <PracticeMode
                  sessionKey={activeSession.sessionKey}
                  mode="challenge"
                  title="Tantangan Acak Excel"
                  subtitle={`Mode Tantangan Acak · ${
                    activeSession.category === 'Semua'
                      ? 'Semua Kategori'
                      : activeSession.category
                  }`}
                  challengeCategoryLabel={
                    activeSession.category === 'Semua'
                      ? 'Semua Kategori'
                      : activeSession.category
                  }
                  questions={activeSession.questions}
                  exitLabel="Kembali ke Lobi Latihan"
                  onExit={() => setActiveSession(null)}
                  onRestartChallenge={() =>
                    startRandomChallenge(activeSession.category, activeSession.count)
                  }
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="arena-lobby"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Segmented Mode Selector */}
              <div
                className="mb-6 inline-flex items-center rounded-lg bg-slate-200/70 dark:bg-slate-800 p-1"
                role="tablist"
                aria-label="Pilih mode latihan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'per-formula'}
                  onClick={() => setArenaTab('per-formula')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    arenaTab === 'per-formula'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Latihan Per Rumus (26 Rumus)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'challenge'}
                  onClick={() => setArenaTab('challenge')}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    arenaTab === 'challenge'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mode Tantangan Acak</span>
                </button>
              </div>

              {arenaTab === 'per-formula' ? (
                <div>
                  {/* Filter Kategori */}
                  <div className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-2">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  {/* Grid Kartu Latihan Per Rumus */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredFormulas.map((item) => {
                      const total = PRACTICE_QUESTIONS_BY_FORMULA[item.id]?.length ?? 5;
                      const solved = Math.min(getFormulaSolvedCount(item.id), total);
                      const pct = Math.round((solved / total) * 100);
                      const isComplete = solved >= total;

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-colors duration-200"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                              <span className="truncate">
                                {item.category} · {item.level}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-mono font-semibold whitespace-nowrap shrink-0 tabular-nums ${
                                  isComplete
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {isComplete && (
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                <span>
                                  {solved}/{total} Soal
                                </span>
                              </span>
                            </div>

                            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                              {item.name}
                            </h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                              {item.tagline}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-700 dark:bg-emerald-500 transition-all duration-200"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => startFormulaPractice(item.id)}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                            >
                              <Play className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>
                                {solved > 0 && !isComplete
                                  ? 'Lanjutkan Latihan'
                                  : isComplete
                                  ? 'Ulangi Latihan'
                                  : 'Mulai Latihan (5 Soal)'}
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode Tantangan Acak */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] items-start">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                        Konfigurasi Tantangan Acak
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Soal dipilih acak tanpa menampilkan nama rumusnya di awal, sehingga Anda dilatih menentukan fungsi Excel yang paling tepat.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Cakupan Kategori Soal
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map((cat) => {
                          const active = challengeCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setChallengeCategory(cat)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                active
                                  ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {cat === 'Semua' ? 'Semua Kategori' : cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Jumlah Soal per Sesi
                      </label>
                      <div className="inline-flex items-center gap-2">
                        {([5, 10] as const).map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setChallengeCount(cnt)}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              challengeCount === cnt
                                ? 'bg-slate-900 dark:bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {cnt} Soal Acak
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          startRandomChallenge(challengeCategory, challengeCount)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Shuffle className="h-4 w-4" aria-hidden="true" />
                        <span>Mulai Tantangan Acak ({challengeCount} Soal)</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Riwayat Tantangan */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-5 py-3.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <History className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                        <span>Riwayat Skor Tantangan</span>
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {progress.challengeHistory.length} sesi
                      </span>
                    </div>

                    {progress.challengeHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          Belum ada riwayat tantangan acak
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                          Selesaikan satu sesi Tantangan Acak untuk melihat catatan skor Anda tersimpan otomatis di sini.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {progress.challengeHistory.map((item) => {
                          const pct = Math.round(
                            (item.correctCount / item.totalCount) * 100
                          );
                          return (
                            <li
                              key={item.id}
                              className="px-5 py-3.5 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {item.categoryLabel}
                                </div>
                                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                  {formatDateShort(item.completedAt)}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                  {item.correctCount}/{item.totalCount}
                                </div>
                                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  {pct}%
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
