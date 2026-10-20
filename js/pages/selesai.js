// Mengatur halaman penutup: menampilkan modul yang selesai dan langkah lanjutan.

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
};

const sidebar = document.getElementById("sidebar");
const tombolMenu = document.getElementById("tombol-menu");
const tirai = document.getElementById("tirai");

siapkanSidebar({ sidebar, tombolMenu, tirai });
siapkanTransisiHalaman();
aturPenandaSidebar();
muatSelesai();

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

function buatTautan(label, href, garis = false) {
  const tautan = document.createElement("a");
  tautan.className = `tombol${garis ? " tombol--garis" : ""}`;
  tautan.href = href;
  tautan.textContent = label;
  return tautan;
}

function tampilkanKesalahan(pesan) {
  elemen.ikon.textContent = "!";
  elemen.lencana.className = "lencana lencana--bahaya";
  elemen.lencana.textContent = "Tidak tersedia";
  elemen.judul.textContent = "Halaman penutup";
  elemen.teks.textContent = pesan;
  elemen.status.textContent = "—";
  elemen.catatan.textContent =
    "Kembali ke dashboard untuk melihat modul yang sudah tersedia.";
  elemen.aksi.replaceChildren(
    buatTautan("Kembali ke Dashboard", "index.html")
  );
  elemen.lencanaTopbar.className = "lencana lencana--bahaya";
  elemen.lencanaTopbar.textContent = "Tidak tersedia";
  elemen.sidebarJudul.textContent = "Halaman penutup";
  elemen.sidebarInfo.textContent = "Ringkasan modul tidak dapat dimuat.";
}

async function muatSelesai() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id")) || 1;

  if (!Number.isInteger(id) || id < 1 || id > 8) {
    tampilkanKesalahan("Modul yang diminta tidak ditemukan.");
    return;
  }

  try {
    const folder = `modul-${String(id).padStart(2, "0")}`;

    const responsKatalog = await fetch("data/daftar-modul.json");

    if (!responsKatalog.ok) {
      throw new Error("Katalog modul tidak dapat dimuat.");
    }

    const katalog = await responsKatalog.json();
    const daftar = Array.isArray(katalog.modul) ? katalog.modul : [];
    const entri = daftar.find((modul) => modul.id === id);

    let judulModul = entri?.judul || `Modul ${id}`;

    // Meta hanya diambil untuk modul yang sudah tersedia agar tidak memicu
    // permintaan 404 pada modul yang masih disiapkan.
    if (entri && entri.status === "tersedia") {
      try {
        const responsMeta = await fetch(`data/${folder}/meta.json`);

        if (responsMeta.ok) {
          const meta = await responsMeta.json();
          judulModul = meta.judul || judulModul;
        }
      } catch (error) {
        console.warn("Meta modul tidak dapat dimuat:", error);
      }
    }

    const berikutnya = daftar.find((modul) => modul.id === id + 1);
    const modulTerakhir = id >= 8;

    elemen.modul.textContent = judulModul;
    document.title = `Modul ${id} selesai — PYLearn`;

    // Modul 8 adalah mini project. Jangan tampilkan tautan bila belum siap.
    if (modulTerakhir) {
      const modulDelapan = daftar.find((modul) => modul.id === 8);
      const proyekSiap =
        modulDelapan && modulDelapan.status === "tersedia";

      if (!proyekSiap) {
        elemen.ikon.textContent = "✓";
        elemen.lencana.className = "lencana lencana--segera";
        elemen.lencana.textContent = "Mini project segera";
        elemen.judul.textContent = "Halaman penutup";
        elemen.teks.textContent =
          "Rangkaian modul PYLearn akan ditutup dengan mini project pada Modul 8. Materi tersebut belum tersedia saat ini.";
        elemen.status.textContent = "Menunggu Modul 8";
        elemen.catatan.textContent =
          "Kembali ke dashboard untuk melihat modul yang sudah tersedia.";
        elemen.aksi.replaceChildren(
          buatTautan("Kembali ke Dashboard", "index.html")
        );
        elemen.lencanaTopbar.className = "lencana lencana--segera";
        elemen.lencanaTopbar.textContent = "Mini project segera";
        elemen.sidebarJudul.textContent = "Halaman penutup";
        elemen.sidebarInfo.textContent = "Mini project sedang disiapkan.";
        return;
      }

      elemen.ikon.textContent = "✓";
      elemen.lencana.className = "lencana lencana--tersedia";
      elemen.lencana.textContent = "Kursus selesai";
      elemen.judul.textContent = "Selamat, seluruh modul selesai!";
      elemen.teks.textContent =
        "Kamu telah menyelesaikan seluruh rangkaian modul PYLearn. Terapkan materi yang sudah dipelajari melalui mini project Python.";
      elemen.status.textContent = "Kursus selesai";
      elemen.catatan.textContent =
        "Mini project menjadi penerapan akhir dari seluruh materi.";
      elemen.aksi.replaceChildren(
        buatTautan("Buka Mini Project", "modul.html?id=8"),
        buatTautan("Kembali ke Dashboard", "index.html", true)
      );
      elemen.lencanaTopbar.className = "lencana lencana--tersedia";
      elemen.lencanaTopbar.textContent = "Kursus selesai";
      elemen.sidebarJudul.textContent = "Seluruh modul selesai";
      elemen.sidebarInfo.textContent =
        "Saatnya menerapkan materi dalam mini project.";
      return;
    }

    // Halaman penutup hanya untuk modul yang sudah benar-benar tersedia.
    if (!entri || entri.status !== "tersedia") {
      elemen.ikon.textContent = "!";
      elemen.lencana.className = "lencana lencana--segera";
      elemen.lencana.textContent = "Belum tersedia";
      elemen.judul.textContent = "Modul belum tersedia";
      elemen.teks.textContent = entri
        ? `Modul ${id}: ${judulModul} belum dapat diselesaikan karena materinya masih disiapkan.`
        : `Modul ${id} belum terdaftar dalam kurikulum.`;
      elemen.status.textContent = "Menunggu";
      elemen.catatan.textContent =
        "Kembali ke dashboard untuk melihat modul yang sudah tersedia.";
      elemen.aksi.replaceChildren(
        buatTautan("Kembali ke Dashboard", "index.html")
      );
      elemen.lencanaTopbar.className = "lencana lencana--segera";
      elemen.lencanaTopbar.textContent = "Belum tersedia";
      elemen.sidebarJudul.textContent = "Modul belum tersedia";
      elemen.sidebarInfo.textContent = "Materi modul sedang disiapkan.";
      return;
    }

    if (berikutnya && berikutnya.status === "tersedia") {
      elemen.judul.textContent = `Modul ${id} selesai!`;
      elemen.teks.textContent = `Kamu sudah menyelesaikan ${judulModul}. Lanjutkan ke Modul ${berikutnya.id}: ${berikutnya.judul} untuk mempelajari materi berikutnya.`;
      elemen.status.textContent = "Lulus";
      elemen.catatan.textContent =
        "Nilai kuis hanya ditampilkan saat kuis dan tidak disimpan. Kamu dapat mengulang modul kapan saja.";
      elemen.aksi.replaceChildren(
        buatTautan(
          `Lanjut ke Modul ${berikutnya.id}`,
          `modul.html?id=${berikutnya.id}`
        ),
        buatTautan(`Ulangi Modul ${id}`, `modul.html?id=${id}`, true)
      );
      elemen.lencanaTopbar.className = "lencana lencana--tersedia";
      elemen.lencanaTopbar.textContent = "Modul selesai";
      elemen.sidebarJudul.textContent = `Modul ${id} selesai`;
      elemen.sidebarInfo.textContent =
        `Lanjut ke Modul ${berikutnya.id}: ${berikutnya.judul}.`;
      return;
    }

    // Modul berikutnya belum tersedia.
    elemen.judul.textContent = `Modul ${id} selesai!`;
    elemen.teks.textContent = `Kamu sudah menyelesaikan ${judulModul}. Modul berikutnya belum tersedia saat ini, jadi kamu bisa mengulang modul ini atau kembali ke dashboard.`;
    elemen.status.textContent = "Selesai";
    elemen.catatan.textContent =
      "Modul baru akan tampil di dashboard setelah tersedia. Nilai kuis tidak disimpan.";
    elemen.aksi.replaceChildren(
      buatTautan(`Ulangi Modul ${id}`, `modul.html?id=${id}`),
      buatTautan("Kembali ke Dashboard", "index.html", true)
    );
    elemen.lencanaTopbar.className = "lencana lencana--tersedia";
    elemen.lencanaTopbar.textContent = "Modul selesai";
    elemen.sidebarJudul.textContent = `Modul ${id} selesai`;
    elemen.sidebarInfo.textContent = "Modul berikutnya sedang disiapkan.";
  } catch (error) {
    console.error("Kesalahan memuat halaman penutup:", error);
    tampilkanKesalahan(
      "Ringkasan modul gagal dimuat. Kembali ke dashboard untuk melanjutkan."
    );
  }
}
