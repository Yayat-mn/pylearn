/**
 * ============================================================
 * DASHBOARD
 * ------------------------------------------------------------
 * Peran   : merender daftar modul dari katalog dan mengatur
 *           navigasi section pada halaman index.html.
 * Dipakai : index.html
 * Data    : data/daftar-modul.json (lewat features/katalog.js).
 * Alur    : muatKatalog() -> kartu modul -> penanda sidebar.
 * ============================================================
 */

import { muatKatalog } from "../features/katalog.js";
import { siapkanSidebar } from "../features/sidebar.js";
import { siapkanTransisiHalaman } from "../features/transisi-halaman.js";

// ------------------------------------------------------------
// Referensi elemen dan penyiapan awal
// ------------------------------------------------------------

const wadahModul = document.getElementById("wadah-modul");
const statusModul = document.getElementById("status-modul");
const jumlahTersedia = document.getElementById("jumlah-tersedia");

const sidebar = document.getElementById("sidebar");
const tombolMenu = document.getElementById("tombol-menu");
const tirai = document.getElementById("tirai");

const tautanBagian = [
  ...document.querySelectorAll(".navigasi-utama__tautan[data-bagian]"),
];
const penandaNavigasi = document.querySelector(".navigasi-utama__penanda");
const bagianDashboard = document.getElementById("dashboard");
const bagianDaftarModul = document.getElementById("daftar-modul");

siapkanSidebar({ sidebar, tombolMenu, tirai });
siapkanTransisiHalaman();

// ------------------------------------------------------------
// Kartu modul
// ------------------------------------------------------------

// Membuat lencana status kecil dengan warna sesuai jenisnya.
function buatLencana(teks, jenis) {
  const lencana = document.createElement("span");
  lencana.className = `lencana lencana--${jenis}`;
  lencana.textContent = teks;
  return lencana;
}

/**
 * Membuat satu kartu modul. Kartu modul "segera" sengaja tidak memakai
 * tautan agar tidak membuka halaman yang materinya belum ada.
 *
 * @param {object} modul entri katalog
 * @returns {HTMLElement}
 */
function buatKartuModul(modul) {
  const tersedia = modul.status === "tersedia";
  const nomor = String(modul.id).padStart(2, "0");

  const kartu = document.createElement("article");
  kartu.className = tersedia
    ? "kartu-modul"
    : "kartu-modul kartu-modul--segera";
  kartu.setAttribute("aria-labelledby", `judul-modul-${modul.id}`);

  // Bagian kiri: nomor, label, judul, dan deskripsi.
  const kiri = document.createElement("div");
  kiri.className = "kartu-modul__kiri";

  const nomorModul = document.createElement("div");
  nomorModul.className = "kartu-modul__nomor";
  nomorModul.textContent = nomor;
  nomorModul.setAttribute("aria-hidden", "true");

  const info = document.createElement("div");
  info.className = "kartu-modul__info";

  const meta = document.createElement("div");
  meta.className = "kartu-modul__meta";

  const label = document.createElement("strong");
  label.textContent = `Modul ${nomor}`;

  const titik = document.createElement("span");
  titik.className = "titik-pemisah";
  titik.setAttribute("aria-hidden", "true");

  meta.append(
    label,
    titik,
    buatLencana(
      tersedia ? "Tersedia" : "Segera",
      tersedia ? "tersedia" : "segera"
    )
  );

  const judul = document.createElement("h3");
  judul.className = "kartu-modul__judul";
  judul.id = `judul-modul-${modul.id}`;
  judul.textContent = modul.judul;

  const deskripsi = document.createElement("p");
  deskripsi.className = "kartu-modul__deskripsi";
  deskripsi.textContent = modul.deskripsi;

  info.append(meta, judul, deskripsi);
  kiri.append(nomorModul, info);

  // Bagian kanan: jumlah subbab dan tombol aksi.
  const kanan = document.createElement("div");
  kanan.className = "kartu-modul__kanan";

  const subbab = document.createElement("span");
  subbab.className = "kartu-modul__subbab";
  subbab.textContent = `${modul.jumlahSubbab} subbab`;
  kanan.append(subbab);

  if (tersedia) {
    const tautan = document.createElement("a");
    tautan.className = "tombol tombol--kecil";
    tautan.href = `modul.html?id=${modul.id}`;
    tautan.setAttribute(
      "aria-label",
      `Buka Modul ${modul.id}: ${modul.judul}`
    );

    const panah = document.createElement("span");
    panah.setAttribute("aria-hidden", "true");
    panah.textContent = "→";

    tautan.append("Buka Modul ", panah);
    kanan.append(tautan);
  } else {
    const nonaktif = document.createElement("span");
    nonaktif.className = "tombol tombol--kecil tombol--nonaktif";
    nonaktif.setAttribute("aria-disabled", "true");
    nonaktif.textContent = "Segera hadir";
    kanan.append(nonaktif);
  }

  kartu.append(kiri, kanan);
  return kartu;
}

/**
 * Mengganti isi wadah dengan kartu-kartu modul dan memperbarui jumlah
 * modul yang tersedia di sidebar.
 *
 * @param {Array<object>} daftar
 */
function tampilkanDaftarModul(daftar) {
  wadahModul.replaceChildren();

  let jumlahModulTersedia = 0;

  daftar.forEach((modul) => {
    wadahModul.appendChild(buatKartuModul(modul));

    if (modul.status === "tersedia") {
      jumlahModulTersedia += 1;
    }
  });

  jumlahTersedia.textContent = String(jumlahModulTersedia);
  statusModul.hidden = true;
}

/**
 * Memuat katalog dan merender daftar. Jika gagal, tampilkan pesan dan
 * jangan biarkan angka statis di HTML menyesatkan pembaca.
 */
async function muatDaftarModul() {
  try {
    const daftar = await muatKatalog();
    tampilkanDaftarModul(daftar);
  } catch (error) {
    console.error("Gagal memuat daftar modul:", error);

    // Jangan biarkan angka statis dari HTML tampil seolah katalog berhasil.
    jumlahTersedia.textContent = "—";
    statusModul.hidden = false;
    statusModul.classList.add("status-modul--gagal");
    statusModul.textContent =
      "Gagal memuat daftar modul. Pastikan halaman dibuka lewat HTTP server (Live Server), bukan file://.";
  }
}

// ------------------------------------------------------------
// Navigasi section aktif dan penanda biru yang bergeser
// ------------------------------------------------------------

const AMBANG_BAGIAN = 140;

let kunciNavigasiSampai = 0;
let permintaanGulir = null;

/**
 * Menempatkan penanda biru tepat di belakang tautan sidebar yang aktif.
 * Dihitung dari offset elemen agar tetap pas saat teks/font berubah.
 */
function perbaruiPenanda() {
  if (!penandaNavigasi) return;

  const tautanAktif = tautanBagian.find((tautan) =>
    tautan.classList.contains("navigasi-utama__tautan--aktif")
  );

  if (!tautanAktif) {
    penandaNavigasi.hidden = true;
    return;
  }

  penandaNavigasi.hidden = false;
  penandaNavigasi.style.height = `${tautanAktif.offsetHeight}px`;
  penandaNavigasi.style.transform = `translateY(${tautanAktif.offsetTop}px)`;
  penandaNavigasi.parentElement.classList.add("navigasi-utama--siap");
}

/**
 * Menandai satu section sebagai aktif.
 *
 * @param {"dashboard"|"daftar-modul"} nama
 * @param {boolean} kunci true saat menu diklik, agar status aktif tidak
 *   langsung ditimpa oleh scroll halus yang masih berjalan
 */
function aturNavigasiAktif(nama, kunci = false) {
  tautanBagian.forEach((tautan) => {
    const aktif = tautan.dataset.bagian === nama;

    tautan.classList.toggle("navigasi-utama__tautan--aktif", aktif);

    if (aktif) {
      tautan.setAttribute("aria-current", "location");
    } else {
      tautan.removeAttribute("aria-current");
    }
  });

  // Saat menu diklik, tahan status aktif sampai smooth scroll selesai.
  if (kunci) {
    kunciNavigasiSampai = performance.now() + 1500;
  }

  perbaruiPenanda();
}

/**
 * Menentukan section yang sedang terlihat berdasarkan posisi daftar modul.
 * Pemindaian hanya menulis DOM bila status benar-benar berubah.
 */
function periksaBagianAktif() {
  if (!bagianDashboard || !bagianDaftarModul) return;
  if (performance.now() < kunciNavigasiSampai) return;

  const posisiDaftar = bagianDaftarModul.getBoundingClientRect().top;
  const namaAktif =
    posisiDaftar <= AMBANG_BAGIAN ? "daftar-modul" : "dashboard";

  const tautanAktif = tautanBagian.find((tautan) =>
    tautan.classList.contains("navigasi-utama__tautan--aktif")
  );

  // Hindari penulisan DOM berulang saat posisi belum berubah.
  if (tautanAktif && tautanAktif.dataset.bagian === namaAktif) return;

  aturNavigasiAktif(namaAktif);
}

tautanBagian.forEach((tautan) => {
  tautan.addEventListener("click", () => {
    aturNavigasiAktif(tautan.dataset.bagian, true);
  });
});

window.addEventListener("scroll", () => {
  if (permintaanGulir !== null) return;

  permintaanGulir = requestAnimationFrame(() => {
    permintaanGulir = null;
    periksaBagianAktif();
  });
}, { passive: true });

// scrollend tersedia di Chromium; fallback-nya adalah batas waktu di atas.
if ("onscrollend" in window) {
  window.addEventListener("scrollend", () => {
    kunciNavigasiSampai = 0;
    periksaBagianAktif();
  });
}

const hashAwal = window.location.hash;
aturNavigasiAktif(
  hashAwal === "#daftar-modul" ? "daftar-modul" : "dashboard"
);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(perbaruiPenanda);
}

window.addEventListener("resize", perbaruiPenanda);

muatDaftarModul();
