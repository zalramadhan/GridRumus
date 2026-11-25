import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  History,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Target,
  Timer,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FORMULAS } from '../data/formulas';
import {
  JOB_PRACTICE_ROLES,
  PRACTICE_QUESTIONS_BY_FORMULA,
} from '../data/practice';
import {
  buildExamQuestions,
  clearExamHistory,
  EXAM_PASS_THRESHOLD_PERCENT,
  EXAM_TRACK_PRESETS,
  ExamTrackId,
  loadExamHistory,
  saveExamHistoryEntry,
  TimedExamHistoryEntry,
} from '../data/practice/examTracks';
import { useAuth } from '../hooks/useAuth';
import { formatRemainingHoursMinutes, usePaidPass } from '../hooks/usePaidPass';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { FormulaCategory, PracticeRunnerQuestion } from '../types/excel';
import { downloadCertificatePng, formatExamDuration } from '../utils/certificateGenerator';
import { PracticeMode } from './PracticeMode';
import { TimedExamMode } from './TimedExamMode';

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
      type: 'job';
      sessionKey: string;
      jobId: string;
      roleTitle: string;
      department: string;
      questions: PracticeRunnerQuestion[];
    }
  | {
      type: 'challenge';
      sessionKey: string;
      category: FormulaCategory;
      count: number;
      questions: PracticeRunnerQuestion[];
    }
  | {
      type: 'timed-exam';
      sessionKey: string;
      participantName: string;
      trackId: ExamTrackId;
      trackTitle: string;
      durationSeconds: number;
      count: 5 | 10;
      questions: PracticeRunnerQuestion[];
    };

export function PracticeArena() {
  const { user, requireAuth } = useAuth();
  const {
    hasActivePass,
    remainingSeconds,
    statusLoading,
    priceIdr,
    passDurationHours,
    openPaywall,
  } = usePaidPass();
  const {
    progress,
    totalQuestionsCount,
    solvedTotalCount,
    completedFormulasCount,
    completedJobsCount,
    bestChallengePercent,
    getFormulaSolvedCount,
    getJobSolvedCount,
    resetAllProgress,
  } = usePracticeProgress();

  const [arenaTab, setArenaTab] = useState<
    'per-formula' | 'per-job' | 'timed-exam' | 'challenge'
  >('per-formula');
  const [selectedCategory, setSelectedCategory] = useState<FormulaCategory>('Semua');
  const [challengeCategory, setChallengeCategory] = useState<FormulaCategory>('Semua');
  const [challengeCount, setChallengeCount] = useState<5 | 10>(10);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveArenaSession | null>(null);

  // Timed Exam Lobby states (browser-only, no Firestore writes)
  const [participantName, setParticipantName] = useState('');
  const [examNameError, setExamNameError] = useState('');
  const [examTrackId, setExamTrackId] = useState<ExamTrackId>('admin-kantor');
  const [examCount, setExamCount] = useState<5 | 10>(5);
  const [examHistory, setExamHistory] = useState<TimedExamHistoryEntry[]>(() =>
    loadExamHistory()
  );

  useEffect(() => {
    if (user?.displayName && !participantName) {
      setParticipantName(user.displayName);
    }
  }, [user?.displayName, participantName]);

  useEffect(() => {
    if (!user && activeSession) {
      setActiveSession(null);
    } else if (user && !statusLoading && !hasActivePass && activeSession) {
      setActiveSession(null);
    }
  }, [user, statusLoading, hasActivePass, activeSession]);

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
    if (!hasActivePass) {
      openPaywall(`Latihan ${formula.name}`);
      return;
    }
    requireAuth('practice', () => {
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

  const startJobPractice = (jobId: string) => {
    const job = JOB_PRACTICE_ROLES.find((j) => j.id === jobId);
    if (!job || job.questions.length === 0) return;
    if (!hasActivePass) {
      openPaywall(`Simulasi Kerja: ${job.roleTitle}`);
      return;
    }
    requireAuth('practice', () => {
      const qs: PracticeRunnerQuestion[] = job.questions.map((q) => ({
        ...q,
        formulaId: job.id,
        formulaName: job.roleTitle,
        category: 'Matematika & Agregasi',
      }));

      setActiveSession({
        type: 'job',
        sessionKey: `arena-job-${job.id}-${Date.now()}`,
        jobId: job.id,
        roleTitle: job.roleTitle,
        department: job.department,
        questions: qs,
      });
    });
  };

  const startRandomChallenge = (
    cat: FormulaCategory = challengeCategory,
    count: number = challengeCount
  ) => {
    if (!hasActivePass) {
      openPaywall('Mode Tantangan Acak');
      return;
    }
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

  const startTimedExam = (
    trackId: ExamTrackId = examTrackId,
    count: 5 | 10 = examCount,
    nameOverride?: string
  ) => {
    const preset = EXAM_TRACK_PRESETS.find((t) => t.id === trackId) ?? EXAM_TRACK_PRESETS[0];
    if (!hasActivePass) {
      openPaywall(`Simulasi Tes Kerja: ${preset.title}`);
      return;
    }
    const cleanName = (nameOverride ?? participantName).trim();
    if (!cleanName) {
      setExamNameError('Masukkan nama lengkap Anda terlebih dahulu untuk dicetak di sertifikat.');
      return;
    }

    const qs = buildExamQuestions(preset.id, count);
    if (qs.length === 0) return;

    setExamNameError('');
    setActiveSession({
      type: 'timed-exam',
      sessionKey: `arena-timed-exam-${preset.id}-${count}-${Date.now()}`,
      participantName: cleanName.slice(0, 80),
      trackId: preset.id,
      trackTitle: preset.title,
      durationSeconds: count * 60,
      count,
      questions: qs,
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
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
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
                Rumus &amp; Profesi Tuntas
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {completedFormulasCount}{' '}
                <span className="text-sm font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                  / {FORMULAS.length} Rumus · {completedJobsCount}/{JOB_PRACTICE_ROLES.length} Job
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

        {/* Bilah Status Token Harian Mayar.id */}
        <div
          className={`mb-7 rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
            hasActivePass
              ? 'border-[#008120]/30 dark:border-[#A2DF20]/40 bg-[#FEFEFE] dark:bg-[#0A1815]'
              : 'border-[#07170B]/15 dark:border-[#EAF2EC]/18 bg-[#FEFEFE] dark:bg-[#0A1815]'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                hasActivePass
                  ? 'bg-[#A2DF20]/25 text-[#008120] dark:text-[#A2DF20]'
                  : 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20]/15 dark:text-[#A2DF20]'
              }`}
            >
              {hasActivePass ? (
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Lock className="h-5 w-5" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0">
              {hasActivePass ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-display text-sm sm:text-base font-bold text-[#07170B] dark:text-[#FEFEFE]">
                      Token Harian Aktif · Semua Mode Terbuka
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Sisa waktu: {formatRemainingHoursMinutes(remainingSeconds)}</span>
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                    Bebas mengerjakan Latihan Per Rumus, Profesi Kerja, Simulasi Tes Kerja Berwaktu, dan Tantangan Acak.
                  </p>
                </>
              ) : (
                <>
                  <div className="font-display text-sm sm:text-base font-bold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                    Arena Latihan Memerlukan Token Harian · Rp{priceIdr.toLocaleString('id-ID')} / {passDurationHours} Jam
                  </div>
                  <p className="mt-0.5 text-xs text-[#3D4D42] dark:text-[#B5C4BA]">
                    Satu kali pembayaran otomatis via QRIS / E-Wallet / VA di Mayar.id membuka seluruh 4 mode latihan selama {passDurationHours} jam penuh.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0">
            {hasActivePass ? (
              <button
                type="button"
                onClick={() => openPaywall('Status Token Harian 24 Jam')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                <span>Detail Token</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={statusLoading}
                onClick={() => openPaywall('Seluruh Mode Arena Latihan Soal')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] disabled:opacity-60 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#07170B] transition-colors whitespace-nowrap cursor-pointer tabular-nums"
              >
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {statusLoading
                    ? 'Memeriksa Status Token...'
                    : `Beli Token 24 Jam (Rp${priceIdr.toLocaleString('id-ID')})`}
                </span>
              </button>
            )}
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
              ) : activeSession.type === 'job' ? (
                <PracticeMode
                  sessionKey={activeSession.sessionKey}
                  mode="job"
                  title={`Simulasi Kerja: ${activeSession.roleTitle}`}
                  subtitle={`Latihan Berdasarkan Profesi · ${activeSession.department}`}
                  formulaIdForScore={activeSession.jobId}
                  questions={activeSession.questions}
                  exitLabel="Kembali ke Lobi Latihan"
                  onExit={() => setActiveSession(null)}
                />
              ) : activeSession.type === 'timed-exam' ? (
                <TimedExamMode
                  sessionKey={activeSession.sessionKey}
                  participantName={activeSession.participantName}
                  trackId={activeSession.trackId}
                  trackTitle={activeSession.trackTitle}
                  durationSeconds={activeSession.durationSeconds}
                  questions={activeSession.questions}
                  onComplete={(entry) => {
                    const updated = saveExamHistoryEntry(entry);
                    setExamHistory(updated);
                  }}
                  onRestart={() =>
                    startTimedExam(
                      activeSession.trackId,
                      activeSession.count,
                      activeSession.participantName
                    )
                  }
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
                className="mb-6 flex w-full lg:w-auto lg:inline-flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-1 rounded-2xl lg:rounded-full bg-[#DCE6DF] dark:bg-[#041006] p-1"
                role="tablist"
                aria-label="Pilih mode latihan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'per-formula'}
                  onClick={() => setArenaTab('per-formula')}
                  className={`relative inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    arenaTab === 'per-formula'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'per-formula' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-xl sm:rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Play className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="relative z-10">Latihan Per Rumus (26 Rumus)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'per-job'}
                  onClick={() => setArenaTab('per-job')}
                  className={`relative inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    arenaTab === 'per-job'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'per-job' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-xl sm:rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Briefcase className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="relative z-10">Sesuai Pekerjaan ({JOB_PRACTICE_ROLES.length} Profesi)</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'timed-exam'}
                  onClick={() => setArenaTab('timed-exam')}
                  className={`relative inline-flex items-center justify-center gap-2 rounded-xl lg:rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    arenaTab === 'timed-exam'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'timed-exam' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-xl lg:rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Timer className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="relative z-10">Simulasi Tes Kerja</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={arenaTab === 'challenge'}
                  onClick={() => setArenaTab('challenge')}
                  className={`relative inline-flex items-center justify-center gap-2 rounded-xl lg:rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    arenaTab === 'challenge'
                      ? 'text-[#A2DF20] dark:text-[#07170B]'
                      : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                  }`}
                >
                  {arenaTab === 'challenge' && (
                    <motion.span
                      layoutId="arena-mode-pill"
                      transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                      className="absolute inset-0 rounded-xl lg:rounded-full bg-[#07170B] dark:bg-[#A2DF20]"
                    />
                  )}
                  <Shuffle className="relative z-10 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="relative z-10">Mode Tantangan Acak</span>
                </button>
              </div>

              {arenaTab === 'timed-exam' ? (
                /* Lobby Simulasi Tes Kerja Berwaktu & Sertifikat Skor */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
                  <div className="min-w-0 rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-4 sm:p-6 space-y-5">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        Simulasi Tes Interview Admin &amp; Finance
                      </h3>
                      <p className="mt-1 text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                        Uji kesiapan menghadapi tes Excel masuk kerja dengan timer hitung mundur, tanpa tombol bantuan, lalu unduh Sertifikat Skor (.png) langsung di browser.
                      </p>
                    </div>

                    {/* Nama Lengkap Peserta */}
                    <div>
                      <label
                        htmlFor="exam-participant-name"
                        className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-1.5"
                      >
                        Nama Lengkap Peserta (untuk Sertifikat)
                      </label>
                      <input
                        id="exam-participant-name"
                        type="text"
                        maxLength={80}
                        value={participantName}
                        onChange={(e) => {
                          setParticipantName(e.target.value);
                          if (examNameError) setExamNameError('');
                        }}
                        placeholder="Contoh: Nadia Kusuma"
                        className="w-full rounded-xl border border-[#07170B]/15 dark:border-[#EAF2EC]/18 bg-[#F5F6F6] dark:bg-[#041006] px-4 py-2.5 text-sm text-[#07170B] dark:text-[#FEFEFE] placeholder:text-[#78887D] dark:placeholder:text-[#6E8074] focus:border-[#008120] dark:focus:border-[#A2DF20] focus:outline-none"
                      />
                      {examNameError && (
                        <p className="mt-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                          {examNameError}
                        </p>
                      )}
                    </div>

                    {/* Paket Posisi Tes */}
                    <div>
                      <label className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
                        Pilih Paket Posisi Tes
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {EXAM_TRACK_PRESETS.map((preset) => {
                          const selected = examTrackId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setExamTrackId(preset.id)}
                              className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
                                selected
                                  ? 'border-[#008120] dark:border-[#A2DF20] bg-[#EAF2EC]/80 dark:bg-[#041006]'
                                  : 'border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#F5F6F6]/70 dark:bg-[#041006]/50 hover:border-[#07170B]/25 dark:hover:border-[#EAF2EC]/25'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-display text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                                  {preset.title}
                                </span>
                                <span
                                  className={`text-xs font-semibold shrink-0 ${
                                    selected
                                      ? 'text-[#008120] dark:text-[#A2DF20]'
                                      : 'text-[#5E7064] dark:text-[#8A9A8F]'
                                  }`}
                                >
                                  {selected ? 'Dipilih' : preset.roleLabel}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                                {preset.summary}
                              </p>
                              <p className="mt-2 font-mono text-[11px] text-[#008120] dark:text-[#A2DF20] break-words">
                                Materi: {preset.focusFormulas.join(' · ')}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pilihan Durasi & Jumlah Soal */}
                    <div>
                      <label className="block text-xs font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
                        Durasi &amp; Jumlah Soal
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {([5, 10] as const).map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setExamCount(cnt)}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              examCount === cnt
                                ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                                : 'bg-[#F5F6F6] dark:bg-[#041006] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                            }`}
                          >
                            {cnt} Soal · {cnt} Menit
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Catatan Aturan Ujian */}
                    <div className="rounded-xl bg-[#F5F6F6] dark:bg-[#041006] p-4 text-xs text-[#3D4D42] dark:text-[#B5C4BA] space-y-1">
                      <p className="font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        Ketentuan Simulasi:
                      </p>
                      <p>
                        1. Tombol Petunjuk dan Lihat Jawaban dinonaktifkan selama timer berjalan.
                      </p>
                      <p>
                        2. Kunci rumus &amp; pembahasan terbuka otomatis setelah seluruh soal dinilai.
                      </p>
                      <p>
                        3. Skor minimal {EXAM_PASS_THRESHOLD_PERCENT}% meraih predikat Kompeten / Lulus Uji pada sertifikat PNG.
                      </p>
                    </div>

                    <div className="pt-1">
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => startTimedExam(examTrackId, examCount)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer"
                      >
                        {hasActivePass ? (
                          <Timer className="h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {hasActivePass
                            ? `Mulai Tes Sekarang (${examCount} Menit)`
                            : `Buka Tes dengan Token Rp${priceIdr.toLocaleString('id-ID')}`}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Riwayat Simulasi Tes di Browser Lokal */}
                  <div className="rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] overflow-hidden">
                    <div className="bg-[#EAF2EC]/75 dark:bg-[#041006]/55 px-5 py-3.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        <Award className="h-4 w-4 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                        <span>Riwayat Sertifikat (Browser Lokal)</span>
                      </span>
                      {examHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearExamHistory();
                            setExamHistory([]);
                          }}
                          className="text-xs font-semibold text-[#5E7064] hover:text-red-700 dark:text-[#8A9A8F] dark:hover:text-red-400 cursor-pointer"
                        >
                          Hapus Riwayat
                        </button>
                      )}
                    </div>

                    {examHistory.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                          Belum ada riwayat simulasi tes
                        </p>
                        <p className="mt-1 text-xs text-[#5E7064] dark:text-[#8A9A8F] max-w-xs mx-auto">
                          Selesaikan satu sesi tes kerja untuk melihat skor dan mengunduh ulang sertifikat PNG dari perangkat ini.
                        </p>
                      </div>
                    ) : (
                      <ul className="p-2 space-y-1.5">
                        {examHistory.map((item, idx) => (
                          <li
                            key={item.id}
                            className={`rounded-xl px-4 py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between ${
                              idx % 2 === 1
                                ? 'bg-[#F5F6F6]/70 dark:bg-[#041006]/45'
                                : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#07170B] dark:text-[#FEFEFE] truncate">
                                {item.participantName}
                              </div>
                              <div className="text-xs text-[#3D4D42] dark:text-[#B5C4BA] truncate">
                                {item.trackTitle}
                              </div>
                              <div className="mt-0.5 text-[11px] text-[#5E7064] dark:text-[#8A9A8F] tabular-nums">
                                {formatDateShort(item.completedAt)} · Waktu {formatExamDuration(item.elapsedSeconds)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <div className="sm:text-right">
                                <div className="font-mono text-sm font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                                  {item.scorePercent}% ({item.correctCount}/{item.totalCount})
                                </div>
                                <div
                                  className={`text-[11px] font-semibold ${
                                    item.passed
                                      ? 'text-[#008120] dark:text-[#A2DF20]'
                                      : 'text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {item.passed ? 'Kompeten' : 'Perlu Latihan'}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => downloadCertificatePng(item)}
                                className="inline-flex items-center gap-1 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-3 py-1.5 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap cursor-pointer transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>PNG</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : arenaTab === 'per-job' ? (
                <div>
                  <p className="mb-5 text-sm text-[#3D4D42] dark:text-[#B5C4BA] max-w-2xl">
                    Pilih simulasi soal Excel sesuai posisi kerja nyata—lengkap dengan kasus operasional pabrik, administrasi kantor, pembukuan akunting, logistik gudang, sales, hingga penggajian HRD.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {JOB_PRACTICE_ROLES.map((job) => {
                      const total = job.questions.length;
                      const solved = Math.min(getJobSolvedCount(job.id), total);
                      const pct = Math.round((solved / total) * 100);
                      const isComplete = solved >= total;

                      return (
                        <motion.div
                          key={job.id}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                          className="flex flex-col justify-between rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-5 transition-colors duration-200"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F] mb-1.5">
                              <span className="truncate">{job.department}</span>
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
                              {job.roleTitle}
                            </h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                              {job.summary}
                            </p>
                            <p className="mt-2.5 font-mono text-[11px] text-[#008120] dark:text-[#A2DF20] break-words">
                              Rumus kunci: {job.focusFormulas.join(' · ')}
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
                              onClick={() => startJobPractice(job.id)}
                              className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                                isComplete
                                  ? 'bg-[#EAF2EC] dark:bg-[#11281B] text-[#07170B] dark:text-[#A2DF20] hover:bg-[#DCE6DF] dark:hover:bg-[#193827]'
                                  : 'bg-[#07170B] hover:bg-[#122B18] text-[#A2DF20] dark:bg-[#A2DF20] dark:hover:bg-[#B3EB3B] dark:text-[#07170B]'
                              }`}
                            >
                              {hasActivePass ? (
                                <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              )}
                              <span>
                                {solved > 0 && !isComplete
                                  ? 'Lanjutkan Simulasi Kerja'
                                  : isComplete
                                  ? 'Ulangi Simulasi Kerja'
                                  : `Mulai Simulasi (${total} Soal)`}
                              </span>
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : arenaTab === 'per-formula' ? (
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
                              {hasActivePass ? (
                                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                              )}
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
                  <div className="min-w-0 rounded-2xl bg-[#FEFEFE] dark:bg-[#0A1815] p-4 sm:p-6 space-y-5">
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
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 sm:px-6 py-3 text-sm font-bold text-[#07170B] transition-colors cursor-pointer"
                      >
                        {hasActivePass ? (
                          <Shuffle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {hasActivePass
                            ? `Mulai Tantangan Acak (${challengeCount} Soal)`
                            : `Buka Tantangan dengan Token Rp${priceIdr.toLocaleString('id-ID')}`}
                        </span>
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
