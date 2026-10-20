# Arsitektur PYLearn

Dokumen ini menjelaskan pembagian kode, alur data, dan keputusan desain yang
perlu diketahui sebelum mengubah fitur. Untuk format berkas data, lihat
[`skema-data.md`](skema-data.md).

## 1. Batasan proyek

- HTML, CSS, dan JavaScript murni; tanpa framework, build step, atau npm.
- Semua halaman adalah berkas statis yang disajikan lewat HTTP server.
- Modul JavaScript memakai ES module (`<script type="module">`).
- Python berjalan di browser melalui Pyodide di Web Worker.
- CodeMirror 5 dan Pyodide dimuat dari CDN.
- Tidak ada backend, autentikasi, atau penyimpanan nilai.

## 2. Lapisan

```text
┌─────────────────────────────────────────────────────────────┐
│ HTML: index.html, modul.html, selesai.html                  │
│ Struktur dan placeholder; tanpa logika data.                │
└───────────────────────────┬─────────────────────────────────┘
                            │ <script type="module">
┌───────────────────────────▼─────────────────────────────────┐
│ js/pages/                                                    │
│ dashboard.js   modul.js   selesai.js                        │
│ Mengatur satu halaman, memanggil fitur, menulis DOM.        │
└───────────────────────────┬─────────────────────────────────┘
                            │ import
┌───────────────────────────▼─────────────────────────────────┐
│ js/features/                                                 │
│ katalog.js  editor.js  latihan.js  kuis.js                  │
│ python-runner.js  sidebar.js  transisi-halaman.js           │
│ Komponen yang dapat dipakai ulang dan tidak tahu halaman.   │
└───────────────────────────┬─────────────────────────────────┘
                            │ postMessage
┌─────────────────────────────────────────────────────────────┐
│ js/workers/pyodide-worker.js                                │
│ Memuat Pyodide dan mengeksekusi kode di thread terpisah.    │
└─────────────────────────────────────────────────────────────┘

data/*.json  +  data/modul-XX/*  →  dibaca lewat fetch()
css/*.css                        →  tampilan dan token warna
```

Aturan arah dependensi:

- `pages` boleh mengimpor `features`.
- `features` tidak boleh mengimpor `pages`.
- `workers` tidak mengimpor kode halaman.
- Semua akses `fetch()` ke data modul terjadi di `pages` atau `katalog.js`.

## 3. Tanggung jawab berkas

| Berkas | Tanggung jawab |
|---|---|
| `js/pages/dashboard.js` | Memuat katalog, merender kartu, menghitung modul tersedia, dan menyinkronkan navigasi section. |
| `js/pages/modul.js` | Orkestrasi halaman modul: katalog, meta, materi, video, latihan, kuis, tahap, dan tombol. |
| `js/pages/selesai.js` | Menentukan status akhir berdasarkan katalog dan merender langkah lanjutan. |
| `js/features/katalog.js` | Sumber tunggal `daftar-modul.json`; cache, pengurutan, pencarian, dan cek ketersediaan. |
| `js/features/editor.js` | Membuat CodeMirror, membaca/mengisi kode, dan mengunci editor. |
| `js/features/latihan.js` | Menormalkan output dan membandingkannya dengan target. |
| `js/features/kuis.js` | Validasi data kuis, render soal, penilaian, pembahasan, dan reset. |
| `js/features/python-runner.js` | Membuat/membuang Worker, menangani pesan, timeout, Stop, dan error. |
| `js/features/sidebar.js` | Drawer responsif, `inert`, tirai, Escape, dan pengembalian fokus. |
| `js/features/transisi-halaman.js` | Lapisan transisi saat berpindah halaman internal. |
| `js/workers/pyodide-worker.js` | Memuat Pyodide, menangkap stdout/stderr, menjalankan kode di namespace baru. |

## 4. Alur dashboard

```text
index.html
  └─ dashboard.js
       ├─ siapkanSidebar()
       ├─ siapkanTransisiHalaman()
       └─ muatKatalog()
            ├─ sukses → tampilkanDaftarModul()
            │            ├─ kartu "tersedia" → tautan modul.html?id=N
            │            └─ kartu "segera"   → tombol nonaktif
            └─ gagal  → status error, jumlah tersedia = "—"
```

Dashboard tidak memakai `meta.json`. Semua informasi kartu berasal dari
katalog agar ringan dan konsisten.

## 5. Alur halaman modul

### 5.1 Urutan mulai

```text
modul.html?id=N
  └─ modul.js
       ├─ siapkanSidebar(), siapkanTransisiHalaman()
       ├─ siapkanEditor()            → tombol Run masih terkunci
       ├─ tampilkanTahap(hash)       → #belajar / #latihan / #kuis
       └─ muatModul()
            ├─ validasi id
            ├─ muatKatalog()
            ├─ cariModul()
            ├─ tampilkanNavigasiModul()
            ├─ cek status "tersedia"
            │    └─ tidak → tampilkanKesalahan("Modul belum tersedia")
            ├─ fetch meta.json
            ├─ modulSiap = true
            └─ Promise.all([
                 muatLatihan(),
                 muatMateri(),
                 muatKuis()
               ])
```

Katalog dimuat **sebelum** `meta.json`. Dengan begitu modul yang masih
`segera` tidak menghasilkan permintaan 404, melainkan pesan yang sesuai.
Kegagalan salah satu bagian (misalnya `latihan.json` hilang) tidak
menggagalkan seluruh halaman; bagian itu menampilkan keadaan kosong.

### 5.2 Tahap dan hash

Tahap disimpan di hash URL:

- `#belajar`
- `#latihan`
- `#kuis`

`namaTahapDariHash()` mengubah hash asing menjadi `belajar`.
`tampilkanTahap()` menyelaraskan panel, tautan sidebar, bilah tahap, remah,
dan `aria-current`. Perpindahan tahap memakai View Transition bila tersedia;
jika tidak, animasi CSS sederhana. Pengguna dengan
`prefers-reduced-motion: reduce` tidak mendapat animasi atau smooth scroll.

Saat pengguna meninggalkan tahap Latihan ketika program masih berjalan,
program dihentikan dan Worker dibuang agar tidak ada pekerjaan tersembunyi.

### 5.3 Keadaan latihan

```text
latihanSiap=false, editor terkunci untuk Periksa
        │ muatLatihan()
        ▼
kode awal terisi, latihanSiap=true
        │ Periksa Output
        ▼
output dibandingkan dengan target
   ├─ cocok   → latihanBenar=true, tombol Lanjut ke Kuis muncul
   └─ beda    → percobaan++, petunjuk bertambah
                 └─ percobaan >= 3 → solusi ditampilkan
```

Aturan penting:

- Memuat kode awal tidak dihitung sebagai perubahan pengguna
  (`sedangMengisiKode`).
- Setelah latihan benar, mengubah kode membatalkan status benar agar hasil
  edit harus diperiksa ulang.
- Hanya pemeriksaan yang benar-benar selesai dinilai. Stop manual dan
  perpindahan tahap tidak menambah percobaan.
- Semua keadaan hilang saat halaman dimuat ulang.

### 5.4 Siklus Worker Pyodide

```text
jalankanProgram()
  ├─ aturProses(true)          → Run/Periksa nonaktif, Stop belum aktif
  ├─ pastikanPython()
  │    └─ siapkanPython()      → buat Worker, muat Pyodide sekali
  ├─ aturProses(true, true)    → Stop aktif
  ├─ jalankanKode(kode)
  │    ├─ postMessage({kode})
  │    ├─ worker → output / selesai
  │    └─ timer 5 detik → hentikan()
  └─ finally
       ├─ editor dibuka kembali
       └─ aturProses(false)
```

Setiap Stop, timeout, error Worker, atau perpindahan tahap memanggil
`bersihkanWorker()`:

- `worker.terminate()`
- `worker = null`
- `janjiSiap = null`

Worker baru dibuat pada eksekusi berikutnya. Konsekuensinya, Pyodide perlu
dimuat ulang setelah penghentian. Ini disengaja: Pyodide tidak menyediakan
cara aman untuk menghentikan kode Python yang sedang berjalan dari luar.

Di dalam Worker, setiap program dijalankan dengan
`pyodide.globals.get("dict")()` sebagai namespace baru. Variabel dari
eksekusi sebelumnya tidak bocor. Objek namespace dihancurkan setelah
eksekusi untuk menjaga memori.

### 5.5 Output dan error

- stdout dan stderr dikirim terpisah dari Worker, lalu digabung di panel
  output.
- Output dibatasi 10.000 karakter; setelah itu muncul keterangan
  `... (output dipotong)`.
- Pesan error Python tetap ditampilkan sebagai bagian dari output agar
  mahasiswa dapat membaca penyebabnya.
- Panel output selalu memakai `textContent`, bukan `innerHTML`.

### 5.6 Tujuan setelah lulus

`tentukanTujuanLanjut()` memakai katalog:

1. Jika modul berikutnya ada dan `tersedia`, tampilkan tautan ke modul itu.
2. Jika tidak ada atau belum tersedia, arahkan ke
   `selesai.html?id=<nomor modul>`.

Tidak ada logika khusus “id >= 8”; modul terakhir dikenali dari tidak adanya
modul berikutnya di katalog.

## 6. Halaman penutup

`selesai.html?id=N` menerima id dari URL. Perilakunya:

| Keadaan | Tampilan |
|---|---|
| `id` tidak valid | Pesan nomor modul tidak valid |
| `id` tidak ada di katalog | Modul belum terdaftar |
| Modul `segera` dan bukan modul terakhir | “Modul belum tersedia” |
| Modul terakhir masih `segera` | “Mini project segera” |
| Modul `tersedia` dengan modul berikutnya `tersedia` | “Modul N selesai!” + tautan lanjut |
| Modul `tersedia` tanpa modul berikutnya | “Kursus selesai” + tautan mini project |

Halaman ini tidak menerima atau menyimpan nilai kuis. Status hanya
disimpulkan dari katalog dan `meta.json` (untuk judul).

## 7. Kuis

`kuis.js` memisahkan tiga hal:

1. `validasiKuis()` — memastikan struktur data benar sebelum dirender.
2. `buatKuis()` — membuat DOM dan memasang interaksi.
3. `hitungNilai()` — menghitung nilai 0–100.

Setelah submit:

- Semua input radio dinonaktifkan.
- Jawaban benar dan salah ditandai.
- Pembahasan dibuka.
- Tombol submit berubah menjadi “Jawaban sudah dikumpulkan”.
- Jika gagal, tombol **Ulangi Modul** mereset kuis dan memanggil callback
  halaman untuk kembali ke tahap Belajar.

Jumlah soal tidak dikunci di kode; `kuis.json` menentukan jumlahnya. Kunci
jawaban memakai huruf `A`–`D`, dan jumlah pilihan boleh 2–4.

## 8. Sidebar dan aksesibilitas

- Breakpoint drawer: `max-width: 1024px`.
- Saat tertutup di mobile, sidebar diberi `inert` dan `aria-hidden="true"`.
- Saat dibuka, fokus dipindahkan ke tautan pertama.
- Escape, klik tirai, atau klik tautan menutup drawer.
- Fokus dikembalikan ke tombol menu setelah drawer ditutup.
- Saat layar melewati 1024 px, `inert` dan `aria-hidden` dibersihkan.

## 9. Keamanan dan ketahanan

- Teks dari data JSON ditulis dengan `textContent`.
- `innerHTML` hanya dipakai untuk `materi.html`, yang merupakan konten
  proyek dan tidak berasal dari input pengguna.
- Output Python dibatasi panjangnya.
- Eksekusi Python dibatasi 5 detik dan dapat dihentikan manual.
- Semua kegagalan `fetch()` ditangkap dan ditampilkan sebagai pesan yang
  dapat dibaca, bukan layar kosong.
- CDN yang gagal dimuat tidak membuat halaman crash; editor atau Python
  menampilkan status gagal dan tombol yang sesuai.

## 10. Titik perluasan

### Menambah modul

Cukup tambah folder `data/modul-XX`, lengkapi empat berkas, lalu ubah status
di katalog. Tidak perlu mengubah JavaScript bila skema data tidak berubah.

### Menambah jenis media

Tambahkan tab/panel di `modul.html`, lalu perluas `terapkanMedia()` dan
`tampilkanMedia()` di `modul.js`.

### Mengubah penilaian latihan

Ubah `normalisasiOutput()` atau `bandingkanOutput()` di
`js/features/latihan.js`. Perubahan akan berlaku untuk semua modul.

### Menambah dukungan `input()`

Saat ini `input()` belum terhubung ke browser. Untuk mendukungnya, tambahkan
mekanisme `setStdin` di Worker dan saluran prompt di halaman. Jangan memakai
`input()` di materi/latihan sebelum fitur ini selesai.

### Menyimpan progres

Saat ini tidak ada penyimpanan. Jika nanti ditambahkan, letakkan di lapisan
fitur terpisah (misalnya `js/features/progres.js`) dan jangan mencampur
logika penyimpanan ke `kuis.js` atau `latihan.js`.

## 11. Konvensi kode

- Nama variabel, fungsi, dan komentar memakai Bahasa Indonesia.
- Setiap berkas diawali blok komentar: peran, pemakai, alur, dan catatan.
- Bagian besar dipisahkan dengan komentar section.
- Fungsi yang tidak langsung jelas diberi JSDoc singkat.
- Warna hanya lewat token di `css/variables.css`.
- Jangan menambah dependency tanpa persetujuan.
