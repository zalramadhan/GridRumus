import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  Copy,
  Download,
  Lightbulb,
  ListChecks,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Table2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PRACTICE_QUESTIONS_BY_FORMULA } from '../data/practice';
import { useAuth } from '../hooks/useAuth';
import { usePracticeProgress } from '../hooks/usePracticeProgress';
import { FormulaEntry, GridCell, PracticeRunnerQuestion } from '../types/excel';
import { downloadFormulaWorkbook } from '../utils/xlsxGenerator';
import { PracticeMode } from './PracticeMode';

interface FormulaSimulatorProps {
  formula: FormulaEntry;
}

function formatDisplayValue(val: string | number, cell: GridCell): string {
  if (typeof val === 'number') {
    if (cell.format === 'currency') {
      return `Rp ${val.toLocaleString('id-ID')}`;
    }
    return val.toLocaleString('id-ID');
  }
  return String(val);
}

export function FormulaSimulator({ formula }: FormulaSimulatorProps) {
  const [overrides, setOverrides] = useState<Record<string, string | number>>({});
  const [activeCell, setActiveCell] = useState<string>(formula.worksheet.defaultActiveCell);
  const [useSemicolon, setUseSemicolon] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [practiceActive, setPracticeActive] = useState<boolean>(false);

  const { user, requireAuth } = useAuth();
  const { getFormulaSolvedCount } = usePracticeProgress();

  const practiceQuestions = useMemo(
    () => PRACTICE_QUESTIONS_BY_FORMULA[formula.id] ?? [],
    [formula.id]
  );

  const runnerQuestions = useMemo<PracticeRunnerQuestion[]>(
    () =>
      practiceQuestions.map((q) => ({
        ...q,
        formulaId: formula.id,
        formulaName: formula.name,
        category: formula.category,
      })),
    [practiceQuestions, formula.id, formula.name, formula.category]
  );

  const solvedCount = getFormulaSolvedCount(formula.id);

  useEffect(() => {
    setOverrides({});
    setActiveCell(formula.worksheet.defaultActiveCell);
    setCopied(false);
    setDownloaded(false);
    setPracticeActive(false);
  }, [formula]);

  useEffect(() => {
    if (!user && practiceActive) {
      setPracticeActive(false);
    }
  }, [user, practiceActive]);

  const getVal = useMemo(() => {
    return (ref: string): string | number => {
      if (ref in overrides) return overrides[ref];
      const match = /^([A-Z]+)(\d+)$/.exec(ref);
      if (!match) return '';
      const col = match[1];
      const rowNum = Number(match[2]);
      const row = formula.worksheet.rows.find((r) => r.rowNum === rowNum);
      const cell = row?.cells[col];
      return cell ? cell.value : '';
    };
  }, [formula, overrides]);

  const computedGrid = useMemo(() => {
    const map: Record<string, { cell: GridCell; displayVal: string | number }> = {};
    for (const row of formula.worksheet.rows) {
      for (const col of formula.worksheet.columns) {
        const cell = row.cells[col];
        if (!cell) continue;
        const ref = `${col}${row.rowNum}`;
        const raw = ref in overrides ? overrides[ref] : cell.value;
        const val = cell.isFormula && cell.compute ? cell.compute(getVal) : raw;
        map[ref] = { cell, displayVal: val };
      }
    }
    return map;
  }, [formula, overrides, getVal]);

  const activeEntry = computedGrid[activeCell];
  const formatFormulaSeparator = (rawFormula: string) =>
    useSemicolon ? rawFormula.replace(/,/g, ';') : rawFormula;

  const activeFormulaBarText =
    activeEntry?.cell.isFormula && activeEntry.cell.formula
      ? formatFormulaSeparator(activeEntry.cell.formula)
      : activeEntry
      ? String(activeEntry.displayVal)
      : '';

  const syntaxText = useSemicolon ? formula.syntaxSemicolon : formula.syntax;

  const handleCopySyntax = async () => {
    const textToCopy =
      activeEntry?.cell.isFormula && activeEntry.cell.formula
        ? formatFormulaSeparator(activeEntry.cell.formula)
        : syntaxText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadSample = () => {
    requireAuth('download', () => {
      downloadFormulaWorkbook(formula, overrides);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1800);
    });
  };

  const handleCellChange = (ref: string, rawInput: string, inputType?: string) => {
    if (inputType === 'number') {
      if (rawInput === '' || rawInput === '-') {
        setOverrides((prev) => ({ ...prev, [ref]: 0 }));
      } else {
        const parsed = Number(rawInput);
        setOverrides((prev) => ({
          ...prev,
          [ref]: Number.isFinite(parsed) ? parsed : 0,
        }));
      }
    } else {
      setOverrides((prev) => ({ ...prev, [ref]: rawInput }));
    }
  };

  const hasEdits = Object.keys(overrides).length > 0;

  if (practiceActive && runnerQuestions.length > 0) {
    return (
      <div id="simulator-grid">
        <PracticeMode
          sessionKey={`sim-${formula.id}`}
          mode="formula"
          title={`Latihan ${formula.name}`}
          subtitle={`Latihan Praktek Langsung · ${formula.name}`}
          formulaIdForScore={formula.id}
          questions={runnerQuestions}
          exitLabel="Kembali ke Simulator"
          onExit={() => setPracticeActive(false)}
        />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={formula.id}
        id="simulator-grid"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#FEFEFE] dark:bg-[#0A1815] rounded-2xl overflow-hidden transition-colors duration-200"
      >
        {/* Header Rumus */}
        <div className="px-6 py-6 dark:bg-[#002100]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F] mb-1.5">
                <span>{formula.category}</span>
                <span aria-hidden="true">·</span>
                <span>Tingkat {formula.level}</span>
                <span aria-hidden="true">·</span>
                <span>{formula.excelVersion}</span>
                {practiceQuestions.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#008120] dark:text-[#A2DF20] tabular-nums">
                      Latihan: {solvedCount}/{practiceQuestions.length} selesai
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#07170B] dark:text-[#98ff00]">
                {formula.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] max-w-2xl">
                {formula.tagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={handleCopySyntax}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008120] dark:focus-visible:outline-[#A2DF20]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5 text-[#008120] dark:text-[#A2DF20]"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Rumus Disalin</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Salin Rumus</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC] hover:bg-[#DCE6DF] dark:bg-[#11281B] dark:hover:bg-[#193827] px-4 py-2 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008120] dark:focus-visible:outline-[#A2DF20]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {downloaded ? (
                    <motion.span
                      key="sim-dl-done"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5 text-[#008120] dark:text-[#A2DF20]"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>File Terunduh (.xlsx)</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="sim-dl-idle"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5 text-[#008120] dark:text-[#A2DF20]" aria-hidden="true" />
                      <span>Unduh Contoh (.xlsx)</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {practiceQuestions.length > 0 && (
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => requireAuth('practice', () => setPracticeActive(true))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-4 py-2 text-xs font-bold text-[#07170B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#07170B] dark:focus-visible:outline-[#A2DF20]"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mulai Latihan ({practiceQuestions.length} Soal)</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Sintaks + Pengalih Pemisah Koma/Titik Koma */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-medium text-[#5E7064] dark:text-[#8A9A8F] shrink-0">
                Sintaks:
              </span>
              <code className="font-mono text-xs sm:text-sm font-medium text-[#07170B] dark:text-[#A2DF20] bg-[#EAF2EC] dark:bg-[#041006] rounded-lg px-3 py-1.5 overflow-x-auto">
                {syntaxText}
              </code>
            </div>

            <div
              className="inline-flex items-center rounded-full bg-[#EAF2EC] dark:bg-[#041006] p-1 self-start shrink-0"
              role="group"
              aria-label="Pilih pemisah argumen Excel"
            >
              <button
                type="button"
                onClick={() => setUseSemicolon(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !useSemicolon
                    ? 'bg-[#07170B] text-[#FEFEFE] dark:bg-[#A2DF20] dark:text-[#07170B]'
                    : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                }`}
              >
                Pemisah Koma (,)
              </button>
              <button
                type="button"
                onClick={() => setUseSemicolon(true)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  useSemicolon
                    ? 'bg-[#07170B] text-[#FEFEFE] dark:bg-[#A2DF20] dark:text-[#07170B]'
                    : 'text-[#3D4D42] dark:text-[#B5C4BA] hover:text-[#07170B] dark:hover:text-[#FEFEFE]'
                }`}
              >
                Titik Koma (;)
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Spreadsheet Interaktif */}
        <div className="px-6 py-5 bg-[#EAF2EC]/45 dark:bg-[#001000]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-start gap-2.5">
              <Table2
                className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h4 className="text-sm font-bold text-[#07170B] dark:text-[#98ff00]">
                  Simulator Grid Langsung
                </h4>
                <p className="text-xs text-[#5E7064] dark:text-[#8A9A8F]">
                  Klik sel input untuk mengubah angka/teks, lalu lihat sel hasil hijau menghitung otomatis.
                </p>
              </div>
            </div>
            {hasEdits && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onClick={() => setOverrides({})}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FEFEFE] dark:bg-[#0A1815] px-3.5 py-1.5 text-xs font-semibold text-[#07170B] dark:text-[#FEFEFE] hover:bg-[#EAF2EC] dark:hover:bg-[#11281B] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset Data</span>
              </motion.button>
            )}
          </div>

          {/* Formula Bar ala Excel */}
          <div className="flex items-stretch border border-[#07170B]/12 dark:border-[#EAF2EC]/14 border-b-0 rounded-t-xl bg-[#FEFEFE] dark:bg-[#0A1815] overflow-hidden">
            <motion.div
              key={activeCell}
              initial={{ opacity: 0.5, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.14 }}
              className="w-16 shrink-0 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#EAF2EC]/60 dark:bg-[#07170B] px-2.5 py-1.5 text-center font-mono text-xs font-bold text-[#07170B] dark:text-[#A2DF20] flex items-center justify-center"
            >
              {activeCell}
            </motion.div>
            <div className="w-9 shrink-0 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#F5F6F6] dark:bg-[#07170B]/60 px-2 py-1.5 text-center font-mono text-xs italic font-semibold text-[#008120] dark:text-[#A2DF20] flex items-center justify-center">
              fx
            </div>
            <div className="flex-1 px-3 py-1.5 font-mono text-xs text-[#07170B] dark:text-[#FEFEFE] flex items-center overflow-x-auto whitespace-nowrap">
              <motion.span
                key={`${activeCell}-${activeFormulaBarText}`}
                initial={{ opacity: 0.5, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14 }}
              >
                {activeFormulaBarText || (
                  <span className="text-[#78887D] dark:text-[#6E8074]">Sel kosong</span>
                )}
              </motion.span>
            </div>
          </div>

          {/* Tabel Grid */}
          <div className="overflow-x-auto border border-[#07170B]/12 dark:border-[#EAF2EC]/14 rounded-b-xl bg-[#FEFEFE] dark:bg-[#0A1815]">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#EAF2EC]/70 dark:bg-[#07170B] border-b border-[#07170B]/12 dark:border-[#EAF2EC]/12">
                  <th className="w-10 border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 py-1.5 px-2 text-center font-mono font-medium text-[#5E7064] dark:text-[#8A9A8F] select-none">
                    #
                  </th>
                  {formula.worksheet.columns.map((col) => (
                    <th
                      key={col}
                      className="border-r last:border-r-0 border-[#07170B]/10 dark:border-[#EAF2EC]/12 py-1.5 px-3 text-center font-mono font-semibold text-[#3D4D42] dark:text-[#B5C4BA] select-none min-w-[110px]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formula.worksheet.rows.map((row) => (
                  <tr
                    key={row.rowNum}
                    className="border-b last:border-b-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8"
                  >
                    <td className="border-r border-[#07170B]/10 dark:border-[#EAF2EC]/12 bg-[#EAF2EC]/45 dark:bg-[#07170B]/80 py-1.5 px-2 text-center font-mono font-medium text-[#5E7064] dark:text-[#8A9A8F] select-none tabular-nums">
                      {row.rowNum}
                    </td>
                    {formula.worksheet.columns.map((col) => {
                      const ref = `${col}${row.rowNum}`;
                      const entry = computedGrid[ref];
                      const cell = entry?.cell;
                      const isSelected = activeCell === ref;

                      if (!cell) {
                        return (
                          <td
                            key={ref}
                            onClick={() => setActiveCell(ref)}
                            className={`border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 px-3 py-2 text-[#78887D] cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-inset ring-[#008120] dark:ring-[#A2DF20]'
                                : ''
                            }`}
                          />
                        );
                      }

                      const isFormula = Boolean(cell.isFormula);
                      const isHeader = Boolean(cell.isHeader);
                      const isEditable = Boolean(cell.editable);
                      const rawVal = ref in overrides ? overrides[ref] : cell.value;

                      return (
                        <td
                          key={ref}
                          onClick={() => setActiveCell(ref)}
                          className={`border-r last:border-r-0 border-[#07170B]/8 dark:border-[#EAF2EC]/8 p-0 transition-colors ${
                            isHeader
                              ? 'bg-[#EAF2EC]/75 dark:bg-[#102418] font-semibold text-[#07170B] dark:text-[#FEFEFE]'
                              : isFormula
                              ? 'bg-[#EAF2EC] dark:bg-[#A2DF20]/15 font-bold text-[#008120] dark:text-[#A2DF20]'
                              : isEditable
                              ? 'bg-[#FEFEFE] dark:bg-[#0A1815] hover:bg-[#F5F6F6] dark:hover:bg-[#0F241A]'
                              : 'bg-[#F5F6F6]/60 dark:bg-[#07170B]/50 text-[#3D4D42] dark:text-[#B5C4BA]'
                          } ${
                            isSelected
                              ? 'ring-2 ring-inset ring-[#008120] dark:ring-[#A2DF20]'
                              : ''
                          }`}
                        >
                          {isEditable ? (
                            <input
                              type={
                                cell.inputType === 'number'
                                  ? 'number'
                                  : cell.inputType === 'date'
                                  ? 'date'
                                  : 'text'
                              }
                              value={rawVal}
                              aria-label={`Sel ${ref}`}
                              onFocus={() => setActiveCell(ref)}
                              onChange={(e) =>
                                handleCellChange(ref, e.target.value, cell.inputType)
                              }
                              className={`w-full bg-transparent px-3 py-2 text-xs text-[#07170B] dark:text-[#FEFEFE] focus:outline-none tabular-nums ${
                                cell.align === 'right' ? 'text-right font-mono' : 'text-left'
                              }`}
                            />
                          ) : isFormula ? (
                            <motion.div
                              key={String(entry.displayVal)}
                              initial={{ opacity: 0.65, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                              className={`px-3 py-2 tabular-nums font-mono ${
                                cell.align === 'right' ? 'text-right' : 'text-left'
                              }`}
                            >
                              {formatDisplayValue(entry.displayVal, cell)}
                            </motion.div>
                          ) : (
                            <div
                              className={`px-3 py-2 tabular-nums ${
                                cell.align === 'right' ? 'text-right font-mono' : 'text-left'
                              }`}
                            >
                              {formatDisplayValue(entry.displayVal, cell)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E7064] dark:text-[#8A9A8F]">
            <span>
              Sel hijau berisi rumus aktif Excel yang ikut tersimpan saat Anda mengunduh file .xlsx.
            </span>
            <span className="font-mono text-[#3D4D42] dark:text-[#B5C4BA]">
              Sheet: {formula.worksheet.sheetName}
            </span>
          </div>
        </div>

        {/* Penjelasan Praktis & Argumen */}
        <div className="p-6 space-y-7 dark:bg-[#001f00]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="inline-flex items-center gap-2 text-sm font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
                <Briefcase
                  className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0"
                  aria-hidden="true"
                />
                <span className="dark:text-[#98ff00]">Kapan Dipakai di Dunia Kerja</span>
              </h4>
              <p className="text-sm leading-relaxed text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em]">
                {formula.practicalUse}
              </p>
            </div>

            <div>
              <h4 className="inline-flex items-center gap-2 text-sm font-bold text-[#07170B] dark:text-[#FEFEFE] mb-2">
                <ListChecks
                  className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0"
                  aria-hidden="true"
                />
                <span className="dark:text-[#98ff00]">Langkah Penggunaan Cepat</span>
              </h4>
              <ol className="space-y-1.5 text-sm text-[#3D4D42] dark:text-[#B5C4BA] dark:tracking-[0.01em] list-decimal list-inside">
                {formula.stepByStep.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Argumen */}
          <div>
            <h4 className="inline-flex items-center gap-2 text-sm font-bold text-[#07170B] dark:text-[#FEFEFE] mb-3">
              <SlidersHorizontal
                className="h-4 w-4 text-[#008120] dark:text-[#A2DF20] shrink-0"
                aria-hidden="true"
              />
              <span className="dark:text-[#98ff00]">Rincian Argumen Rumus</span>
            </h4>
            <div className="overflow-x-auto rounded-xl bg-[#F5F6F6] dark:bg-[#041006]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#EAF2EC]/75 dark:bg-[#0D2114] text-[#3D4D42] dark:text-[#B5C4BA]">
                    <th className="py-2.5 px-4 font-semibold">Argumen</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Penjelasan Praktis</th>
                  </tr>
                </thead>
                <tbody>
                  {formula.arguments.map((arg, idx) => (
                    <tr
                      key={arg.name}
                      className={
                        idx % 2 === 0
                          ? 'bg-[#FEFEFE]/70 dark:bg-[#0A1815]/60'
                          : 'bg-[#F5F6F6] dark:bg-[#041006]'
                      }
                    >
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-[#008120] dark:text-[#A2DF20] whitespace-nowrap">
                        {arg.name}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-[#5E7064] dark:text-[#8A9A8F] whitespace-nowrap">
                        {arg.required ? 'Wajib' : 'Opsional'}
                      </td>
                      <td className="py-2.5 px-4 text-[#3D4D42] dark:text-[#B5C4BA] leading-relaxed">
                        {arg.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kesalahan Umum & Tips Pro */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 p-4">
              <h4 className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Kesalahan Umum yang Sering Terjadi</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/85">
                {formula.pitfall}
              </p>
            </div>

            <div className="rounded-xl bg-[#EAF2EC]/80 dark:bg-[#0F2418] p-4">
              <h4 className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008120] dark:text-[#A2DF20] mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Trik Pro Efisiensi Kerja</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-[#07170B]/90 dark:text-[#EAF2EC]/90">
                {formula.proTip}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
