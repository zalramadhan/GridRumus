export type FormulaCategory =
  | 'Semua'
  | 'Matematika & Agregasi'
  | 'Logika & Kondisi'
  | 'Pencarian (Lookup)'
  | 'Teks & Pembersihan'
  | 'Tanggal & Waktu'
  | 'Keuangan & Array';

export type SkillLevel = 'Dasar' | 'Menengah' | 'Lanjutan';

export interface FormulaArgument {
  name: string;
  required: boolean;
  description: string;
}

export interface GridCell {
  value: string | number;
  editable?: boolean;
  inputType?: 'text' | 'number' | 'date';
  isHeader?: boolean;
  isFormula?: boolean;
  formula?: string;
  format?: 'currency' | 'number' | 'percent' | 'text' | 'date';
  align?: 'left' | 'right' | 'center';
  compute?: (getVal: (ref: string) => string | number) => string | number;
}

export interface GridRow {
  rowNum: number;
  cells: Record<string, GridCell>;
}

export interface GridWorksheet {
  sheetName: string;
  columns: string[];
  colWidths: number[];
  rows: GridRow[];
  defaultActiveCell: string;
}

export interface FormulaEntry {
  id: string;
  name: string;
  category: Exclude<FormulaCategory, 'Semua'>;
  level: SkillLevel;
  excelVersion: string;
  tagline: string;
  syntax: string;
  syntaxSemicolon: string;
  arguments: FormulaArgument[];
  practicalUse: string;
  stepByStep: string[];
  pitfall: string;
  proTip: string;
  worksheet: GridWorksheet;
}

export type TipCategory =
  | 'Semua'
  | 'Navigasi & Seleksi'
  | 'Pembersihan Data'
  | 'Formula & Audit'
  | 'Produktivitas Kerja';

export interface TipEntry {
  id: string;
  title: string;
  category: Exclude<TipCategory, 'Semua'>;
  shortcutWin: string;
  shortcutMac: string;
  summary: string;
  steps: string[];
  realExample: string;
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface PracticePack {
  id: string;
  filename: string;
  title: string;
  description: string;
  sheetsCount: number;
  sheetNames: string[];
  formulasIncluded: string[];
  targetRole: string;
}
