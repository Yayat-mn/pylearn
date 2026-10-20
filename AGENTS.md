# PYLearn — Panduan Proyek

Multimedia pembelajaran Python untuk mahasiswa semester awal.
Proyek mata kuliah Multimedia Pembelajaran, Kelompok 4 PTIK B 2024.

## Menjalankan
- Sajikan lewat HTTP server, jangan buka via `file://`
  (fetch `data/*.json` akan diblokir CORS).
- Pilih salah satu, tidak perlu keduanya:
  - `python -m http.server 8000` dari folder proyek, atau
- ekstensi Live Server di VS Code (klik Go Live, default port 5500).
- Folder yang dibuka di editor/server harus folder proyek (`pylearn`),
  bukan folder induknya, agar `data/modul-XX/` bisa diakses.
- Halaman modul: `http://localhost:8000/modul.html?id=1` (id 1–8),
  atau `http://127.0.0.1:5500/modul.html?id=1` bila memakai Live Server.
  Sesuaikan port dengan yang tertera di terminal / status bar VS Code.
- `index.html` hanya dashboard; halaman modul selalu lewat `modul.html?id=...`.
- CDN CodeMirror dan Pyodide memerlukan koneksi internet.

## Stack
- HTML + CSS + JavaScript murni. ES module (`<script type="module">`).
- Tanpa framework, tanpa build step, tanpa npm dependency.
- CodeMirror 5 dari CDN untuk editor kode.
- Pyodide dimuat di Web Worker (`js/workers/pyodide-worker.js`).

## Struktur
- `js/pages/`   — skrip per halaman (`modul.js`, `dashboard.js`)
- `js/features/`— komponen yang bisa dipakai ulang (`editor.js`, `latihan.js`, `python-runner.js`, `sidebar.js`, `transisi-halaman.js`)
- `js/workers/` — kode yang berjalan di worker
- `data/modul-XX/` — `meta.json` + `materi.html` per modul
- `css/`         — `variables.css` (token warna), `base.css`, `components.css`

## Konvensi
- Nama variabel, fungsi, dan komentar memakai Bahasa Indonesia.
- Komentar menjelaskan langkah kerja, bukan mengulang kode.
- Warna hanya lewat variabel CSS (`--warna-utama`, `--warna-aksen`).
- Setiap modul baru wajib punya `meta.json` yang sesuai skema modul-01.
- ID subbab memakai pola `subbab-1-1` (titik diganti strip).

## Larangan
- Jangan menambah dependency atau framework tanpa persetujuan.
- Jangan mengubah `pyodide-worker.js` tanpa menaikkan versi CDN secara sadar.
- Jangan memakai `innerHTML` untuk data dari pengguna.
- Jangan menaruh kunci API atau data pribadi di repo.

## Verifikasi
- Uji di browser: editor muncul, Python termuat, output tampil.
- Uji Stop dan batas waktu 5 detik (mis. `while True: pass`).
- Pastikan navigasi subbab melompat ke bagian yang benar.