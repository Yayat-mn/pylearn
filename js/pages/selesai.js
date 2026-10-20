/**
 * ============================================================
 * HALAMAN PENUTUP
 * ------------------------------------------------------------
 * Peran   : menampilkan ringkasan modul yang selesai dan langkah
 *           berikutnya (modul lanjutan atau kembali ke dashboard).
 * Dipakai : selesai.html
 * Data    : data/daftar-modul.json + meta.json modul terkait.
 * Catatan : nilai kuis tidak pernah dikirim ke halaman ini dan tidak
 *           disimpan; status hanya disimpulkan dari katalog.
 * ============================================================
 */

import {
  cariModul,
  modulBerikutnya,
  modulTersedia,
  muatKatalog,
} from "../features/katalog.js";
import { siapkanSidebar } from "../features/sidebar.js";
import { siapkanTransisiHalaman } from "../features/transisi-halaman.js";

const elemen = {
  lencana: document.getElementById("lencana-selesai"),
  ikon: document.getElementById("ikon-selesai"),
  judul: document.getElementById("judul-selesai"),
  teks: document.getElementById("teks-selesai"),
  modul: document.getElementById("selesai-modul"),
  status: document.getElementById("selesai-status"),
  aksi: document.getElementById("aksi-selesai"),
  catatan: document.getElementById("catatan-selesai"),
  lencanaTopbar: document.getElementById("lencana-topbar"),
  sidebarJudul: document.getElementById("sidebar-judul-selesai"),
  sidebarInfo: document.getElementById("sidebar-info-selesai"),
  tautanSelesai: document.getElementById("tautan-selesai"),
};

const sidebar = document.getElementById("sidebar");
const tombolMenu = document.getElementById("tombol-menu");
const tirai = document.getElementById("tirai");

siapkanSidebar({ sidebar, tombolMenu, tirai });
siapkanTransisiHalaman();
aturPenandaSidebar();
muatSelesai();

// ------------------------------------------------------------
// Penanda menu sidebar
// ------------------------------------------------------------

// Menempatkan penanda biru pada menu yang sedang aktif.
function aturPenandaSidebar() {
  const aktif = document.querySelector(
    ".navigasi-utama__tautan--aktif"
  );
  const penanda = document.querySelector(".navigasi-utama__penanda");

  if (!aktif || !penanda) return;

  const atur = () => {
    penanda.hidden = false;
    penanda.style.height = `${aktif.offsetHeight}px`;
    penanda.style.transform = `translateY(${aktif.offsetTop}px)`;
    penanda.parentElement.classList.add("navigasi-utama--siap");
  };

  atur();
  window.addEventListener("resize", atur);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(atur);
  }
}

// ------------------------------------------------------------
// Pembentuk tampilan
// ------------------------------------------------------------

// Membuat tautan bergaya tombol untuk aksi halaman penutup.
function buatTautan(label, href, garis = false) {
  const tautan = document.createElement("a");
  tautan.className = `tombol${garis ? " tombol--garis" : ""}`;
  tautan.href = href;
  tautan.textContent = label;
  return tautan;
}

/**
 * Menulis satu keadaan halaman sekaligus. Semua cabang di bawah memakai
 * fungsi ini agar elemen yang harus berubah tidak ada yang terlewat.
 *
 * @param {{
 *   ikon?: string,
 *   lencanaTeks: string,
 *   lencanaJenis?: "tersedia"|"segera"|"bahaya",
 *   judul: string,
 *   teks: string,
 *   status: string,
 *   catatan: string,
 *   aksi?: HTMLElement[],
 *   topbarTeks?: string,
 *   topbarJenis?: "tersedia"|"segera"|"bahaya",
 *   sidebarJudul?: string,
 *   sidebarInfo?: string
 * }} tampilan
 */
function terapkanTampilan({
  ikon = "✓",
  lencanaTeks,
  lencanaJenis = "tersedia",
  judul,
  teks,
  status,
  catatan,
  aksi = [],
  topbarTeks = lencanaTeks,
  topbarJenis = lencanaJenis,
  sidebarJudul = "Halaman penutup",
  sidebarInfo = "",
}) {
  elemen.ikon.textContent = ikon;

  elemen.lencana.className = `lencana lencana--${lencanaJenis}`;
  elemen.lencana.textContent = lencanaTeks;

  elemen.judul.textContent = judul;
  elemen.teks.textContent = teks;
  elemen.status.textContent = status;
  elemen.catatan.textContent = catatan;

  elemen.aksi.replaceChildren(...aksi);

  elemen.lencanaTopbar.className = `lencana lencana--${topbarJenis}`;
  elemen.lencanaTopbar.textContent = topbarTeks;

  elemen.sidebarJudul.textContent = sidebarJudul;
  elemen.sidebarInfo.textContent = sidebarInfo;
}

/**
 * Menampilkan keadaan gagal yang seragam untuk id salah, modul tidak
 * terdaftar, atau katalog yang tidak dapat dimuat.
 *
 * @param {string} pesan
 */
function tampilkanKesalahan(pesan) {
  document.title = "Halaman Penutup — PYLearn";

  terapkanTampilan({
    ikon: "!",
    lencanaTeks: "Tidak tersedia",
    lencanaJenis: "bahaya",
    judul: "Halaman penutup",
    teks: pesan,
    status: "—",
    catatan: "Kembali ke dashboard untuk melihat modul yang sudah tersedia.",
    aksi: [buatTautan("Kembali ke Dashboard", "index.html")],
    topbarTeks: "Tidak tersedia",
    topbarJenis: "bahaya",
    sidebarInfo: "Ringkasan modul tidak dapat dimuat.",
  });
}

// ------------------------------------------------------------
// Pemuatan data
// ------------------------------------------------------------

async function muatSelesai() {
  const params = new URLSearchParams(window.location.search);
  const nilaiId = params.get("id");
  const id =
    nilaiId === null || nilaiId.trim() === "" ? 1 : Number(nilaiId);

  if (!Number.isInteger(id) || id < 1) {
    tampilkanKesalahan(
      "Nomor modul tidak valid. Kembali ke dashboard untuk memilih modul."
    );
    return;
  }

  // Menu sidebar harus tetap menunjuk modul yang sedang dibuka.
  if (elemen.tautanSelesai) {
    elemen.tautanSelesai.href = `selesai.html?id=${id}`;
  }

  try {
    const daftar = await muatKatalog();
    const entri = cariModul(daftar, id);

    if (!entri) {
      tampilkanKesalahan(
        `Modul ${id} belum terdaftar dalam kurikulum. Kembali ke dashboard untuk memilih modul.`
      );
      return;
    }

    const berikutnya = modulBerikutnya(daftar, id);
    const modulTerakhir = !berikutnya;

    let judulModul = entri.judul || `Modul ${id}`;

    // Meta hanya diambil untuk modul yang sudah tersedia agar tidak memicu
    // permintaan 404 pada modul yang masih disiapkan.
    if (modulTersedia(entri)) {
      try {
        const folder = entri.slug || `modul-${String(id).padStart(2, "0")}`;
        const responsMeta = await fetch(`data/${folder}/meta.json`);

        if (responsMeta.ok) {
          const meta = await responsMeta.json();
          judulModul = meta.judul || judulModul;
        }
      } catch (error) {
        console.warn("Meta modul tidak dapat dimuat:", error);
      }
    }

    elemen.modul.textContent = judulModul;

    // Modul terakhir adalah mini project. Jangan tampilkan tautan bila
    // materinya belum siap.
    if (modulTerakhir) {
      if (!modulTersedia(entri)) {
        document.title = "Mini Project Segera — PYLearn";
        terapkanTampilan({
          ikon: "✓",
          lencanaTeks: "Mini project segera",
          lencanaJenis: "segera",
          judul: "Halaman penutup",
          teks:
            "Rangkaian modul PYLearn akan ditutup dengan mini project pada Modul 8. Materi tersebut belum tersedia saat ini.",
          status: "Menunggu Modul 8",
          catatan:
            "Kembali ke dashboard untuk melihat modul yang sudah tersedia.",
          aksi: [buatTautan("Kembali ke Dashboard", "index.html")],
          topbarTeks: "Mini project segera",
          topbarJenis: "segera",
          sidebarInfo: "Mini project sedang disiapkan.",
        });
        return;
      }

      document.title = "Kursus Selesai — PYLearn";
      terapkanTampilan({
        ikon: "✓",
        lencanaTeks: "Kursus selesai",
        judul: "Selamat, seluruh modul selesai!",
        teks:
          "Kamu telah menyelesaikan seluruh rangkaian modul PYLearn. Terapkan materi yang sudah dipelajari melalui mini project Python.",
        status: "Kursus selesai",
        catatan: "Mini project menjadi penerapan akhir dari seluruh materi.",
        aksi: [
          buatTautan("Buka Mini Project", `modul.html?id=${id}`),
          buatTautan("Kembali ke Dashboard", "index.html", true),
        ],
        topbarTeks: "Kursus selesai",
        sidebarJudul: "Seluruh modul selesai",
        sidebarInfo: "Saatnya menerapkan materi dalam mini project.",
      });
      return;
    }

    // Halaman penutup hanya untuk modul yang sudah benar-benar tersedia.
    if (!modulTersedia(entri)) {
      document.title = `Modul ${id} Belum Tersedia — PYLearn`;
      terapkanTampilan({
        ikon: "!",
        lencanaTeks: "Belum tersedia",
        lencanaJenis: "segera",
        judul: "Modul belum tersedia",
        teks: `Modul ${id}: ${judulModul} belum dapat diselesaikan karena materinya masih disiapkan.`,
        status: "Menunggu",
        catatan:
          "Kembali ke dashboard untuk melihat modul yang sudah tersedia.",
        aksi: [buatTautan("Kembali ke Dashboard", "index.html")],
        topbarTeks: "Belum tersedia",
        topbarJenis: "segera",
        sidebarJudul: "Modul belum tersedia",
        sidebarInfo: "Materi modul sedang disiapkan.",
      });
      return;
    }

    if (modulTersedia(berikutnya)) {
      document.title = `Modul ${id} Selesai — PYLearn`;
      terapkanTampilan({
        ikon: "✓",
        lencanaTeks: "Modul selesai",
        judul: `Modul ${id} selesai!`,
        teks: `Kamu sudah menyelesaikan ${judulModul}. Lanjutkan ke Modul ${berikutnya.id}: ${berikutnya.judul} untuk mempelajari materi berikutnya.`,
        status: "Lulus",
        catatan:
          "Nilai kuis hanya ditampilkan saat kuis dan tidak disimpan. Kamu dapat mengulang modul kapan saja.",
        aksi: [
          buatTautan(
            `Lanjut ke Modul ${berikutnya.id}`,
            `modul.html?id=${berikutnya.id}`
          ),
          buatTautan(`Ulangi Modul ${id}`, `modul.html?id=${id}`, true),
        ],
        topbarTeks: "Modul selesai",
        sidebarJudul: `Modul ${id} selesai`,
        sidebarInfo: `Lanjut ke Modul ${berikutnya.id}: ${berikutnya.judul}.`,
      });
      return;
    }

    // Modul berikutnya belum tersedia.
    document.title = `Modul ${id} Selesai — PYLearn`;
    terapkanTampilan({
      ikon: "✓",
      lencanaTeks: "Modul selesai",
      judul: `Modul ${id} selesai!`,
      teks: `Kamu sudah menyelesaikan ${judulModul}. Modul berikutnya belum tersedia saat ini, jadi kamu bisa mengulang modul ini atau kembali ke dashboard.`,
      status: "Selesai",
      catatan:
        "Modul baru akan tampil di dashboard setelah tersedia. Nilai kuis tidak disimpan.",
      aksi: [
        buatTautan(`Ulangi Modul ${id}`, `modul.html?id=${id}`),
        buatTautan("Kembali ke Dashboard", "index.html", true),
      ],
      topbarTeks: "Modul selesai",
      sidebarJudul: `Modul ${id} selesai`,
      sidebarInfo: "Modul berikutnya sedang disiapkan.",
    });
  } catch (error) {
    console.error("Kesalahan memuat halaman penutup:", error);
    tampilkanKesalahan(
      "Ringkasan modul gagal dimuat. Kembali ke dashboard untuk melanjutkan."
    );
  }
}
