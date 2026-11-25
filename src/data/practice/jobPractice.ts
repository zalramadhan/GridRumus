import { JobPracticeRole } from '../../types/excel';

export const JOB_PRACTICE_ROLES: JobPracticeRole[] = [
  {
    id: 'job-admin-produksi',
    roleTitle: 'Admin Produksi & PPIC',
    department: 'Manufaktur & Pabrik',
    summary:
      'Studi kasus harian lantai produksi: rekap output per shift, keputusan QC reject, rasio efisiensi mesin, pencarian BOM material, dan audit keterlambatan Work Order.',
    focusFormulas: ['SUMIFS', 'IF', 'ROUND', 'VLOOKUP', 'COUNTIF'],
    questions: [
      {
        id: 'job-prod-1',
        title: 'Soal 1: Total Output Shift Pagi yang Lolos QC',
        instruction:
          'Di sel D6, hitung total Output (Unit) dari D2:D5 khusus Shift "Pagi" (kolom B) dengan Status QC "Lolos" (kolom C) menggunakan SUMIFS.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Mesin', isHeader: true },
              B: { value: 'Shift', isHeader: true },
              C: { value: 'Status QC', isHeader: true },
              D: { value: 'Output (Unit)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'M-01' },
              B: { value: 'Pagi' },
              C: { value: 'Lolos' },
              D: { value: 420, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'M-02' },
              B: { value: 'Malam' },
              C: { value: 'Lolos' },
              D: { value: 380, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'M-03' },
              B: { value: 'Pagi' },
              C: { value: 'Hold' },
              D: { value: 150, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'M-04' },
              B: { value: 'Pagi' },
              C: { value: 'Lolos' },
              D: { value: 510, align: 'right' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: '' },
              C: { value: 'Total Pagi Lolos', isHeader: true },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D6',
        expectedResult: 930,
        acceptedFormulas: [
          '=SUMIFS(D2:D5,B2:B5,"Pagi",C2:C5,"Lolos")',
          '=SUMIFS(D2:D5,C2:C5,"Lolos",B2:B5,"Pagi")',
        ],
        hint: 'Urutan SUMIFS: =SUMIFS(rentang_jumlah, rentang_kriteria1, kriteria1, rentang_kriteria2, kriteria2).',
        explanation:
          '=SUMIFS(D2:D5,B2:B5,"Pagi",C2:C5,"Lolos") menjumlahkan 420 + 510 = 930 unit.',
      },
      {
        id: 'job-prod-2',
        title: 'Soal 2: Keputusan QC Batch Berdasarkan Tingkat Reject',
        instruction:
          'Di sel D2, jika Reject (%) di C2 lebih dari 0.05 (5%), tampilkan "Rework", selain itu tampilkan "Lolos" menggunakan IF.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Batch', isHeader: true },
              B: { value: 'Qty Cek', isHeader: true, align: 'right' },
              C: { value: 'Reject (%)', isHeader: true, align: 'right' },
              D: { value: 'Keputusan QC', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'B-104' },
              B: { value: 500, align: 'right' },
              C: { value: 0.07, align: 'right' },
              D: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'Rework',
        acceptedFormulas: [
          '=IF(C2>0.05,"Rework","Lolos")',
          '=IF(C2>5%,"Rework","Lolos")',
          '=IF(C2<=0.05,"Lolos","Rework")',
          '=IF(C2<=5%,"Lolos","Rework")',
        ],
        hint: 'Gunakan =IF(C2>0.05,"Rework","Lolos").',
        explanation:
          'Karena 0.07 (7%) > 0.05 (5%), rumus mengembalikan keputusan "Rework".',
      },
      {
        id: 'job-prod-3',
        title: 'Soal 3: Rasio Efisiensi Line Dibulatkan 1 Desimal',
        instruction:
          'Di sel D2, hitung persentase efisiensi (B2/C2)*100 lalu bulatkan hingga 1 angka di belakang koma memakai ROUND.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Line', isHeader: true },
              B: { value: 'Aktual', isHeader: true, align: 'right' },
              C: { value: 'Target', isHeader: true, align: 'right' },
              D: { value: 'Efisiensi (%)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Line A' },
              B: { value: 875, align: 'right' },
              C: { value: 900, align: 'right' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 97.2,
        acceptedFormulas: [
          '=ROUND((B2/C2)*100,1)',
          '=ROUND(B2/C2*100,1)',
          '=ROUND(100*B2/C2,1)',
        ],
        hint: 'Format: =ROUND((B2/C2)*100, 1).',
        explanation:
          '875/900 * 100 = 97,222..., dibulatkan 1 desimal oleh ROUND menjadi 97,2.',
      },
      {
        id: 'job-prod-4',
        title: 'Soal 4: Ambil Nama Bahan Baku dari Master BOM',
        instruction:
          'Di sel E2, cari Nama Bahan di tabel A2:C4 berdasarkan kode material di D2 menggunakan VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Kode', isHeader: true },
              B: { value: 'Nama Bahan', isHeader: true },
              C: { value: 'Satuan', isHeader: true },
              D: { value: 'Cari Kode', isHeader: true },
              E: { value: 'Hasil Bahan', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'RM-01' },
              B: { value: 'Resin PP' },
              C: { value: 'Kg' },
              D: { value: 'RM-02' },
              E: { value: '?', isTarget: true },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'RM-02' },
              B: { value: 'Pigmen Biru' },
              C: { value: 'Kg' },
              D: { value: '' },
              E: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'RM-03' },
              B: { value: 'Karton Box' },
              C: { value: 'Pcs' },
              D: { value: '' },
              E: { value: '' },
            },
          },
        ],
        targetCell: 'E2',
        expectedResult: 'Pigmen Biru',
        acceptedFormulas: [
          '=VLOOKUP(D2,A2:C4,2,FALSE)',
          '=VLOOKUP(D2,A2:B4,2,FALSE)',
          '=XLOOKUP(D2,A2:A4,B2:B4)',
        ],
        hint: 'Nama Bahan berada di kolom ke-2 pada tabel referensi A2:C4.',
        explanation:
          '=VLOOKUP(D2,A2:C4,2,FALSE) mencari RM-02 dan mengambil "Pigmen Biru".',
      },
      {
        id: 'job-prod-5',
        title: 'Soal 5: Hitung Jumlah Work Order Terlambat',
        instruction:
          'Di sel C6, hitung berapa banyak Work Order di C2:C5 yang berstatus "Terlambat" memakai COUNTIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'No WO', isHeader: true },
              B: { value: 'Line', isHeader: true },
              C: { value: 'Status Jadwal', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'WO-21' },
              B: { value: 'Line 1' },
              C: { value: 'Tepat Waktu' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'WO-22' },
              B: { value: 'Line 2' },
              C: { value: 'Terlambat' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'WO-23' },
              B: { value: 'Line 1' },
              C: { value: 'Terlambat' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'WO-24' },
              B: { value: 'Line 3' },
              C: { value: 'Tepat Waktu' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: 'Total Terlambat', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C6',
        expectedResult: 2,
        acceptedFormulas: ['=COUNTIF(C2:C5,"Terlambat")'],
        hint: 'Format: =COUNTIF(C2:C5,"Terlambat").',
        explanation:
          '=COUNTIF(C2:C5,"Terlambat") menemukan 2 Work Order yang melewati tenggat.',
      },
    ],
  },
  {
    id: 'job-admin-kantor',
    roleTitle: 'Admin Kantor & Umum',
    department: 'Administrasi & Operasional',
    summary:
      'Tugas administrasi perkantoran: rekap presensi divisi, membersihkan teks nama tamu/karyawan, menghitung masa kerja, mencari ruang rapat, dan rekap klaim operasional.',
    focusFormulas: ['COUNTIFS', 'PROPER', 'TRIM', 'DATEDIF', 'SUMIFS'],
    questions: [
      {
        id: 'job-kantor-1',
        title: 'Soal 1: Hitung Karyawan Operasional yang Hadir Tepat Waktu',
        instruction:
          'Di sel C6, hitung jumlah karyawan dari Divisi "Operasional" (B2:B5) dengan Kehadiran "Tepat Waktu" (C2:C5) menggunakan COUNTIFS.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama', isHeader: true },
              B: { value: 'Divisi', isHeader: true },
              C: { value: 'Kehadiran', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Rina' },
              B: { value: 'Operasional' },
              C: { value: 'Tepat Waktu' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Budi' },
              B: { value: 'Operasional' },
              C: { value: 'Terlambat' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Dina' },
              B: { value: 'Marketing' },
              C: { value: 'Tepat Waktu' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'Agus' },
              B: { value: 'Operasional' },
              C: { value: 'Tepat Waktu' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: 'Op. Tepat Waktu', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C6',
        expectedResult: 2,
        acceptedFormulas: [
          '=COUNTIFS(B2:B5,"Operasional",C2:C5,"Tepat Waktu")',
          '=COUNTIFS(C2:C5,"Tepat Waktu",B2:B5,"Operasional")',
        ],
        hint: 'Masukkan dua pasangan rentang dan kriteria pada COUNTIFS.',
        explanation:
          'Hanya Rina dan Agus yang memenuhi kedua syarat (Operasional + Tepat Waktu), sehingga hasilnya 2.',
      },
      {
        id: 'job-kantor-2',
        title: 'Soal 2: Rapikan Spasi Ganda & Kapitalisasi Nama Tamu',
        instruction:
          'Di sel B2, hapus spasi berlebih dan ubah huruf awal tiap kata di sel A2 menjadi kapital menggunakan gabungan PROPER dan TRIM.',
        columns: ['A', 'B'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama Mentah', isHeader: true },
              B: { value: 'Nama Rapi', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: '  siti   rahma  ' },
              B: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'B2',
        expectedResult: 'Siti Rahma',
        acceptedFormulas: ['=PROPER(TRIM(A2))', '=TRIM(PROPER(A2))'],
        hint: 'Bungkus TRIM(A2) di dalam PROPER(...).',
        explanation:
          '=PROPER(TRIM(A2)) membersihkan spasi ganda lalu merapikan kapital menjadi "Siti Rahma".',
      },
      {
        id: 'job-kantor-3',
        title: 'Soal 3: Hitung Masa Kerja Karyawan dalam Tahun Penuh',
        instruction:
          'Di sel D2, hitung selisih tahun penuh antara Tgl Masuk (B2) dan Tgl Evaluasi (C2) memakai DATEDIF.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Karyawan', isHeader: true },
              B: { value: 'Tgl Masuk', isHeader: true },
              C: { value: 'Tgl Evaluasi', isHeader: true },
              D: { value: 'Masa Kerja (Thn)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Fajar' },
              B: { value: '2021-03-10' },
              C: { value: '2026-11-24' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 5,
        acceptedFormulas: ['=DATEDIF(B2,C2,"Y")'],
        hint: 'Gunakan unit "Y" pada argumen ketiga DATEDIF.',
        explanation:
          '=DATEDIF(B2,C2,"Y") menghitung masa kerja penuh dari Maret 2021 hingga November 2026 = 5 tahun.',
      },
      {
        id: 'job-kantor-4',
        title: 'Soal 4: Cari Nama Ruang Rapat dari Kode Acara',
        instruction:
          'Di sel D2, ambil nama ruangan dari tabel A2:B4 berdasarkan kode di sel C2 menggunakan VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Kode', isHeader: true },
              B: { value: 'Ruangan', isHeader: true },
              C: { value: 'Cari Kode', isHeader: true },
              D: { value: 'Lokasi', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'EV-01' },
              B: { value: 'Aula Lt. 2' },
              C: { value: 'EV-03' },
              D: { value: '?', isTarget: true },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'EV-02' },
              B: { value: 'R. Rapat Merapi' },
              C: { value: '' },
              D: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'EV-03' },
              B: { value: 'R. Rapat Bromo' },
              C: { value: '' },
              D: { value: '' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'R. Rapat Bromo',
        acceptedFormulas: ['=VLOOKUP(C2,A2:B4,2,FALSE)', '=XLOOKUP(C2,A2:A4,B2:B4)'],
        hint: 'Gunakan pencarian persis (FALSE / 0) pada VLOOKUP.',
        explanation:
          '=VLOOKUP(C2,A2:B4,2,FALSE) mencocokkan EV-03 dan mengembalikan "R. Rapat Bromo".',
      },
      {
        id: 'job-kantor-5',
        title: 'Soal 5: Rekap Klaim Reimbursement Disetujui Divisi Umum',
        instruction:
          'Di sel D5, jumlahkan Nominal (D2:D4) khusus Divisi "Umum" (B2:B4) yang Status-nya "Disetujui" (C2:C4) memakai SUMIFS.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Pemohon', isHeader: true },
              B: { value: 'Divisi', isHeader: true },
              C: { value: 'Status', isHeader: true },
              D: { value: 'Nominal (Rp)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Nadia' },
              B: { value: 'Umum' },
              C: { value: 'Disetujui' },
              D: { value: 350000, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Riko' },
              B: { value: 'Umum' },
              C: { value: 'Ditolak' },
              D: { value: 200000, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Tania' },
              B: { value: 'Umum' },
              C: { value: 'Disetujui' },
              D: { value: 450000, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: '' },
              B: { value: '' },
              C: { value: 'Total Disetujui', isHeader: true },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D5',
        expectedResult: 800000,
        acceptedFormulas: [
          '=SUMIFS(D2:D4,B2:B4,"Umum",C2:C4,"Disetujui")',
          '=SUMIFS(D2:D4,C2:C4,"Disetujui",B2:B4,"Umum")',
        ],
        hint: 'Sertakan rentang jumlah D2:D4 di argumen pertama SUMIFS.',
        explanation:
          'Klaim Nadia (350.000) dan Tania (450.000) berstatus Disetujui, sehingga totalnya 800.000.',
      },
    ],
  },
  {
    id: 'job-akunting-finance',
    roleTitle: 'Akunting & Finance',
    department: 'Keuangan & Pembukuan',
    summary:
      'Simulasi kerja tim finance & accounting: menghitung hutang vendor per status, klasifikasi aging piutang, mencegah #DIV/0! pada margin, cicilan pinjaman PMT, dan lookup kode COA.',
    focusFormulas: ['SUMIFS', 'IFS', 'IFERROR', 'PMT', 'VLOOKUP'],
    questions: [
      {
        id: 'job-fin-1',
        title: 'Soal 1: Total Tagihan Belum Lunas ke PT Maju',
        instruction:
          'Di sel D6, jumlahkan Nilai invoice (D2:D5) untuk Vendor "PT Maju" (B2:B5) dengan Status "Belum Lunas" (C2:C5) memakai SUMIFS.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'No Inv', isHeader: true },
              B: { value: 'Vendor', isHeader: true },
              C: { value: 'Status', isHeader: true },
              D: { value: 'Nilai (Rp)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'INV-01' },
              B: { value: 'PT Maju' },
              C: { value: 'Belum Lunas' },
              D: { value: 5500000, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'INV-02' },
              B: { value: 'PT Maju' },
              C: { value: 'Lunas' },
              D: { value: 3000000, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'INV-03' },
              B: { value: 'CV Karya' },
              C: { value: 'Belum Lunas' },
              D: { value: 2000000, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'INV-04' },
              B: { value: 'PT Maju' },
              C: { value: 'Belum Lunas' },
              D: { value: 4500000, align: 'right' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: '' },
              C: { value: 'Hutang PT Maju', isHeader: true },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D6',
        expectedResult: 10000000,
        acceptedFormulas: [
          '=SUMIFS(D2:D5,B2:B5,"PT Maju",C2:C5,"Belum Lunas")',
          '=SUMIFS(D2:D5,C2:C5,"Belum Lunas",B2:B5,"PT Maju")',
        ],
        hint: 'Gunakan dua kriteria: Vendor="PT Maju" dan Status="Belum Lunas".',
        explanation:
          'INV-01 (5.500.000) + INV-04 (4.500.000) menghasilkan total kewajiban 10.000.000.',
      },
      {
        id: 'job-fin-2',
        title: 'Soal 2: Klasifikasi Umur Piutang (Aging Schedule)',
        instruction:
          'Di sel C2, tentukan kategori aging berdasarkan Telat (Hari) di B2: >60 hari = "Macet", >30 hari = "Perhatian", selainnya = "Lancar" (pakai IFS atau IF bertingkat).',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Faktur', isHeader: true },
              B: { value: 'Telat (Hari)', isHeader: true, align: 'right' },
              C: { value: 'Kategori Aging', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'FJ-209' },
              B: { value: 45, align: 'right' },
              C: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'C2',
        expectedResult: 'Perhatian',
        acceptedFormulas: [
          '=IFS(B2>60,"Macet",B2>30,"Perhatian",TRUE,"Lancar")',
          '=IF(B2>60,"Macet",IF(B2>30,"Perhatian","Lancar"))',
        ],
        hint: 'Cek kondisi paling tinggi terlebih dahulu: B2>60 baru B2>30.',
        explanation:
          'Karena 45 hari tidak >60 tetapi >30, kategori piutang otomatis menjadi "Perhatian".',
      },
      {
        id: 'job-fin-3',
        title: 'Soal 3: Amankan Rasio Margin dari Error Pembagian Nol',
        instruction:
          'Di sel D2, hitung rasio margin B2/C2 namun tampilkan angka 0 apabila terjadi error #DIV/0! menggunakan IFERROR.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Produk', isHeader: true },
              B: { value: 'Laba', isHeader: true, align: 'right' },
              C: { value: 'Omzet', isHeader: true, align: 'right' },
              D: { value: 'Margin', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Paket Baru' },
              B: { value: 0, align: 'right' },
              C: { value: 0, align: 'right' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 0,
        acceptedFormulas: ['=IFERROR(B2/C2,0)'],
        hint: 'Bungkus pembagian B2/C2 dengan =IFERROR(B2/C2, 0).',
        explanation:
          '=IFERROR(B2/C2,0) mencegah laporan keuangan rusak akibat #DIV/0! saat omzet masih nol.',
      },
      {
        id: 'job-fin-4',
        title: 'Soal 4: Hitung Cicilan Bulanan Pinjaman Modal Kerja',
        instruction:
          'Di sel D2, hitung cicilan bulanan bernilai positif menggunakan PMT dengan bunga tahunan A2 (bagi 12), tenor B2 bulan, dan pinjaman C2 (gunakan -C2 agar hasilnya positif).',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Bunga/Thn', isHeader: true, align: 'right' },
              B: { value: 'Tenor (Bln)', isHeader: true, align: 'right' },
              C: { value: 'Pinjaman', isHeader: true, align: 'right' },
              D: { value: 'Cicilan/Bln', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 0.12, align: 'right' },
              B: { value: 12, align: 'right' },
              C: { value: 12000000, align: 'right' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 1066185,
        acceptedFormulas: ['=PMT(A2/12,B2,-C2)', '=-PMT(A2/12,B2,C2)'],
        hint: 'Format: =PMT(A2/12, B2, -C2).',
        explanation:
          'Bunga bulanan 1% (12%/12) selama 12 bulan untuk Rp12 juta menghasilkan cicilan sekitar Rp1.066.185/bulan.',
      },
      {
        id: 'job-fin-5',
        title: 'Soal 5: Ambil Nama Akun Buku Besar Berdasarkan Kode COA',
        instruction:
          'Di sel D2, tampilkan Nama Akun dari daftar A2:B4 berdasarkan Kode COA di C2 menggunakan VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Kode COA', isHeader: true },
              B: { value: 'Nama Akun', isHeader: true },
              C: { value: 'Cari COA', isHeader: true },
              D: { value: 'Nama Akun', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 1101 },
              B: { value: 'Kas Besar' },
              C: { value: 5101 },
              D: { value: '?', isTarget: true },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 2101 },
              B: { value: 'Hutang Usaha' },
              C: { value: '' },
              D: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 5101 },
              B: { value: 'Beban Gaji' },
              C: { value: '' },
              D: { value: '' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'Beban Gaji',
        acceptedFormulas: ['=VLOOKUP(C2,A2:B4,2,FALSE)', '=XLOOKUP(C2,A2:A4,B2:B4)'],
        hint: 'Gunakan pencarian persis (FALSE) pada kolom ke-2.',
        explanation:
          'Kode akun 5101 dipetakan ke "Beban Gaji" secara otomatis.',
      },
    ],
  },
  {
    id: 'job-admin-gudang',
    roleTitle: 'Admin Gudang & Logistik',
    department: 'Warehouse & Inventory',
    summary:
      'Operasional gudang sehari-hari: peringatan stok menipis, total pengiriman per cabang gudang, pembuatan label rak otomatis, cek harga SKU, dan hitung item butuh restock.',
    focusFormulas: ['IF', 'SUMIF', 'CONCAT', 'VLOOKUP', 'COUNTIF'],
    questions: [
      {
        id: 'job-gudang-1',
        title: 'Soal 1: Peringatan Stok Menipis Otomatis',
        instruction:
          'Di sel D2, jika Stok (B2) lebih kecil dari Min Stok (C2), tampilkan "Restock", selainnya tampilkan "Aman".',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'SKU', isHeader: true },
              B: { value: 'Stok', isHeader: true, align: 'right' },
              C: { value: 'Min Stok', isHeader: true, align: 'right' },
              D: { value: 'Status', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'SKU-09' },
              B: { value: 12, align: 'right' },
              C: { value: 20, align: 'right' },
              D: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'Restock',
        acceptedFormulas: ['=IF(B2<C2,"Restock","Aman")', '=IF(B2>=C2,"Aman","Restock")'],
        hint: 'Bandingkan B2 < C2 di dalam fungsi IF.',
        explanation:
          'Stok saat ini (12) berada di bawah batas aman (20), sehingga status menjadi "Restock".',
      },
      {
        id: 'job-gudang-2',
        title: 'Soal 2: Total Barang Keluar dari Gudang Surabaya',
        instruction:
          'Di sel C5, hitung total Qty Keluar (C2:C4) khusus untuk Gudang "Surabaya" (B2:B4) memakai SUMIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Surat Jalan', isHeader: true },
              B: { value: 'Gudang', isHeader: true },
              C: { value: 'Qty Keluar', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'SJ-01' },
              B: { value: 'Surabaya' },
              C: { value: 60, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'SJ-02' },
              B: { value: 'Jakarta' },
              C: { value: 45, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'SJ-03' },
              B: { value: 'Surabaya' },
              C: { value: 90, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: '' },
              B: { value: 'Total Surabaya', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C5',
        expectedResult: 150,
        acceptedFormulas: ['=SUMIF(B2:B4,"Surabaya",C2:C4)'],
        hint: 'Format SUMIF: =SUMIF(rentang_gudang, "Surabaya", rentang_qty).',
        explanation:
          'Pengiriman dari Surabaya sebanyak 60 + 90 = 150 unit.',
      },
      {
        id: 'job-gudang-3',
        title: 'Soal 3: Buat Kode Label Rak Otomatis',
        instruction:
          'Di sel C2, gabungkan Zona (A2) dan No Rak (B2) dengan tanda hubung "-" agar menghasilkan "Z1-R04" (gunakan CONCAT, TEXTJOIN, atau operator &).',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Zona', isHeader: true },
              B: { value: 'No Rak', isHeader: true },
              C: { value: 'Label Rak', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Z1' },
              B: { value: 'R04' },
              C: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'C2',
        expectedResult: 'Z1-R04',
        acceptedFormulas: [
          '=CONCAT(A2,"-",B2)',
          '=CONCATENATE(A2,"-",B2)',
          '=TEXTJOIN("-",TRUE,A2,B2)',
          '=A2&"-"&B2',
        ],
        hint: 'Contoh paling ringkas: =CONCAT(A2,"-",B2) atau =A2&"-"&B2.',
        explanation:
          'Fungsi penggabungan teks menyatukan kode zona dan nomor rak menjadi satu identitas lokasi rak.',
      },
      {
        id: 'job-gudang-4',
        title: 'Soal 4: Ambil Harga Satuan Barang dari Master SKU',
        instruction:
          'Di sel E2, ambil Harga barang (kolom ke-3 pada A2:C4) untuk SKU yang tertulis di sel D2 memakai VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D', 'E'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'SKU', isHeader: true },
              B: { value: 'Barang', isHeader: true },
              C: { value: 'Harga', isHeader: true, align: 'right' },
              D: { value: 'Cek SKU', isHeader: true },
              E: { value: 'Harga', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'BRG-1' },
              B: { value: 'Lakban Bening' },
              C: { value: 12000, align: 'right' },
              D: { value: 'BRG-3' },
              E: { value: '?', isTarget: true, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'BRG-2' },
              B: { value: 'Bubble Wrap' },
              C: { value: 45000, align: 'right' },
              D: { value: '' },
              E: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'BRG-3' },
              B: { value: 'Kardus Besar' },
              C: { value: 18500, align: 'right' },
              D: { value: '' },
              E: { value: '' },
            },
          },
        ],
        targetCell: 'E2',
        expectedResult: 18500,
        acceptedFormulas: ['=VLOOKUP(D2,A2:C4,3,FALSE)', '=XLOOKUP(D2,A2:A4,C2:C4)'],
        hint: 'Harga berada di kolom ke-3 dari tabel A2:C4.',
        explanation:
          '=VLOOKUP(D2,A2:C4,3,FALSE) mengambil harga BRG-3 sebesar 18.500.',
      },
      {
        id: 'job-gudang-5',
        title: 'Soal 5: Hitung Jumlah Item Berstatus Restock',
        instruction:
          'Di sel C6, hitung berapa banyak SKU di C2:C5 yang berstatus "Restock" memakai COUNTIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'SKU', isHeader: true },
              B: { value: 'Stok', isHeader: true, align: 'right' },
              C: { value: 'Status', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'SKU-1' },
              B: { value: 5, align: 'right' },
              C: { value: 'Restock' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'SKU-2' },
              B: { value: 80, align: 'right' },
              C: { value: 'Aman' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'SKU-3' },
              B: { value: 8, align: 'right' },
              C: { value: 'Restock' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'SKU-4' },
              B: { value: 3, align: 'right' },
              C: { value: 'Restock' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: 'Perlu Restock', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C6',
        expectedResult: 3,
        acceptedFormulas: ['=COUNTIF(C2:C5,"Restock")'],
        hint: 'Hitung teks "Restock" pada C2:C5 dengan COUNTIF.',
        explanation:
          'Ada 3 SKU (SKU-1, SKU-3, SKU-4) yang perlu segera dipesan ulang.',
      },
    ],
  },
  {
    id: 'job-sales-marketing',
    roleTitle: 'Sales & Marketing',
    department: 'Penjualan & Komersial',
    summary:
      'Analisis kinerja penjualan: total omzet per wilayah, penentuan tier bonus sales, rata-rata deal closing, ekstrak kode promo campaign, dan lookup supervisor area.',
    focusFormulas: ['SUMIF', 'IFS', 'AVERAGEIF', 'LEFT', 'VLOOKUP'],
    questions: [
      {
        id: 'job-sales-1',
        title: 'Soal 1: Total Omzet Sales Wilayah Jabar',
        instruction:
          'Di sel C5, hitung total Omzet (C2:C4) untuk Wilayah "Jabar" (B2:B4) memakai SUMIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Sales', isHeader: true },
              B: { value: 'Wilayah', isHeader: true },
              C: { value: 'Omzet (Rp)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Rama' },
              B: { value: 'Jabar' },
              C: { value: 15000000, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Sinta' },
              B: { value: 'Jatim' },
              C: { value: 20000000, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Dito' },
              B: { value: 'Jabar' },
              C: { value: 12000000, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: '' },
              B: { value: 'Total Jabar', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C5',
        expectedResult: 27000000,
        acceptedFormulas: ['=SUMIF(B2:B4,"Jabar",C2:C4)'],
        hint: 'Format: =SUMIF(B2:B4,"Jabar",C2:C4).',
        explanation:
          'Omzet Rama (15jt) + Dito (12jt) = 27.000.000 untuk wilayah Jabar.',
      },
      {
        id: 'job-sales-2',
        title: 'Soal 2: Penentuan Tier Bonus Pencapaian Target',
        instruction:
          'Di sel C2, tentukan status bonus berdasarkan Capaian (%) di B2: >=100 = "Bonus Penuh", >=80 = "Bonus 50%", selainnya = "Belum Bonus" (pakai IFS atau IF bertingkat).',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama Sales', isHeader: true },
              B: { value: 'Capaian (%)', isHeader: true, align: 'right' },
              C: { value: 'Status Bonus', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Rama' },
              B: { value: 88, align: 'right' },
              C: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'C2',
        expectedResult: 'Bonus 50%',
        acceptedFormulas: [
          '=IFS(B2>=100,"Bonus Penuh",B2>=80,"Bonus 50%",TRUE,"Belum Bonus")',
          '=IF(B2>=100,"Bonus Penuh",IF(B2>=80,"Bonus 50%","Belum Bonus"))',
        ],
        hint: 'Mulai evaluasi dari batas tertinggi B2>=100 lalu B2>=80.',
        explanation:
          'Dengan capaian 88%, sales masuk rentang >=80% dan berhak menerima "Bonus 50%".',
      },
      {
        id: 'job-sales-3',
        title: 'Soal 3: Rata-Rata Nilai Deal yang Berhasil Won',
        instruction:
          'Di sel C5, hitung rata-rata Nilai Deal (C2:C4) khusus untuk Stage "Won" (B2:B4) memakai AVERAGEIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Prospek', isHeader: true },
              B: { value: 'Stage', isHeader: true },
              C: { value: 'Nilai Deal', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Toko A' },
              B: { value: 'Won' },
              C: { value: 10000000, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Toko B' },
              B: { value: 'Lost' },
              C: { value: 15000000, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Toko C' },
              B: { value: 'Won' },
              C: { value: 20000000, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: '' },
              B: { value: 'Rata-rata Won', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C5',
        expectedResult: 15000000,
        acceptedFormulas: ['=AVERAGEIF(B2:B4,"Won",C2:C4)'],
        hint: 'Format: =AVERAGEIF(rentang_kriteria, "Won", rentang_rata2).',
        explanation:
          'Rata-rata transaksi Won adalah (10.000.000 + 20.000.000) / 2 = 15.000.000.',
      },
      {
        id: 'job-sales-4',
        title: 'Soal 4: Ekstrak Prefix Kode Promo Campaign',
        instruction:
          'Di sel B2, ambil 3 karakter pertama dari Kode Order di A2 menggunakan LEFT.',
        columns: ['A', 'B'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Kode Order', isHeader: true },
              B: { value: 'Kode Promo', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'PRM-2026-01' },
              B: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'B2',
        expectedResult: 'PRM',
        acceptedFormulas: ['=LEFT(A2,3)'],
        hint: 'Gunakan =LEFT(sel, jumlah_karakter).',
        explanation:
          '=LEFT(A2,3) mengekstrak kode promo "PRM" untuk kebutuhan pelacakan kampanye.',
      },
      {
        id: 'job-sales-5',
        title: 'Soal 5: Cari Nama Supervisor Berdasarkan Kode Wilayah',
        instruction:
          'Di sel D2, cari Supervisor di tabel A2:B4 untuk wilayah yang dipilih di C2 menggunakan VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Wilayah', isHeader: true },
              B: { value: 'Supervisor', isHeader: true },
              C: { value: 'Cek Wilayah', isHeader: true },
              D: { value: 'Supervisor', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'JABAR' },
              B: { value: 'Pak Hendra' },
              C: { value: 'JATENG' },
              D: { value: '?', isTarget: true },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'JATENG' },
              B: { value: 'Bu Lestari' },
              C: { value: '' },
              D: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'JATIM' },
              B: { value: 'Pak Bagus' },
              C: { value: '' },
              D: { value: '' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'Bu Lestari',
        acceptedFormulas: ['=VLOOKUP(C2,A2:B4,2,FALSE)', '=XLOOKUP(C2,A2:A4,B2:B4)'],
        hint: 'Ambil kolom ke-2 dari tabel A2:B4.',
        explanation:
          'Wilayah JATENG mengembalikan penanggung jawab "Bu Lestari".',
      },
    ],
  },
  {
    id: 'job-hrd-payroll',
    roleTitle: 'HRD & Payroll',
    department: 'Human Resources & Penggajian',
    summary:
      'Perhitungan HR & penggajian: menarik gaji pokok sesuai golongan, menyaring karyawan tetap bergaji tertentu, rekap jam lembur departemen, cek syarat tunjangan, dan sisa hari kontrak.',
    focusFormulas: ['VLOOKUP', 'COUNTIFS', 'SUMIF', 'IF', 'DATEDIF'],
    questions: [
      {
        id: 'job-hrd-1',
        title: 'Soal 1: Ambil Gaji Pokok Sesuai Golongan Karyawan',
        instruction:
          'Di sel D2, cari Gaji Pokok di tabel A2:B4 untuk golongan pada sel C2 menggunakan VLOOKUP atau XLOOKUP.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Golongan', isHeader: true },
              B: { value: 'Gaji Pokok', isHeader: true, align: 'right' },
              C: { value: 'Cek Gol.', isHeader: true },
              D: { value: 'Gaji Pokok', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Gol-1' },
              B: { value: 5000000, align: 'right' },
              C: { value: 'Gol-2' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Gol-2' },
              B: { value: 6500000, align: 'right' },
              C: { value: '' },
              D: { value: '' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Gol-3' },
              B: { value: 8500000, align: 'right' },
              C: { value: '' },
              D: { value: '' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 6500000,
        acceptedFormulas: ['=VLOOKUP(C2,A2:B4,2,FALSE)', '=XLOOKUP(C2,A2:A4,B2:B4)'],
        hint: 'Gunakan =VLOOKUP(C2,A2:B4,2,FALSE).',
        explanation:
          'Golongan Gol-2 terhubung dengan gaji pokok sebesar Rp6.500.000.',
      },
      {
        id: 'job-hrd-2',
        title: 'Soal 2: Hitung Karyawan Tetap dengan Gaji >= 6 Juta',
        instruction:
          'Di sel C6, hitung jumlah karyawan berstatus "Tetap" (B2:B5) dengan Gaji >= 6000000 (C2:C5) memakai COUNTIFS.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama', isHeader: true },
              B: { value: 'Status', isHeader: true },
              C: { value: 'Gaji (Rp)', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Andi' },
              B: { value: 'Tetap' },
              C: { value: 7000000, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Bella' },
              B: { value: 'Kontrak' },
              C: { value: 6500000, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Candra' },
              B: { value: 'Tetap' },
              C: { value: 5200000, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: 'Dewi' },
              B: { value: 'Tetap' },
              C: { value: 8000000, align: 'right' },
            },
          },
          {
            rowNum: 6,
            cells: {
              A: { value: '' },
              B: { value: 'Tetap >= 6jt', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C6',
        expectedResult: 2,
        acceptedFormulas: [
          '=COUNTIFS(B2:B5,"Tetap",C2:C5,">=6000000")',
          '=COUNTIFS(C2:C5,">=6000000",B2:B5,"Tetap")',
        ],
        hint: 'Operator perbandingan angka di COUNTIFS harus diapit tanda kutip: ">=6000000".',
        explanation:
          'Andi (7jt) dan Dewi (8jt) berstatus Tetap dan gajinya >= 6 juta, sehingga hasilnya 2.',
      },
      {
        id: 'job-hrd-3',
        title: 'Soal 3: Total Jam Lembur Departemen Produksi',
        instruction:
          'Di sel C5, hitung total Jam Lembur (C2:C4) khusus untuk Departemen "Produksi" (B2:B4) menggunakan SUMIF.',
        columns: ['A', 'B', 'C'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama', isHeader: true },
              B: { value: 'Departemen', isHeader: true },
              C: { value: 'Jam Lembur', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Eko' },
              B: { value: 'Produksi' },
              C: { value: 8, align: 'right' },
            },
          },
          {
            rowNum: 3,
            cells: {
              A: { value: 'Farah' },
              B: { value: 'Finance' },
              C: { value: 3, align: 'right' },
            },
          },
          {
            rowNum: 4,
            cells: {
              A: { value: 'Gilang' },
              B: { value: 'Produksi' },
              C: { value: 12, align: 'right' },
            },
          },
          {
            rowNum: 5,
            cells: {
              A: { value: '' },
              B: { value: 'Lembur Produksi', isHeader: true },
              C: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'C5',
        expectedResult: 20,
        acceptedFormulas: ['=SUMIF(B2:B4,"Produksi",C2:C4)'],
        hint: 'Gunakan =SUMIF(B2:B4,"Produksi",C2:C4).',
        explanation:
          'Total jam lembur Eko (8) + Gilang (12) = 20 jam.',
      },
      {
        id: 'job-hrd-4',
        title: 'Soal 4: Validasi Syarat Tunjangan Kehadiran Penuh',
        instruction:
          'Di sel D2, tampilkan "Dapat" jika Alpa (B2) sama dengan 0 DAN Telat (C2) kurang dari atau sama dengan 1, selainnya "Hangus" (pakai IF + AND).',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Nama', isHeader: true },
              B: { value: 'Alpa', isHeader: true, align: 'right' },
              C: { value: 'Telat', isHeader: true, align: 'right' },
              D: { value: 'Tunjangan', isHeader: true },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Hana' },
              B: { value: 0, align: 'right' },
              C: { value: 1, align: 'right' },
              D: { value: '?', isTarget: true },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 'Dapat',
        acceptedFormulas: [
          '=IF(AND(B2=0,C2<=1),"Dapat","Hangus")',
          '=IF(AND(C2<=1,B2=0),"Dapat","Hangus")',
        ],
        hint: 'Gabungkan dua syarat dengan AND(B2=0, C2<=1) di dalam IF.',
        explanation:
          'Karena Alpa = 0 dan Telat = 1 (<=1), kedua syarat terpenuhi dan menghasilkan "Dapat".',
      },
      {
        id: 'job-hrd-5',
        title: 'Soal 5: Hitung Sisa Hari Menuju Akhir Kontrak',
        instruction:
          'Di sel D2, hitung sisa hari antara Hari Ini (B2) dan Akhir Kontrak (C2) menggunakan DATEDIF unit "D" atau pengurangan tanggal C2-B2.',
        columns: ['A', 'B', 'C', 'D'],
        rows: [
          {
            rowNum: 1,
            cells: {
              A: { value: 'Karyawan', isHeader: true },
              B: { value: 'Hari Ini', isHeader: true },
              C: { value: 'Akhir Kontrak', isHeader: true },
              D: { value: 'Sisa Hari', isHeader: true, align: 'right' },
            },
          },
          {
            rowNum: 2,
            cells: {
              A: { value: 'Ilham' },
              B: { value: '2026-11-01' },
              C: { value: '2026-11-26' },
              D: { value: '?', isTarget: true, align: 'right' },
            },
          },
        ],
        targetCell: 'D2',
        expectedResult: 25,
        acceptedFormulas: ['=C2-B2', '=DATEDIF(B2,C2,"D")'],
        hint: 'Gunakan =C2-B2 atau =DATEDIF(B2,C2,"D").',
        explanation:
          'Selisih dari 1 Nov 2026 ke 26 Nov 2026 adalah 25 hari kalender.',
      },
    ],
  },
];
