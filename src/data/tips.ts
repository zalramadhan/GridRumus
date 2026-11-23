import { TipEntry, PracticePack } from '../types/excel';

export const TIPS: TipEntry[] = [
  {
    id: 'flash-fill',
    title: 'Flash Fill: Pisah & Gabung Teks Otomatis Tanpa Rumus',
    category: 'Pembersihan Data',
    shortcutWin: 'Ctrl + E',
    shortcutMac: 'Cmd + E',
    summary:
      'Excel mengenali pola ketikan Anda di 1-2 baris pertama, lalu mengisi ribuan baris sisanya secara instan tanpa menulis rumus LEFT/MID/RIGHT.',
    steps: [
      'Ketik contoh hasil yang diinginkan di kolom sebelah data mentah (misal dari "andi.wijaya@gmail.com" ketik "Andi Wijaya" di sel B2).',
      'Pindah ke sel B3 lalu tekan Ctrl + E.',
      'Seluruh kolom otomatis mengikuti pola kapitalisasi dan pemisahan yang Anda contohkan.',
    ],
    realExample: 'Mengubah daftar email karyawan menjadi Nama Lengkap berformat Title Case dalam 2 detik.',
    beforeAfter: {
      before: 'siti.rahma@perusahaan.co.id',
      after: 'Siti Rahma',
    },
  },
  {
    id: 'absolute-reference',
    title: 'Kunci Referensi Sel ($A$1) Agar Rumus Tidak Bergeser',
    category: 'Formula & Audit',
    shortcutWin: 'F4',
    shortcutMac: 'Cmd + T',
    summary:
      'Mengunci baris dan/atau kolom saat menyalin rumus ke bawah atau ke kanan (wajib saat mengalikan tarif PPN 11% atau tabel VLOOKUP).',
    steps: [
      'Saat kursor berada di referensi sel seperti B2 di Formula Bar, tekan F4 satu kali untuk mengunci penuh ($B$2).',
      'Tekan F4 lagi untuk mengunci baris saja (B$2), tekan sekali lagi untuk mengunci kolom saja ($B2).',
    ],
    realExample: 'Mengalikan daftar harga di B2:B50 dengan satu sel tarif PPN 11% di sel F1: =B2*$F$1.',
    beforeAfter: {
      before: '=B2*F1 (bergeser jadi F2, F3 saat ditarik)',
      after: '=B2*$F$1 (selalu mengunci sel F1)',
    },
  },
  {
    id: 'paste-values',
    title: 'Paste Values: Mengubah Hasil Rumus Menjadi Angka Permanen',
    category: 'Produktivitas Kerja',
    shortcutWin: 'Ctrl + Shift + V',
    shortcutMac: 'Cmd + Shift + V',
    summary:
      'Menghapus ketergantungan rumus sebelum mengirim file ke pihak luar atau sebelum menghapus kolom sumber data.',
    steps: [
      'Salin sel berisi rumus dengan Ctrl + C.',
      'Tekan Ctrl + Shift + V (Excel 365) atau Ctrl + Alt + V lalu tekan V dan Enter.',
      'Rumus hilang, menyisakan nilai bersih sehingga file lebih ringan dan aman dari error #REF!.',
    ],
    realExample: 'Mengunci hasil TRIM/PROPER sebelum menghapus kolom data mentah yang berantakan.',
  },
  {
    id: 'ctrl-arrow-select',
    title: 'Blok Puluhan Ribu Baris Data dalam 1 Detik',
    category: 'Navigasi & Seleksi',
    shortcutWin: 'Ctrl + Shift + Panah Bawah',
    shortcutMac: 'Cmd + Shift + Panah Bawah',
    summary:
      'Berhenti menggeser mouse secara manual dari baris 1 sampai baris 50.000. Lompat langsung ke batas akhir tabel data.',
    steps: [
      'Klik sel paling atas pada kolom yang ingin diseleksi.',
      'Tekan Ctrl + Shift + Panah Bawah untuk memblok hingga baris terakhir yang berisi data.',
      'Tekan Ctrl + A satu kali di dalam tabel untuk langsung memblok seluruh tabel aktif.',
    ],
    realExample: 'Memblok seluruh kolom transaksi sepanjang 1 tahun sebelum membuat PivotTable atau grafik.',
  },
  {
    id: 'excel-table',
    title: 'Format as Table (Ctrl + T) untuk Rumus Otomatis Memanjang',
    category: 'Produktivitas Kerja',
    shortcutWin: 'Ctrl + T',
    shortcutMac: 'Cmd + T',
    summary:
      'Mengubah rentang biasa menjadi Tabel Resmi Excel sehingga rumus, filter, format warna selang-seling, dan sumber grafik ikut memanjang otomatis saat baris baru ditambahkan.',
    steps: [
      'Klik satu sel mana saja di dalam data Anda.',
      'Tekan Ctrl + T lalu pastikan kotak "My table has headers" dicentang, tekan Enter.',
      'Saat Anda mengetik baris baru di paling bawah, semua rumus di kolom sebelah kanan otomatis terisi!',
    ],
    realExample: 'Buku kas harian atau log penjualan yang terus bertambah barisnya setiap hari.',
  },
  {
    id: 'remove-duplicates',
    title: 'Hapus Data Ganda & Deteksi Duplikat Secara Visual',
    category: 'Pembersihan Data',
    shortcutWin: 'Alt + A + M',
    shortcutMac: 'Tab Data > Remove Duplicates',
    summary:
      'Membersihkan double input nomor invoice atau daftar email pelanggan kembar hanya dalam beberapa klik.',
    steps: [
      'Untuk menandai dulu sebelum menghapus: blok kolom > Home > Conditional Formatting > Highlight Cells Rules > Duplicate Values.',
      'Untuk langsung menghapus baris duplikat: klik Data > Remove Duplicates (atau Alt + A + M), pilih kolom patokan (misal No Invoice).',
    ],
    realExample: 'Menghilangkan transaksi ganda hasil gabungan laporan dari dua admin gudang.',
  },
  {
    id: 'text-to-columns',
    title: 'Ubah Teks Angka Menjadi Angka Asli & Pecah CSV Instan',
    category: 'Pembersihan Data',
    shortcutWin: 'Alt + A + E',
    shortcutMac: 'Tab Data > Text to Columns',
    summary:
      'Memperbaiki kolom angka atau tanggal hasil ekspor sistem ERP/bank yang tidak bisa di-SUM karena terbaca sebagai teks.',
    steps: [
      'Blok satu kolom angka/tanggal yang bermasalah (biasanya rata kiri).',
      'Tekan Alt + A + E (Text to Columns) lalu langsung klik Finish.',
      'Excel otomatis memaksa konversi ulang tipe data teks menjadi angka/tanggal valid.',
    ],
    realExample: 'Mengatasi SUM menghasilkan 0 pada file unduhan mutasi rekening bank atau marketplace.',
  },
  {
    id: 'toggle-formulas',
    title: 'Intip Semua Rumus Sekaligus Saat Audit Laporan',
    category: 'Formula & Audit',
    shortcutWin: 'Ctrl + ` (Tilde)',
    shortcutMac: 'Ctrl + `',
    summary:
      'Menampilkan seluruh isi rumus di dalam worksheet secara bersamaan untuk mengecek apakah ada sel yang terisi angka ketikan manual.',
    steps: [
      'Tekan Ctrl + ` (tombol di sebelah kiri angka 1 pada keyboard).',
      'Semua sel ber-rumus akan memperlihatkan sintaks =SUM(...) alih-alih angkanya.',
      'Tekan Ctrl + ` lagi untuk kembali ke tampilan normal.',
    ],
    realExample: 'Mengecek laporan keuangan sebelum dikirim ke atasan agar tidak ada sel total yang diketik manual (hardcode).',
  },
  {
    id: 'autosum-instant',
    title: 'AutoSum Kilat untuk Baris dan Kolom Sekaligus',
    category: 'Formula & Audit',
    shortcutWin: 'Alt + =',
    shortcutMac: 'Cmd + Shift + T',
    summary:
      'Menjumlahkan puluhan kolom maupun baris secara bersamaan tanpa mengetik =SUM satu per satu.',
    steps: [
      'Blok seluruh tabel angka DITAMBAH satu baris kosong di bawah dan satu kolom kosong di kanan.',
      'Tekan Alt + = satu kali.',
      'Total per baris di sebelah kanan dan total per kolom di bagian bawah langsung terisi otomatis.',
    ],
    realExample: 'Menyelesaikan rekap tabel penjualan 12 bulan x 10 cabang dalam 1 detik.',
  },
  {
    id: 'freeze-panes',
    title: 'Freeze Panes: Kunci Header Tabel Saat Scroll ke Bawah',
    category: 'Navigasi & Seleksi',
    shortcutWin: 'Alt + W + F + F',
    shortcutMac: 'View > Freeze Panes',
    summary:
      'Menjaga baris judul kolom tetap terlihat di layar meski Anda sedang mengedit baris ke-2.000.',
    steps: [
      'Klik sel tepat di BAWAH baris header (misal sel A2 jika header di baris 1, atau B2 jika ingin mengunci baris 1 dan kolom A sekaligus).',
      'Buka tab View > Freeze Panes > Freeze Panes (atau tekan Alt + W + F + F).',
    ],
    realExample: 'Menginput stok opname ratusan item tanpa lupa nama kolom bulan ke kanan.',
  },
  {
    id: 'comma-vs-semicolon',
    title: 'Tips Regional Indonesia: Koma (,) vs Titik Koma (;)',
    category: 'Formula & Audit',
    shortcutWin: 'Control Panel > Region',
    shortcutMac: 'System Settings > Region',
    summary:
      'Mengapa rumus =IF(A2>10,"Ya","Tidak") kadang error di komputer kantor? Karena pengaturan Regional Windows Indonesia memakai titik koma (;).',
    steps: [
      'Lihat tooltip kecil yang muncul di bawah sel saat Anda mengetik rumus.',
      'Jika pemisah di tooltip berupa titik koma, ketik =SUMIF(B2:B6;F2;D2:D6).',
      'Jika Anda mengunduh file .xlsx dari GridRumus dan membukanya di Excel Indonesia, Excel otomatis mengonversi pemisah rumus sesuai setelan PC Anda!',
    ],
    realExample: 'Menghindari pesan error "There is a problem with this formula" saat menyalin rumus dari internet.',
  },
  {
    id: 'paste-transpose',
    title: 'Transpose: Putar Tabel Horizontal Menjadi Vertikal',
    category: 'Produktivitas Kerja',
    shortcutWin: 'Ctrl + Alt + V, lalu E',
    shortcutMac: 'Cmd + Ctrl + V > Transpose',
    summary:
      'Mengubah susunan header kolom (kiri ke kanan) menjadi daftar baris (atas ke bawah) tanpa mengetik ulang.',
    steps: [
      'Salin tabel sumber dengan Ctrl + C.',
      'Klik sel tujuan, tekan Ctrl + Alt + V untuk membuka Paste Special.',
      'Centang opsi Transpose (atau tekan huruf E) lalu tekan Enter.',
    ],
    realExample: 'Mengubah daftar nama bulan yang memanjang ke kanan menjadi tabel vertikal yang siap dibuat grafik.',
  },
];

export const PRACTICE_PACKS: PracticePack[] = [
  {
    id: 'master-all-formulas',
    filename: 'Paket_Lengkap_Semua_Rumus_GridRumus.xlsx',
    title: 'Workbook Master: Semua Rumus Excel (Multi-Sheet)',
    description:
      'Satu file Excel lengkap berisi seluruh lembar latihan rumus (Matematika, Logika, Lookup, Teks, Tanggal, Keuangan & Dynamic Array) lengkap dengan rumus aktif di setiap sel.',
    sheetsCount: 18,
    sheetNames: ['Latihan_SUM', 'Latihan_SUMIF', 'Latihan_SUMIFS', 'Latihan_VLOOKUP', 'Latihan_XLOOKUP', '... +13 Sheet'],
    formulasIncluded: ['SUM', 'SUMIFS', 'COUNTIFS', 'IF', 'IFS', 'VLOOKUP', 'INDEX+MATCH', 'XLOOKUP', 'DATEDIF', 'PMT', 'FILTER', 'UNIQUE'],
    targetRole: 'Semua Pengguna · Belajar Terstruktur',
  },
  {
    id: 'sales-rekap-case',
    filename: 'Studi_Kasus_Rekap_Penjualan_Cabang.xlsx',
    title: 'Studi Kasus Penjualan & Stok (SUMIFS + VLOOKUP + IF)',
    description:
      'Simulasi transaksi penjualan toko multi-cabang dengan tabel Master Produk, pencarian harga otomatis memakai VLOOKUP, status stok dengan IF, dan ringkasan omzet cabang via SUMIFS.',
    sheetsCount: 2,
    sheetNames: ['Transaksi_Penjualan', 'Master_Produk_&_Rekap'],
    formulasIncluded: ['VLOOKUP', 'SUMIFS', 'COUNTIFS', 'IF', 'SUBTOTAL', 'IFERROR'],
    targetRole: 'Admin Sales · Operasional · Retail',
  },
  {
    id: 'hr-payroll-case',
    filename: 'Studi_Kasus_HR_Masa_Kerja_&_Bonus.xlsx',
    title: 'Studi Kasus HRD: Masa Kerja, Hari Kerja & Bonus KPI',
    description:
      'Daftar karyawan lengkap dengan perhitungan lama bekerja (DATEDIF), jumlah hari kerja efektif (NETWORKDAYS), kelayakan bonus (IF + AND), dan pencarian golongan gaji (INDEX + MATCH).',
    sheetsCount: 2,
    sheetNames: ['Data_Karyawan_HR', 'Skema_Golongan'],
    formulasIncluded: ['DATEDIF', 'NETWORKDAYS', 'IF', 'AND', 'INDEX+MATCH', 'COUNTIF'],
    targetRole: 'HRD · Payroll · Personalia',
  },
  {
    id: 'finance-loan-case',
    filename: 'Studi_Kasus_Keuangan_Cicilan_&_Pembulatan.xlsx',
    title: 'Studi Kasus Keuangan: Simulasi Cicilan & Invoice Pajak',
    description:
      'Kalkulator angsuran pinjaman usaha dengan PMT, perhitungan PPN 11% dan pembulatan presisi ROUND/ROUNDUP, serta rasio aman bebas #DIV/0! dengan IFERROR.',
    sheetsCount: 2,
    sheetNames: ['Simulasi_Cicilan_PMT', 'Invoice_&_Pajak'],
    formulasIncluded: ['PMT', 'ROUND', 'ROUNDUP', 'IFERROR', 'EOMONTH', 'SUM'],
    targetRole: 'Keuangan · Akuntansi · UMKM',
  },
  {
    id: 'crm-cleaning-case',
    filename: 'Studi_Kasus_Pembersihan_Data_CRM.xlsx',
    title: 'Studi Kasus Pembersihan Data Pelanggan & Faktur',
    description:
      'Latihan merapikan nama berantakan hasil ekspor form (TRIM + PROPER), mengekstrak kode wilayah faktur (LEFT/MID/RIGHT), memisahkan username email (FIND), dan menggabungkan alamat (TEXTJOIN).',
    sheetsCount: 1,
    sheetNames: ['Pembersihan_CRM'],
    formulasIncluded: ['TRIM', 'PROPER', 'LEFT', 'MID', 'RIGHT', 'FIND', 'TEXTJOIN'],
    targetRole: 'Admin Database · Marketing · Data Entry',
  },
];
