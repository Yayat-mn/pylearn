# PYLearn

Multimedia pembelajaran Python berbasis web untuk mahasiswa semester awal.
Proyek mata kuliah Multimedia Pembelajaran, Kelompok 4 PTIK B 2024.

PYLearn membagi materi menjadi delapan modul. Setiap modul memiliki materi
teks, video, satu latihan coding, dan kuis pilihan ganda. Kode latihan
dijalankan langsung di browser memakai Pyodide, tanpa server Python.

## Fitur

- Dashboard berisi katalog delapan modul dan status ketersediaannya.
- Halaman modul dengan tiga tahap: **Belajar → Latihan → Kuis**.
- Materi teks dan video dalam satu tab, dengan daftar subbab yang dapat
  diklik.
- Editor Python (CodeMirror) yang berjalan di browser melalui Web Worker
  Pyodide.
- Pemeriksaan output latihan, petunjuk bertahap, dan solusi setelah tiga
  percobaan gagal.
- Batas waktu eksekusi 5 detik, tombol Stop, dan batas panjang output.
- Kuis dengan jumlah soal serta batas lulus yang diatur lewat `kuis.json`.
- Halaman penutup dan tautan lanjut ke modul berikutnya bila sudah tersedia.
- Tampilan responsif: sidebar berubah menjadi drawer pada layar kecil.

## Menjalankan

Halaman **harus** dibuka lewat HTTP server. Membuka `index.html` langsung
dari `file://` akan memblokir `fetch()` ke folder `data/`.

Dari folder proyek (`pylearn`):

```bash
python -m http.server 8000
```

Lalu buka:

- Dashboard: <http://localhost:8000/index.html>
- Modul 1: <http://localhost:8000/modul.html?id=1>
- Modul 2: <http://localhost:8000/modul.html?id=2>
- Modul 3: <http://localhost:8000/modul.html?id=3>
- Modul 4: <http://localhost:8000/modul.html?id=4>
- Modul 5: <http://localhost:8000/modul.html?id=5>
- Modul 6: <http://localhost:8000/modul.html?id=6>
- Modul 7: <http://localhost:8000/modul.html?id=7>
- Halaman penutup: <http://localhost:8000/selesai.html?id=1>

Alternatif tanpa Python: ekstensi **Live Server** di VS Code, lalu klik
**Go Live** (biasanya port 5500). Sesuaikan port pada URL.

Catatan:

- Folder yang dibuka di editor/server harus folder `pylearn`, bukan folder
  induknya.
- CodeMirror dan Pyodide dimuat dari CDN, jadi koneksi internet diperlukan.
- Pyodide diunduh saat pertama kali kode dijalankan, bukan saat halaman
  dibuka.

## Struktur proyek

```text
pylearn/
├── index.html                 # dashboard
├── modul.html                 # kerangka halaman modul
├── selesai.html               # halaman penutup
├── css/
│   ├── variables.css          # token warna, jarak, bayangan
│   ├── base.css               # reset dan dasar tipografi
│   └── components.css         # seluruh komponen UI
├── js/
│   ├── pages/
│   │   ├── dashboard.js       # katalog dan navigasi dashboard
│   │   ├── modul.js           # alur tiga tahap halaman modul
│   │   └── selesai.js         # status akhir dan langkah lanjutan
│   ├── features/
│   │   ├── editor.js          # wrapper CodeMirror
│   │   ├── katalog.js         # pemuat katalog bersama
│   │   ├── kuis.js            # validasi, render, dan penilaian kuis
│   │   ├── latihan.js         # normalisasi dan pembanding output
│   │   ├── python-runner.js   # pengelola Worker Pyodide
│   │   ├── sidebar.js         # drawer responsif dan fokus
│   │   └── transisi-halaman.js
│   └── workers/
│       └── pyodide-worker.js  # eksekusi Python di worker
├── data/
│   ├── daftar-modul.json      # katalog modul
│   └── modul-01/              # meta.json, materi.html, latihan.json, kuis.json
└── docs/
    ├── arsitektur.md          # cara kerja dan batas modul
    ├── skema-data.md          # kontrak setiap berkas data
    └── uji-manual.md          # daftar pemeriksaan sebelum rilis
```

## Alur halaman modul

1. **Belajar** — `meta.json` mengisi judul, tujuan, video, dan daftar subbab.
   `materi.html` dimuat ke panel Teks. Tab Video menampilkan iframe YouTube.
2. **Latihan** — `latihan.json` mengisi instruksi, target output, kode awal,
   petunjuk, dan solusi. Tombol **Periksa Output** menjalankan kode di Pyodide
   lalu membandingkan output dengan target.
3. **Kuis** — `kuis.json` menghasilkan soal pilihan ganda. Setelah dikumpulkan,
   jawaban dikunci dan pembahasan ditampilkan. Jika lulus, tombol lanjut
   mengarah ke modul berikutnya yang `tersedia`; jika belum ada, ke halaman
   penutup.

Status halaman disimpan di URL (`#belajar`, `#latihan`, `#kuis`), sehingga
tahap tertentu dapat dibuka langsung. Tidak ada penguncian urutan modul dan
tidak ada penyimpanan nilai.

## Data dan modul baru

Kontrak lengkap setiap berkas ada di [`docs/skema-data.md`](docs/skema-data.md).
Ringkasnya, satu modul membutuhkan:

```text
data/modul-XX/
├── meta.json
├── materi.html
├── latihan.json
└── kuis.json
```

Setelah isinya lengkap, ubah `status` modul tersebut di
`data/daftar-modul.json` dari `segera` menjadi `tersedia`. Modul yang masih
`segera` tidak dapat dibuka dan akan menampilkan pesan yang ramah, bukan
galat 404.

## Dokumentasi

- [`docs/arsitektur.md`](docs/arsitektur.md) — pembagian lapisan, alur data,
  siklus Worker, dan titik perluasan.
- [`docs/skema-data.md`](docs/skema-data.md) — format dan aturan semua berkas
  JSON/HTML modul.
- [`docs/uji-manual.md`](docs/uji-manual.md) — checklist pengujian sebelum
  menambah modul atau merilis perubahan.

## Batasan yang diketahui

- Nilai kuis, jumlah percobaan, dan status latihan tidak disimpan. Memuat
  ulang halaman berarti memulai dari awal.
- `input()` belum terhubung ke `prompt()` browser. Hindari `input()` pada
  latihan sampai dukungan `setStdin` ditambahkan.
- Setelah Stop atau timeout, Worker Pyodide dibuang. Eksekusi berikutnya
  membuat Worker baru dan memuat Pyodide lagi.
- Pyodide dan CodeMirror memerlukan internet karena dimuat dari CDN.
- Proyek ini tidak memakai framework, build step, atau npm dependency.

## Kontribusi

- Gunakan nama variabel, fungsi, dan komentar dalam Bahasa Indonesia.
- Warna hanya boleh diambil dari variabel di `css/variables.css`.
- Jangan memakai `innerHTML` untuk data dari pengguna atau data JSON. Teks
  dari data harus ditulis dengan `textContent`.
- Jangan mengubah `js/workers/pyodide-worker.js` tanpa menaikkan versi CDN
  secara sadar.
- Sebelum mengirim perubahan, jalankan checklist di
  [`docs/uji-manual.md`](docs/uji-manual.md).
