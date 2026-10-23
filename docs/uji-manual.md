# Uji Manual PYLearn

Checklist ini dipakai sebelum menambah modul, mengubah fitur, atau merilis
perubahan. Jalankan dengan HTTP server (bukan `file://`) dan koneksi internet
aktif untuk CodeMirror/Pyodide.

## Persiapan

1. Dari folder proyek, jalankan:

   ```bash
   python -m http.server 8000
   ```

2. Buka <http://localhost:8000/index.html>.
3. Buka DevTools → Console dan pastikan tidak ada error saat halaman dimuat.
4. Untuk uji ulang setelah mengubah JavaScript, lakukan hard refresh
   (`Ctrl+Shift+R`) atau aktifkan **Disable cache** di panel Network.

## 1. Dashboard

- [ ] Delapan kartu modul tampil berurutan.
- [ ] Modul yang `tersedia` menampilkan tautan **Buka Modul**.
- [ ] Modul `segera` menampilkan tombol nonaktif dan tidak dapat diklik.
- [ ] Angka “Modul tersedia” di sidebar sesuai isi katalog.
- [ ] Klik menu **Dashboard** dan **Daftar Modul** menggeser halaman serta
      penanda biru mengikuti section aktif.
- [ ] Pada lebar < 1024 px, sidebar berubah menjadi drawer.

## 2. Halaman modul — Belajar

Buka `modul.html?id=1`.

- [ ] Judul, nomor, deskripsi, jumlah subbab, dan jumlah video terisi.
- [ ] Tujuan pembelajaran tampil.
- [ ] Remah dan kartu sidebar menampilkan modul yang benar.
- [ ] Tab **Teks** menampilkan `materi.html`.
- [ ] Tab **Video** menampilkan iframe YouTube; tidak ada iframe rusak.
- [ ] Klik setiap subbab di daftar kanan menggulir ke section yang benar.
- [ ] Saat halaman digulir, subbab aktif di daftar kanan ikut berubah.
- [ ] Navigasi **Modul sebelumnya/berikutnya** sesuai katalog; modul `segera`
      tidak berupa tautan aktif.

## 3. Halaman modul — Latihan

Buka `modul.html?id=1#latihan`.

- [ ] Editor CodeMirror muncul dan berisi kode awal.
- [ ] Tombol **Jalankan** dan **Periksa Output** aktif setelah data latihan
      selesai dimuat.
- [ ] Klik **Jalankan** menampilkan output di panel dan status “Python siap.”
- [ ] Saat program berjalan, editor tidak dapat diubah.
- [ ] Klik **Periksa Output** dengan kode salah:
  - [ ] status berubah menjadi “Belum sesuai · 1/3”;
  - [ ] petunjuk pertama muncul;
  - [ ] solusi belum terbuka.
- [ ] Ulangi sampai percobaan ketiga:
  - [ ] status “Solusi terbuka”;
  - [ ] seluruh petunjuk dan solusi tampil.
- [ ] Masukkan kode yang benar, klik **Periksa Output**:
  - [ ] status “Benar”;
  - [ ] tombol **Lanjut ke Kuis** muncul.
- [ ] Ubah kode setelah benar:
  - [ ] status benar dibatalkan;
  - [ ] umpan balik lama hilang.
- [ ] Klik **Lanjut ke Kuis** membuka tahap Kuis.
- [ ] Muat ulang halaman: percobaan kembali nol dan kode kembali ke kode awal.

## 4. Eksekusi Python

- [ ] Kode `print("Halo")` menampilkan `Halo`.
- [ ] Kode yang error (misalnya `print(`) menampilkan pesan traceback yang
      dapat dibaca, bukan layar kosong.
- [ ] Output sangat panjang berhenti dan menampilkan
      `... (output dipotong)`.
- [ ] Kode `while True: pass` dihentikan otomatis setelah ±5 detik dengan
      pesan batas waktu.
- [ ] Klik **Stop** saat program berjalan:
  - [ ] program berhenti;
  - [ ] status “Program dihentikan.”;
  - [ ] output menyebut alasan penghentian;
  - [ ] tombol **Jalankan** aktif kembali.
- [ ] Setelah Stop/timeout, jalankan kode lagi; Pyodide dimuat ulang dan kode
      tetap berjalan.
- [ ] Jalankan `x = 123`, lalu jalankan `print(x)` di eksekusi terpisah:
      hasilnya `NameError`, bukan `123` (namespace bersih).
- [ ] Berpindah dari Latihan ke Kuis saat program berjalan menghentikan
      program dan tidak meninggalkan output baru.

## 5. Halaman modul — Kuis

Buka `modul.html?id=1#kuis`.

- [ ] Jumlah soal sesuai `kuis.json`.
- [ ] Batas lulus yang tampil sesuai `kuis.json`.
- [ ] Klik **Kumpulkan Jawaban** tanpa menjawab:
  - [ ] peringatan menyebut nomor soal yang kosong;
  - [ ] halaman menggulir ke soal pertama yang kosong.
- [ ] Jawab semua dengan benar, kumpulkan:
  - [ ] nilai `100/100`;
  - [ ] semua pembahasan terbuka;
  - [ ] semua radio nonaktif;
  - [ ] tombol kumpulkan nonaktif.
- [ ] Muat ulang, jawab semua salah, kumpulkan:
  - [ ] nilai `0/100`;
  - [ ] jawaban benar dan salah ditandai;
  - [ ] tombol **Ulangi Modul** muncul.
- [ ] Klik **Ulangi Modul**:
  - [ ] kembali ke tahap Belajar;
  - [ ] jawaban dan hasil kuis bersih.
- [ ] Jika lulus dan modul berikutnya tersedia, tombol lanjut menuju modul
      tersebut.
- [ ] Jika lulus dan modul berikutnya belum tersedia, tombol lanjut menuju
      `selesai.html?id=<id>`.

## 6. Modul belum tersedia dan id salah

- [ ] `modul.html?id=5` (atau modul `segera` lain) menampilkan
      **"Modul belum tersedia"**, bukan "Gagal memuat modul" atau 404.
- [ ] `modul.html?id=8` menampilkan pesan mini project masih disiapkan.
- [ ] `modul.html?id=abc`, `?id=0`, dan tanpa `?id` menampilkan pesan nomor
      tidak valid.
- [ ] `modul.html?id=99` menampilkan “Modul tidak ditemukan”.
- [ ] Tombol **Jalankan**, **Periksa Output**, dan **Stop** nonaktif pada
      keadaan modul tidak tersedia.
- [ ] Navigasi sebelumnya/berikutnya tetap masuk akal dan tidak membuka
      halaman yang salah.

## 7. Halaman penutup

- [ ] `selesai.html?id=1` menampilkan "Modul 1 selesai!" dan tautan yang
      sesuai.
- [ ] `selesai.html?id=2` menampilkan "Modul 2 selesai!" dan status
      **Lulus** dengan tautan **Lanjut ke Modul 3**.
- [ ] `selesai.html?id=3` menampilkan "Modul 3 selesai!" dan status
      **Lulus** dengan tautan **Lanjut ke Modul 4**.
- [ ] `selesai.html?id=4` menampilkan "Modul 4 selesai!" dan status
      **Selesai** karena Modul 5 belum tersedia.
- [ ] Tautan sidebar "Halaman Penutup" mempertahankan `?id=1`.
- [ ] `selesai.html?id=abc` menampilkan pesan id tidak valid.
- [ ] `selesai.html?id=5` (modul `segera`) menampilkan "Modul belum tersedia",
      bukan "selesai".
- [ ] `selesai.html?id=8` menampilkan "Mini project segera".
- [ ] Tidak ada tautan ke modul yang belum tersedia.

## 8. Mobile dan aksesibilitas

Uji pada lebar 390 px (DevTools device toolbar).

- [ ] Sidebar tertutup dan tidak dapat dijangkau Tab (`inert`).
- [ ] Tombol menu memiliki `aria-expanded="false"`.
- [ ] Klik tombol menu:
  - [ ] drawer terbuka;
  - [ ] `aria-expanded="true"`;
  - [ ] fokus pindah ke tautan pertama di sidebar;
  - [ ] tirai gelap tampil.
- [ ] Tekan **Escape**: drawer tertutup dan fokus kembali ke tombol menu.
- [ ] Klik tirai: drawer tertutup dan fokus kembali ke tombol menu.
- [ ] Klik tautan di drawer: halaman berpindah dan drawer tertutup.
- [ ] Perbesar jendela melewati 1024 px: sidebar tampil penuh dan atribut
      `inert`/`aria-hidden` hilang.
- [ ] Semua tombol dapat difokuskan dengan Tab dan memiliki label yang jelas.
- [ ] Preferensi **Reduce motion** mematikan animasi dan smooth scroll.

## 9. Ketahanan dan kegagalan

- [ ] Buka halaman tanpa HTTP server (`file://`): muncul pesan yang
      menyarankan HTTP server, bukan layar kosong.
- [ ] Blokir CDN CodeMirror: halaman tetap tampil dan status editor
      menunjukkan kegagalan; tombol tidak membuka editor rusak.
- [ ] Blokir CDN Pyodide: klik Jalankan menampilkan pesan gagal yang dapat
      dibaca; percobaan berikutnya mencoba memuat ulang, bukan memakai worker
      yang sudah mati.
- [ ] Rusak sementara `latihan.json`: materi dan kuis tetap tampil; panel
      latihan menampilkan keadaan kosong.
- [ ] Rusak sementara `kuis.json`: materi dan latihan tetap tampil; panel
      kuis menampilkan “Kuis belum tersedia”.
- [ ] Katalog gagal dimuat: dashboard menampilkan pesan error dan jumlah
      modul menjadi “—”, bukan angka statis yang menyesatkan.

## 10. Pemeriksaan akhir

- [ ] Console tidak menampilkan error tak terduga.
- [ ] Tidak ada permintaan 404 untuk modul yang seharusnya `segera`.
- [ ] `node --check` lulus untuk semua berkas JavaScript (opsional, untuk
      pengembang).
- [ ] Semua JSON dapat di-parse.
- [ ] `git diff --check` tidak melaporkan spasi/konflik.
- [ ] Perubahan dokumentasi sesuai dengan perilaku aplikasi.
