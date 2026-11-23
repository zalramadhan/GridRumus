import * as XLSX from 'xlsx';
import { FORMULAS } from '../data/formulas';
import { FormulaEntry, GridWorksheet } from '../types/excel';

function toXlsxFormula(raw: string): string {
  let f = raw.startsWith('=') ? raw.slice(1) : raw;
  f = f
    .replace(/\bXLOOKUP\(/g, '_xlfn.XLOOKUP(')
    .replace(/\bIFS\(/g, '_xlfn.IFS(')
    .replace(/\bTEXTJOIN\(/g, '_xlfn.TEXTJOIN(')
    .replace(/\bUNIQUE\(/g, '_xlfn.UNIQUE(')
    .replace(/\bFILTER\(/g, '_xlfn._xlws.FILTER(')
    .replace(/\bSORT\(/g, '_xlfn._xlws.SORT(');
  return f;
}

function parseIsoDate(val: string | number): Date | null {
  if (typeof val !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const d = new Date(Date.UTC(year, month, day));
  return isNaN(d.getTime()) ? null : d;
}

function buildWorksheetFromModel(
  worksheet: GridWorksheet,
  overrides?: Record<string, string | number>
): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const colCount = worksheet.columns.length;
  const rowCount = worksheet.rows.length;

  const getVal = (ref: string): string | number => {
    if (overrides && ref in overrides) return overrides[ref];
    const colMatch = /^([A-Z]+)(\d+)$/.exec(ref);
    if (!colMatch) return '';
    const col = colMatch[1];
    const rowNum = Number(colMatch[2]);
    const row = worksheet.rows.find((r) => r.rowNum === rowNum);
    const cell = row?.cells[col];
    return cell ? cell.value : '';
  };

  for (const row of worksheet.rows) {
    for (let cIdx = 0; cIdx < colCount; cIdx++) {
      const col = worksheet.columns[cIdx];
      const cell = row.cells[col];
      if (!cell) continue;

      const ref = `${col}${row.rowNum}`;
      const rawVal = overrides && ref in overrides ? overrides[ref] : cell.value;

      if (cell.isFormula && cell.formula) {
        const computed = cell.compute ? cell.compute(getVal) : rawVal;
        const isNum = typeof computed === 'number';
        const isDateOut =
          typeof computed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(computed);

        if (isDateOut) {
          const d = parseIsoDate(computed);
          ws[ref] = {
            t: 'd',
            v: d ?? computed,
            f: toXlsxFormula(cell.formula),
            z: 'yyyy-mm-dd',
          };
        } else {
          ws[ref] = {
            t: isNum ? 'n' : 's',
            v: computed,
            f: toXlsxFormula(cell.formula),
            ...(cell.format === 'currency' ? { z: '#,##0' } : {}),
          };
        }
      } else if (cell.inputType === 'date') {
        const d = parseIsoDate(rawVal);
        if (d) {
          ws[ref] = { t: 'd', v: d, z: 'yyyy-mm-dd' };
        } else {
          ws[ref] = { t: 's', v: String(rawVal ?? '') };
        }
      } else if (typeof rawVal === 'number') {
        ws[ref] = {
          t: 'n',
          v: rawVal,
          ...(cell.format === 'currency' ? { z: '#,##0' } : {}),
        };
      } else {
        ws[ref] = { t: 's', v: String(rawVal ?? '') };
      }
    }
  }

  const lastCol = worksheet.columns[colCount - 1] || 'A';
  ws['!ref'] = `A1:${lastCol}${rowCount}`;
  ws['!cols'] = worksheet.colWidths.map((wch) => ({ wch }));
  return ws;
}

export function downloadFormulaWorkbook(
  formula: FormulaEntry,
  overrides?: Record<string, string | number>
): void {
  const wb = XLSX.utils.book_new();
  const wsMain = buildWorksheetFromModel(formula.worksheet, overrides);
  const safeSheetName = formula.worksheet.sheetName.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, wsMain, safeSheetName);

  const guideRows: (string | number)[][] = [
    ['Panduan Praktis Rumus Excel', formula.name],
    ['Kategori', formula.category],
    ['Tingkat', formula.level],
    ['Kompatibilitas', formula.excelVersion],
    ['Sintaks (Koma)', formula.syntax],
    ['Sintaks (Titik Koma / Regional ID)', formula.syntaxSemicolon],
    [''],
    ['Kapan Dipakai di Dunia Kerja', formula.practicalUse],
    ['Kesalahan Umum (Pitfall)', formula.pitfall],
    ['Tips Pro', formula.proTip],
    [''],
    ['Penjelasan Argumen', 'Status', 'Keterangan'],
    ...formula.arguments.map((a) => [
      a.name,
      a.required ? 'Wajib' : 'Opsional',
      a.description,
    ]),
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideRows);
  wsGuide['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 64 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan_Rumus');

  const fileSafe = formula.id.replace(/[^a-z0-9-_]/gi, '_');
  XLSX.writeFile(wb, `Latihan_${fileSafe}_GridRumus.xlsx`, { cellDates: true });
}

function makeMasterAllPack(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const indexRows: (string | number)[][] = [
    ['GridRumus — Workbook Latihan Lengkap Semua Rumus Excel'],
    ['Petunjuk: Buka tab-tab di bawah untuk mencoba langsung data dan rumus aktif.'],
    [''],
    ['No', 'Nama Rumus', 'Kategori', 'Tingkat', 'Sintaks', 'Nama Sheet'],
    ...FORMULAS.map((f, idx) => [
      idx + 1,
      f.name,
      f.category,
      f.level,
      f.syntax,
      f.worksheet.sheetName.slice(0, 31),
    ]),
  ];
  const wsIndex = XLSX.utils.aoa_to_sheet(indexRows);
  wsIndex['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 46 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsIndex, 'Daftar_Isi');

  const usedNames = new Set<string>(['Daftar_Isi']);
  for (const formula of FORMULAS) {
    let sheetName = formula.worksheet.sheetName.slice(0, 31);
    let suffix = 2;
    while (usedNames.has(sheetName)) {
      sheetName = `${formula.worksheet.sheetName.slice(0, 28)}_${suffix++}`;
    }
    usedNames.add(sheetName);
    const ws = buildWorksheetFromModel(formula.worksheet);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  return wb;
}

function makeSalesCasePack(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transaksi_Penjualan
  const wsSales: XLSX.WorkSheet = {
    A1: { t: 's', v: 'No Faktur' },
    B1: { t: 's', v: 'Cabang' },
    C1: { t: 's', v: 'Kode SKU' },
    D1: { t: 's', v: 'Nama Produk (VLOOKUP)' },
    E1: { t: 's', v: 'Qty' },
    F1: { t: 's', v: 'Harga Satuan (VLOOKUP)' },
    G1: { t: 's', v: 'Subtotal (Rp)' },
    H1: { t: 's', v: 'Kategori Order (IF)' },

    A2: { t: 's', v: 'INV-001' },
    B2: { t: 's', v: 'Jakarta' },
    C2: { t: 's', v: 'SKU-01' },
    D2: { t: 's', v: 'Laptop Pro 14', f: "VLOOKUP(C2,'Master_Produk_&_Rekap'!$A$2:$C$5,2,FALSE)" },
    E2: { t: 'n', v: 2 },
    F2: { t: 'n', v: 12500000, f: "VLOOKUP(C2,'Master_Produk_&_Rekap'!$A$2:$C$5,3,FALSE)", z: '#,##0' },
    G2: { t: 'n', v: 25000000, f: 'E2*F2', z: '#,##0' },
    H2: { t: 's', v: 'Grosir', f: 'IF(G2>=10000000,"Grosir","Reguler")' },

    A3: { t: 's', v: 'INV-002' },
    B3: { t: 's', v: 'Surabaya' },
    C3: { t: 's', v: 'SKU-02' },
    D3: { t: 's', v: 'Monitor 27 IPS', f: "VLOOKUP(C3,'Master_Produk_&_Rekap'!$A$2:$C$5,2,FALSE)" },
    E3: { t: 'n', v: 3 },
    F3: { t: 'n', v: 3200000, f: "VLOOKUP(C3,'Master_Produk_&_Rekap'!$A$2:$C$5,3,FALSE)", z: '#,##0' },
    G3: { t: 'n', v: 9600000, f: 'E3*F3', z: '#,##0' },
    H3: { t: 's', v: 'Reguler', f: 'IF(G3>=10000000,"Grosir","Reguler")' },

    A4: { t: 's', v: 'INV-003' },
    B4: { t: 's', v: 'Jakarta' },
    C4: { t: 's', v: 'SKU-03' },
    D4: { t: 's', v: 'Keyboard Mekanik', f: "VLOOKUP(C4,'Master_Produk_&_Rekap'!$A$2:$C$5,2,FALSE)" },
    E4: { t: 'n', v: 5 },
    F4: { t: 'n', v: 650000, f: "VLOOKUP(C4,'Master_Produk_&_Rekap'!$A$2:$C$5,3,FALSE)", z: '#,##0' },
    G4: { t: 'n', v: 3250000, f: 'E4*F4', z: '#,##0' },
    H4: { t: 's', v: 'Reguler', f: 'IF(G4>=10000000,"Grosir","Reguler")' },

    A5: { t: 's', v: 'INV-004' },
    B5: { t: 's', v: 'Bandung' },
    C5: { t: 's', v: 'SKU-01' },
    D5: { t: 's', v: 'Laptop Pro 14', f: "VLOOKUP(C5,'Master_Produk_&_Rekap'!$A$2:$C$5,2,FALSE)" },
    E5: { t: 'n', v: 1 },
    F5: { t: 'n', v: 12500000, f: "VLOOKUP(C5,'Master_Produk_&_Rekap'!$A$2:$C$5,3,FALSE)", z: '#,##0' },
    G5: { t: 'n', v: 12500000, f: 'E5*F5', z: '#,##0' },
    H5: { t: 's', v: 'Grosir', f: 'IF(G5>=10000000,"Grosir","Reguler")' },

    A6: { t: 's', v: 'INV-005' },
    B6: { t: 's', v: 'Jakarta' },
    C6: { t: 's', v: 'SKU-04' },
    D6: { t: 's', v: 'Docking USB-C', f: "VLOOKUP(C6,'Master_Produk_&_Rekap'!$A$2:$C$5,2,FALSE)" },
    E6: { t: 'n', v: 4 },
    F6: { t: 'n', v: 450000, f: "VLOOKUP(C6,'Master_Produk_&_Rekap'!$A$2:$C$5,3,FALSE)", z: '#,##0' },
    G6: { t: 'n', v: 1800000, f: 'E6*F6', z: '#,##0' },
    H6: { t: 's', v: 'Reguler', f: 'IF(G6>=10000000,"Grosir","Reguler")' },

    D7: { t: 's', v: 'Total (SUBTOTAL Dinamis)' },
    E7: { t: 'n', v: 15, f: 'SUBTOTAL(9,E2:E6)' },
    G7: { t: 'n', v: 52150000, f: 'SUBTOTAL(9,G2:G6)', z: '#,##0' },
  };
  wsSales['!ref'] = 'A1:H7';
  wsSales['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 24 },
    { wch: 8 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
  ];

  // Sheet 2: Master_Produk_&_Rekap
  const wsMaster: XLSX.WorkSheet = {
    A1: { t: 's', v: 'Kode SKU' },
    B1: { t: 's', v: 'Nama Produk' },
    C1: { t: 's', v: 'Harga Satuan' },
    E1: { t: 's', v: 'Rekap Cabang' },
    F1: { t: 's', v: 'Total Omzet (SUMIFS)' },
    G1: { t: 's', v: 'Jumlah Transaksi (COUNTIFS)' },

    A2: { t: 's', v: 'SKU-01' },
    B2: { t: 's', v: 'Laptop Pro 14' },
    C2: { t: 'n', v: 12500000, z: '#,##0' },
    E2: { t: 's', v: 'Jakarta' },
    F2: { t: 'n', v: 30050000, f: 'SUMIFS(Transaksi_Penjualan!$G$2:$G$6,Transaksi_Penjualan!$B$2:$B$6,E2)', z: '#,##0' },
    G2: { t: 'n', v: 3, f: 'COUNTIFS(Transaksi_Penjualan!$B$2:$B$6,E2)' },

    A3: { t: 's', v: 'SKU-02' },
    B3: { t: 's', v: 'Monitor 27 IPS' },
    C3: { t: 'n', v: 3200000, z: '#,##0' },
    E3: { t: 's', v: 'Surabaya' },
    F3: { t: 'n', v: 9600000, f: 'SUMIFS(Transaksi_Penjualan!$G$2:$G$6,Transaksi_Penjualan!$B$2:$B$6,E3)', z: '#,##0' },
    G3: { t: 'n', v: 1, f: 'COUNTIFS(Transaksi_Penjualan!$B$2:$B$6,E3)' },

    A4: { t: 's', v: 'SKU-03' },
    B4: { t: 's', v: 'Keyboard Mekanik' },
    C4: { t: 'n', v: 650000, z: '#,##0' },
    E4: { t: 's', v: 'Bandung' },
    F4: { t: 'n', v: 12500000, f: 'SUMIFS(Transaksi_Penjualan!$G$2:$G$6,Transaksi_Penjualan!$B$2:$B$6,E4)', z: '#,##0' },
    G4: { t: 'n', v: 1, f: 'COUNTIFS(Transaksi_Penjualan!$B$2:$B$6,E4)' },

    A5: { t: 's', v: 'SKU-04' },
    B5: { t: 's', v: 'Docking USB-C' },
    C5: { t: 'n', v: 450000, z: '#,##0' },
  };
  wsMaster['!ref'] = 'A1:G5';
  wsMaster['!cols'] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 4 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, wsSales, 'Transaksi_Penjualan');
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Master_Produk_&_Rekap');
  return wb;
}

function makeHrCasePack(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const wsHr: XLSX.WorkSheet = {
    A1: { t: 's', v: 'NIP' },
    B1: { t: 's', v: 'Nama Karyawan' },
    C1: { t: 's', v: 'Golongan' },
    D1: { t: 's', v: 'Tgl Masuk' },
    E1: { t: 's', v: 'Tgl Evaluasi' },
    F1: { t: 's', v: 'Masa Kerja (DATEDIF)' },
    G1: { t: 's', v: 'Absensi (%)' },
    H1: { t: 's', v: 'Skor KPI' },
    I1: { t: 's', v: 'Gaji Pokok (INDEX+MATCH)' },
    J1: { t: 's', v: 'Status Bonus (IF+AND)' },

    A2: { t: 's', v: 'HR-01' },
    B2: { t: 's', v: 'Dimas Pratama' },
    C2: { t: 's', v: 'Gol-B' },
    D2: { t: 'd', v: new Date(Date.UTC(2021, 2, 15)), z: 'yyyy-mm-dd' },
    E2: { t: 'd', v: new Date(Date.UTC(2026, 10, 23)), z: 'yyyy-mm-dd' },
    F2: { t: 's', v: '5 Thn 8 Bln', f: 'DATEDIF(D2,E2,"Y")&" Thn "&DATEDIF(D2,E2,"YM")&" Bln"' },
    G2: { t: 'n', v: 96 },
    H2: { t: 'n', v: 88 },
    I2: { t: 'n', v: 8500000, f: 'INDEX(Skema_Golongan!$B$2:$B$4,MATCH(C2,Skema_Golongan!$A$2:$A$4,0))', z: '#,##0' },
    J2: { t: 's', v: 'Layak Bonus', f: 'IF(AND(G2>=90,H2>=80),"Layak Bonus","Belum Layak")' },

    A3: { t: 's', v: 'HR-02' },
    B3: { t: 's', v: 'Nadia Kusuma' },
    C3: { t: 's', v: 'Gol-A' },
    D3: { t: 'd', v: new Date(Date.UTC(2019, 6, 1)), z: 'yyyy-mm-dd' },
    E3: { t: 'd', v: new Date(Date.UTC(2026, 10, 23)), z: 'yyyy-mm-dd' },
    F3: { t: 's', v: '7 Thn 4 Bln', f: 'DATEDIF(D3,E3,"Y")&" Thn "&DATEDIF(D3,E3,"YM")&" Bln"' },
    G3: { t: 'n', v: 98 },
    H3: { t: 'n', v: 91 },
    I3: { t: 'n', v: 12000000, f: 'INDEX(Skema_Golongan!$B$2:$B$4,MATCH(C3,Skema_Golongan!$A$2:$A$4,0))', z: '#,##0' },
    J3: { t: 's', v: 'Layak Bonus', f: 'IF(AND(G3>=90,H3>=80),"Layak Bonus","Belum Layak")' },

    A4: { t: 's', v: 'HR-03' },
    B4: { t: 's', v: 'Riko Saputra' },
    C4: { t: 's', v: 'Gol-C' },
    D4: { t: 'd', v: new Date(Date.UTC(2025, 0, 10)), z: 'yyyy-mm-dd' },
    E4: { t: 'd', v: new Date(Date.UTC(2026, 10, 23)), z: 'yyyy-mm-dd' },
    F4: { t: 's', v: '1 Thn 10 Bln', f: 'DATEDIF(D4,E4,"Y")&" Thn "&DATEDIF(D4,E4,"YM")&" Bln"' },
    G4: { t: 'n', v: 85 },
    H4: { t: 'n', v: 82 },
    I4: { t: 'n', v: 6200000, f: 'INDEX(Skema_Golongan!$B$2:$B$4,MATCH(C4,Skema_Golongan!$A$2:$A$4,0))', z: '#,##0' },
    J4: { t: 's', v: 'Belum Layak', f: 'IF(AND(G4>=90,H4>=80),"Layak Bonus","Belum Layak")' },

    B6: { t: 's', v: 'Jumlah Karyawan Layak Bonus:' },
    C6: { t: 'n', v: 2, f: 'COUNTIF(J2:J4,"Layak Bonus")' },
    B7: { t: 's', v: 'Hari Kerja Efektif Nov 2026:' },
    C7: { t: 'n', v: 21, f: 'NETWORKDAYS(DATE(2026,11,1),DATE(2026,11,30))' },
  };
  wsHr['!ref'] = 'A1:J7';
  wsHr['!cols'] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 20 },
  ];

  const wsGrade = XLSX.utils.aoa_to_sheet([
    ['Golongan', 'Gaji Pokok'],
    ['Gol-A', 12000000],
    ['Gol-B', 8500000],
    ['Gol-C', 6200000],
  ]);
  wsGrade['!cols'] = [{ wch: 14 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(wb, wsHr, 'Data_Karyawan_HR');
  XLSX.utils.book_append_sheet(wb, wsGrade, 'Skema_Golongan');
  return wb;
}

function makeFinanceCasePack(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const wsPmt: XLSX.WorkSheet = {
    A1: { t: 's', v: 'Jenis Fasilitas' },
    B1: { t: 's', v: 'Plafon Pinjaman' },
    C1: { t: 's', v: 'Bunga/Tahun (%)' },
    D1: { t: 's', v: 'Tenor (Bulan)' },
    E1: { t: 's', v: 'Cicilan / Bulan (PMT)' },
    F1: { t: 's', v: 'Total Pengembalian' },

    A2: { t: 's', v: 'Kredit Modal Kerja' },
    B2: { t: 'n', v: 150000000, z: '#,##0' },
    C2: { t: 'n', v: 10.5 },
    D2: { t: 'n', v: 36 },
    E2: { t: 'n', v: 4875364, f: 'ROUND(PMT((C2/100)/12,D2,-B2),0)', z: '#,##0' },
    F2: { t: 'n', v: 175513104, f: 'E2*D2', z: '#,##0' },

    A3: { t: 's', v: 'Leasing Mesin Produksi' },
    B3: { t: 'n', v: 300000000, z: '#,##0' },
    C3: { t: 'n', v: 8.4 },
    D3: { t: 'n', v: 48 },
    E3: { t: 'n', v: 7379579, f: 'ROUND(PMT((C3/100)/12,D3,-B3),0)', z: '#,##0' },
    F3: { t: 'n', v: 354219792, f: 'E3*D3', z: '#,##0' },
  };
  wsPmt['!ref'] = 'A1:F3';
  wsPmt['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 22 }, { wch: 22 }];

  const wsInv: XLSX.WorkSheet = {
    A1: { t: 's', v: 'Item Jasa' },
    B1: { t: 's', v: 'DPP (Rp)' },
    C1: { t: 's', v: 'PPN 11% (ROUND)' },
    D1: { t: 's', v: 'Total Tagihan' },
    E1: { t: 's', v: 'Tgl Invoice' },
    F1: { t: 's', v: 'Jatuh Tempo (EOMONTH)' },

    A2: { t: 's', v: 'Jasa Konsultasi IT' },
    B2: { t: 'n', v: 14550000, z: '#,##0' },
    C2: { t: 'n', v: 1600500, f: 'ROUND(B2*0.11,0)', z: '#,##0' },
    D2: { t: 'n', v: 16150500, f: 'B2+C2', z: '#,##0' },
    E2: { t: 'd', v: new Date(Date.UTC(2026, 10, 5)), z: 'yyyy-mm-dd' },
    F2: { t: 'd', v: new Date(Date.UTC(2026, 10, 30)), f: 'EOMONTH(E2,0)', z: 'yyyy-mm-dd' },

    A3: { t: 's', v: 'Pemeliharaan Server' },
    B3: { t: 'n', v: 5325500, z: '#,##0' },
    C3: { t: 'n', v: 585805, f: 'ROUND(B3*0.11,0)', z: '#,##0' },
    D3: { t: 'n', v: 5911305, f: 'B3+C3', z: '#,##0' },
    E3: { t: 'd', v: new Date(Date.UTC(2026, 10, 18)), z: 'yyyy-mm-dd' },
    F3: { t: 'd', v: new Date(Date.UTC(2026, 11, 31)), f: 'EOMONTH(E3,1)', z: 'yyyy-mm-dd' },

    A4: { t: 's', v: 'Total Tagihan' },
    D4: { t: 'n', v: 22061805, f: 'SUM(D2:D3)', z: '#,##0' },
  };
  wsInv['!ref'] = 'A1:F4';
  wsInv['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, wsPmt, 'Simulasi_Cicilan_PMT');
  XLSX.utils.book_append_sheet(wb, wsInv, 'Invoice_&_Pajak');
  return wb;
}

function makeCrmCleaningPack(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {
    A1: { t: 's', v: 'Nama Kotor (Input Form)' },
    B1: { t: 's', v: 'Nama Bersih (PROPER+TRIM)' },
    C1: { t: 's', v: 'Kode Faktur' },
    D1: { t: 's', v: 'Kota (LEFT)' },
    E1: { t: 's', v: 'Email' },
    F1: { t: 's', v: 'Username (LEFT+FIND)' },

    A2: { t: 's', v: '  ahmad   FAUZI ' },
    B2: { t: 's', v: 'Ahmad Fauzi', f: 'PROPER(TRIM(A2))' },
    C2: { t: 's', v: 'JKT-2026-089' },
    D2: { t: 's', v: 'JKT', f: 'LEFT(C2,3)' },
    E2: { t: 's', v: 'ahmad.fauzi@nusantara.id' },
    F2: { t: 's', v: 'ahmad.fauzi', f: 'LEFT(E2,FIND("@",E2)-1)' },

    A3: { t: 's', v: 'dewi   LESTARI  ' },
    B3: { t: 's', v: 'Dewi Lestari', f: 'PROPER(TRIM(A3))' },
    C3: { t: 's', v: 'BDG-2026-104' },
    D3: { t: 's', v: 'BDG', f: 'LEFT(C3,3)' },
    E3: { t: 's', v: 'dewi.lestari@karya.co.id' },
    F3: { t: 's', v: 'dewi.lestari', f: 'LEFT(E3,FIND("@",E3)-1)' },
  };
  ws['!ref'] = 'A1:F3';
  ws['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 28 }, { wch: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Pembersihan_CRM');
  return wb;
}

export function downloadPracticePack(packId: string, filename: string): void {
  let wb: XLSX.WorkBook;
  switch (packId) {
    case 'sales-rekap-case':
      wb = makeSalesCasePack();
      break;
    case 'hr-payroll-case':
      wb = makeHrCasePack();
      break;
    case 'finance-loan-case':
      wb = makeFinanceCasePack();
      break;
    case 'crm-cleaning-case':
      wb = makeCrmCleaningPack();
      break;
    case 'master-all-formulas':
    default:
      wb = makeMasterAllPack();
      break;
  }
  XLSX.writeFile(wb, filename, { cellDates: true });
}
