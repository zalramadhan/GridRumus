import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  Check,
  Copy,
  Download,
  Lightbulb,
  ListChecks,
  RotateCcw,
  SlidersHorizontal,
  Table2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormulaEntry, GridCell } from '../types/excel';
import { downloadFormulaWorkbook } from '../utils/xlsxGenerator';

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

  useEffect(() => {
    setOverrides({});
    setActiveCell(formula.worksheet.defaultActiveCell);
    setCopied(false);
    setDownloaded(false);
  }, [formula]);

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
    downloadFormulaWorkbook(formula, overrides);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1800);
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={formula.id}
        id="simulator-grid"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors duration-200"
      >
        {/* Header Rumus */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span>{formula.category}</span>
                <span aria-hidden="true">·</span>
                <span>Tingkat {formula.level}</span>
                <span aria-hidden="true">·</span>
                <span>{formula.excelVersion}</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {formula.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] max-w-2xl">
                {formula.tagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12 }}
                onClick={handleCopySyntax}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:text-slate-900 dark:hover:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-400"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                      className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:focus-visible:outline-emerald-400"
              >
                {downloaded ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>File Terunduh (.xlsx)</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Unduh Contoh (.xlsx)</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Sintaks + Pengalih Pemisah Koma/Titik Koma */}
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                Sintaks:
              </span>
              <code className="font-mono text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/70 rounded-md px-2.5 py-1 overflow-x-auto">
                {syntaxText}
              </code>
            </div>

            <div
              className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 self-start shrink-0"
              role="group"
              aria-label="Pilih pemisah argumen Excel"
            >
              <button
                type="button"
                onClick={() => setUseSemicolon(false)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  !useSemicolon
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Pemisah Koma (,)
              </button>
              <button
                type="button"
                onClick={() => setUseSemicolon(true)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  useSemicolon
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Titik Koma (;)
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Spreadsheet Interaktif */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-start gap-2.5">
              <Table2
                className="h-4 w-4 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Simulator Grid Langsung
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset Data</span>
              </motion.button>
            )}
          </div>

          {/* Formula Bar ala Excel */}
          <div className="flex items-stretch border border-slate-300 dark:border-slate-700 border-b-0 rounded-t-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center">
              {activeCell}
            </div>
            <div className="w-9 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 px-2 py-1.5 text-center font-mono text-xs italic font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              fx
            </div>
            <div className="flex-1 px-3 py-1.5 font-mono text-xs text-slate-800 dark:text-slate-100 flex items-center overflow-x-auto whitespace-nowrap">
              {activeFormulaBarText || (
                <span className="text-slate-400 dark:text-slate-500">Sel kosong</span>
              )}
            </div>
          </div>

          {/* Tabel Grid */}
          <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-b-lg bg-white dark:bg-slate-900">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                  <th className="w-10 border-r border-slate-300 dark:border-slate-700 py-1.5 px-2 text-center font-mono font-medium text-slate-500 dark:text-slate-400 select-none">
                    #
                  </th>
                  {formula.worksheet.columns.map((col) => (
                    <th
                      key={col}
                      className="border-r last:border-r-0 border-slate-300 dark:border-slate-700 py-1.5 px-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-300 select-none min-w-[110px]"
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
                    className="border-b last:border-b-0 border-slate-200 dark:border-slate-800"
                  >
                    <td className="border-r border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 py-1.5 px-2 text-center font-mono font-medium text-slate-500 dark:text-slate-400 select-none tabular-nums">
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
                            className={`border-r last:border-r-0 border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-400 cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-inset ring-emerald-700 dark:ring-emerald-400'
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
                          className={`border-r last:border-r-0 border-slate-200 dark:border-slate-800 p-0 transition-colors ${
                            isHeader
                              ? 'bg-slate-100/90 dark:bg-slate-800/90 font-semibold text-slate-800 dark:text-slate-100'
                              : isFormula
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/60 font-semibold text-emerald-950 dark:text-emerald-200'
                              : isEditable
                              ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                              : 'bg-slate-50/30 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                          } ${
                            isSelected
                              ? 'ring-2 ring-inset ring-emerald-700 dark:ring-emerald-400'
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
                              className={`w-full bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none tabular-nums ${
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
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Sel hijau berisi rumus aktif Excel yang ikut tersimpan saat Anda mengunduh file .xlsx.
            </span>
            <span className="font-mono text-slate-600 dark:text-slate-300">
              Sheet: {formula.worksheet.sheetName}
            </span>
          </div>
        </div>

        {/* Penjelasan Praktis & Argumen */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                <Briefcase
                  className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>Kapan Dipakai di Dunia Kerja</span>
              </h4>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 dark:tracking-[0.01em]">
                {formula.practicalUse}
              </p>
            </div>

            <div>
              <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2">
                <ListChecks
                  className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>Langkah Penggunaan Cepat</span>
              </h4>
              <ol className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 dark:tracking-[0.01em] list-decimal list-inside">
                {formula.stepByStep.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Argumen */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-3">
              <SlidersHorizontal
                className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0"
                aria-hidden="true"
              />
              <span>Rincian Argumen Rumus</span>
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <th className="py-2.5 px-4 font-semibold">Argumen</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Penjelasan Praktis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {formula.arguments.map((arg) => (
                    <tr key={arg.name} className="bg-white dark:bg-slate-900">
                      <td className="py-2.5 px-4 font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-300 whitespace-nowrap">
                        {arg.name}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {arg.required ? 'Wajib' : 'Opsional'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {arg.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kesalahan Umum & Tips Pro */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t border-slate-100 dark:border-slate-800 pt-5">
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/70 bg-amber-50/50 dark:bg-amber-950/30 p-4">
              <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Kesalahan Umum yang Sering Terjadi</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/85">
                {formula.pitfall}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
              <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Trik Pro Efisiensi Kerja</span>
              </h4>
              <p className="text-xs sm:text-sm leading-relaxed text-emerald-950/90 dark:text-emerald-100/85">
                {formula.proTip}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
