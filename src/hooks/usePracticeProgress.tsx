import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { FORMULAS } from '../data/formulas';
import { PRACTICE_QUESTIONS_BY_FORMULA } from '../data/practice';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChallengeHistoryEntry, PracticeProgressState } from '../types/excel';
import { useAuth } from './useAuth';

const STORAGE_KEY = 'gridrumus-practice-progress-v1';

const DEFAULT_PROGRESS: PracticeProgressState = {
  version: 1,
  solvedQuestionIds: [],
  formulaBestScores: {},
  challengeHistory: [],
};

function sanitizeProgressState(parsed: Partial<PracticeProgressState> | null | undefined): PracticeProgressState {
  if (!parsed || typeof parsed !== 'object') return DEFAULT_PROGRESS;
  return {
    version: 1,
    solvedQuestionIds: Array.isArray(parsed.solvedQuestionIds)
      ? parsed.solvedQuestionIds.filter((x): x is string => typeof x === 'string').slice(0, 200)
      : [],
    formulaBestScores:
      parsed.formulaBestScores && typeof parsed.formulaBestScores === 'object'
        ? parsed.formulaBestScores
        : {},
    challengeHistory: Array.isArray(parsed.challengeHistory)
      ? parsed.challengeHistory.slice(0, 10)
      : [],
  };
}

function loadInitialProgress(): PracticeProgressState {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return sanitizeProgressState(JSON.parse(raw) as Partial<PracticeProgressState>);
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
  const { user, authReady } = useAuth();
  const [progress, setProgress] = useState<PracticeProgressState>(loadInitialProgress);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage quota errors
    }
  }, [progress]);

  useEffect(() => {
    if (!authReady || !user) return;

    const progressPath = `users/${user.uid}/progress/practice`;
    const progressDocRef = doc(db, 'users', user.uid, 'progress', 'practice');

    const unsub = onSnapshot(
      progressDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as Partial<PracticeProgressState>;
        const remote = sanitizeProgressState(data);
        setProgress(remote);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, progressPath);
      }
    );

    return () => unsub();
  }, [user, authReady]);

  const persistToFirestore = useCallback(
    async (nextState: PracticeProgressState) => {
      if (!user) return;
      const progressPath = `users/${user.uid}/progress/practice`;
      const userDocRef = doc(db, 'users', user.uid);
      const progressDocRef = doc(db, 'users', user.uid, 'progress', 'practice');

      try {
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          const safeEmail = (user.email || '').slice(0, 254);
          if (!safeEmail) return;
          const profilePayload: Record<string, unknown> = {
            uid: user.uid,
            displayName: (user.displayName?.trim() || safeEmail.split('@')[0] || 'Pengguna').slice(0, 120),
            email: safeEmail,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (user.photoURL) {
            profilePayload.photoURL = user.photoURL.slice(0, 500);
          }
          await setDoc(userDocRef, profilePayload);
        }

        await setDoc(progressDocRef, {
          userId: user.uid,
          solvedQuestionIds: nextState.solvedQuestionIds.slice(0, 200),
          formulaBestScores: nextState.formulaBestScores,
          challengeHistory: nextState.challengeHistory.slice(0, 10),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, progressPath);
      }
    },
    [user]
  );

  const recordQuestionSolved = useCallback(
    (questionId: string, formulaId: string) => {
      const prev = progressRef.current;
      const alreadySolved = prev.solvedQuestionIds.includes(questionId);
      const nextSolved = alreadySolved
        ? prev.solvedQuestionIds
        : [...prev.solvedQuestionIds, questionId].slice(0, 200);

      const formulaQs = PRACTICE_QUESTIONS_BY_FORMULA[formulaId] ?? [];
      const solvedForFormula = formulaQs.filter((q) => nextSolved.includes(q.id)).length;
      const prevBest = prev.formulaBestScores[formulaId] ?? 0;

      if (alreadySolved && solvedForFormula <= prevBest) {
        return;
      }

      const nextState: PracticeProgressState = {
        ...prev,
        solvedQuestionIds: nextSolved,
        formulaBestScores: {
          ...prev.formulaBestScores,
          [formulaId]: Math.max(prevBest, solvedForFormula),
        },
      };
      setProgress(nextState);
      void persistToFirestore(nextState).catch(() => {});
    },
    [persistToFirestore]
  );

  const recordFormulaSessionScore = useCallback(
    (formulaId: string, score: number) => {
      const prev = progressRef.current;
      const prevBest = prev.formulaBestScores[formulaId] ?? 0;
      if (score <= prevBest) return;

      const nextState: PracticeProgressState = {
        ...prev,
        formulaBestScores: {
          ...prev.formulaBestScores,
          [formulaId]: score,
        },
      };
      setProgress(nextState);
      void persistToFirestore(nextState).catch(() => {});
    },
    [persistToFirestore]
  );

  const recordChallengeSession = useCallback(
    (categoryLabel: string, correctCount: number, totalCount: number) => {
      const prev = progressRef.current;
      const entry: ChallengeHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        completedAt: new Date().toISOString(),
        categoryLabel,
        correctCount,
        totalCount,
      };
      const nextState: PracticeProgressState = {
        ...prev,
        challengeHistory: [entry, ...prev.challengeHistory].slice(0, 10),
      };
      setProgress(nextState);
      void persistToFirestore(nextState).catch(() => {});
    },
    [persistToFirestore]
  );

  const resetAllProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (user) {
      const progressPath = `users/${user.uid}/progress/practice`;
      void deleteDoc(doc(db, 'users', user.uid, 'progress', 'practice')).catch(
        (error) => {
          handleFirestoreError(error, OperationType.DELETE, progressPath);
        }
      );
    }
  }, [user]);

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
