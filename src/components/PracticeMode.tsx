import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle2,
  Eye,
  HelpCircle,
  Play,
  RotateCcw,
  Shuffle,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { PracticeRunnerQuestion } from '../types/excel';
import { validatePracticeFormula, ValidationResult } from '../utils/formulaValidator';

interface PracticeModeProps {
  sessionKey: string;
  mode: 'formula' | 'challenge' | 'job';
  title: string;
  subtitle: string;
  formulaIdForScore?: string;
  challengeCategoryLabel?: string;
  questions: PracticeRunnerQuestion[];
  exitLabel?: string;
  onExit: () => void;
  onRestartChallenge?: () => void;
}

export function PracticeMode({
  sessionKey,
  mode,
  title,
  subtitle,
  formulaIdForScore,
  challengeCategoryLabel,
  questions,
  exitLabel = 'Kembali ke Simulator',
  onExit,
  onRestartChallenge,
}: PracticeModeProps) {
  const { recordQuestionSolved, recordFormulaSessionScore, recordChallengeSession } =
    usePracticeProgress();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ValidationResult>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [sessionRecorded, setSessionRecorded] = useState(false);

  useEffect(() => {
    setCurrentIdx(0);
    setAnswers({});
    setResults({});
    setShowHint({});
    setRevealed({});
    setShowSummary(false);
    setSessionRecorded(false);
  }, [sessionKey]);

  const currentQuestion = questions[currentIdx];
  if (!currentQuestion) return null;

  const qId = currentQuestion.id;
  const userInput = answers[qId] ?? '';
  const result = results[qId];
  const isHintVisible = Boolean(showHint[qId]);
  const isRevealed = Boolean(revealed[qId]);

  const earnedCorrectCount = questions.filter(
    (q) => results[q.id]?.isCorrect && !revealed[q.id]
  ).length;
  const displayedCorrectCount = questions.filter(
    (q) => results[q.id]?.isCorrect
  ).length;

  const finalizeSessionIfNeeded = (finalEarnedCount: number) => {
    if (sessionRecorded) return;
    setSessionRecorded(true);
    if ((mode === 'formula' || mode === 'job') && formulaIdForScore) {
      recordFormulaSessionScore(formulaIdForScore, finalEarnedCount);
    } else if (mode === 'challenge' && challengeCategoryLabel) {
      recordChallengeSession(
        challengeCategoryLabel,
        finalEarnedCount,
        questions.length
      );
    }
  };

  const handleCheck = () => {
    const validation = validatePracticeFormula(
      userInput,
      currentQuestion.acceptedFormulas
    );
    const nextResults = { ...results, [qId]: validation };
    setResults(nextResults);

    if (validation.isCorrect && !revealed[qId]) {
      recordQuestionSolved(qId, currentQuestion.formulaId);
      if ((mode === 'formula' || mode === 'job') && formulaIdForScore) {
        const nextEarned = questions.filter(
          (q) => nextResults[q.id]?.isCorrect && !revealed[q.id]
        ).length;
        recordFormulaSessionScore(formulaIdForScore, nextEarned);
      }
    }
  };

  const handleRevealAnswer = () => {
    const canonical = currentQuestion.acceptedFormulas[0];
    setAnswers((prev) => ({ ...prev, [qId]: canonical }));
    setRevealed((prev) => ({ ...prev, [qId]: true }));
    setResults((prev) => ({
      ...prev,
      [qId]: {
        isCorrect: true,
        message:
          'Contoh jawaban diisikan. Pelajari polanya lalu lanjut ke soal berikutnya.',
      },
    }));
  };

  const handleRestart = () => {
    if (mode === 'challenge' && onRestartChallenge) {
      onRestartChallenge();
      return;
    }
    setCurrentIdx(0);
    setAnswers({});
    setResults({});
    setShowHint({});
    setRevealed({});
    setShowSummary(false);
    setSessionRecorded(false);
  };

  const handleOpenSummary = () => {
    finalizeSessionIfNeeded(earnedCorrectCount);
    setShowSummary(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      handleOpenSummary();
    }
  };

  const formatExpected = (val: string | number): string => {
    if (typeof val === 'number') return val.toLocaleString('id-ID');
    return val === '' ? '"" (kosong)' : val;
  };

  return (
    <div className="bg-[#FEFEFE] dark:bg-[#0A1815] rounded-2xl transition-colors duration-200 overflow-hidden">
      {/* Header Latihan */}
      <div className="px-4 sm:px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#008120] dark:text-[#A2DF20] font-semibold mb-1">
            {mode === 'challenge' ? (
              <Shuffle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : mode === 'job' ? (
              <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">{subtitle}</span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE]">
            {title} ({questions.length} Soal)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="font-mono text-xs font-bold text-[#07170B] dark:text-[#A2DF20] tabular-nums">
            Benar: {earnedCorrectCount}/{questions.length}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{exitLabel}</span>
          </motion.button>
        </div>
      </div>

      {/* Navigasi Nomor Soal */}
      <div className="bg-[#EAF2EC]/55 dark:bg-[#041006]/70 px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
        {questions.map((q, idx) => {
          const isCurrent = !showSummary && idx === currentIdx;
          const status = results[q.id];
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setShowSummary(false);
                setCurrentIdx(idx);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
                  : status?.isCorrect
                  ? 'bg-[#EAF2EC] dark:bg-[#A2DF20]/15 text-[#008120] dark:text-[#A2DF20]'
                  : status && !status.isCorrect
                  ? 'bg-red-100/80 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                  : 'bg-[#FEFEFE] dark:bg-[#0A1815] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
              }`}
            >
              {status?.isCorrect && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              {status && !status.isCorrect && (
                <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span>Soal {idx + 1}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleOpenSummary}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showSummary
              ? 'bg-[#07170B] text-[#A2DF20] dark:bg-[#A2DF20] dark:text-[#07170B]'
              : 'bg-[#FEFEFE] dark:bg-[#0A1815] text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
          }`}
        >
          <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Ringkasan</span>
        </button>
      </div>

      {/* Isi Soal atau Ringkasan */}
      <AnimatePresence mode="wait">
        {showSummary ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 sm:p-6 space-y-6"
          >
            <div className="rounded-2xl bg-[#EAF2EC]/65 dark:bg-[#041006] p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <Award
                  className="h-7 w-7 text-[#008120] dark:text-[#A2DF20] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h4 className="font-display text-lg font-extrabold text-[#07170B] dark:text-[#FEFEFE]">
                    Ringkasan {title}
                  </h4>
                  <p className="mt-1 text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
                    Skor mandiri Anda:{' '}
                    <span className="font-mono font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      {earnedCorrectCount} dari {questions.length}
                    </span>{' '}
                    soal dijawab benar ({Math.round((earnedCorrectCount / questions.length) * 100)}%). Progres telah tersimpan di browser.
                  </p>
                  {displayedCorrectCount > earnedCorrectCount && (
                    <p className="mt-1 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                      Soal yang dibuka lewat tombol Lihat Jawaban tetap dapat ditinjau ulang, namun tidak dihitung sebagai skor mandiri.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FEFEFE] hover:bg-[#DCE6DF] dark:bg-[#0A1815] dark:hover:bg-[#11281B] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{mode === 'challenge' ? 'Tantangan Baru' : 'Ulangi Semua Soal'}</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={onExit}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2 text-xs font-bold text-[#07170B] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Selesai &amp; Kembali</span>
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              {questions.map((q, idx) => {
                const st = results[q.id];
                const wasRevealed = Boolean(revealed[q.id]);
                return (
                  <div
                    key={q.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-[#F5F6F6] dark:bg-[#041006]/70 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#07170B] dark:text-[#FEFEFE]">
                        {st?.isCorrect && !wasRevealed ? (
                          <CheckCircle2
                            className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="h-4 w-4 text-[#78887D] dark:text-[#6E8074] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span>{q.title}</span>
                        <span className="text-xs font-normal text-[#5E7064] dark:text-[#8A9A8F]">
                          · {q.formulaName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#5E7064] dark:text-[#8A9A8F] font-mono break-all">
                        Jawaban baku: {q.acceptedFormulas[0]}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSummary(false);
                        setCurrentIdx(idx);
                      }}
                      className="self-start sm:self-center rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-4 py-1.5 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] hover:bg-[#EAF2EC] dark:hover:bg-[#11281B] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      Buka Soal {idx + 1}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={qId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
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
                {mode === 'challenge' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{currentQuestion.category}</span>
                  </>
                )}
              </div>
              <h4 className="font-display text-lg font-bold text-[#07170B] dark:text-[#FEFEFE]">
                {currentQuestion.title}
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA]">
                {currentQuestion.instruction}
              </p>
            </div>

            {/* Mini Spreadsheet Interaktif */}
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
                    if (results[qId]) {
                      setResults((prev) => {
                        const next = { ...prev };
                        delete next[qId];
                        return next;
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCheck();
                    }
                  }}
                  placeholder={`Ketik rumus di sini, misal ${currentQuestion.acceptedFormulas[0].slice(0, 4)}...`}
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
                                className={`border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 p-0 ring-2 ring-inset ${
                                  result?.isCorrect
                                    ? 'bg-[#EAF2EC] dark:bg-[#A2DF20]/18 ring-[#008120] dark:ring-[#A2DF20]'
                                    : 'bg-[#EAF2EC]/45 dark:bg-[#A2DF20]/8 ring-[#008120] dark:ring-[#A2DF20]'
                                }`}
                              >
                                {result?.isCorrect ? (
                                  <motion.div
                                    initial={{ opacity: 0.6, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.16 }}
                                    className={`px-3 py-2 font-mono font-bold text-[#008120] dark:text-[#A2DF20] tabular-nums ${
                                      cell.align === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {formatExpected(currentQuestion.expectedResult)}
                                  </motion.div>
                                ) : (
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
                                        handleCheck();
                                      }
                                    }}
                                    placeholder="=..."
                                    aria-label={`Input sel target ${ref}`}
                                    className={`w-full bg-transparent px-3 py-2 font-mono text-xs text-[#07170B] dark:text-[#FEFEFE] placeholder:text-[#008120]/60 dark:placeholder:text-[#A2DF20]/60 focus:outline-none ${
                                      cell.align === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                  />
                                )}
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
                Mendukung pemisah argumen koma <code className="font-mono">(,)</code> maupun titik koma <code className="font-mono">(;)</code>. Tekan Enter atau klik Periksa Jawaban.
              </p>
            </div>

            {/* Tombol Aksi Soal */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheck}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-5 py-2 text-xs font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Periksa Jawaban</span>
                </motion.button>

                <button
                  type="button"
                  onClick={() =>
                    setShowHint((prev) => ({ ...prev, [qId]: !prev[qId] }))
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isHintVisible ? 'Tutup Petunjuk' : 'Petunjuk'}</span>
                </button>

                {!result?.isCorrect && (
                  <button
                    type="button"
                    onClick={handleRevealAnswer}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Lihat Jawaban</span>
                  </button>
                )}
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <span>
                  {currentIdx < questions.length - 1
                    ? 'Soal Berikutnya'
                    : 'Lihat Ringkasan Skor'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </motion.button>
            </div>

            {isHintVisible && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16 }}
                className="rounded-xl bg-[#EAF2EC]/75 dark:bg-[#041006] p-4 text-xs sm:text-sm text-[#3D4D42] dark:text-[#B5C4BA]"
              >
                <span className="font-bold text-[#07170B] dark:text-[#FEFEFE]">
                  Petunjuk:
                </span>{' '}
                {currentQuestion.hint}
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`rounded-xl p-4 ${
                  result.isCorrect
                    ? 'bg-[#EAF2EC]/90 dark:bg-[#0F2418] text-[#07170B] dark:text-[#EAF2EC]'
                    : 'bg-red-50/90 dark:bg-red-950/40 text-red-950 dark:text-red-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {result.isCorrect ? (
                    <CheckCircle2
                      className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="h-4 w-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold break-words">
                      {result.message}
                      {mode === 'challenge' && result.isCorrect && (
                        <span className="ml-1.5 font-normal text-[#008120] dark:text-[#A2DF20]">
                          (Rumus: {currentQuestion.formulaName})
                        </span>
                      )}
                    </p>
                    {(result.isCorrect || isRevealed) && (
                      <p className="leading-relaxed opacity-90 break-words">
                        <span className="font-mono font-semibold break-all">
                          {currentQuestion.acceptedFormulas[0]}
                        </span>{' '}
                        — {currentQuestion.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
