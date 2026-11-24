import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../hooks/useAuth';
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
  const { user, requireAuth } = useAuth();
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

  useEffect(() => {
    if (!user && activeSession) {
      setActiveSession(null);
    }
  }, [user, activeSession]);

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
    requireAuth('practice', () => {
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
    });
  };

  const startRandomChallenge = (
    cat: FormulaCategory = challengeCategory,
    count: number = challengeCount
  ) => {
    requireAuth('practice', () => {
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
      className="py-16 bg-[#EAF2EC]/65 dark:bg-[#041006] transition-colors duration-200"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        {/* Header Arena Latihan */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-7">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1.5">
              <Target className="h-4 w-4" aria-hidden="true" />
              <span>Praktek Langsung di Web</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#07170B] dark:text-[#FEFEFE]">
              Arena Latihan Soal &amp;{' '}
              <span className="text-[#008120] dark:text-[#A2DF20]">
                Tantangan Acak
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-2xl">
              Uji kemampuan menulis rumus Excel langsung di grid interaktif. Pilih latihan terfokus 5 soal per rumus atau tantang diri dengan soal acak lintas kategori.
            </p>
          </div>

          {/* Kontrol Reset Progres Aman */}
          {!activeSession && (
            <div className="flex items-center gap-2 shrink-0">
              {confirmReset ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-red-100/90 dark:bg-red-950/50 px-4 py-1.5">
                  <span className="text-xs font-medium text-red-900 dark:text-red-200">
                    Hapus semua skor?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllProgress();
                      setConfirmReset(false);
                    }}
                    className="rounded-full bg-red-700 hover:bg-red-800 px-3 py-1 text-xs font-semibold text-white cursor-pointer"
                  >
                    Ya, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-3 py-1 text-xs font-medium text-[#07170B] dark:text-[#FEFEFE] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={solvedTotalCount === 0 && progress.challengeHistory.length === 0}
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] hover:bg-[#DCE6DF] dark:hover:bg-[#11281B] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer transition-colors"
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
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-transparent dark:border-[#00aa10] bg-[#FEFEFE] dark:bg-[#041006] px-5 py-4 flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Total Soal Dikuasai
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {solvedTotalCount}{' '}
                <span className="text-sm font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                  / {totalQuestionsCount}
                </span>
              </div>
            </div>
            <CheckCircle2
              className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] shrink-0"
              aria-hidden="true"
            />
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-transparent dark:border-[#00aa10] bg-[#FEFEFE] dark:bg-[#041006] px-5 py-4 flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Rumus Tuntas (5/5)
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {completedFormulasCount}{' '}
                <span className="text-sm font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                  / {FORMULAS.length}
                </span>
              </div>
            </div>
            <Award
              className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] shrink-0"
              aria-hidden="true"
            />
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-transparent dark:border-[#00aa10] bg-[#FEFEFE] dark:bg-[#041006] px-5 py-4 flex items-center justify-between"
          >
            <div>
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Skor Tantangan Terbaik
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {progress.challengeHistory.length > 0 ? `${bestChallengePercent}%` : '—'}
              </div>
            </div>
            <Shuffle
              className="h-5 w-5 text-[#008120] dark:text-[#A2DF20] shrink-0"
              aria-hidden="true"
            />
          </motion.div>
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
                className="mb-6 inline-flex items-center rounded-full bg-[#DCE6DF] dark:bg-[#041006] p-1"
                role="tablist"
                aria-label="Pilih mode latihan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'per-formula'}
                  onClick={() => setArenaTab('per-formula')}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    arenaTab === 'per-formula'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'per-formula' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Play className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                  <span className="relative z-10">Latihan Per Rumus (26 Rumus)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'challenge'}
                  onClick={() => setArenaTab('challenge')}
                  className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    arenaTab === 'challenge'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'challenge' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Shuffle className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                  <span className="relative z-10">Mode Tantangan Acak</span>
                </button>
              </div>

              {arenaTab === 'per-formula' ? (
                <div>
                  {/* Filter Kategori */}
                  <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <motion.button
                          key={cat}
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedCategory(cat)}
                          className={`relative rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'text-[#A2DF20] dark:text-[#07170B]'
                              : 'bg-[#FEFEFE] dark:bg-[#001a04] text-[#3D4D42] dark:text-[#B5C4BA] hover:bg-[#FEFEFE]/80 dark:hover:bg-[#11281B] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="arena-category-pill"
                              transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                              className="absolute inset-0 rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                            />
                          )}
                          <span className="relative z-10">{cat}</span>
                        </motion.button>
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
                        <motion.div
                          key={item.id}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col justify-between rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-5 transition-colors duration-200"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F] mb-1.5">
                              <span className="truncate">
                                {item.category} · {item.level}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 font-mono font-semibold whitespace-nowrap shrink-0 tabular-nums ${
                                  isComplete
                                    ? 'text-[#008120] dark:text-[#A2DF20]'
                                    : 'text-[#3D4D42] dark:text-[#B5C4BA]'
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

                            <h3 className="font-display text-base font-bold text-[#07170B] dark:text-[#98ff00]">
                              {item.name}
                            </h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] line-clamp-2">
                              {item.tagline}
                            </p>
                          </div>

                          <div className="mt-5 space-y-3">
                            <div className="h-1.5 w-full rounded-full bg-[#EAF2EC] dark:bg-[#041006] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#008120] dark:bg-[#A2DF20] transition-all duration-200"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => startFormulaPractice(item.id)}
                              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                                isComplete
                                  ? 'bg-[#EAF2EC] dark:bg-[#11281B] text-[#07170B] dark:text-[#A2DF20] hover:bg-[#DCE6DF] dark:hover:bg-[#193827]'
                                  : 'bg-[#07170B] hover:bg-[#122B18] text-[#A2DF20] dark:bg-[#A2DF20] dark:hover:bg-[#B3EB3B] dark:text-[#07170B]'
                              }`}
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
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Mode Tantangan Acak */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr] items-start">
                  <div className="rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-6 space-y-5">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        Konfigurasi Tantangan Acak
                      </h3>
                      <p className="mt-1 text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                        Soal dipilih acak tanpa menampilkan nama rumusnya di awal, sehingga Anda dilatih menentukan fungsi Excel yang paling tepat.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
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
                              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                active
                                  ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                                  : 'bg-[#F5F6F6] dark:bg-[#041006] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                              }`}
                            >
                              {cat === 'Semua' ? 'Semua Kategori' : cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
                        Jumlah Soal per Sesi
                      </label>
                      <div className="inline-flex items-center gap-2">
                        {([5, 10] as const).map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setChallengeCount(cnt)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              challengeCount === cnt
                                ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                                : 'bg-[#F5F6F6] dark:bg-[#041006] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                            }`}
                          >
                            {cnt} Soal Acak
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          startRandomChallenge(challengeCategory, challengeCount)
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer"
                      >
                        <Shuffle className="h-4 w-4" aria-hidden="true" />
                        <span>Mulai Tantangan Acak ({challengeCount} Soal)</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Riwayat Tantangan */}
                  <div className="rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] overflow-hidden">
                    <div className="bg-[#EAF2EC]/75 dark:bg-[#041006]/55 px-5 py-3.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        <History className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                        <span>Riwayat Skor Tantangan</span>
                      </span>
                      <span className="font-mono text-xs text-[#3D4D42] dark:text-[#A2DF20] tabular-nums">
                        {progress.challengeHistory.length} sesi
                      </span>
                    </div>

                    {progress.challengeHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                          Belum ada riwayat tantangan acak
                        </p>
                        <p className="mt-1 text-xs text-[#5E7064] dark:text-[#8A9A8F] max-w-xs mx-auto">
                          Selesaikan satu sesi Tantangan Acak untuk melihat catatan skor Anda tersimpan otomatis di sini.
                        </p>
                      </div>
                    ) : (
                      <ul className="p-2 space-y-1">
                        {progress.challengeHistory.map((item, idx) => {
                          const pct = Math.round(
                            (item.correctCount / item.totalCount) * 100
                          );
                          return (
                            <li
                              key={item.id}
                              className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 ${
                                idx % 2 === 1
                                  ? 'bg-[#F5F6F6]/70 dark:bg-[#041006]/45'
                                  : ''
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                  {item.categoryLabel}
                                </div>
                                <div className="mt-0.5 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                                  {formatDateShort(item.completedAt)}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-mono text-sm font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                                  {item.correctCount}/{item.totalCount}
                                </div>
                                <div className="font-mono text-xs text-[#5E7064] dark:text-[#8A9A8F] tabular-nums">
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
