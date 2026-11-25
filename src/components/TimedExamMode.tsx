import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Send,
  Timer,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  EXAM_PASS_THRESHOLD_PERCENT,
  ExamTrackId,
  stripExamTitlePrefix,
  TimedExamHistoryEntry,
} from '../data/practice/examTracks';
import { PracticeRunnerQuestion } from '../types/excel';
import {
  downloadCertificatePng,
  formatExamDuration,
  formatIndonesianDate,
} from '../utils/certificateGenerator';
import { validatePracticeFormula } from '../utils/formulaValidator';

interface QuestionEvaluation {
  question: PracticeRunnerQuestion;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean;
  message: string;
}

interface SubmittedExamState {
  entry: TimedExamHistoryEntry;
  submittedByTimeout: boolean;
  evaluations: QuestionEvaluation[];
}

interface TimedExamModeProps {
  sessionKey: string;
  participantName: string;
  trackId: ExamTrackId;
  trackTitle: string;
  durationSeconds: number;
  questions: PracticeRunnerQuestion[];
  onComplete: (entry: TimedExamHistoryEntry) => void;
  onRestart: () => void;
  onExit: () => void;
}

function generateCertificateId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GR-EXM-${yy}${mm}${dd}-${rand}`;
}

export function TimedExamMode({
  sessionKey,
  participantName,
  trackId,
  trackTitle,
  durationSeconds,
  questions,
  onComplete,
  onRestart,
  onExit,
}: TimedExamModeProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submittedState, setSubmittedState] = useState<SubmittedExamState | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const remainingRef = useRef(remainingSeconds);
  remainingRef.current = remainingSeconds;
  const hasSubmittedRef = useRef(false);

  // Reset when a brand-new session starts
  useEffect(() => {
    setCurrentIdx(0);
    setAnswers({});
    setRemainingSeconds(durationSeconds);
    setConfirmExit(false);
    setConfirmSubmit(false);
    setSubmittedState(null);
    hasSubmittedRef.current = false;
  }, [sessionKey, durationSeconds]);

  const gradeAndFinalize = useCallback(
    (byTimeout: boolean) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      const currentAnswers = answersRef.current;
      const evaluations: QuestionEvaluation[] = questions.map((q) => {
        const raw = (currentAnswers[q.id] ?? '').trim();
        const isAnswered = raw.length > 0;
        const validation = validatePracticeFormula(raw, q.acceptedFormulas);
        return {
          question: q,
          userAnswer: raw,
          isAnswered,
          isCorrect: validation.isCorrect,
          message: validation.message,
        };
      });

      const correctCount = evaluations.filter((e) => e.isCorrect).length;
      const totalCount = questions.length;
      const scorePercent =
        totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const passed = scorePercent >= EXAM_PASS_THRESHOLD_PERCENT;
      const elapsedSeconds = byTimeout
        ? durationSeconds
        : Math.max(1, durationSeconds - remainingRef.current);

      const entry: TimedExamHistoryEntry = {
        id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        certificateId: generateCertificateId(),
        participantName: participantName.trim() || 'Peserta Simulasi',
        trackId,
        trackTitle,
        correctCount,
        totalCount,
        scorePercent,
        passed,
        elapsedSeconds,
        durationSeconds,
        completedAt: new Date().toISOString(),
      };

      setConfirmSubmit(false);
      setConfirmExit(false);
      setSubmittedState({
        entry,
        submittedByTimeout: byTimeout,
        evaluations,
      });
      onComplete(entry);
    },
    [durationSeconds, onComplete, participantName, questions, trackId, trackTitle]
  );

  // 1-second exam countdown timer
  useEffect(() => {
    if (submittedState) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [submittedState, sessionKey]);

  // Trigger automatic grading as soon as timer hits 00:00
  useEffect(() => {
    if (remainingSeconds === 0 && !submittedState && !hasSubmittedRef.current) {
      gradeAndFinalize(true);
    }
  }, [remainingSeconds, submittedState, gradeAndFinalize]);

  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  const answeredCount = questions.filter(
    (q) => (answers[q.id] ?? '').trim().length > 0
  ).length;
  const isTimeCritical = remainingSeconds <= 60 && remainingSeconds > 0;

  if (submittedState) {
    const { entry, submittedByTimeout, evaluations } = submittedState;
    return (
      <div className="bg-[#FEFEFE] dark:bg-[#0A1815] rounded-2xl transition-colors duration-200 overflow-hidden">
        {/* Header Hasil Tes */}
        <div className="px-4 sm:px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#07170B]/8 dark:border-[#EAF2EC]/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-1">
              <Award className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {submittedByTimeout
                  ? 'Waktu Habis · Tes Otomatis Dinilai'
                  : 'Tes Selesai & Dinilai'}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE]">
              Hasil {entry.trackTitle}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Ulangi Tes Ini</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onExit}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Kembali ke Lobi</span>
            </motion.button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* 3 Ringkasan Nilai */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[#F5F6F6] dark:bg-[#041006] p-4">
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Skor Akhir
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {entry.scorePercent}%{' '}
                <span className="text-sm font-medium text-[#5E7064] dark:text-[#8A9A8F]">
                  ({entry.correctCount}/{entry.totalCount} Benar)
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#F5F6F6] dark:bg-[#041006] p-4">
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Predikat Uji (Standar &ge; {EXAM_PASS_THRESHOLD_PERCENT}%)
              </div>
              <div
                className={`mt-1.5 flex items-center gap-1.5 font-display text-base sm:text-lg font-extrabold ${
                  entry.passed
                    ? 'text-[#008120] dark:text-[#A2DF20]'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {entry.passed ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <span>
                  {entry.passed ? 'Kompeten / Lulus Uji' : 'Perlu Latihan Lagi'}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#F5F6F6] dark:bg-[#041006] p-4">
              <div className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                Durasi Pengerjaan
              </div>
              <div className="mt-1 font-mono text-2xl font-extrabold text-[#07170B] dark:text-[#FEFEFE] tabular-nums">
                {formatExamDuration(entry.elapsedSeconds)}{' '}
                <span className="text-xs font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                  / {formatExamDuration(entry.durationSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Pratinjau Sertifikat Digital GridRumus */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-display text-base sm:text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
                  Sertifikat Skor Digital
                </h4>
                <p className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                  Diproses langsung di browser tanpa menyimpan data ke server. Unduh sebagai gambar PNG beresolusi tinggi.
                </p>
              </div>
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => downloadCertificatePng(entry)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Unduh Sertifikat (.png)</span>
              </motion.button>
            </div>

            {/* Visual Preview Card mirroring Canvas Layout */}
            <div className="relative overflow-hidden rounded-2xl border border-[#A2DF20]/40 bg-[#07170B] p-6 sm:p-10 text-center text-[#FEFEFE]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(162,223,32,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(162,223,32,0.16) 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />

              <div className="relative z-10 mx-auto max-w-2xl space-y-5">
                <div className="mx-auto h-1 w-16 rounded-full bg-[#A2DF20]" />
                <div>
                  <div className="font-display text-sm font-bold text-[#A2DF20]">
                    GridRumus
                  </div>
                  <div className="mt-1 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-[#FEFEFE]">
                    Sertifikat Uji Kompetensi Excel Kerja
                  </div>
                </div>

                <div className="border-y border-[#EAF2EC]/15 py-5 space-y-2">
                  <div className="text-xs text-[#8A9A8F]">Diberikan kepada</div>
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#FEFEFE] break-words">
                    {entry.participantName}
                  </div>
                  <p className="text-xs sm:text-sm text-[#B5C4BA]">
                    Telah menyelesaikan Simulasi Tes Kerja Berwaktu pada bidang{' '}
                    <span className="font-bold text-[#A2DF20]">
                      {entry.trackTitle}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-center">
                  <div className="rounded-xl border border-[#EAF2EC]/15 bg-[#0B2012] px-3 py-3">
                    <div className="text-[11px] text-[#8A9A8F]">Skor Akhir</div>
                    <div className="mt-0.5 font-mono text-base font-bold text-[#A2DF20] tabular-nums">
                      {entry.scorePercent}% ({entry.correctCount}/{entry.totalCount})
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#EAF2EC]/15 bg-[#0B2012] px-3 py-3">
                    <div className="text-[11px] text-[#8A9A8F]">Predikat</div>
                    <div
                      className={`mt-0.5 font-display text-sm font-bold ${
                        entry.passed ? 'text-[#A2DF20]' : 'text-amber-300'
                      }`}
                    >
                      {entry.passed ? 'Kompeten / Lulus Uji' : 'Perlu Latihan Lagi'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#EAF2EC]/15 bg-[#0B2012] px-3 py-3">
                    <div className="text-[11px] text-[#8A9A8F]">Durasi</div>
                    <div className="mt-0.5 font-mono text-base font-bold text-[#FEFEFE] tabular-nums">
                      {formatExamDuration(entry.elapsedSeconds)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#8A9A8F] pt-2">
                  <span>Tanggal: {formatIndonesianDate(entry.completedAt)}</span>
                  <span className="font-mono text-[#A2DF20]">
                    ID: {entry.certificateId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pembahasan Lengkap Setiap Soal */}
          <div className="space-y-3">
            <h4 className="font-display text-base sm:text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
              Kunci Jawaban &amp; Pembahasan ({evaluations.length} Soal)
            </h4>
            <div className="space-y-2.5">
              {evaluations.map((item, idx) => (
                <div
                  key={item.question.id}
                  className="rounded-xl bg-[#F5F6F6] dark:bg-[#041006]/80 p-4 sm:p-5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.isCorrect ? (
                        <CheckCircle2
                          className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          className="h-4 w-4 text-red-700 dark:text-red-400 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-display text-sm font-bold text-[#07170B] dark:text-[#FEFEFE]">
                        Soal {idx + 1}: {stripExamTitlePrefix(item.question.title)}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        item.isCorrect
                          ? 'text-[#008120] dark:text-[#A2DF20]'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {item.isCorrect
                        ? 'Benar'
                        : item.isAnswered
                        ? 'Kurang Tepat'
                        : 'Tidak Dijawab'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-xs pt-1">
                    <div className="rounded-lg bg-[#FEFEFE] dark:bg-[#0A1815] px-3 py-2">
                      <span className="text-[#5E7064] dark:text-[#8A9A8F]">
                        Jawaban Anda:{' '}
                      </span>
                      <span className="font-mono font-semibold text-[#07170B] dark:text-[#FEFEFE] break-all">
                        {item.isAnswered ? item.userAnswer : '(kosong)'}
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#FEFEFE] dark:bg-[#0A1815] px-3 py-2">
                      <span className="text-[#5E7064] dark:text-[#8A9A8F]">
                        Jawaban Baku:{' '}
                      </span>
                      <span className="font-mono font-semibold text-[#008120] dark:text-[#A2DF20] break-all">
                        {item.question.acceptedFormulas[0]}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                    {item.question.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const qId = currentQuestion.id;
  const userInput = answers[qId] ?? '';

  return (
    <div className="bg-[#FEFEFE] dark:bg-[#0A1815] rounded-2xl transition-colors duration-200 overflow-hidden">
      {/* Header Ujian Berwaktu */}
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-[#07170B]/8 dark:border-[#EAF2EC]/10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#008120] dark:text-[#A2DF20] mb-0.5">
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Simulasi Tes Kerja Berwaktu</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#5E7064] dark:text-[#8A9A8F] font-normal">
              Peserta: {participantName}
            </span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE]">
            {trackTitle} ({questions.length} Soal)
          </h3>
        </div>

        {/* Countdown Timer + Submit Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="timer"
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs sm:text-sm font-bold tabular-nums transition-colors ${
              isTimeCritical
                ? 'bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-200 border border-red-400/50'
                : 'bg-[#EAF2EC] text-[#07170B] dark:bg-[#041006] dark:text-[#A2DF20]'
            }`}
          >
            {isTimeCritical ? (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{formatExamDuration(remainingSeconds)}</span>
            {isTimeCritical && (
              <span className="font-sans text-[11px] font-semibold">
                · Waktu Hampir Habis
              </span>
            )}
          </div>

          <span className="font-mono text-xs text-[#5E7064] dark:text-[#8A9A8F] tabular-nums">
            Terjawab: {answeredCount}/{questions.length}
          </span>

          {confirmExit ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100/90 dark:bg-red-950/60 px-3 py-1">
              <span className="text-xs font-medium text-red-900 dark:text-red-200">
                Batalkan tes?
              </span>
              <button
                type="button"
                onClick={onExit}
                className="rounded-full bg-red-700 hover:bg-red-800 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
              >
                Ya, Keluar
              </button>
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-2.5 py-1 text-xs font-medium text-[#07170B] dark:text-[#FEFEFE] cursor-pointer"
              >
                Lanjut
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setConfirmSubmit(false);
                setConfirmExit(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-3.5 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          )}

          {confirmSubmit ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] dark:bg-[#11281B] px-3 py-1">
              <span className="text-xs font-medium text-[#07170B] dark:text-[#FEFEFE]">
                Nilai sekarang?
              </span>
              <button
                type="button"
                onClick={() => gradeAndFinalize(false)}
                className="rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-3 py-1 text-xs font-bold text-[#07170B] cursor-pointer"
              >
                Ya, Kirim
              </button>
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-2.5 py-1 text-xs font-medium text-[#07170B] dark:text-[#FEFEFE] cursor-pointer"
              >
                Cek Ulang
              </button>
            </div>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setConfirmExit(false);
                if (answeredCount < questions.length) {
                  setConfirmSubmit(true);
                } else {
                  gradeAndFinalize(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-4 py-2 text-xs font-bold text-[#07170B] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Kirim &amp; Nilai Tes</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigasi Nomor Soal Ujian */}
      <div className="bg-[#EAF2EC]/55 dark:bg-[#041006]/70 px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const isFilled = (answers[q.id] ?? '').trim().length > 0;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIdx(idx)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                  : isFilled
                  ? 'bg-[#EAF2EC] dark:bg-[#A2DF20]/15 text-[#008120] dark:text-[#A2DF20]'
                  : 'bg-[#FEFEFE] dark:bg-[#0A1815] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {isFilled && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>Soal {idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Area Pengerjaan Soal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qId}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 sm:p-6 space-y-5"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#5E7064] dark:text-[#8A9A8F] mb-1">
              <span>
                Soal {currentIdx + 1} dari {questions.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Sel Target:{' '}
                <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20]">
                  {currentQuestion.targetCell}
                </span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Mode Ujian (Tanpa Petunjuk)</span>
            </div>
            <h4 className="font-display text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
              {stripExamTitlePrefix(currentQuestion.title)}
            </h4>
            <p className="mt-1.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
              {currentQuestion.instruction}
            </p>
          </div>

          {/* Grid Spreadsheet Interaktif */}
          <div>
            <div className="flex items-stretch border border-[#07170B]/12 dark:border-[#EAF2EC]/14 border-b-0 rounded-t-xl bg-[#FEFEFE] dark:bg-[#041006] overflow-hidden">
              <div className="w-16 shrink-0 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#EAF2EC]/60 dark:bg-[#07170B] px-2.5 py-2 text-center font-mono text-xs font-bold text-[#008120] dark:text-[#A2DF20] flex items-center justify-center">
                {currentQuestion.targetCell}
              </div>
              <div className="w-9 shrink-0 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#F5F6F6] dark:bg-[#07170B]/60 px-2 py-2 text-center font-mono text-xs italic font-semibold text-[#008120] dark:text-[#A2DF20] flex items-center justify-center">
                fx
              </div>
              <input
                type="text"
                value={userInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers((prev) => ({ ...prev, [qId]: val }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (currentIdx < questions.length - 1) {
                      setCurrentIdx((i) => i + 1);
                    }
                  }
                }}
                placeholder="Ketik rumus jawaban Anda, diawali tanda = ..."
                aria-label={`Ketik rumus Excel untuk sel ${currentQuestion.targetCell}`}
                className="flex-1 bg-transparent px-3 py-2 font-mono text-xs sm:text-sm text-[#07170B] dark:text-[#FEFEFE] placeholder:text-[#78887D] dark:placeholder:text-[#6E8074] focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto border border-[#07170B]/12 dark:border-[#EAF2EC]/14 rounded-b-xl bg-[#FEFEFE] dark:bg-[#041006]">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-[#EAF2EC]/70 dark:bg-[#07170B] border-b border-[#07170B]/12 dark:border-[#EAF2EC]/12">
                    <th className="w-10 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 py-1.5 px-2 text-center font-mono font-medium text-[#5E7064] dark:text-[#8A9A8F] select-none">
                      #
                    </th>
                    {currentQuestion.columns.map((col) => (
                      <th
                        key={col}
                        className="border-r last:border-r-0 border-[#07170B]/10 dark:border-[#EAF2EC]/12 py-1.5 px-3 text-center font-mono font-semibold text-[#3D4D42] dark:text-[#B5C4BA] select-none min-w-[100px]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentQuestion.rows.map((row) => (
                    <tr
                      key={row.rowNum}
                      className="border-b last:border-b-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8"
                    >
                      <td className="border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#EAF2EC]/45 dark:bg-[#07170B]/80 py-1.5 px-2 text-center font-mono font-medium text-[#5E7064] dark:text-[#8A9A8F] select-none tabular-nums">
                        {row.rowNum}
                      </td>
                      {currentQuestion.columns.map((col) => {
                        const ref = `${col}${row.rowNum}`;
                        const cell = row.cells[col];
                        if (!cell) {
                          return (
                            <td
                              key={ref}
                              className="border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 px-3 py-2"
                            />
                          );
                        }

                        const isTarget = Boolean(cell.isTarget);
                        const isHeader = Boolean(cell.isHeader);

                        if (isTarget) {
                          return (
                            <td
                              key={ref}
                              className="border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 p-0 ring-2 ring-inset bg-[#EAF2EC]/45 dark:bg-[#A2DF20]/8 ring-[#008120] dark:ring-[#A2DF20]"
                            >
                              <input
                                type="text"
                                value={userInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAnswers((prev) => ({ ...prev, [qId]: val }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (currentIdx < questions.length - 1) {
                                      setCurrentIdx((i) => i + 1);
                                    }
                                  }
                                }}
                                placeholder="=..."
                                aria-label={`Input sel target ${ref}`}
                                className={`w-full bg-transparent px-3 py-2 font-mono text-xs text-[#07170B] dark:text-[#FEFEFE] placeholder:text-[#008120]/60 dark:placeholder:text-[#A2DF20]/60 focus:outline-none ${
                                  cell.align === 'right' ? 'text-right' : 'text-left'
                                }`}
                              />
                            </td>
                          );
                        }

                        return (
                          <td
                            key={ref}
                            className={`border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 px-3 py-2 tabular-nums ${
                              isHeader
                                ? 'bg-[#EAF2EC]/75 dark:bg-[#102418] font-semibold text-[#07170B] dark:text-[#FEFEFE]'
                                : 'bg-[#FEFEFE] dark:bg-[#0A1815] text-[#3D4D42] dark:text-[#B5C4BA]'
                            } ${
                              cell.align === 'right'
                                ? 'text-right font-mono'
                                : 'text-left'
                            }`}
                          >
                            {typeof cell.value === 'number'
                              ? cell.value.toLocaleString('id-ID')
                              : cell.value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
              Jawaban disimpan otomatis selama sesi tes. Mendukung pemisah argumen koma <code className="font-mono">(,)</code> maupun titik koma <code className="font-mono">(;)</code>.
            </p>
          </div>

          {/* Navigasi Antar Soal */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Soal Sebelumnya</span>
            </button>

            {currentIdx < questions.length - 1 ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#07170B] hover:bg-[#122B18] text-[#A2DF20] dark:bg-[#A2DF20] dark:hover:bg-[#B3EB3B] dark:text-[#07170B] px-5 py-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>Soal Berikutnya</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (answeredCount < questions.length) {
                    setConfirmSubmit(true);
                  } else {
                    gradeAndFinalize(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2 text-xs font-bold text-[#07170B] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Selesai &amp; Nilai Ujian</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
