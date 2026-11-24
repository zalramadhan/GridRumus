import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FORMULAS } from '../data/formulas';
import { PRACTICE_QUESTIONS_BY_FORMULA } from '../data/practice';
import { ChallengeHistoryEntry, PracticeProgressState } from '../types/excel';

const STORAGE_KEY = 'gridrumus-practice-progress-v1';

const DEFAULT_PROGRESS: PracticeProgressState = {
  version: 1,
  solvedQuestionIds: [],
  formulaBestScores: {},
  challengeHistory: [],
};

function loadInitialProgress(): PracticeProgressState {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<PracticeProgressState>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS;
    return {
      version: 1,
      solvedQuestionIds: Array.isArray(parsed.solvedQuestionIds)
        ? parsed.solvedQuestionIds.filter((x): x is string => typeof x === 'string')
        : [],
      formulaBestScores:
        parsed.formulaBestScores && typeof parsed.formulaBestScores === 'object'
          ? parsed.formulaBestScores
          : {},
      challengeHistory: Array.isArray(parsed.challengeHistory)
        ? parsed.challengeHistory.slice(0, 10)
        : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

interface PracticeProgressContextValue {
  progress: PracticeProgressState;
  totalQuestionsCount: number;
  solvedTotalCount: number;
  completedFormulasCount: number;
  bestChallengePercent: number;
  getFormulaSolvedCount: (formulaId: string) => number;
  recordQuestionSolved: (questionId: string, formulaId: string) => void;
  recordFormulaSessionScore: (formulaId: string, score: number) => void;
  recordChallengeSession: (
    categoryLabel: string,
    correctCount: number,
    totalCount: number
  ) => void;
  resetAllProgress: () => void;
}

const PracticeProgressContext = createContext<PracticeProgressContextValue | null>(
  null
);

export function PracticeProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<PracticeProgressState>(loadInitialProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage quota errors
    }
  }, [progress]);

  const recordQuestionSolved = useCallback((questionId: string, formulaId: string) => {
    setProgress((prev) => {
      const alreadySolved = prev.solvedQuestionIds.includes(questionId);
      const nextSolved = alreadySolved
        ? prev.solvedQuestionIds
        : [...prev.solvedQuestionIds, questionId];

      const formulaQs = PRACTICE_QUESTIONS_BY_FORMULA[formulaId] ?? [];
      const solvedForFormula = formulaQs.filter((q) => nextSolved.includes(q.id)).length;
      const prevBest = prev.formulaBestScores[formulaId] ?? 0;

      if (alreadySolved && solvedForFormula <= prevBest) {
        return prev;
      }

      return {
        ...prev,
        solvedQuestionIds: nextSolved,
        formulaBestScores: {
          ...prev.formulaBestScores,
          [formulaId]: Math.max(prevBest, solvedForFormula),
        },
      };
    });
  }, []);

  const recordFormulaSessionScore = useCallback((formulaId: string, score: number) => {
    setProgress((prev) => {
      const prevBest = prev.formulaBestScores[formulaId] ?? 0;
      if (score <= prevBest) return prev;
      return {
        ...prev,
        formulaBestScores: {
          ...prev.formulaBestScores,
          [formulaId]: score,
        },
      };
    });
  }, []);

  const recordChallengeSession = useCallback(
    (categoryLabel: string, correctCount: number, totalCount: number) => {
      const entry: ChallengeHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        completedAt: new Date().toISOString(),
        categoryLabel,
        correctCount,
        totalCount,
      };
      setProgress((prev) => ({
        ...prev,
        challengeHistory: [entry, ...prev.challengeHistory].slice(0, 10),
      }));
    },
    []
  );

  const resetAllProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<PracticeProgressContextValue>(() => {
    const totalQuestionsCount = FORMULAS.reduce(
      (sum, f) => sum + (PRACTICE_QUESTIONS_BY_FORMULA[f.id]?.length ?? 0),
      0
    );

    const solvedSet = new Set(progress.solvedQuestionIds);
    const solvedTotalCount = solvedSet.size;

    const getFormulaSolvedCount = (formulaId: string) => {
      const qs = PRACTICE_QUESTIONS_BY_FORMULA[formulaId] ?? [];
      const solvedNow = qs.filter((q) => solvedSet.has(q.id)).length;
      return Math.max(solvedNow, progress.formulaBestScores[formulaId] ?? 0);
    };

    const completedFormulasCount = FORMULAS.filter((f) => {
      const total = PRACTICE_QUESTIONS_BY_FORMULA[f.id]?.length ?? 5;
      return getFormulaSolvedCount(f.id) >= total;
    }).length;

    const bestChallengePercent = progress.challengeHistory.reduce((best, item) => {
      if (item.totalCount <= 0) return best;
      const pct = Math.round((item.correctCount / item.totalCount) * 100);
      return Math.max(best, pct);
    }, 0);

    return {
      progress,
      totalQuestionsCount,
      solvedTotalCount,
      completedFormulasCount,
      bestChallengePercent,
      getFormulaSolvedCount,
      recordQuestionSolved,
      recordFormulaSessionScore,
      recordChallengeSession,
      resetAllProgress,
    };
  }, [
    progress,
    recordQuestionSolved,
    recordFormulaSessionScore,
    recordChallengeSession,
    resetAllProgress,
  ]);

  return (
    <PracticeProgressContext.Provider value={value}>
      {children}
    </PracticeProgressContext.Provider>
  );
}

export function usePracticeProgress() {
  const ctx = useContext(PracticeProgressContext);
  if (!ctx) {
    throw new Error('usePracticeProgress must be used within PracticeProgressProvider');
  }
  return ctx;
}
