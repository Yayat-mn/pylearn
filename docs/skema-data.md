# Skema Data PYLearn

Dokumen ini menjadi acuan saat menambah atau mengubah modul. Semua berkas
data berupa JSON UTF-8, memakai indentasi 2 spasi, tanpa komentar, dan tanpa
koma di akhir.

## Struktur folder

```text
data/
├── daftar-modul.json      # katalog untuk dashboard dan halaman modul
└── modul-01 … modul-08/
    ├── meta.json          # identitas dan daftar subbab
    ├── materi.html        # isi materi teks
    ├── latihan.json       # satu tugas coding
    └── kuis.json          # soal pilihan ganda
```

Nama folder harus sama dengan `slug` pada katalog, misalnya `modul-02`.
JavaScript memakai `slug` bila tersedia; jika tidak, memakai pola
`modul-XX` dengan nomor dua digit.

## 1. `data/daftar-modul.json`

Sumber data untuk kartu dashboard, navigasi modul, dan penentuan langkah
lanjut. Halaman modul memakai `meta.json` untuk isi, tetapi status
ketersediaan selalu diambil dari katalog.

| Field | Tipe | Keterangan |
|---|---|---|
| `judul` | string | Judul aplikasi |
| `deskripsi` | string | Deskripsi singkat aplikasi |
| `modul` | array | Daftar modul, urut dari id terkecil |
| `modul[].id` | number | Nomor modul 1–8 |
| `modul[].slug` | string | Nama folder, misalnya `modul-01` |
| `modul[].judul` | string | Judul modul |
| `modul[].deskripsi` | string | Satu kalimat untuk kartu |
| `modul[].jumlahSubbab` | number | Jumlah subbab, untuk label kartu |
| `modul[].status` | string | `tersedia` atau `segera` |

Aturan:

- `id` harus unik dan berurutan 1–8.
- `judul` dan `deskripsi` sebaiknya sama dengan `meta.json` modul terkait.
- Ubah `status` menjadi `tersedia` setelah folder modul lengkap.
- Modul berstatus `segera` ditampilkan sebagai kartu nonaktif di dashboard.
- Membuka `modul.html?id=<modul segera>` menampilkan pesan “Modul belum
  tersedia”, bukan galat 404.
- `modul.html?id=<nomor tidak dikenal>` menampilkan “Modul tidak ditemukan”.
- Katalog dimuat satu kali per halaman dan di-cache oleh
  `js/features/katalog.js`. Jika pemuatan gagal, cache dibersihkan agar
  percobaan berikutnya masih bisa berhasil.

## 2. `meta.json`

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | number | Nomor modul |
| `slug` | string | Nama folder (opsional; dipakai bila ada) |
| `judul` | string | Judul modul |
| `deskripsi` | string | Ringkasan modul |
| `tujuanPembelajaran` | string[] | Daftar tujuan |
| `subbab` | array | Daftar subbab |
| `subbab[].id` | string | Nomor subbab, misalnya `1.1` |
| `subbab[].judul` | string | Judul subbab |
| `video` | object | Video pembelajaran |
| `video.youtubeId` | string | ID video 11 karakter, bukan URL penuh |
| `video.judul` | string | Judul video |
| `kodeAwal` | string | Cadangan kode awal editor |
| `fileMateri` | string | Nama berkas materi, biasanya `materi.html` |
| `fileLatihan` | string | Nama berkas latihan, biasanya `latihan.json` |
| `fileKuis` | string | Nama berkas kuis, biasanya `kuis.json` |

Contoh `video`:

```json
"video": {
  "youtubeId": "dQw4w9WgXcQ",
  "judul": "Pengenalan Python untuk Pemula"
}
```

`youtubeId` harus berupa ID 11 karakter, bukan URL seperti
`https://www.youtube.com/watch?v=...`. Jika kosong atau tidak valid, halaman
menampilkan pesan “Video belum tersedia untuk modul ini.”

Field `fileMateri`, `fileLatihan`, dan `fileKuis` bersifat opsional. Nilai
bawaan masing-masing adalah `materi.html`, `latihan.json`, dan `kuis.json`.

## 3. `materi.html`

- Satu berkas berisi seluruh subbab modul.
- Setiap subbab dibungkus `<section>` dengan id `subbab-<nomor>`.
  Titik diganti strip: `1.1` menjadi `subbab-1-1`.
- Id tersebut harus sama dengan hasil konversi `subbab[].id` di `meta.json`,
  karena navigasi subbab memakai pola itu.
- Gunakan `<h2>` atau `<h3>` secara konsisten untuk judul subbab.
- Contoh kode memakai `<pre><code class="language-python">`.
- Jangan memuat editor atau skrip di dalam berkas ini.

Catatan keamanan: `materi.html` dimuat dengan `innerHTML` karena merupakan
konten proyek yang tepercaya, bukan input pengguna. Jangan pernah memasukkan
teks dari URL, formulir, atau data eksternal ke berkas ini tanpa sanitasi.

## 4. `latihan.json`

Satu tugas coding per modul.

```json
{
  "judul": "Latihan Modul 1",
  "instruksi": "Tampilkan teks Halo, PYLearn! menggunakan print().",
  "kodeAwal": "print(\"Halo, PYLearn!\")",
  "outputDiharapkan": "Halo, PYLearn!",
  "petunjuk": [
    "Gunakan fungsi print().",
    "Teks harus diapit tanda kutip."
  ],
  "kunci": "print(\"Halo, PYLearn!\")"
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `judul` | string | Judul latihan |
| `instruksi` | string | Tugas yang harus dikerjakan |
| `kodeAwal` | string | Isi awal editor |
| `outputDiharapkan` | string | Output target, boleh multi-baris dengan `\n` |
| `petunjuk` | string[] | Petunjuk bertahap |
| `kunci` | string | Solusi, ditampilkan setelah 3 percobaan gagal |

Aturan penilaian output:

- Akhiran baris `\r\n` diseragamkan menjadi `\n`.
- Spasi di akhir setiap baris dihapus.
- Baris kosong di awal dan akhir dibuang.
- Perbandingan bersifat case-sensitive; huruf besar dan kecil dibedakan.
- Program mengikuti batas waktu 5 detik dan batas output 10.000 karakter.
- Tombol Periksa Output menjalankan ulang kode, bukan memakai output lama.
- Setiap pemeriksaan yang menghasilkan output berbeda atau error menambah
  jumlah percobaan. Stop manual dan perpindahan tahap tidak dihitung.
- Petunjuk ditampilkan bertahap setelah percobaan gagal. Setelah 3 percobaan
  gagal, `kunci` ditampilkan.
- Setelah output sesuai, tombol **Lanjut ke Kuis** muncul. Jumlah percobaan
  tidak disimpan dan kembali ke nol setelah halaman dimuat ulang.
- Jika `kodeAwal` kosong, halaman memakai `meta.kodeAwal`; jika keduanya
  kosong, editor mulai kosong.

## 5. `kuis.json`

```json
{
  "judul": "Kuis Modul 1",
  "batasLulus": 60,
  "soal": [
    {
      "pertanyaan": "Fungsi apa yang digunakan untuk menampilkan teks?",
      "pilihan": ["input()", "print()", "len()", "type()"],
      "jawaban": "B",
      "pembahasan": "print() menampilkan keluaran ke layar."
    }
  ]
}
```

| Field | Tipe | Keterangan |
|---|---|---|
| `judul` | string | Judul kuis |
| `batasLulus` | number | Nilai minimal 0–100 |
| `soal` | array | Daftar soal, minimal satu |
| `soal[].pertanyaan` | string | Pertanyaan |
| `soal[].pilihan` | string[] | Dua sampai empat pilihan jawaban |
| `soal[].jawaban` | string | Huruf kunci: `A`, `B`, `C`, atau `D` |
| `soal[].pembahasan` | string | Penjelasan jawaban benar (opsional) |

Aturan penilaian:

- Nilai = `Math.round(jumlahBenar / jumlahSoal * 100)`.
- Lulus jika nilai `>= batasLulus`.
- Skor hanya ditampilkan, tidak disimpan. Muat ulang halaman berarti mengulang.
- Menambah soal cukup menambah objek di array `soal`; nilai menyesuaikan
  otomatis, tetapi periksa kembali `batasLulus`.
- Setelah submit, jawaban dikunci dan pembahasan ditampilkan.
- Jika lulus dan modul berikutnya `tersedia`, tombol lanjut menuju modul itu.
  Jika tidak ada modul berikutnya yang tersedia, tombol lanjut menuju
  `selesai.html?id=<nomor modul>`.
- Jika belum lulus, tombol **Ulangi Modul** mereset kuis dan kembali ke tahap
  Belajar.

## 6. Alur halaman modul

1. **Belajar** — tab Teks memuat `materi.html`, tab Video memuat YouTube.
   Daftar subbab dapat diklik dan disinkronkan dengan posisi gulir.
2. **Latihan** — editor memakai `latihan.kodeAwal`. Tombol Periksa Output
   membandingkan hasil dengan `outputDiharapkan`. Setelah output sesuai,
   tombol **Lanjut ke Kuis** muncul.
3. **Kuis** — soal dari `kuis.json`, lalu skor dan pembahasan.
4. Jika lulus, lanjut ke modul berikutnya bila sudah tersedia; jika belum,
   menuju `selesai.html?id=<nomor modul>`. Jika belum lulus, tombol Ulangi
   Modul mengembalikan ke tahap Belajar.

Tahap disimpan di hash URL: `#belajar`, `#latihan`, dan `#kuis`. Tidak ada
penguncian urutan modul; semua modul yang `tersedia` dapat dibuka langsung.

## 7. Halaman penutup

`selesai.html?id=<nomor>` membaca katalog dan `meta.json` untuk menentukan:

- id tidak valid → pesan kesalahan;
- modul belum terdaftar → pesan kesalahan;
- modul `segera` → “Modul belum tersedia”;
- modul terakhir masih `segera` → “Mini project segera”;
- modul tersedia dengan modul berikutnya tersedia → tautan lanjut;
- modul tersedia tanpa modul berikutnya → “Kursus selesai”.

## 8. Menambah modul baru

1. Buat folder `data/modul-XX`.
2. Isi `meta.json`, `materi.html`, `latihan.json`, `kuis.json`.
3. Pastikan id subbab di materi sama dengan `meta.json`.
4. Tambahkan entri di `data/daftar-modul.json`.
5. Uji modul dalam status `segera` terlebih dahulu, lalu ubah status menjadi
   `tersedia`.
6. Uji alur: materi, subbab, video, latihan (gagal/benar), kuis
   (gagal/lulus), dan tautan lanjut.

## 9. Batasan Pyodide

- `input()` belum terhubung ke `prompt()` browser. Hindari `input()` pada
  latihan sampai dukungan `setStdin` ditambahkan.
- Setiap program dijalankan di namespace baru; variabel dari eksekusi
  sebelumnya tidak tersedia.
- Setelah Stop atau timeout, Worker Pyodide dibuang dan perlu dimuat ulang
  pada eksekusi berikutnya.
