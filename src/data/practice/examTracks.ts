import { FORMULAS } from '../formulas';
import { PracticeRunnerQuestion } from '../../types/excel';
import { JOB_PRACTICE_ROLES, PRACTICE_QUESTIONS_BY_FORMULA } from './index';

export type ExamTrackId = 'admin-kantor' | 'akunting-finance' | 'gabungan-interview';

export interface ExamTrackPreset {
  id: ExamTrackId;
  title: string;
  roleLabel: string;
  summary: string;
  focusFormulas: string[];
}

export interface TimedExamHistoryEntry {
  id: string;
  certificateId: string;
  participantName: string;
  trackId: ExamTrackId;
  trackTitle: string;
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  passed: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  completedAt: string;
}

export const EXAM_PASS_THRESHOLD_PERCENT = 75;
export const EXAM_HISTORY_STORAGE_KEY = 'gridrumus-exam-history-v1';

export const EXAM_TRACK_PRESETS: ExamTrackPreset[] = [
  {
    id: 'admin-kantor',
    title: 'Tes Admin Kantor & Umum',
    roleLabel: 'Staff Administrasi & Operasional',
    summary:
      'Uji ketepatan rekap presensi, perapihan teks nama/kode, hitung masa kerja & hari kerja bersih, logika IF, hingga pencarian ruang dan klaim operasional.',
    focusFormulas: ['COUNTIFS', 'PROPER', 'TRIM', 'DATEDIF', 'NETWORKDAYS', 'VLOOKUP', 'SUMIFS'],
  },
  {
    id: 'akunting-finance',
    title: 'Tes Akunting & Finance',
    roleLabel: 'Staff Finance, AR/AP & Pembukuan',
    summary:
      'Fokus tes masuk tim keuangan: hutang vendor, aging piutang, pengamanan #DIV/0! & #N/A dengan IFERROR, cicilan PMT, EOMONTH, SUBTOTAL, dan lookup COA.',
    focusFormulas: ['SUMIFS', 'IFS', 'IFERROR', 'PMT', 'EOMONTH', 'SUBTOTAL', 'VLOOKUP'],
  },
  {
    id: 'gabungan-interview',
    title: 'Paket Gabungan Admin + Finance',
    roleLabel: 'Persiapan Interview Lintas Posisi',
    summary:
      'Simulasi komprehensif lintas Admin Kantor, Finance, Produksi, Gudang, dan HRD Payroll—ideal untuk tes saringan Excel perusahaan skala menengah & korporasi.',
    focusFormulas: ['SUMIFS', 'COUNTIFS', 'VLOOKUP', 'IFERROR', 'IF/AND', 'DATEDIF', 'PMT'],
  },
];

function fromJobQuestion(jobId: string, questionId: string): PracticeRunnerQuestion | null {
  const job = JOB_PRACTICE_ROLES.find((j) => j.id === jobId);
  if (!job) return null;
  const q = job.questions.find((item) => item.id === questionId);
  if (!q) return null;
  return {
    ...q,
    formulaId: job.id,
    formulaName: job.roleTitle,
    category: 'Matematika & Agregasi',
  };
}

function fromFormulaQuestion(formulaId: string, questionId: string): PracticeRunnerQuestion | null {
  const formula = FORMULAS.find((f) => f.id === formulaId);
  const qs = PRACTICE_QUESTIONS_BY_FORMULA[formulaId] ?? [];
  const q = qs.find((item) => item.id === questionId);
  if (!formula || !q) return null;
  return {
    ...q,
    formulaId: formula.id,
    formulaName: formula.name,
    category: formula.category,
  };
}

export function stripExamTitlePrefix(rawTitle: string): string {
  return rawTitle.replace(/^Soal\s+\d+\s*:\s*/i, '').trim();
}

export function buildExamQuestions(
  trackId: ExamTrackId,
  count: 5 | 10
): PracticeRunnerQuestion[] {
  let pool: Array<PracticeRunnerQuestion | null> = [];

  if (trackId === 'admin-kantor') {
    pool = [
      fromJobQuestion('job-admin-kantor', 'job-kantor-1'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-2'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-3'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-4'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-5'),
      fromFormulaQuestion('trim-proper', 'tp-4'),
      fromFormulaQuestion('left-mid-right', 'lmr-1'),
      fromFormulaQuestion('networkdays', 'nw-2'),
      fromFormulaQuestion('if-basic', 'if-2'),
      fromFormulaQuestion('vlookup', 'vl-4'),
    ];
  } else if (trackId === 'akunting-finance') {
    pool = [
      fromJobQuestion('job-akunting-finance', 'job-fin-1'),
      fromJobQuestion('job-akunting-finance', 'job-fin-2'),
      fromJobQuestion('job-akunting-finance', 'job-fin-3'),
      fromJobQuestion('job-akunting-finance', 'job-fin-4'),
      fromJobQuestion('job-akunting-finance', 'job-fin-5'),
      fromFormulaQuestion('eomonth', 'eo-2'),
      fromFormulaQuestion('subtotal', 'sub-1'),
      fromFormulaQuestion('iferror', 'iferror-2'),
      fromFormulaQuestion('vlookup', 'vl-4'),
      fromFormulaQuestion('if-basic', 'if-5'),
    ];
  } else {
    pool = [
      fromJobQuestion('job-admin-kantor', 'job-kantor-1'),
      fromJobQuestion('job-akunting-finance', 'job-fin-1'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-2'),
      fromJobQuestion('job-akunting-finance', 'job-fin-3'),
      fromJobQuestion('job-admin-produksi', 'job-prod-4'),
      fromJobQuestion('job-akunting-finance', 'job-fin-2'),
      fromJobQuestion('job-admin-kantor', 'job-kantor-3'),
      fromJobQuestion('job-hrd-payroll', 'job-hrd-2'),
      fromJobQuestion('job-admin-gudang', 'job-gudang-1'),
      fromJobQuestion('job-akunting-finance', 'job-fin-4'),
    ];
  }

  return pool
    .filter((q): q is PracticeRunnerQuestion => q !== null)
    .slice(0, count);
}

export function loadExamHistory(): TimedExamHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EXAM_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is TimedExamHistoryEntry =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.certificateId === 'string' &&
          typeof item.participantName === 'string' &&
          typeof item.trackTitle === 'string' &&
          typeof item.correctCount === 'number' &&
          typeof item.totalCount === 'number'
      )
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function saveExamHistoryEntry(
  entry: TimedExamHistoryEntry
): TimedExamHistoryEntry[] {
  const current = loadExamHistory();
  const next = [entry, ...current].slice(0, 8);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(EXAM_HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}

export function clearExamHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(EXAM_HISTORY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}
