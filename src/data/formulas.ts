import { FormulaEntry } from '../types/excel';

const num = (v: string | number): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const cleaned = String(v).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const str = (v: string | number): string => String(v ?? '').trim();

export const FORMULAS: FormulaEntry[] = [
  // =========================================================
  // 1. MATEMATIKA & AGREGASI
  // =========================================================
  {
    id: 'sum',
    name: 'SUM',
    category: 'Matematika & Agregasi',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menjumlahkan seluruh angka dalam satu atau beberapa rentang sel.',
    syntax: '=SUM(number1, [number2], ...)',
    syntaxSemicolon: '=SUM(number1; [number2]; ...)',
    arguments: [
      { name: 'number1', required: true, description: 'Rentang sel atau angka pertama yang ingin dijumlahkan (misal B2:B6).' },
      { name: 'number2', required: false, description: 'Angka atau rentang sel tambahan jika data terpisah.' },
    ],
    practicalUse:
      'Digunakan setiap hari untuk menghitung total omzet penjualan, total pengeluaran kas, jumlah jam kerja karyawan, hingga rekap kuantitas stok barang masuk dan keluar.',
    stepByStep: [
      'Klik sel kosong di bawah atau di samping deretan angka yang ingin dijumlahkan.',
      'Ketik =SUM( lalu blok rentang sel angka (misal C2:C6).',
      'Tutup kurung ) dan tekan Enter. Tip cepat: tekan Alt + = untuk AutoSum otomatis.',
    ],
    pitfall:
      'Angka yang tersimpan sebagai teks (biasanya rata kiri dengan tanda kutip atau tanda seru hijau) tidak akan diikutkan oleh SUM.',
    proTip:
      'Gunakan tombol pintas Alt + = (Windows) atau Cmd + Shift + T (Mac) di sel paling bawah tabel untuk langsung menyisipkan SUM otomatis.',
    worksheet: {
      sheetName: 'Latihan_SUM',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [14, 24, 16, 20],
      defaultActiveCell: 'C7',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Kode', isHeader: true },
            B: { value: 'Nama Produk', isHeader: true },
            C: { value: 'Qty Terjual', isHeader: true, align: 'right' },
            D: { value: 'Total Omzet (Rp)', isHeader: true, align: 'right' },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'PRD-01' },
            B: { value: 'Kertas A4 80gr', editable: true },
            C: { value: 25, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 1375000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'PRD-02' },
            B: { value: 'Tinta Printer Hitam', editable: true },
            C: { value: 12, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 1440000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'PRD-03' },
            B: { value: 'Map Ordner Bantex', editable: true },
            C: { value: 40, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 1120000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'PRD-04' },
            B: { value: 'Pulpen Gel Hitam', editable: true },
            C: { value: 60, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 360000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: 'PRD-05' },
            B: { value: 'Binder Clip Box', editable: true },
            C: { value: 18, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 270000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
          },
        },
        {
          rowNum: 7,
          cells: {
            A: { value: '' },
            B: { value: 'Total Keseluruhan', isHeader: true },
            C: {
              value: 155,
              isFormula: true,
              formula: '=SUM(C2:C6)',
              format: 'number',
              align: 'right',
              compute: (g) => num(g('C2')) + num(g('C3')) + num(g('C4')) + num(g('C5')) + num(g('C6')),
            },
            D: {
              value: 4565000,
              isFormula: true,
              formula: '=SUM(D2:D6)',
              format: 'currency',
              align: 'right',
              compute: (g) => num(g('D2')) + num(g('D3')) + num(g('D4')) + num(g('D5')) + num(g('D6')),
            },
          },
        },
      ],
    },
  },
  {
    id: 'sumif',
    name: 'SUMIF',
    category: 'Matematika & Agregasi',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menjumlahkan angka berdasarkan satu syarat atau kriteria tertentu.',
    syntax: '=SUMIF(range, criteria, [sum_range])',
    syntaxSemicolon: '=SUMIF(range; criteria; [sum_range])',
    arguments: [
      { name: 'range', required: true, description: 'Kolom yang diperiksa kriterianya (misal kolom Cabang B2:B6).' },
      { name: 'criteria', required: true, description: 'Syarat yang dicari, bisa berupa teks ("Jakarta"), angka (>500000), atau sel referensi (F2).' },
      { name: 'sum_range', required: false, description: 'Kolom angka yang akan dijumlahkan jika syarat terpenuhi (misal D2:D6).' },
    ],
    practicalUse:
      'Sangat sering dipakai bagian keuangan dan penjualan untuk menghitung total omzet per cabang, total belanja per kategori biaya, atau total penjualan dari satu sales tertentu tanpa membuat PivotTable.',
    stepByStep: [
      'Siapkan sel kriteria target (misalnya sel F2 berisi "Jakarta").',
      'Masukkan rentang kategori sebagai argumen pertama (B2:B6).',
      'Arahkan kriteria ke sel F2 lalu tentukan kolom nilai D2:D6 sebagai sum_range.',
    ],
    pitfall:
      'Panjang baris antara range dan sum_range wajib sama (misal B2:B6 dengan D2:D6). Jika tidak sejajar, hasil penjumlahan akan bergeser.',
    proTip:
      'Gunakan wildcard bintang (*) pada kriteria seperti "*Jakarta*" untuk menjumlahkan semua baris yang mengandung kata Jakarta.',
    worksheet: {
      sheetName: 'Latihan_SUMIF',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      colWidths: [14, 16, 18, 18, 4, 22],
      defaultActiveCell: 'F3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Tanggal', isHeader: true },
            B: { value: 'Cabang', isHeader: true },
            C: { value: 'Kategori', isHeader: true },
            D: { value: 'Penjualan (Rp)', isHeader: true, align: 'right' },
            E: { value: '' },
            F: { value: 'Filter Cabang', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: '2026-10-01' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Laptop' },
            D: { value: 12500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: 'Jakarta', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: '2026-10-02' },
            B: { value: 'Surabaya', editable: true },
            C: { value: 'Monitor' },
            D: { value: 4200000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: {
              value: 21000000,
              isFormula: true,
              formula: '=SUMIF(B2:B6,F2,D2:D6)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const target = str(g('F2')).toLowerCase();
                let total = 0;
                for (let r = 2; r <= 6; r++) {
                  if (str(g(`B${r}`)).toLowerCase() === target) total += num(g(`D${r}`));
                }
                return total;
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: '2026-10-03' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Aksesoris' },
            D: { value: 1850000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: 'Ubah F2 ke Surabaya/Bandung' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: '2026-10-04' },
            B: { value: 'Bandung', editable: true },
            C: { value: 'Laptop' },
            D: { value: 9800000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: '' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: '2026-10-05' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Monitor' },
            D: { value: 6650000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'sumifs',
    name: 'SUMIFS',
    category: 'Matematika & Agregasi',
    level: 'Menengah',
    excelVersion: 'Excel 2007+',
    tagline: 'Menjumlahkan angka dengan banyak kriteria sekaligus (logika DAN).',
    syntax: '=SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    syntaxSemicolon: '=SUMIFS(sum_range; criteria_range1; criteria1; ...)',
    arguments: [
      { name: 'sum_range', required: true, description: 'Kolom angka yang akan dijumlahkan (berbeda dari SUMIF, di sini ditaruh paling depan!).' },
      { name: 'criteria_range1', required: true, description: 'Rentang kolom syarat pertama (misal Cabang).' },
      { name: 'criteria1', required: true, description: 'Nilai syarat pertama (misal sel F2).' },
      { name: 'criteria_range2', required: false, description: 'Rentang kolom syarat kedua (misal Kategori atau Status Lunas).' },
    ],
    practicalUse:
      'Andalan utama laporan manajemen: menghitung total penjualan cabang Jakarta khusus produk kategori Laptop yang statusnya sudah Lunas.',
    stepByStep: [
      'Selalu mulai dengan kolom yang dijumlahkan: D2:D6.',
      'Tambahkan pasangan syarat ke-1: kolom B2:B6 dengan sel F2.',
      'Tambahkan pasangan syarat ke-2: kolom C2:C6 dengan sel F3.',
    ],
    pitfall:
      'Banyak pengguna tertukar urutan argumen dengan SUMIF. Ingat: SUMIF menaruh sum_range di BELAKANG, sedangkan SUMIFS menaruh sum_range di DEPAN.',
    proTip:
      'Kombinasikan operator perbandingan dengan tanda &, misalnya ">="&F4 untuk memfilter tanggal atau nominal minimal secara dinamis.',
    worksheet: {
      sheetName: 'Latihan_SUMIFS',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      colWidths: [14, 16, 16, 18, 4, 22],
      defaultActiveCell: 'F4',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Sales', isHeader: true },
            B: { value: 'Cabang', isHeader: true },
            C: { value: 'Status', isHeader: true },
            D: { value: 'Nilai Order (Rp)', isHeader: true, align: 'right' },
            E: { value: '' },
            F: { value: 'Parameter Filter', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Rina' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Lunas', editable: true },
            D: { value: 8500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: 'Jakarta', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Budi' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Piutang', editable: true },
            D: { value: 4200000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: 'Lunas', editable: true },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Dina' },
            B: { value: 'Bandung', editable: true },
            C: { value: 'Lunas', editable: true },
            D: { value: 6300000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: {
              value: 14700000,
              isFormula: true,
              formula: '=SUMIFS(D2:D6,B2:B6,F2,C2:C6,F3)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const cabang = str(g('F2')).toLowerCase();
                const status = str(g('F3')).toLowerCase();
                let total = 0;
                for (let r = 2; r <= 6; r++) {
                  if (
                    str(g(`B${r}`)).toLowerCase() === cabang &&
                    str(g(`C${r}`)).toLowerCase() === status
                  ) {
                    total += num(g(`D${r}`));
                  }
                }
                return total;
              },
            },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'Andi' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 'Lunas', editable: true },
            D: { value: 6200000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: 'F2=Cabang, F3=Status' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: 'Sari' },
            B: { value: 'Surabaya', editable: true },
            C: { value: 'Lunas', editable: true },
            D: { value: 5100000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: '' },
            F: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'countif-countifs',
    name: 'COUNTIF & COUNTIFS',
    category: 'Matematika & Agregasi',
    level: 'Dasar',
    excelVersion: 'Excel 2007+',
    tagline: 'Menghitung berapa banyak sel/baris yang memenuhi satu atau banyak syarat.',
    syntax: '=COUNTIFS(criteria_range1, criteria1, [criteria_range2, criteria2], ...)',
    syntaxSemicolon: '=COUNTIFS(criteria_range1; criteria1; ...)',
    arguments: [
      { name: 'criteria_range1', required: true, description: 'Kolom yang ingin dihitung frekuensinya.' },
      { name: 'criteria1', required: true, description: 'Kondisi pencocokan (misal "Hadir", ">80", atau sel referensi).' },
      { name: 'criteria_range2', required: false, description: 'Kolom syarat tambahan untuk COUNTIFS.' },
    ],
    practicalUse:
      'Dipakai HRD untuk merekap jumlah karyawan yang hadir, terlambat, atau cuti; dipakai gudang untuk menghitung jumlah SKU yang stoknya di bawah batas aman (<10).',
    stepByStep: [
      'Gunakan COUNTIF jika hanya butuh 1 syarat, misal hitung jumlah status "Hadir".',
      'Gunakan COUNTIFS jika syarat lebih dari satu, misal Divisi "IT" sekaligus status "Hadir".',
    ],
    pitfall:
      'Spasi berlebih di akhir teks ("Hadir ") membuat COUNTIF tidak menghitung sel tersebut. Bersihkan dulu dengan TRIM.',
    proTip:
      'Untuk menghitung sel yang TIDAK kosong dengan syarat tertentu, pakai kriteria "<>". Untuk mendeteksi duplikat cepat, pakai =COUNTIF($A$2:$A$100, A2)>1.',
    worksheet: {
      sheetName: 'Latihan_COUNTIFS',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 16, 16, 4, 24],
      defaultActiveCell: 'E3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Karyawan', isHeader: true },
            B: { value: 'Divisi', isHeader: true },
            C: { value: 'Kehadiran', isHeader: true },
            D: { value: '' },
            E: { value: 'Rekap Kehadiran', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Dewi Lestari' },
            B: { value: 'Operasional', editable: true },
            C: { value: 'Hadir', editable: true },
            D: { value: '' },
            E: { value: 'Operasional', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Bagas Pratama' },
            B: { value: 'Operasional', editable: true },
            C: { value: 'Terlambat', editable: true },
            D: { value: '' },
            E: {
              value: 2,
              isFormula: true,
              formula: '=COUNTIFS(B2:B6,E2,C2:C6,"Hadir")',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const div = str(g('E2')).toLowerCase();
                let cnt = 0;
                for (let r = 2; r <= 6; r++) {
                  if (str(g(`B${r}`)).toLowerCase() === div && str(g(`C${r}`)).toLowerCase() === 'hadir') cnt++;
                }
                return cnt;
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Nadia Putri' },
            B: { value: 'Keuangan', editable: true },
            C: { value: 'Hadir', editable: true },
            D: { value: '' },
            E: {
              value: 3,
              isFormula: true,
              formula: '=COUNTIF(C2:C6,"Hadir")',
              format: 'number',
              align: 'right',
              compute: (g) => {
                let cnt = 0;
                for (let r = 2; r <= 6; r++) {
                  if (str(g(`C${r}`)).toLowerCase() === 'hadir') cnt++;
                }
                return cnt;
              },
            },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'Rizky Maulana' },
            B: { value: 'Operasional', editable: true },
            C: { value: 'Hadir', editable: true },
            D: { value: '' },
            E: { value: 'E3: Hadir per Divisi E2' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: 'Fajar Nugroho' },
            B: { value: 'Keuangan', editable: true },
            C: { value: 'Izin', editable: true },
            D: { value: '' },
            E: { value: 'E4: Total Hadir Semua' },
          },
        },
      ],
    },
  },
  {
    id: 'averageif',
    name: 'AVERAGE & AVERAGEIF',
    category: 'Matematika & Agregasi',
    level: 'Dasar',
    excelVersion: 'Excel 2007+',
    tagline: 'Menghitung nilai rata-rata dari seluruh data atau khusus kategori tertentu.',
    syntax: '=AVERAGEIF(range, criteria, [average_range])',
    syntaxSemicolon: '=AVERAGEIF(range; criteria; [average_range])',
    arguments: [
      { name: 'range', required: true, description: 'Kolom kategori yang akan dievaluasi.' },
      { name: 'criteria', required: true, description: 'Syarat kelompok yang ingin dicari rata-ratanya.' },
      { name: 'average_range', required: false, description: 'Kolom angka yang dihitung rata-ratanya.' },
    ],
    practicalUse:
      'Menghitung rata-rata nilai ujian per kelas, rata-rata ukuran keranjang belanja (AOV) per kanal iklan, atau rata-rata durasi penyelesaian tiket komplain.',
    stepByStep: [
      'Pilih sel hasil lalu ketik =AVERAGEIF(.',
      'Masukkan rentang kategori (B2:B6), kriteria (E2), dan kolom nilai (C2:C6).',
    ],
    pitfall:
      'Sel bernilai 0 ikut dihitung sebagai pembagi rata-rata, sedangkan sel kosong tidak dihitung. Jika tidak ingin menghitung nol, gunakan AVERAGEIFS dengan syarat ">0".',
    proTip:
      'Bandingkan AVERAGE dengan MEDIAN bila data memiliki nilai ekstrem (outlier) seperti satu transaksi raksasa yang mendistorsi rata-rata.',
    worksheet: {
      sheetName: 'Latihan_AVERAGEIF',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 16, 18, 4, 22],
      defaultActiveCell: 'E3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Peserta', isHeader: true },
            B: { value: 'Kelas', isHeader: true },
            C: { value: 'Skor Evaluasi', isHeader: true, align: 'right' },
            D: { value: '' },
            E: { value: 'Rata-rata Kelas', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Alya' },
            B: { value: 'Analitik', editable: true },
            C: { value: 88, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: '' },
            E: { value: 'Analitik', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Bima' },
            B: { value: 'Keuangan', editable: true },
            C: { value: 76, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: '' },
            E: {
              value: 91,
              isFormula: true,
              formula: '=AVERAGEIF(B2:B6,E2,C2:C6)',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const target = str(g('E2')).toLowerCase();
                let sum = 0;
                let cnt = 0;
                for (let r = 2; r <= 6; r++) {
                  if (str(g(`B${r}`)).toLowerCase() === target) {
                    sum += num(g(`C${r}`));
                    cnt++;
                  }
                }
                return cnt === 0 ? 0 : Math.round((sum / cnt) * 100) / 100;
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Citra' },
            B: { value: 'Analitik', editable: true },
            C: { value: 94, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: '' },
            E: { value: 'Ubah E2 ke Keuangan' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'Damar' },
            B: { value: 'Keuangan', editable: true },
            C: { value: 84, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: '' },
            E: { value: '' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: 'Eka' },
            B: { value: 'Analitik', editable: true },
            C: { value: 91, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: '' },
            E: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'round-family',
    name: 'ROUND / ROUNDUP / ROUNDDOWN',
    category: 'Matematika & Agregasi',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Membulatkan angka desimal atau ribuan secara matematis agar presisi di invoice.',
    syntax: '=ROUND(number, num_digits)',
    syntaxSemicolon: '=ROUND(number; num_digits)',
    arguments: [
      { name: 'number', required: true, description: 'Angka atau rumus perhitungan yang ingin dibulatkan.' },
      { name: 'num_digits', required: true, description: 'Jumlah angka di belakang koma (0 = bulat satuan, -3 = bulat ribuan).' },
    ],
    practicalUse:
      'Wajib digunakan pada perhitungan pajak PPN 11%, diskon persentase, atau harga jual agar total di invoice tidak selisih Rp 1 akibat angka desimal tersembunyi.',
    stepByStep: [
      'Gunakan ROUND(..., 0) untuk pembulatan standar tanpa koma.',
      'Gunakan ROUND(..., -3) untuk membulatkan harga ke kelipatan 1.000 terdekat.',
      'Gunakan ROUNDUP untuk selalu membulatkan ke atas (misal hitung kebutuhan dus/karton).',
    ],
    pitfall:
      'Mengubah tampilan desimal lewat tombol ribbon (Decrease Decimal) hanya menyembunyikan koma di layar, bukan mengubah nilai asli. Gunakan ROUND agar nilai aslinya ikut bulat.',
    proTip:
      'Pakai MROUND(angka, 500) jika ingin membulatkan harga kasir ke kelipatan Rp 500 terdekat.',
    worksheet: {
      sheetName: 'Latihan_ROUND',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [20, 18, 20, 20],
      defaultActiveCell: 'C2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Komponen Harga', isHeader: true },
            B: { value: 'Nilai Asli', isHeader: true, align: 'right' },
            C: { value: 'ROUND (Satuan)', isHeader: true, align: 'right' },
            D: { value: 'ROUNDUP (Ribuan)', isHeader: true, align: 'right' },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'DPP + PPN 11%' },
            B: { value: 145678.65, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: {
              value: 145679,
              isFormula: true,
              formula: '=ROUND(B2,0)',
              format: 'currency',
              align: 'right',
              compute: (g) => Math.round(num(g('B2'))),
            },
            D: {
              value: 146000,
              isFormula: true,
              formula: '=ROUNDUP(B2,-3)',
              format: 'currency',
              align: 'right',
              compute: (g) => Math.ceil(num(g('B2')) / 1000) * 1000,
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Biaya Kirim/Kg' },
            B: { value: 23410.25, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: {
              value: 23410,
              isFormula: true,
              formula: '=ROUND(B3,0)',
              format: 'currency',
              align: 'right',
              compute: (g) => Math.round(num(g('B3'))),
            },
            D: {
              value: 24000,
              isFormula: true,
              formula: '=ROUNDUP(B3,-3)',
              format: 'currency',
              align: 'right',
              compute: (g) => Math.ceil(num(g('B3')) / 1000) * 1000,
            },
          },
        },
      ],
    },
  },
  {
    id: 'subtotal',
    name: 'SUBTOTAL',
    category: 'Matematika & Agregasi',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menjumlahkan atau menghitung rata-rata khusus baris yang terlihat saat tabel difilter.',
    syntax: '=SUBTOTAL(function_num, ref1, [ref2], ...)',
    syntaxSemicolon: '=SUBTOTAL(function_num; ref1; ...)',
    arguments: [
      { name: 'function_num', required: true, description: 'Kode fungsi: 9 atau 109 untuk SUM, 1/101 untuk AVERAGE, 3/103 untuk COUNTA.' },
      { name: 'ref1', required: true, description: 'Rentang data tabel yang akan dihitung saat Filter aktif.' },
    ],
    practicalUse:
      'Sangat penting pada tabel laporan besar yang sering difilter (AutoFilter). Jika memakai SUM biasa, total di atas/bawah tabel tidak berubah saat difilter. SUBTOTAL otomatis mengikuti hasil filter.',
    stepByStep: [
      'Gunakan kode 9 untuk SUM (mengabaikan baris tersembunyi hasil Filter).',
      'Gunakan kode 109 untuk SUM (mengabaikan baris Filter DAN baris yang di-Hide manual).',
    ],
    pitfall:
      'Jika Anda menaruh SUBTOTAL di baris tengah lalu membuat Grand Total SUBTOTAL di paling bawah, SUBTOTAL otomatis mengabaikan sel SUBTOTAL lain di dalam rentangnya sehingga tidak terjadi double counting.',
    proTip:
      'Letakkan baris SUBTOTAL di baris paling atas (baris 1 atau 2) di atas header tabel yang di-Freeze, agar total selalu terlihat saat scroll ribuan baris.',
    worksheet: {
      sheetName: 'Latihan_SUBTOTAL',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [16, 20, 18, 22],
      defaultActiveCell: 'C7',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Divisi', isHeader: true },
            B: { value: 'Keperluan', isHeader: true },
            C: { value: 'Biaya (Rp)', isHeader: true, align: 'right' },
            D: { value: 'Catatan', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Marketing' },
            B: { value: 'Iklan Sosial Media' },
            C: { value: 3500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 'Aktif saat filter' },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Operasional' },
            B: { value: 'Listrik & Internet' },
            C: { value: 2150000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 'Aktif saat filter' },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Marketing' },
            B: { value: 'Cetak Brosur' },
            C: { value: 950000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 'Aktif saat filter' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'HRD' },
            B: { value: 'Pelatihan Staf' },
            C: { value: 4000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 'Aktif saat filter' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: '' },
            B: { value: 'Total Dinamis (SUBTOTAL 9)', isHeader: true },
            C: {
              value: 10600000,
              isFormula: true,
              formula: '=SUBTOTAL(9,C2:C5)',
              format: 'currency',
              align: 'right',
              compute: (g) => num(g('C2')) + num(g('C3')) + num(g('C4')) + num(g('C5')),
            },
            D: { value: 'Otomatis ikuti filter di Excel' },
          },
        },
      ],
    },
  },

  // =========================================================
  // 2. LOGIKA & KONDISI
  // =========================================================
  {
    id: 'if-basic',
    name: 'IF',
    category: 'Logika & Kondisi',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Mengambil keputusan otomatis: jika kondisi benar lakukan A, jika salah lakukan B.',
    syntax: '=IF(logical_test, value_if_true, value_if_false)',
    syntaxSemicolon: '=IF(logical_test; value_if_true; value_if_false)',
    arguments: [
      { name: 'logical_test', required: true, description: 'Pernyataan perbandingan, misal C2>=75 atau B2="Lunas".' },
      { name: 'value_if_true', required: true, description: 'Hasil yang muncul jika syarat terpenuhi (teks wajib diapit tanda kutip "").' },
      { name: 'value_if_false', required: true, description: 'Hasil yang muncul jika syarat tidak terpenuhi.' },
    ],
    practicalUse:
      'Menentukan status Lulus/Remedial, memberi status "Restock" saat stok kurang dari batas minimum, atau menentukan apakah transaksi mendapat gratis ongkir.',
    stepByStep: [
      'Tulis syarat logika di argumen pertama, misal B2>=C2.',
      'Tulis hasil jika benar ("Target Tercapai") dan jika salah ("Belum Tercapai").',
    ],
    pitfall:
      'Lupa memberi tanda kutip ganda "" pada hasil berupa teks akan memunculkan error #NAME?. Angka tidak perlu tanda kutip.',
    proTip:
      'Jika ingin sel terlihat kosong saat kondisi salah, gunakan tanda kutip kosong "" pada value_if_false.',
    worksheet: {
      sheetName: 'Latihan_IF',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 18, 18, 22],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Nama Sales', isHeader: true },
            B: { value: 'Omzet (Rp)', isHeader: true, align: 'right' },
            C: { value: 'Target (Rp)', isHeader: true, align: 'right' },
            D: { value: 'Status Kinerja', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Rama Wijaya' },
            B: { value: 54000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 50000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: {
              value: 'Target Tercapai',
              isFormula: true,
              formula: '=IF(B2>=C2,"Target Tercapai","Belum Tercapai")',
              compute: (g) => (num(g('B2')) >= num(g('C2')) ? 'Target Tercapai' : 'Belum Tercapai'),
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Sinta Dewi' },
            B: { value: 42000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 50000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: {
              value: 'Belum Tercapai',
              isFormula: true,
              formula: '=IF(B3>=C3,"Target Tercapai","Belum Tercapai")',
              compute: (g) => (num(g('B3')) >= num(g('C3')) ? 'Target Tercapai' : 'Belum Tercapai'),
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Taufik Hidayat' },
            B: { value: 61500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 50000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: {
              value: 'Target Tercapai',
              isFormula: true,
              formula: '=IF(B4>=C4,"Target Tercapai","Belum Tercapai")',
              compute: (g) => (num(g('B4')) >= num(g('C4')) ? 'Target Tercapai' : 'Belum Tercapai'),
            },
          },
        },
      ],
    },
  },
  {
    id: 'ifs-nested',
    name: 'IF Bertingkat & IFS',
    category: 'Logika & Kondisi',
    level: 'Menengah',
    excelVersion: 'Excel 2019+ (IFS) / Semua (Nested IF)',
    tagline: 'Mengevaluasi banyak tingkatan kondisi seperti grade nilai atau skema komisi berjenjang.',
    syntax: '=IFS(test1, val1, test2, val2, TRUE, fallback)',
    syntaxSemicolon: '=IFS(test1; val1; test2; val2; TRUE; fallback)',
    arguments: [
      { name: 'test1', required: true, description: 'Kondisi tingkat pertama (mulai dari batas paling tinggi atau paling rendah secara berurutan).' },
      { name: 'val1', required: true, description: 'Nilai yang dikembalikan jika kondisi pertama benar.' },
      { name: 'TRUE, fallback', required: false, description: 'Nilai default terakhir apabila semua kondisi sebelumnya tidak terpenuhi.' },
    ],
    practicalUse:
      'Menghitung grade nilai (A/B/C/D), menentukan tarif diskon bertingkat berdasarkan nominal belanja, atau mengklasifikasikan usia piutang (0-30 hari, 31-60 hari, >60 hari).',
    stepByStep: [
      'Susun batas dari nilai TERTINGGI ke terendah (misal >=90, lalu >=75, lalu >=60).',
      'Jika memakai Excel lama (<2019), gunakan Nested IF: =IF(B2>=90,"A",IF(B2>=75,"B","C")).',
      'Pada Excel 2019+/365, gunakan IFS agar rumus lebih bersih dan tidak banyak kurung tutup.',
    ],
    pitfall:
      'Salah mengurutkan batas (misal menaruh >=60 sebelum >=90) membuat skor 95 berhenti di kondisi >=60! Selalu urutkan secara konsisten.',
    proTip:
      'Jika ada lebih dari 5 tingkatan tarif atau komisi, lebih baik buat tabel referensi kecil lalu gunakan VLOOKUP dengan match TRUE (approximate) agar mudah diperbarui.',
    worksheet: {
      sheetName: 'Latihan_IFS',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 16, 16, 20],
      defaultActiveCell: 'C2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Kandidat', isHeader: true },
            B: { value: 'Nilai Tes', isHeader: true, align: 'right' },
            C: { value: 'Predikat (IF)', isHeader: true },
            D: { value: 'Rekomendasi', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Naufal' },
            B: { value: 92, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: {
              value: 'A - Sangat Baik',
              isFormula: true,
              formula: '=IF(B2>=85,"A - Sangat Baik",IF(B2>=70,"B - Baik","C - Perlu Latihan"))',
              compute: (g) => {
                const v = num(g('B2'));
                return v >= 85 ? 'A - Sangat Baik' : v >= 70 ? 'B - Baik' : 'C - Perlu Latihan';
              },
            },
            D: {
              value: 'Lolos Langsung',
              isFormula: true,
              formula: '=IF(B2>=85,"Lolos Langsung",IF(B2>=70,"Wawancara","Cadangan"))',
              compute: (g) => {
                const v = num(g('B2'));
                return v >= 85 ? 'Lolos Langsung' : v >= 70 ? 'Wawancara' : 'Cadangan';
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Putri' },
            B: { value: 76, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: {
              value: 'B - Baik',
              isFormula: true,
              formula: '=IF(B3>=85,"A - Sangat Baik",IF(B3>=70,"B - Baik","C - Perlu Latihan"))',
              compute: (g) => {
                const v = num(g('B3'));
                return v >= 85 ? 'A - Sangat Baik' : v >= 70 ? 'B - Baik' : 'C - Perlu Latihan';
              },
            },
            D: {
              value: 'Wawancara',
              isFormula: true,
              formula: '=IF(B3>=85,"Lolos Langsung",IF(B3>=70,"Wawancara","Cadangan"))',
              compute: (g) => {
                const v = num(g('B3'));
                return v >= 85 ? 'Lolos Langsung' : v >= 70 ? 'Wawancara' : 'Cadangan';
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Kevin' },
            B: { value: 63, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: {
              value: 'C - Perlu Latihan',
              isFormula: true,
              formula: '=IF(B4>=85,"A - Sangat Baik",IF(B4>=70,"B - Baik","C - Perlu Latihan"))',
              compute: (g) => {
                const v = num(g('B4'));
                return v >= 85 ? 'A - Sangat Baik' : v >= 70 ? 'B - Baik' : 'C - Perlu Latihan';
              },
            },
            D: {
              value: 'Cadangan',
              isFormula: true,
              formula: '=IF(B4>=85,"Lolos Langsung",IF(B4>=70,"Wawancara","Cadangan"))',
              compute: (g) => {
                const v = num(g('B4'));
                return v >= 85 ? 'Lolos Langsung' : v >= 70 ? 'Wawancara' : 'Cadangan';
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'if-and-or',
    name: 'IF + AND / OR',
    category: 'Logika & Kondisi',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menggabungkan dua atau lebih syarat logika (semua wajib benar atau salah satu saja).',
    syntax: '=IF(AND(syarat1, syarat2), hasil_benar, hasil_salah)',
    syntaxSemicolon: '=IF(AND(syarat1; syarat2); hasil_benar; hasil_salah)',
    arguments: [
      { name: 'AND(...)', required: true, description: 'Bernilai TRUE hanya jika SEMUA syarat di dalamnya terpenuhi.' },
      { name: 'OR(...)', required: false, description: 'Bernilai TRUE jika MINIMAL SATU syarat di dalamnya terpenuhi.' },
    ],
    practicalUse:
      'Menentukan karyawan berhak atas bonus tahunan jika masa kerja >= 1 tahun DAN penilaian kinerja >= 80, atau memberi diskon jika pembeli adalah Member ATAU belanja di atas Rp 1 juta.',
    stepByStep: [
      'Letakkan fungsi AND(...) atau OR(...) langsung di posisi logical_test milik IF.',
      'Masukkan semua syarat yang dipisahkan koma.',
    ],
    pitfall:
      'Menulis AND(B2="A" OR B2="B") di dalam Excel tidak valid. Gunakan sintaks fungsi: OR(B2="A", B2="B").',
    proTip:
      'Anda bisa menggabungkan AND dan OR sekaligus, misal IF(AND(B2>=80, OR(C2="Tetap", C2="Kontrak")), "Eligible", "Tidak").',
    worksheet: {
      sheetName: 'Latihan_AND_OR',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 16, 16, 22],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Karyawan', isHeader: true },
            B: { value: 'Absensi (%)', isHeader: true, align: 'right' },
            C: { value: 'Skor KPI', isHeader: true, align: 'right' },
            D: { value: 'Bonus (Abs>=90 & KPI>=80)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Hendra' },
            B: { value: 95, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: { value: 86, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: 'Dapat Bonus',
              isFormula: true,
              formula: '=IF(AND(B2>=90,C2>=80),"Dapat Bonus","Tidak Dapat")',
              compute: (g) => (num(g('B2')) >= 90 && num(g('C2')) >= 80 ? 'Dapat Bonus' : 'Tidak Dapat'),
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Maya' },
            B: { value: 85, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: { value: 92, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: 'Tidak Dapat',
              isFormula: true,
              formula: '=IF(AND(B3>=90,C3>=80),"Dapat Bonus","Tidak Dapat")',
              compute: (g) => (num(g('B3')) >= 90 && num(g('C3')) >= 80 ? 'Dapat Bonus' : 'Tidak Dapat'),
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Gilang' },
            B: { value: 92, editable: true, inputType: 'number', format: 'number', align: 'right' },
            C: { value: 81, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: 'Dapat Bonus',
              isFormula: true,
              formula: '=IF(AND(B4>=90,C4>=80),"Dapat Bonus","Tidak Dapat")',
              compute: (g) => (num(g('B4')) >= 90 && num(g('C4')) >= 80 ? 'Dapat Bonus' : 'Tidak Dapat'),
            },
          },
        },
      ],
    },
  },
  {
    id: 'iferror',
    name: 'IFERROR',
    category: 'Logika & Kondisi',
    level: 'Dasar',
    excelVersion: 'Excel 2007+',
    tagline: 'Menangkap pesan error (#DIV/0!, #N/A, #VALUE!) dan menggantinya dengan teks atau angka rapi.',
    syntax: '=IFERROR(value, value_if_error)',
    syntaxSemicolon: '=IFERROR(value; value_if_error)',
    arguments: [
      { name: 'value', required: true, description: 'Rumus utama yang dijalankan (misal C2/B2 atau VLOOKUP(...)).' },
      { name: 'value_if_error', required: true, description: 'Nilai pengganti jika rumus utama menghasilkan error (misal 0 atau "Data Tidak Ditemukan").' },
    ],
    practicalUse:
      'Membuat laporan persentase pertumbuhan atau hasil VLOOKUP tetap rapi tanpa merusak penjumlahan SUM di bagian bawah akibat munculnya #DIV/0! atau #N/A.',
    stepByStep: [
      'Tulis rumus pembagian atau lookup Anda seperti biasa, pastikan sudah benar.',
      'Bungkus seluruh rumus tersebut di dalam IFERROR(..., 0) atau IFERROR(..., "-").',
    ],
    pitfall:
      'Jangan asal membungkus rumus sebelum memeriksa penyebab error. Jika rumus Anda salah ketik referensi, IFERROR bisa menyembunyikan bug.',
    proTip:
      'Untuk kasus pembagian dengan nol di laporan keuangan, gunakan =IFERROR((B2-A2)/A2, 0) agar rasio tetap bisa dirata-rata.',
    worksheet: {
      sheetName: 'Latihan_IFERROR',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 16, 16, 22],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Produk', isHeader: true },
            B: { value: 'Omzet', isHeader: true, align: 'right' },
            C: { value: 'Unit Terjual', isHeader: true, align: 'right' },
            D: { value: 'Harga Rata-rata', isHeader: true, align: 'right' },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Paket Hemat' },
            B: { value: 4500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 30, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: 150000,
              isFormula: true,
              formula: '=IFERROR(B2/C2,0)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const denom = num(g('C2'));
                return denom === 0 ? 0 : Math.round(num(g('B2')) / denom);
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Paket Baru (0 Unit)' },
            B: { value: 0, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 0, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: 0,
              isFormula: true,
              formula: '=IFERROR(B3/C3,0)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const denom = num(g('C3'));
                return denom === 0 ? 0 : Math.round(num(g('B3')) / denom);
              },
            },
          },
        },
      ],
    },
  },

  // =========================================================
  // 3. PENCARIAN & REFERENSI (LOOKUP)
  // =========================================================
  {
    id: 'vlookup',
    name: 'VLOOKUP',
    category: 'Pencarian (Lookup)',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Mencari data secara vertikal di kolom paling kiri tabel lalu mengambil nilai di kolom kanannya.',
    syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
    syntaxSemicolon: '=VLOOKUP(lookup_value; table_array; col_index_num; [range_lookup])',
    arguments: [
      { name: 'lookup_value', required: true, description: 'Kata kunci/ID yang dicari (misal Kode SKU di sel E2).' },
      { name: 'table_array', required: true, description: 'Tabel master referensi. Kunci WAJIB berada di kolom paling kiri tabel ini, dan kunci dengan $ ($A$2:$C$6).' },
      { name: 'col_index_num', required: true, description: 'Urutan kolom hasil yang ingin diambil (1=kolom kunci, 2=kolom kedua, dst).' },
      { name: 'range_lookup', required: false, description: 'Isi 0 atau FALSE untuk pencarian persis (wajib untuk ID/nama!).' },
    ],
    practicalUse:
      'Mengisi otomatis nama barang dan harga jual di form invoice hanya dengan mengetik Kode SKU, atau menarik gaji pokok berdasarkan Golongan karyawan.',
    stepByStep: [
      'Pastikan Kode Barang ada di kolom pertama tabel referensi (kolom A).',
      'Kunci tabel referensi dengan menekan F4 ($A$2:$C$5) agar tidak bergeser saat rumus ditarik ke bawah.',
      'Selalu akhiri dengan ,FALSE atau ,0 untuk kecocokan persis.',
    ],
    pitfall:
      'Lupa mengunci rentang tabel dengan $ ($A$2:$C$5) membuat hasil pencarian baris bawah menjadi #N/A saat rumus di-copy ke bawah.',
    proTip:
      'VLOOKUP tidak bisa mencari ke arah kiri. Jika kolom kunci berada di sebelah kanan kolom hasil, gunakan INDEX + MATCH atau XLOOKUP.',
    worksheet: {
      sheetName: 'Latihan_VLOOKUP',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      colWidths: [12, 22, 16, 4, 14, 22],
      defaultActiveCell: 'F3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Kode', isHeader: true },
            B: { value: 'Nama Item', isHeader: true },
            C: { value: 'Harga (Rp)', isHeader: true, align: 'right' },
            D: { value: '' },
            E: { value: 'Cari Kode', isHeader: true },
            F: { value: 'Hasil Otomatis', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'K01' },
            B: { value: 'Mouse Wireless', editable: true },
            C: { value: 185000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: 'K03', editable: true },
            F: {
              value: 'Stand Laptop Alu',
              isFormula: true,
              formula: '=VLOOKUP(E2,$A$2:$C$5,2,FALSE)',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 5; r++) {
                  if (str(g(`A${r}`)).toUpperCase() === key) return g(`B${r}`);
                }
                return '#N/A';
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'K02' },
            B: { value: 'Keyboard Mekanik', editable: true },
            C: { value: 450000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: 'Harga:' },
            F: {
              value: 240000,
              isFormula: true,
              formula: '=VLOOKUP(E2,$A$2:$C$5,3,FALSE)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 5; r++) {
                  if (str(g(`A${r}`)).toUpperCase() === key) return num(g(`C${r}`));
                }
                return '#N/A';
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'K03' },
            B: { value: 'Stand Laptop Alu', editable: true },
            C: { value: 240000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: '' },
            F: { value: 'Coba ubah E2: K01 - K04' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'K04' },
            B: { value: 'USB-C Hub 6in1', editable: true },
            C: { value: 320000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: '' },
            F: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'hlookup',
    name: 'HLOOKUP',
    category: 'Pencarian (Lookup)',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Mencari data secara horizontal di baris teratas tabel lalu mengambil nilai di baris bawahnya.',
    syntax: '=HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])',
    syntaxSemicolon: '=HLOOKUP(lookup_value; table_array; row_index_num; [range_lookup])',
    arguments: [
      { name: 'lookup_value', required: true, description: 'Nama kolom/periode yang dicari (misal "Feb").' },
      { name: 'table_array', required: true, description: 'Tabel horizontal tempat header berada di baris paling atas.' },
      { name: 'row_index_num', required: true, description: 'Nomor baris yang ingin diambil (1=header, 2=baris kedua, dst).' },
      { name: 'range_lookup', required: false, description: 'Isi FALSE atau 0 untuk pencarian persis.' },
    ],
    practicalUse:
      'Mengambil nilai anggaran atau target dari tabel matriks bulanan yang header bulannya (Jan, Feb, Mar) tersusun mendatar ke kanan.',
    stepByStep: [
      'Pastikan kunci pencarian (misal nama bulan) berada di baris paling atas tabel referensi.',
      'Hitung urutan baris target dari atas tabel (misal baris Target = 2, Realisasi = 3).',
    ],
    pitfall:
      'Pastikan format penulisan bulan di kunci sama persis dengan tabel ("Feb" vs "Februari" akan menghasilkan #N/A).',
    proTip:
      'Jika header dan struktur tabel bisa berbalik arah, XLOOKUP dapat menangani pencarian vertikal maupun horizontal tanpa perlu membedakan V/H.',
    worksheet: {
      sheetName: 'Latihan_HLOOKUP',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [16, 14, 14, 14, 22],
      defaultActiveCell: 'E3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Bulan', isHeader: true },
            B: { value: 'Jan', isHeader: true, align: 'right' },
            C: { value: 'Feb', isHeader: true, align: 'right' },
            D: { value: 'Mar', isHeader: true, align: 'right' },
            E: { value: 'Pilih Bulan (E2)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Target' },
            B: { value: 10000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 12000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 15000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: { value: 'Feb', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Realisasi' },
            B: { value: 9800000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 13400000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: 14800000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            E: {
              value: 13400000,
              isFormula: true,
              formula: '=HLOOKUP(E2,$B$1:$D$3,3,FALSE)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const m = str(g('E2')).toLowerCase();
                if (m === 'jan') return num(g('B3'));
                if (m === 'feb') return num(g('C3'));
                if (m === 'mar') return num(g('D3'));
                return '#N/A';
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'index-match',
    name: 'INDEX + MATCH',
    category: 'Pencarian (Lookup)',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Kombinasi pencari dua arah yang fleksibel: bisa mencari ke kiri dan tahan sisipan kolom.',
    syntax: '=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))',
    syntaxSemicolon: '=INDEX(return_range; MATCH(lookup_value; lookup_range; 0))',
    arguments: [
      { name: 'return_range', required: true, description: 'Kolom tempat hasil yang ingin diambil (boleh di sebelah kiri kolom kunci).' },
      { name: 'lookup_value', required: true, description: 'Nilai kunci yang dicari.' },
      { name: 'lookup_range', required: true, description: 'Kolom tempat kunci berada.' },
      { name: '0', required: true, description: 'Angka 0 di akhir MATCH berarti kecocokan persis (exact match).' },
    ],
    practicalUse:
      'Solusi standar perusahaan saat struktur tabel tidak memungkinkan ID ditaruh di kolom paling kiri, atau ketika file harus tetap kompatibel dengan Excel 2010/2013/2016.',
    stepByStep: [
      'Gunakan MATCH untuk mencari nomor baris posisi kunci: MATCH(E2, $C$2:$C$5, 0).',
      'Masukkan hasil nomor baris tersebut ke dalam INDEX($A$2:$A$5, ...).',
    ],
    pitfall:
      'Pastikan rentang baris INDEX dan MATCH dimulai dan diakhiri pada baris yang sama persis (misal sama-sama baris 2 sampai 5).',
    proTip:
      'INDEX + MATCH juga bisa dibuat 2 dimensi (baris & kolom) dengan menambahkan MATCH kedua untuk nomor kolom.',
    worksheet: {
      sheetName: 'Latihan_INDEX_MATCH',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      colWidths: [18, 16, 12, 4, 14, 22],
      defaultActiveCell: 'F2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Nama Karyawan', isHeader: true },
            B: { value: 'Jabatan', isHeader: true },
            C: { value: 'NIP (Kunci)', isHeader: true },
            D: { value: '' },
            E: { value: 'Cari NIP', isHeader: true },
            F: { value: 'Nama (Lookup ke Kiri)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Arif Budiman', editable: true },
            B: { value: 'Supervisor' },
            C: { value: 'EMP-101' },
            D: { value: '' },
            E: { value: 'EMP-103', editable: true },
            F: {
              value: 'Larasati',
              isFormula: true,
              formula: '=INDEX($A$2:$A$5,MATCH(E2,$C$2:$C$5,0))',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 5; r++) {
                  if (str(g(`C${r}`)).toUpperCase() === key) return g(`A${r}`);
                }
                return '#N/A';
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Beni Kurniawan', editable: true },
            B: { value: 'Staff Gudang' },
            C: { value: 'EMP-102' },
            D: { value: '' },
            E: { value: 'Jabatan:' },
            F: {
              value: 'Analis Data',
              isFormula: true,
              formula: '=INDEX($B$2:$B$5,MATCH(E2,$C$2:$C$5,0))',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 5; r++) {
                  if (str(g(`C${r}`)).toUpperCase() === key) return g(`B${r}`);
                }
                return '#N/A';
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Larasati', editable: true },
            B: { value: 'Analis Data' },
            C: { value: 'EMP-103' },
            D: { value: '' },
            E: { value: '' },
            F: { value: 'Ubah E2: EMP-101 s/d 104' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'Doni Saputra', editable: true },
            B: { value: 'Akuntan' },
            C: { value: 'EMP-104' },
            D: { value: '' },
            E: { value: '' },
            F: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'xlookup',
    name: 'XLOOKUP',
    category: 'Pencarian (Lookup)',
    level: 'Menengah',
    excelVersion: 'Excel 2021 / Microsoft 365',
    tagline: 'Pengganti modern VLOOKUP & HLOOKUP: lebih singkat, aman sisip kolom, dan punya fallback bawaan.',
    syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])',
    syntaxSemicolon: '=XLOOKUP(lookup_value; lookup_array; return_array; [if_not_found])',
    arguments: [
      { name: 'lookup_value', required: true, description: 'Nilai yang dicari.' },
      { name: 'lookup_array', required: true, description: 'Kolom tempat pencarian.' },
      { name: 'return_array', required: true, description: 'Kolom hasil (bisa di kiri, di kanan, atau bahkan beberapa kolom sekaligus!).' },
      { name: 'if_not_found', required: false, description: 'Teks/nilai pengganti jika tidak ketemu, tanpa perlu membungkus dengan IFERROR.' },
    ],
    practicalUse:
      'Menarik data pelanggan, stok, atau tarif secara bersih di Microsoft 365 tanpa menghitung nomor indeks kolom dan tanpa error #N/A yang mengganggu.',
    stepByStep: [
      'Pilih nilai yang dicari (E2), blok kolom kunci (A2:A5), lalu blok kolom hasil (C2:C5).',
      'Tambahkan argumen ke-4 "Tidak Ditemukan" sebagai pengganti IFERROR.',
    ],
    pitfall:
      'File yang memakai XLOOKUP tidak akan terbaca di Excel 2016 ke bawah (muncul _xlfn.XLOOKUP). Jika rekan kerja memakai Excel lama, gunakan INDEX+MATCH.',
    proTip:
      'XLOOKUP bisa mencari dari bawah ke atas (transaksi paling baru) dengan mengisi parameter search_mode = -1 di argumen ke-6.',
    worksheet: {
      sheetName: 'Latihan_XLOOKUP',
      columns: ['A', 'B', 'C', 'D', 'E', 'F'],
      colWidths: [14, 22, 16, 4, 16, 24],
      defaultActiveCell: 'F2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'ID Pelanggan', isHeader: true },
            B: { value: 'Nama Perusahaan', isHeader: true },
            C: { value: 'Tier Diskon', isHeader: true },
            D: { value: '' },
            E: { value: 'Input ID', isHeader: true },
            F: { value: 'Hasil XLOOKUP', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'CUST-01' },
            B: { value: 'PT Maju Jaya', editable: true },
            C: { value: 'Gold (15%)', editable: true },
            D: { value: '' },
            E: { value: 'CUST-02', editable: true },
            F: {
              value: 'CV Berkah Mandiri',
              isFormula: true,
              formula: '=XLOOKUP(E2,$A$2:$A$4,$B$2:$B$4,"Tidak Terdaftar")',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 4; r++) {
                  if (str(g(`A${r}`)).toUpperCase() === key) return g(`B${r}`);
                }
                return 'Tidak Terdaftar';
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'CUST-02' },
            B: { value: 'CV Berkah Mandiri', editable: true },
            C: { value: 'Silver (10%)', editable: true },
            D: { value: '' },
            E: { value: 'Tier:' },
            F: {
              value: 'Silver (10%)',
              isFormula: true,
              formula: '=XLOOKUP(E2,$A$2:$A$4,$C$2:$C$4,"-")',
              compute: (g) => {
                const key = str(g('E2')).toUpperCase();
                for (let r = 2; r <= 4; r++) {
                  if (str(g(`A${r}`)).toUpperCase() === key) return g(`C${r}`);
                }
                return '-';
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'CUST-03' },
            B: { value: 'Toko Sinar Baru', editable: true },
            C: { value: 'Bronze (5%)', editable: true },
            D: { value: '' },
            E: { value: '' },
            F: { value: 'Coba ketik CUST-99 di E2' },
          },
        },
      ],
    },
  },

  // =========================================================
  // 4. TEKS & PEMBERSIHAN DATA
  // =========================================================
  {
    id: 'left-mid-right',
    name: 'LEFT / MID / RIGHT',
    category: 'Teks & Pembersihan',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Memotong dan mengekstrak bagian kode tertentu dari awal, tengah, atau akhir teks.',
    syntax: '=MID(text, start_num, num_chars)',
    syntaxSemicolon: '=MID(text; start_num; num_chars)',
    arguments: [
      { name: 'text', required: true, description: 'Sel berisi teks/kode sumber (misal "JKT-2026-045").' },
      { name: 'start_num', required: true, description: 'Posisi karakter awal pemotongan (khusus MID).' },
      { name: 'num_chars', required: true, description: 'Jumlah karakter yang ingin diambil.' },
    ],
    practicalUse:
      'Memecah kode invoice, mengambil kode wilayah dari plat nomor atau NIK KTP, serta memisahkan tahun produksi dari nomor seri SKU.',
    stepByStep: [
      'Gunakan LEFT(A2, 3) untuk mengambil 3 huruf dari kiri (kode kota).',
      'Gunakan MID(A2, 5, 4) untuk mulai dari karakter ke-5 sebanyak 4 digit (tahun).',
      'Gunakan RIGHT(A2, 3) untuk mengambil 3 digit paling kanan (nomor urut).',
    ],
    pitfall:
      'Hasil dari LEFT/MID/RIGHT selalu berformat Teks meskipun isinya angka. Jika ingin dijumlahkan, kalikan dengan 1 atau bungkus dengan fungsi VALUE(...).',
    proTip:
      'Jika panjang teks tidak seragam, gabungkan LEFT dengan FIND("-", A2)-1 untuk memotong otomatis tepat sebelum tanda strip.',
    worksheet: {
      sheetName: 'Latihan_LEFT_MID_RIGHT',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [20, 14, 14, 14],
      defaultActiveCell: 'C2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Kode Faktur', isHeader: true },
            B: { value: 'Kota (LEFT 3)', isHeader: true },
            C: { value: 'Tahun (MID 5,4)', isHeader: true },
            D: { value: 'Urut (RIGHT 3)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'JKT-2026-084', editable: true },
            B: {
              value: 'JKT',
              isFormula: true,
              formula: '=LEFT(A2,3)',
              compute: (g) => str(g('A2')).slice(0, 3),
            },
            C: {
              value: '2026',
              isFormula: true,
              formula: '=MID(A2,5,4)',
              compute: (g) => str(g('A2')).slice(4, 8),
            },
            D: {
              value: '084',
              isFormula: true,
              formula: '=RIGHT(A2,3)',
              compute: (g) => str(g('A2')).slice(-3),
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'SBY-2026-119', editable: true },
            B: {
              value: 'SBY',
              isFormula: true,
              formula: '=LEFT(A3,3)',
              compute: (g) => str(g('A3')).slice(0, 3),
            },
            C: {
              value: '2026',
              isFormula: true,
              formula: '=MID(A3,5,4)',
              compute: (g) => str(g('A3')).slice(4, 8),
            },
            D: {
              value: '119',
              isFormula: true,
              formula: '=RIGHT(A3,3)',
              compute: (g) => str(g('A3')).slice(-3),
            },
          },
        },
      ],
    },
  },
  {
    id: 'trim-proper',
    name: 'TRIM & PROPER',
    category: 'Teks & Pembersihan',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menghapus spasi ganda berantakan sekaligus merapikan huruf kapital di awal setiap kata.',
    syntax: '=PROPER(TRIM(text))',
    syntaxSemicolon: '=PROPER(TRIM(text))',
    arguments: [
      { name: 'text', required: true, description: 'Sel berisi teks kotor hasil ekspor atau input form.' },
    ],
    practicalUse:
      'Tahap pertama sebelum melakukan VLOOKUP pada daftar nama pelanggan atau karyawan dari Google Form yang sering penuh spasi ganda dan huruf besar/kecil acak.',
    stepByStep: [
      'TRIM membuang semua spasi di depan, di belakang, dan menyisakan maksimal 1 spasi antar kata.',
      'PROPER mengubah setiap awal kata menjadi huruf kapital (Title Case).',
      'Setelah rapi, Copy > Paste Values untuk menimpa data lama.',
    ],
    pitfall:
      'PROPER mengubah singkatan seperti "PT" atau "CV" menjadi "Pt" atau "Cv". Gunakan SUBSTITUTE jika perlu mempertahankan huruf besar singkatan.',
    proTip:
      'Jika data berasal dari copy-paste web yang mengandung baris baru tersembunyi, tambahkan CLEAN: =PROPER(TRIM(CLEAN(A2))).',
    worksheet: {
      sheetName: 'Latihan_TRIM_PROPER',
      columns: ['A', 'B', 'C'],
      colWidths: [28, 24, 24],
      defaultActiveCell: 'C2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Data Mentah Kotor', isHeader: true },
            B: { value: 'Rapikan Spasi (TRIM)', isHeader: true },
            C: { value: 'Kapitalisasi (PROPER+TRIM)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: '  budi   SANTOSO  ', editable: true },
            B: {
              value: 'budi SANTOSO',
              isFormula: true,
              formula: '=TRIM(A2)',
              compute: (g) => String(g('A2')).trim().replace(/\s+/g, ' '),
            },
            C: {
              value: 'Budi Santoso',
              isFormula: true,
              formula: '=PROPER(TRIM(A2))',
              compute: (g) =>
                String(g('A2'))
                  .trim()
                  .replace(/\s+/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'SITI   rahmawati ', editable: true },
            B: {
              value: 'SITI rahmawati',
              isFormula: true,
              formula: '=TRIM(A3)',
              compute: (g) => String(g('A3')).trim().replace(/\s+/g, ' '),
            },
            C: {
              value: 'Siti Rahmawati',
              isFormula: true,
              formula: '=PROPER(TRIM(A3))',
              compute: (g) =>
                String(g('A3'))
                  .trim()
                  .replace(/\s+/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase()),
            },
          },
        },
      ],
    },
  },
  {
    id: 'textjoin',
    name: 'TEXTJOIN & CONCAT',
    category: 'Teks & Pembersihan',
    level: 'Menengah',
    excelVersion: 'Excel 2019+',
    tagline: 'Menggabungkan banyak sel teks sekaligus dengan pemisah otomatis dan mengabaikan sel kosong.',
    syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
    syntaxSemicolon: '=TEXTJOIN(delimiter; ignore_empty; text1; ...)',
    arguments: [
      { name: 'delimiter', required: true, description: 'Karakter pemisah antar teks, misal ", " atau " - ".' },
      { name: 'ignore_empty', required: true, description: 'Isi TRUE agar sel yang kosong tidak menghasilkan pemisah ganda.' },
      { name: 'text1', required: true, description: 'Rentang sel atau beberapa kolom yang ingin digabungkan.' },
    ],
    practicalUse:
      'Menggabungkan kolom Nama Jalan, Kecamatan, Kota, dan Kode Pos menjadi satu alamat pengiriman utuh tanpa koma ganda meski ada kolom yang kosong.',
    stepByStep: [
      'Tentukan pemisah di argumen pertama, misalnya ", ".',
      'Ketik TRUE agar sel kosong otomatis dilewati.',
      'Blok seluruh sel dari kolom A hingga D dalam satu baris (A2:D2).',
    ],
    pitfall:
      'Jika memakai versi Excel lama (<2019), TEXTJOIN belum tersedia. Sebagai gantinya gunakan operator & seperti =A2&", "&B2.',
    proTip:
      'TEXTJOIN sangat ampuh dipasangkan dengan FILTER() untuk menggabungkan beberapa hasil pencarian ke dalam satu sel tunggal.',
    worksheet: {
      sheetName: 'Latihan_TEXTJOIN',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 16, 14, 12, 38],
      defaultActiveCell: 'E2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Jalan', isHeader: true },
            B: { value: 'Kecamatan', isHeader: true },
            C: { value: 'Kota', isHeader: true },
            D: { value: 'Kode Pos', isHeader: true },
            E: { value: 'Alamat Lengkap (TEXTJOIN)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Jl. Sudirman 45', editable: true },
            B: { value: 'Setiabudi', editable: true },
            C: { value: 'Jakarta Selatan', editable: true },
            D: { value: '12930', editable: true },
            E: {
              value: 'Jl. Sudirman 45, Setiabudi, Jakarta Selatan, 12930',
              isFormula: true,
              formula: '=TEXTJOIN(", ",TRUE,A2:D2)',
              compute: (g) =>
                [str(g('A2')), str(g('B2')), str(g('C2')), str(g('D2'))].filter(Boolean).join(', '),
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Jl. Asia Afrika 8', editable: true },
            B: { value: '', editable: true },
            C: { value: 'Bandung', editable: true },
            D: { value: '40111', editable: true },
            E: {
              value: 'Jl. Asia Afrika 8, Bandung, 40111',
              isFormula: true,
              formula: '=TEXTJOIN(", ",TRUE,A3:D3)',
              compute: (g) =>
                [str(g('A3')), str(g('B3')), str(g('C3')), str(g('D3'))].filter(Boolean).join(', '),
            },
          },
        },
      ],
    },
  },
  {
    id: 'find-search',
    name: 'FIND / SEARCH + LEFT',
    category: 'Teks & Pembersihan',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Memisahkan nama depan atau domain email secara dinamis meski panjang teks berbeda-beda.',
    syntax: '=LEFT(text, FIND(" ", text)-1)',
    syntaxSemicolon: '=LEFT(text; FIND(" "; text)-1)',
    arguments: [
      { name: 'find_text', required: true, description: 'Karakter patokan yang dicari posisinya (misal spasi " " atau simbol "@").' },
      { name: 'within_text', required: true, description: 'Sel sumber yang ingin diperiksa.' },
    ],
    practicalUse:
      'Mengambil Username dari alamat email sebelum simbol "@", atau memisahkan Nama Depan dari Nama Lengkap pada database pelanggan.',
    stepByStep: [
      'FIND("@", A2) mencari di posisi huruf keberapa tanda @ berada.',
      'Kurangi 1 agar simbol @ tidak ikut terambil.',
      'Masukkan ke dalam LEFT(A2, FIND("@", A2)-1).',
    ],
    pitfall:
      'FIND membedakan huruf besar dan kecil (case-sensitive), sedangkan SEARCH tidak. Jika teks tidak ditemukan, keduanya memunculkan #VALUE!.',
    proTip:
      'Pada Microsoft 365, Anda juga bisa memakai fungsi baru =TEXTBEFORE(A2,"@") dan =TEXTAFTER(A2,"@") yang jauh lebih ringkas.',
    worksheet: {
      sheetName: 'Latihan_FIND_LEFT',
      columns: ['A', 'B', 'C'],
      colWidths: [28, 18, 22],
      defaultActiveCell: 'B2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Email Kerja', isHeader: true },
            B: { value: 'Username', isHeader: true },
            C: { value: 'Domain Perusahaan', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'rizky.pratama@nusantara.co.id', editable: true },
            B: {
              value: 'rizky.pratama',
              isFormula: true,
              formula: '=LEFT(A2,FIND("@",A2)-1)',
              compute: (g) => {
                const email = str(g('A2'));
                const idx = email.indexOf('@');
                return idx > 0 ? email.slice(0, idx) : '#VALUE!';
              },
            },
            C: {
              value: 'nusantara.co.id',
              isFormula: true,
              formula: '=MID(A2,FIND("@",A2)+1,LEN(A2))',
              compute: (g) => {
                const email = str(g('A2'));
                const idx = email.indexOf('@');
                return idx >= 0 ? email.slice(idx + 1) : '#VALUE!';
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'nadia@kreatifstudio.id', editable: true },
            B: {
              value: 'nadia',
              isFormula: true,
              formula: '=LEFT(A3,FIND("@",A3)-1)',
              compute: (g) => {
                const email = str(g('A3'));
                const idx = email.indexOf('@');
                return idx > 0 ? email.slice(0, idx) : '#VALUE!';
              },
            },
            C: {
              value: 'kreatifstudio.id',
              isFormula: true,
              formula: '=MID(A3,FIND("@",A3)+1,LEN(A3))',
              compute: (g) => {
                const email = str(g('A3'));
                const idx = email.indexOf('@');
                return idx >= 0 ? email.slice(idx + 1) : '#VALUE!';
              },
            },
          },
        },
      ],
    },
  },

  // =========================================================
  // 5. TANGGAL & WAKTU
  // =========================================================
  {
    id: 'datedif',
    name: 'DATEDIF',
    category: 'Tanggal & Waktu',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menghitung selisih tepat dua tanggal dalam satuan tahun, sisa bulan, atau hari (umur & masa kerja).',
    syntax: '=DATEDIF(start_date, end_date, "Y")',
    syntaxSemicolon: '=DATEDIF(start_date; end_date; "Y")',
    arguments: [
      { name: 'start_date', required: true, description: 'Tanggal mulai (misal Tanggal Lahir atau Tanggal Masuk Kerja).' },
      { name: 'end_date', required: true, description: 'Tanggal akhir (bisa diisi fungsi TODAY() untuk tanggal hari ini).' },
      { name: 'unit', required: true, description: '"Y" = tahun penuh, "YM" = sisa bulan setelah tahun, "D" = total hari.' },
    ],
    practicalUse:
      'Wajib bagi HRD untuk menghitung usia karyawan, masa kerja persis (misal "4 Tahun 3 Bulan"), dan mengecek sisa masa kontrak kerja.',
    stepByStep: [
      'Pastikan kedua kolom tanggal benar-benar bertipe Date di Excel (bukan teks biasa).',
      'Gunakan "Y" untuk tahun penuh, dan gabungkan dengan "YM" untuk sisa bulannya.',
    ],
    pitfall:
      'DATEDIF adalah fungsi warisan sehingga tidak muncul di daftar AutoComplete Excel saat Anda mengetik. Ketik lengkap secara manual beserta kurung bukanya.',
    proTip:
      'Gabungkan dengan teks: =DATEDIF(B2,C2,"Y")&" Thn "&DATEDIF(B2,C2,"YM")&" Bln".',
    worksheet: {
      sheetName: 'Latihan_DATEDIF',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 16, 16, 14, 22],
      defaultActiveCell: 'E2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Karyawan', isHeader: true },
            B: { value: 'Tgl Masuk', isHeader: true },
            C: { value: 'Tgl Evaluasi', isHeader: true },
            D: { value: 'Masa (Thn)', isHeader: true, align: 'right' },
            E: { value: 'Lengkap (Thn & Bln)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Bagus Setiawan' },
            B: { value: '2021-04-10', editable: true, inputType: 'date' },
            C: { value: '2026-11-23', editable: true, inputType: 'date' },
            D: {
              value: 5,
              isFormula: true,
              formula: '=DATEDIF(B2,C2,"Y")',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const s = new Date(str(g('B2')));
                const e = new Date(str(g('C2')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return '#NUM!';
                let years = e.getFullYear() - s.getFullYear();
                const mDiff = e.getMonth() - s.getMonth();
                if (mDiff < 0 || (mDiff === 0 && e.getDate() < s.getDate())) years--;
                return years;
              },
            },
            E: {
              value: '5 Thn 7 Bln',
              isFormula: true,
              formula: '=DATEDIF(B2,C2,"Y")&" Thn "&DATEDIF(B2,C2,"YM")&" Bln"',
              compute: (g) => {
                const s = new Date(str(g('B2')));
                const e = new Date(str(g('C2')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return '#NUM!';
                let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
                if (e.getDate() < s.getDate()) months--;
                const y = Math.floor(months / 12);
                const ym = months % 12;
                return `${y} Thn ${ym} Bln`;
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Rika Amalia' },
            B: { value: '2024-08-01', editable: true, inputType: 'date' },
            C: { value: '2026-11-23', editable: true, inputType: 'date' },
            D: {
              value: 2,
              isFormula: true,
              formula: '=DATEDIF(B3,C3,"Y")',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const s = new Date(str(g('B3')));
                const e = new Date(str(g('C3')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return '#NUM!';
                let years = e.getFullYear() - s.getFullYear();
                const mDiff = e.getMonth() - s.getMonth();
                if (mDiff < 0 || (mDiff === 0 && e.getDate() < s.getDate())) years--;
                return years;
              },
            },
            E: {
              value: '2 Thn 3 Bln',
              isFormula: true,
              formula: '=DATEDIF(B3,C3,"Y")&" Thn "&DATEDIF(B3,C3,"YM")&" Bln"',
              compute: (g) => {
                const s = new Date(str(g('B3')));
                const e = new Date(str(g('C3')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return '#NUM!';
                let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
                if (e.getDate() < s.getDate()) months--;
                const y = Math.floor(months / 12);
                const ym = months % 12;
                return `${y} Thn ${ym} Bln`;
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'eomonth',
    name: 'EOMONTH',
    category: 'Tanggal & Waktu',
    level: 'Menengah',
    excelVersion: 'Excel 2007+',
    tagline: 'Menghasilkan tanggal hari terakhir di bulan tertentu (otomatis hitung kabisat & 30/31 hari).',
    syntax: '=EOMONTH(start_date, months)',
    syntaxSemicolon: '=EOMONTH(start_date; months)',
    arguments: [
      { name: 'start_date', required: true, description: 'Tanggal acuan awal.' },
      { name: 'months', required: true, description: '0 untuk akhir bulan yang sama, 1 untuk akhir bulan depan, -1 untuk akhir bulan lalu.' },
    ],
    practicalUse:
      'Menentukan tanggal jatuh tempo invoice akhir bulan, batas tutup buku akuntansi, atau menandai masa berlaku kontrak hingga akhir bulan.',
    stepByStep: [
      'Masukkan tanggal transaksi atau tanggal mulai di argumen pertama.',
      'Isi 0 jika jatuh tempo di akhir bulan berjalan, atau 1 jika akhir bulan berikutnya.',
    ],
    pitfall:
      'Jika hasil sel berupa angka 5 digit seperti 46326, artinya format sel masih General — ubah format sel ke Short Date.',
    proTip:
      'Untuk mendapatkan tanggal 1 bulan berikutnya secara tepat, gunakan =EOMONTH(A2,0)+1.',
    worksheet: {
      sheetName: 'Latihan_EOMONTH',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 16, 14, 20],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'No Invoice', isHeader: true },
            B: { value: 'Tgl Terbit', isHeader: true },
            C: { value: 'Jeda Bulan', isHeader: true, align: 'right' },
            D: { value: 'Jatuh Tempo Akhir Bln', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'INV-2026-01' },
            B: { value: '2026-02-10', editable: true, inputType: 'date' },
            C: { value: 0, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: '2026-02-28',
              isFormula: true,
              formula: '=EOMONTH(B2,C2)',
              compute: (g) => {
                const d = new Date(str(g('B2')));
                if (isNaN(d.getTime())) return '#VALUE!';
                const m = Math.trunc(num(g('C2')));
                const end = new Date(d.getFullYear(), d.getMonth() + m + 1, 0);
                const yyyy = end.getFullYear();
                const mm = String(end.getMonth() + 1).padStart(2, '0');
                const dd = String(end.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'INV-2026-02' },
            B: { value: '2026-03-14', editable: true, inputType: 'date' },
            C: { value: 1, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: {
              value: '2026-04-30',
              isFormula: true,
              formula: '=EOMONTH(B3,C3)',
              compute: (g) => {
                const d = new Date(str(g('B3')));
                if (isNaN(d.getTime())) return '#VALUE!';
                const m = Math.trunc(num(g('C3')));
                const end = new Date(d.getFullYear(), d.getMonth() + m + 1, 0);
                const yyyy = end.getFullYear();
                const mm = String(end.getMonth() + 1).padStart(2, '0');
                const dd = String(end.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'networkdays',
    name: 'NETWORKDAYS',
    category: 'Tanggal & Waktu',
    level: 'Menengah',
    excelVersion: 'Excel 2007+',
    tagline: 'Menghitung jumlah hari kerja efektif (Senin–Jumat) dan otomatis memotong hari libur nasional.',
    syntax: '=NETWORKDAYS(start_date, end_date, [holidays])',
    syntaxSemicolon: '=NETWORKDAYS(start_date; end_date; [holidays])',
    arguments: [
      { name: 'start_date', required: true, description: 'Tanggal mulai proyek atau cuti.' },
      { name: 'end_date', required: true, description: 'Tanggal selesai proyek atau cuti.' },
      { name: 'holidays', required: false, description: 'Rentang daftar tanggal merah / libur nasional (opsional).' },
    ],
    practicalUse:
      'Menghitung durasi SLA pengiriman barang, menghitung hari kerja bersih untuk gaji harian/proyek, atau menghitung hari cuti karyawan tanpa menyertakan Sabtu-Minggu.',
    stepByStep: [
      'Masukkan Tanggal Mulai dan Tanggal Selesai.',
      'Opsional: buat daftar tanggal libur nasional di kolom terpisah lalu blok sebagai argumen ke-3.',
    ],
    pitfall:
      'NETWORKDAYS standar menganggap libur akhir pekan adalah Sabtu & Minggu. Jika kantor masuk hari Sabtu (libur hanya Minggu), gunakan NETWORKDAYS.INTL dengan kode 11.',
    proTip:
      'Untuk menghitung SLA dengan jam kerja atau target tanggal selesai berdasarkan jumlah hari kerja, gunakan fungsi pasangannya: WORKDAY(start_date, days).',
    worksheet: {
      sheetName: 'Latihan_NETWORKDAYS',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [20, 16, 16, 20],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Nama Proyek', isHeader: true },
            B: { value: 'Mulai', isHeader: true },
            C: { value: 'Selesai', isHeader: true },
            D: { value: 'Hari Kerja (Sen-Jum)', isHeader: true, align: 'right' },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Audit Keuangan Q4' },
            B: { value: '2026-11-02', editable: true, inputType: 'date' },
            C: { value: '2026-11-13', editable: true, inputType: 'date' },
            D: {
              value: 10,
              isFormula: true,
              formula: '=NETWORKDAYS(B2,C2)',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const s = new Date(str(g('B2')));
                const e = new Date(str(g('C2')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
                let count = 0;
                const cur = new Date(s);
                while (cur <= e) {
                  const day = cur.getDay();
                  if (day !== 0 && day !== 6) count++;
                  cur.setDate(cur.getDate() + 1);
                }
                return count;
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Migrasi Server' },
            B: { value: '2026-11-16', editable: true, inputType: 'date' },
            C: { value: '2026-11-27', editable: true, inputType: 'date' },
            D: {
              value: 10,
              isFormula: true,
              formula: '=NETWORKDAYS(B3,C3)',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const s = new Date(str(g('B3')));
                const e = new Date(str(g('C3')));
                if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
                let count = 0;
                const cur = new Date(s);
                while (cur <= e) {
                  const day = cur.getDay();
                  if (day !== 0 && day !== 6) count++;
                  cur.setDate(cur.getDate() + 1);
                }
                return count;
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'text-format',
    name: 'TEXT',
    category: 'Tanggal & Waktu',
    level: 'Dasar',
    excelVersion: 'Semua versi Excel',
    tagline: 'Mengubah angka atau tanggal menjadi format teks rapi (nama hari, bulan, atau mata uang dalam kalimat).',
    syntax: '=TEXT(value, format_text)',
    syntaxSemicolon: '=TEXT(value; format_text)',
    arguments: [
      { name: 'value', required: true, description: 'Sel berisi tanggal atau angka.' },
      { name: 'format_text', required: true, description: 'Pola format diapit kutip, misal "dddd, dd mmmm yyyy" atau "#,##0".' },
    ],
    practicalUse:
      'Membuat kalimat surat resmi otomatis seperti "Tagihan sebesar Rp 1.500.000 jatuh tempo pada Senin, 23 November 2026" tanpa angka berubah menjadi kode seri Excel.',
    stepByStep: [
      'Gunakan "dddd" untuk memunculkan nama hari penuh (Senin, Selasa, dst sesuai regional).',
      'Gunakan "#,##0" untuk memunculkan pemisah ribuan saat angka digabung ke kalimat.',
    ],
    pitfall:
      'Output dari TEXT adalah Teks, bukan Angka/Tanggal. Jangan pakai sel hasil TEXT untuk penjumlahan SUM.',
    proTip:
      'Gunakan =TEXT(A2,"0000") untuk mempertahankan angka nol di depan (leading zero) pada nomor kode barang atau nomor antrean.',
    worksheet: {
      sheetName: 'Latihan_TEXT',
      columns: ['A', 'B', 'C'],
      colWidths: [18, 16, 36],
      defaultActiveCell: 'C2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Tanggal', isHeader: true },
            B: { value: 'Nominal (Rp)', isHeader: true, align: 'right' },
            C: { value: 'Ringkasan Kalimat (TEXT)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: '2026-11-23', editable: true, inputType: 'date' },
            B: { value: 2500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: {
              value: 'Tagihan 23 Nov 2026: Rp 2,500,000',
              isFormula: true,
              formula: '="Tagihan "&TEXT(A2,"dd mmm yyyy")&": Rp "&TEXT(B2,"#,##0")',
              compute: (g) => {
                const d = new Date(str(g('A2')));
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const datePart = isNaN(d.getTime())
                  ? str(g('A2'))
                  : `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
                const amt = num(g('B2')).toLocaleString('en-US');
                return `Tagihan ${datePart}: Rp ${amt}`;
              },
            },
          },
        },
      ],
    },
  },

  // =========================================================
  // 6. KEUANGAN & DYNAMIC ARRAY
  // =========================================================
  {
    id: 'pmt',
    name: 'PMT',
    category: 'Keuangan & Array',
    level: 'Menengah',
    excelVersion: 'Semua versi Excel',
    tagline: 'Menghitung besaran cicilan tetap per bulan untuk pinjaman, KPR, atau kredit kendaraan.',
    syntax: '=PMT(rate, nper, pv, [fv], [type])',
    syntaxSemicolon: '=PMT(rate; nper; pv; [fv]; [type])',
    arguments: [
      { name: 'rate', required: true, description: 'Suku bunga PER PERIODE. Jika bunga tahunan 12%, bagi 12 menjadi B2/12!' },
      { name: 'nper', required: true, description: 'Total jumlah kali cicilan (misal 3 tahun = 36 bulan).' },
      { name: 'pv', required: true, description: 'Plafon pinjaman pokok (Present Value). Gunakan tanda minus (-pv) agar hasil cicilan bernilai positif.' },
    ],
    practicalUse:
      'Simulasi angsuran KPR, kredit modal kerja UMKM, atau perhitungan cicilan leasing aset perusahaan.',
    stepByStep: [
      'Bagi bunga tahunan dengan 12 (jika angsuran bulanan).',
      'Kalikan tenor tahun dengan 12 (jika tenor dalam tahun), atau langsung masukkan jumlah bulan.',
      'Masukkan tanda minus di depan Pokok Pinjaman (-B2) agar nilai cicilan positif.',
    ],
    pitfall:
      'Kesalahan paling fatal adalah memasukkan bunga tahunan (misal 10%) tanpa dibagi 12 sementara jangka waktunya 36 bulan. Satuan rate dan nper HARUS sama.',
    proTip:
      'Gunakan PPMT untuk menghitung porsi pokok dan IPMT untuk porsi bunga pada bulan tertentu.',
    worksheet: {
      sheetName: 'Latihan_PMT',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 18, 16, 16, 22],
      defaultActiveCell: 'E2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Paket Kredit', isHeader: true },
            B: { value: 'Pokok Pinjaman', isHeader: true, align: 'right' },
            C: { value: 'Bunga/Thn (%)', isHeader: true, align: 'right' },
            D: { value: 'Tenor (Bulan)', isHeader: true, align: 'right' },
            E: { value: 'Cicilan / Bulan', isHeader: true, align: 'right' },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Modal Usaha' },
            B: { value: 120000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 9.5, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 36, editable: true, inputType: 'number', format: 'number', align: 'right' },
            E: {
              value: 3843952,
              isFormula: true,
              formula: '=PMT((C2/100)/12,D2,-B2)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const pv = num(g('B2'));
                const annualRate = num(g('C2')) / 100;
                const nper = num(g('D2'));
                if (nper <= 0) return 0;
                const r = annualRate / 12;
                if (r === 0) return Math.round(pv / nper);
                const pmt = (pv * r) / (1 - Math.pow(1 + r, -nper));
                return Math.round(pmt);
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Kredit Kendaraan' },
            B: { value: 240000000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: 7.2, editable: true, inputType: 'number', format: 'number', align: 'right' },
            D: { value: 48, editable: true, inputType: 'number', format: 'number', align: 'right' },
            E: {
              value: 5769315,
              isFormula: true,
              formula: '=PMT((C3/100)/12,D3,-B3)',
              format: 'currency',
              align: 'right',
              compute: (g) => {
                const pv = num(g('B3'));
                const annualRate = num(g('C3')) / 100;
                const nper = num(g('D3'));
                if (nper <= 0) return 0;
                const r = annualRate / 12;
                if (r === 0) return Math.round(pv / nper);
                const pmt = (pv * r) / (1 - Math.pow(1 + r, -nper));
                return Math.round(pmt);
              },
            },
          },
        },
      ],
    },
  },
  {
    id: 'filter-array',
    name: 'FILTER (Dynamic Array)',
    category: 'Keuangan & Array',
    level: 'Lanjutan',
    excelVersion: 'Excel 2021 / Microsoft 365',
    tagline: 'Menyaring tabel secara otomatis menjadi daftar baru yang langsung tumpah (spill) tanpa copy-paste.',
    syntax: '=FILTER(array, include, [if_empty])',
    syntaxSemicolon: '=FILTER(array; include; [if_empty])',
    arguments: [
      { name: 'array', required: true, description: 'Seluruh rentang tabel yang ingin disaring.' },
      { name: 'include', required: true, description: 'Kondisi syarat, misal B2:B6="Jakarta" atau (B2:B6="Jakarta")*(C2:C6>5000000).' },
      { name: 'if_empty', required: false, description: 'Teks jika tidak ada baris yang cocok, misal "Tidak Ada Data".' },
    ],
    practicalUse:
      'Membuat dashboard mini interaktif: ketika memilih nama kota atau status di dropdown, daftar transaksi di bawahnya langsung berubah seketika.',
    stepByStep: [
      'Siapkan area kosong di bawah sel rumus karena hasilnya bisa terdiri dari beberapa baris (Spill).',
      'Untuk multi-syarat DAN, kalikan kondisinya dengan tanda bintang: (B2:B6=E2)*(C2:C6>=1000000).',
    ],
    pitfall:
      'Error #SPILL! muncul jika ada sel berisi teks/angka yang menghalangi area di bawah rumus FILTER. Kosongkan area di bawahnya.',
    proTip:
      'Bungkus FILTER dengan SORT() agar hasil saringannya langsung terurut dari nilai terbesar ke terkecil!',
    worksheet: {
      sheetName: 'Latihan_FILTER',
      columns: ['A', 'B', 'C', 'D', 'E'],
      colWidths: [18, 16, 18, 4, 28],
      defaultActiveCell: 'E3',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Pelanggan', isHeader: true },
            B: { value: 'Kota', isHeader: true },
            C: { value: 'Nilai Order', isHeader: true, align: 'right' },
            D: { value: '' },
            E: { value: 'Filter Kota (E2)', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Toko Jaya' },
            B: { value: 'Surabaya', editable: true },
            C: { value: 4500000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: 'Surabaya', editable: true },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'PT Prima' },
            B: { value: 'Jakarta', editable: true },
            C: { value: 9200000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: {
              value: 'Toko Jaya, CV Sentosa',
              isFormula: true,
              formula: '=TEXTJOIN(", ",TRUE,FILTER(A2:A5,B2:B5=E2,"Kosong"))',
              compute: (g) => {
                const target = str(g('E2')).toLowerCase();
                const matches: string[] = [];
                for (let r = 2; r <= 5; r++) {
                  if (str(g(`B${r}`)).toLowerCase() === target) matches.push(str(g(`A${r}`)));
                }
                return matches.length > 0 ? matches.join(', ') : 'Kosong';
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'CV Sentosa' },
            B: { value: 'Surabaya', editable: true },
            C: { value: 6800000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: 'Hasil cocok digabung ke E3' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'UD Makmur' },
            B: { value: 'Bandung', editable: true },
            C: { value: 3100000, editable: true, inputType: 'number', format: 'currency', align: 'right' },
            D: { value: '' },
            E: { value: '' },
          },
        },
      ],
    },
  },
  {
    id: 'unique-sort',
    name: 'UNIQUE & SORT',
    category: 'Keuangan & Array',
    level: 'Lanjutan',
    excelVersion: 'Excel 2021 / Microsoft 365',
    tagline: 'Mengekstrak daftar unik tanpa duplikat dan mengurutkannya otomatis secara dinamis.',
    syntax: '=SORT(UNIQUE(range))',
    syntaxSemicolon: '=SORT(UNIQUE(range))',
    arguments: [
      { name: 'range', required: true, description: 'Kolom data mentah yang memiliki banyak nama berulang.' },
    ],
    practicalUse:
      'Membuat daftar cabang, daftar produk, atau daftar sales unik secara otomatis sebagai sumber Dropdown Validasi Data dan tabel rekap SUMIFS.',
    stepByStep: [
      'Ketik =UNIQUE(A2:A6) di sel kosong untuk menghasilkan daftar unik.',
      'Bungkus dengan SORT(...) agar daftar unik langsung urut abjad A-Z.',
      'Hitung jumlah item unik dengan =COUNTA(UNIQUE(A2:A6)).',
    ],
    pitfall:
      'Jika ada dua penulisan sedikit berbeda ("Jakarta" dan "Jakarta "), UNIQUE menganggapnya dua nilai berbeda. Bersihkan spasi dulu dengan TRIM.',
    proTip:
      'Referensikan sel spill dengan tanda pagar (#), misal =SUMIF(A2:A6, D2#, B2:B6) agar tabel rekap Anda otomatis memanjang saat ada cabang baru.',
    worksheet: {
      sheetName: 'Latihan_UNIQUE',
      columns: ['A', 'B', 'C', 'D'],
      colWidths: [18, 16, 4, 26],
      defaultActiveCell: 'D2',
      rows: [
        {
          rowNum: 1,
          cells: {
            A: { value: 'Cabang Transaksi', isHeader: true },
            B: { value: 'Nominal', isHeader: true, align: 'right' },
            C: { value: '' },
            D: { value: 'Daftar Unik & Urut', isHeader: true },
          },
        },
        {
          rowNum: 2,
          cells: {
            A: { value: 'Surabaya', editable: true },
            B: { value: 1200000, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: '' },
            D: {
              value: 'Bandung, Jakarta, Surabaya',
              isFormula: true,
              formula: '=TEXTJOIN(", ",TRUE,SORT(UNIQUE(A2:A6)))',
              compute: (g) => {
                const set = new Set<string>();
                for (let r = 2; r <= 6; r++) {
                  const val = str(g(`A${r}`));
                  if (val) set.add(val);
                }
                return Array.from(set).sort().join(', ');
              },
            },
          },
        },
        {
          rowNum: 3,
          cells: {
            A: { value: 'Jakarta', editable: true },
            B: { value: 2500000, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: '' },
            D: {
              value: 3,
              isFormula: true,
              formula: '=COUNTA(UNIQUE(A2:A6))',
              format: 'number',
              align: 'right',
              compute: (g) => {
                const set = new Set<string>();
                for (let r = 2; r <= 6; r++) {
                  const val = str(g(`A${r}`));
                  if (val) set.add(val.toLowerCase());
                }
                return set.size;
              },
            },
          },
        },
        {
          rowNum: 4,
          cells: {
            A: { value: 'Bandung', editable: true },
            B: { value: 900000, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: '' },
            D: { value: 'D3: Jumlah cabang unik' },
          },
        },
        {
          rowNum: 5,
          cells: {
            A: { value: 'Jakarta', editable: true },
            B: { value: 3100000, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: '' },
            D: { value: '' },
          },
        },
        {
          rowNum: 6,
          cells: {
            A: { value: 'Surabaya', editable: true },
            B: { value: 1750000, inputType: 'number', format: 'currency', align: 'right' },
            C: { value: '' },
            D: { value: '' },
          },
        },
      ],
    },
  },
];
