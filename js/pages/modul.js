// Mengatur halaman modul: materi, navigasi tahap, dan editor Python.

import { buatEditor } from "../features/editor.js";
import { bandingkanOutput } from "../features/latihan.js";
import {
  buatKuis,
  tampilkanKuisKosong,
  validasiKuis,
} from "../features/kuis.js";
import { siapkanSidebar } from "../features/sidebar.js";
import { siapkanTransisiHalaman } from "../features/transisi-halaman.js";
import {
  siapkanPython,
  jalankanKode,
  hentikan,
} from "../features/python-runner.js";

const NAMA_TAHAP = {
  belajar: "Belajar",
  latihan: "Latihan",
  kuis: "Kuis",
};

const ID_SUBBAB = /^subbab-/;

const sidebar = document.getElementById("sidebar");
const tombolMenu = document.getElementById("tombol-menu");
const tirai = document.getElementById("tirai");

const tautanSidebar = [
  ...document.querySelectorAll(".navigasi-utama__tautan[data-tahap]"),
];
const tautanNavTahap = [
  ...document.querySelectorAll(".tahap-nav__tautan[data-tahap]"),
];
const penandaSidebar = document.querySelector(".navigasi-utama__penanda");
const panelTahap = [...document.querySelectorAll(".panel-tahap")];
const navTahap = document.querySelector(".tahap-nav");

const elemen = {
  judul: document.getElementById("judul-modul"),
  deskripsi: document.getElementById("deskripsi-modul"),
  nomor: document.getElementById("nomor-modul"),
  metaSubbab: document.getElementById("meta-subbab"),
  metaVideo: document.getElementById("meta-video"),
  lencanaSubbab: document.getElementById("lencana-subbab"),
  remahModul: document.getElementById("remah-modul"),
  remahTahap: document.getElementById("remah-tahap"),
  sidebarJudul: document.getElementById("sidebar-judul-modul"),
  sidebarInfo: document.getElementById("sidebar-info-modul"),
  daftarSubbab: document.getElementById("daftar-subbab"),
  daftarTujuan: document.getElementById("daftar-tujuan"),
  kontenMateri: document.getElementById("konten-materi"),
  videoMateri: document.getElementById("video-materi"),
  tabTeks: document.getElementById("tab-teks"),
  tabVideo: document.getElementById("tab-video"),
  panelTeks: document.getElementById("panel-teks"),
  panelVideo: document.getElementById("panel-video"),
  kartuSubbab: document.getElementById("kartu-subbab"),
  asideModul: document.querySelector(".aside-modul"),
  judulLatihan: document.getElementById("judul-latihan"),
  instruksiLatihan: document.getElementById("instruksi-latihan"),
  statusLatihan: document.getElementById("status-latihan"),
  wadahTarget: document.getElementById("wadah-target"),
  targetOutput: document.getElementById("target-output"),
  umpanBalik: document.getElementById("umpan-balik-latihan"),
  lencanaUmpanBalik: document.getElementById("lencana-umpan-balik"),
  judulUmpanBalik: document.getElementById("judul-umpan-balik"),
  pesanUmpanBalik: document.getElementById("pesan-umpan-balik"),
  wadahPetunjuk: document.getElementById("wadah-petunjuk"),
  daftarPetunjuk: document.getElementById("daftar-petunjuk"),
  wadahSolusi: document.getElementById("wadah-solusi"),
  teksSolusi: document.getElementById("teks-solusi"),
  tombolLanjutKuis: document.getElementById("tombol-lanjut-kuis"),
  wadahKuis: document.getElementById("wadah-kuis"),
  areaKode: document.getElementById("kode"),
  tombolJalankan: document.getElementById("tombol-jalankan"),
  tombolStop: document.getElementById("tombol-stop"),
  tombolPeriksa: document.getElementById("tombol-periksa"),
  statusPython: document.getElementById("status-python"),
  output: document.getElementById("output"),
  tautanSebelumnya: document.getElementById("tautan-sebelumnya"),
  tautanBerikutnya: document.getElementById("tautan-berikutnya"),
};

siapkanSidebar({ sidebar, tombolMenu, tirai });
siapkanTransisiHalaman();

let editor = null;
let pythonSiap = false;
let sedangJalan = false;
let tahapAktif = "belajar";
let bagianSubbab = [];
let tautanSubbab = new Map();
let permintaanGulir = null;

let latihan = null;
let latihanSiap = false;
let jumlahPercobaan = 0;
let latihanBenar = false;
let modulAktif = null;
let katalogModul = [];
let modeJalan = null;
let dibatalkanPengguna = false;
let sedangMengisiKode = false;
let timerTransisiTahap = null;
let panelKeluar = null;

// ------------------------------------------------------------
// Navigasi tahap
// ------------------------------------------------------------

function perbaruiPenandaSidebar() {
  if (!penandaSidebar) return;

  const aktif = tautanSidebar.find((tautan) =>
    tautan.classList.contains("navigasi-utama__tautan--aktif")
  );

  if (!aktif) {
    penandaSidebar.hidden = true;
    return;
  }

  penandaSidebar.hidden = false;
  penandaSidebar.style.height = `${aktif.offsetHeight}px`;
  penandaSidebar.style.transform = `translateY(${aktif.offsetTop}px)`;
  penandaSidebar.parentElement.classList.add("navigasi-utama--siap");
}

function namaTahapDariHash() {
  const nama = window.location.hash.replace("#", "");
  return NAMA_TAHAP[nama] ? nama : "belajar";
}

function gulirKeBilahTahap() {
  if (!navTahap) return;

  const kurangiGerak = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const atas =
    navTahap.getBoundingClientRect().top + window.scrollY - 76;

  window.scrollTo({
    top: Math.max(0, atas),
    behavior: kurangiGerak ? "auto" : "smooth",
  });
}

function perbaruiNavigasiTahap(nama) {
  tahapAktif = nama;

  // Program yang masih berjalan dihentikan agar tidak bekerja tanpa terlihat.
  if (sedangJalan && nama !== "latihan") {
    dibatalkanPengguna = true;
    hentikan("Program dihentikan karena berpindah tahap.");
  }

  tautanSidebar.forEach((tautan) => {
    const aktif = tautan.dataset.tahap === nama;
    tautan.classList.toggle("navigasi-utama__tautan--aktif", aktif);

    if (aktif) {
      tautan.setAttribute("aria-current", "step");
    } else {
      tautan.removeAttribute("aria-current");
    }
  });

  tautanNavTahap.forEach((tautan) => {
    const aktif = tautan.dataset.tahap === nama;
    tautan.classList.toggle("tahap-nav__tautan--aktif", aktif);

    if (aktif) {
      tautan.setAttribute("aria-current", "step");
    } else {
      tautan.removeAttribute("aria-current");
    }
  });

  elemen.remahTahap.textContent = NAMA_TAHAP[nama];
  perbaruiPenandaSidebar();

  if (nama === "latihan" && editor) {
    requestAnimationFrame(() => editor.segarkan());
  }

  if (nama === "belajar") {
    requestAnimationFrame(periksaSubbabAktif);
  }
}

function terapkanPanelTahap(nama) {
  panelTahap.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== nama;
  });
}

function terapkanTahap(nama) {
  perbaruiNavigasiTahap(nama);
  terapkanPanelTahap(nama);
}

function bersihkanTransisiTahap() {
  if (timerTransisiTahap) {
    clearTimeout(timerTransisiTahap);
    timerTransisiTahap = null;
  }

  if (panelKeluar) {
    panelKeluar.hidden = true;
    panelKeluar.classList.remove("panel-tahap--keluar");
    panelKeluar = null;
  }

  panelTahap.forEach((panel) => {
    panel.classList.remove("panel-tahap--masuk", "panel-tahap--keluar");
  });
}

function tampilkanTahap(nama, {
  gulir = false,
  perbaruiHash = false,
  animasi = true,
} = {}) {
  if (!NAMA_TAHAP[nama]) nama = "belajar";

  // Selesaikan animasi sebelumnya bila pengguna berpindah lagi dengan cepat.
  bersihkanTransisiTahap();

  if (perbaruiHash && window.location.hash !== `#${nama}`) {
    history.pushState(null, "", `#${nama}`);
  }

  const kurangiGerak = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const panelLama = panelTahap.find((panel) => !panel.hidden);
  const panelBaru = panelTahap.find((panel) => panel.dataset.panel === nama);
  const berubah = tahapAktif !== nama;
  const bisaAnimasi =
    animasi &&
    berubah &&
    !kurangiGerak &&
    panelLama &&
    panelBaru &&
    panelLama !== panelBaru;

  if (!bisaAnimasi) {
    terapkanTahap(nama);
    if (gulir) gulirKeBilahTahap();
    return;
  }

  // Navigasi dan sidebar diperbarui lebih dulu agar transisi CSS-nya berjalan
  // langsung, sama seperti animasi sidebar di dashboard utama.
  perbaruiNavigasiTahap(nama);

  // Panel lama memudar di atas panel baru, sehingga perpindahan terasa menyatu.
  panelLama.hidden = false;
  panelLama.classList.add("panel-tahap--keluar");
  panelKeluar = panelLama;

  panelBaru.hidden = false;
  panelBaru.classList.remove("panel-tahap--masuk");
  void panelBaru.offsetWidth;
  panelBaru.classList.add("panel-tahap--masuk");

  timerTransisiTahap = setTimeout(() => {
    panelLama.hidden = true;
    panelLama.classList.remove("panel-tahap--keluar");
    panelBaru.classList.remove("panel-tahap--masuk");

    if (panelKeluar === panelLama) panelKeluar = null;
    timerTransisiTahap = null;
  }, 300);

  if (gulir) {
    requestAnimationFrame(gulirKeBilahTahap);
  }
}

// Klik tautan tahap di sidebar maupun di bilah langkah.
[...tautanSidebar, ...tautanNavTahap].forEach((tautan) => {
  tautan.addEventListener("click", (event) => {
    event.preventDefault();
    tampilkanTahap(tautan.dataset.tahap, {
      gulir: true,
      perbaruiHash: true,
    });
  });
});

window.addEventListener("popstate", () => {
  tampilkanTahap(namaTahapDariHash(), { perbaruiHash: false });
});

window.addEventListener("hashchange", () => {
  tampilkanTahap(namaTahapDariHash(), { perbaruiHash: false });
});

// ------------------------------------------------------------
// Tab media: Teks dan Video
// ------------------------------------------------------------

function terapkanMedia(nama) {
  const video = nama === "video";

  elemen.panelTeks.hidden = video;
  elemen.panelVideo.hidden = !video;

  elemen.tabTeks.classList.toggle("tab-media__tombol--aktif", !video);
  elemen.tabVideo.classList.toggle("tab-media__tombol--aktif", video);

  elemen.tabTeks.setAttribute("aria-selected", String(!video));
  elemen.tabVideo.setAttribute("aria-selected", String(video));

  elemen.tabTeks.tabIndex = video ? -1 : 0;
  elemen.tabVideo.tabIndex = video ? 0 : -1;

  // Daftar subbab tidak diperlukan saat menonton video.
  elemen.kartuSubbab.hidden = video;
  elemen.asideModul.classList.toggle("aside-modul--tanpa-subbab", video);
}

function tampilkanMedia(nama) {
  const videoSekarang = !elemen.panelVideo.hidden;

  if ((nama === "video") === videoSekarang) return;

  const kurangiGerak = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    typeof document.startViewTransition === "function" &&
    !kurangiGerak
  ) {
    try {
      document.startViewTransition(() => terapkanMedia(nama));
      return;
    } catch (error) {
      // Jika transisi bawaan gagal, tetap tampilkan panel baru.
      console.warn("Transisi media tidak tersedia:", error);
    }
  }

  terapkanMedia(nama);

  if (!kurangiGerak) {
    const panelAktif = nama === "video"
      ? elemen.panelVideo
      : elemen.panelTeks;

    panelAktif.classList.remove("panel-media--masuk");
    void panelAktif.offsetWidth;
    panelAktif.classList.add("panel-media--masuk");
  }
}

elemen.tabTeks.addEventListener("click", () => tampilkanMedia("teks"));
elemen.tabVideo.addEventListener("click", () => tampilkanMedia("video"));

document.querySelector(".tab-media").addEventListener("keydown", (event) => {
  const tombol = [elemen.tabTeks, elemen.tabVideo];
  const indeks = tombol.indexOf(document.activeElement);

  if (indeks < 0) return;

  let tujuan = null;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    tujuan = tombol[(indeks + 1) % tombol.length];
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    tujuan = tombol[(indeks - 1 + tombol.length) % tombol.length];
  } else if (event.key === "Home") {
    tujuan = tombol[0];
  } else if (event.key === "End") {
    tujuan = tombol[tombol.length - 1];
  }

  if (!tujuan) return;

  event.preventDefault();
  tujuan.focus();
  tampilkanMedia(tujuan.dataset.media);
});

// ------------------------------------------------------------
// Subbab
// ------------------------------------------------------------

function terapkanSubbabAktif(idAktif) {
  tautanSubbab.forEach((tautan, id) => {
    const aktif = id === idAktif;

    tautan.classList.toggle("daftar-subbab__tautan--aktif", aktif);

    if (aktif) {
      tautan.setAttribute("aria-current", "location");
    } else {
      tautan.removeAttribute("aria-current");
    }
  });
}

function periksaSubbabAktif() {
  if (document.getElementById("belajar").hidden) return;

  const ambang = 150;
  let idAktif = null;

  for (const bagian of bagianSubbab) {
    if (bagian.getBoundingClientRect().top <= ambang) {
      idAktif = bagian.id;
    } else {
      break;
    }
  }

  // Saat masih di bagian atas materi, subbab pertama tetap ditandai.
  if (!idAktif && bagianSubbab.length > 0) {
    idAktif = bagianSubbab[0].id;
  }

  terapkanSubbabAktif(idAktif);
}

function tampilkanNavigasiSubbab(subbab) {
  elemen.daftarSubbab.replaceChildren();
  tautanSubbab.clear();

  if (!Array.isArray(subbab) || subbab.length === 0) {
    const item = document.createElement("li");
    item.className = "teks-samar";
    item.textContent = "Belum ada subbab.";
    elemen.daftarSubbab.appendChild(item);
    return;
  }

  subbab.forEach((bagian) => {
    const idTarget = `subbab-${bagian.id.replaceAll(".", "-")}`;

    const item = document.createElement("li");
    const tautan = document.createElement("a");

    tautan.className = "daftar-subbab__tautan";
    tautan.href = `#${idTarget}`;
    tautan.textContent = `${bagian.id} ${bagian.judul}`;

    tautan.addEventListener("click", (event) => {
      event.preventDefault();

      tampilkanTahap("belajar", {
        gulir: false,
        perbaruiHash: true,
      });

      terapkanSubbabAktif(idTarget);

      requestAnimationFrame(() => {
        const target = document.getElementById(idTarget);

        if (!target) return;

        const kurangiGerak = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        target.scrollIntoView({
          behavior: kurangiGerak ? "auto" : "smooth",
          block: "start",
        });
      });
    });

    item.appendChild(tautan);
    elemen.daftarSubbab.appendChild(item);
    tautanSubbab.set(idTarget, tautan);
  });
}

function siapkanSubbabDariMateri() {
  bagianSubbab = [
    ...elemen.kontenMateri.querySelectorAll("[id^='subbab-']"),
  ].filter((bagian) => ID_SUBBAB.test(bagian.id));

  periksaSubbabAktif();
}

window.addEventListener("scroll", () => {
  if (permintaanGulir !== null) return;

  permintaanGulir = requestAnimationFrame(() => {
    permintaanGulir = null;
    periksaSubbabAktif();
  });
}, { passive: true });

window.addEventListener("resize", perbaruiPenandaSidebar);

// ------------------------------------------------------------
// Tujuan dan video
// ------------------------------------------------------------

function tampilkanTujuan(tujuan) {
  elemen.daftarTujuan.replaceChildren();

  if (!Array.isArray(tujuan) || tujuan.length === 0) {
    const item = document.createElement("li");
    item.className = "teks-samar";
    item.textContent = "Tujuan pembelajaran belum tersedia.";
    elemen.daftarTujuan.appendChild(item);
    return;
  }

  tujuan.forEach((teks) => {
    const item = document.createElement("li");
    item.textContent = teks;
    elemen.daftarTujuan.appendChild(item);
  });
}

function tampilkanVideo(video) {
  const idVideo = String(video.youtubeId || "").trim();
  const valid = /^[A-Za-z0-9_-]{11}$/.test(idVideo);

  elemen.videoMateri.replaceChildren();
  elemen.videoMateri.classList.toggle("video-materi--terisi", valid);

  if (valid) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${idVideo}?rel=0`;
    iframe.title = video.judul || "Video pembelajaran";
    iframe.loading = "lazy";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    elemen.videoMateri.appendChild(iframe);
    elemen.metaVideo.textContent = "Video tersedia";
    return;
  }

  const kotak = document.createElement("div");
  kotak.className = "video-kosong";

  const judul = document.createElement("p");
  judul.className = "video-kosong__judul";
  judul.textContent = "Video belum tersedia";

  const teks = document.createElement("p");
  teks.className = "video-kosong__teks";
  teks.textContent =
    "Tautan video YouTube untuk modul ini akan ditambahkan oleh penyusun.";

  kotak.append(judul, teks);
  elemen.videoMateri.appendChild(kotak);
  elemen.metaVideo.textContent = "Video belum tersedia";
}

// ------------------------------------------------------------
// Memuat data modul
// ------------------------------------------------------------

function tampilkanHeader(modul) {
  const nomor = String(modul.id).padStart(2, "0");
  const jumlahSubbab = Array.isArray(modul.subbab)
    ? modul.subbab.length
    : 0;

  elemen.nomor.textContent = `Modul ${nomor}`;
  elemen.judul.textContent = modul.judul || "Modul Python";
  elemen.deskripsi.textContent = modul.deskripsi || "";
  elemen.remahModul.textContent = `Modul ${nomor}`;
  elemen.metaSubbab.textContent = `${jumlahSubbab} subbab`;
  elemen.lencanaSubbab.textContent = `${jumlahSubbab} Subbab`;
  elemen.sidebarJudul.textContent = modul.judul || "Modul Python";
  elemen.sidebarInfo.textContent = `Modul ${nomor} · ${jumlahSubbab} subbab`;

  document.title = `${modul.judul || "Modul"} — PYLearn`;
}

function tampilkanKesalahan(judul, pesan) {
  elemen.nomor.textContent = "Modul";
  elemen.judul.textContent = judul;
  elemen.deskripsi.textContent = pesan;
  elemen.metaSubbab.textContent = "—";
  elemen.metaVideo.textContent = "—";
  elemen.lencanaSubbab.textContent = "—";
  elemen.sidebarJudul.textContent = "Modul tidak tersedia";
  elemen.sidebarInfo.textContent = pesan;

  elemen.kontenMateri.replaceChildren();

  const status = document.createElement("p");
  status.className = "status-materi status-materi--gagal";
  status.textContent = pesan;
  elemen.kontenMateri.appendChild(status);

  elemen.daftarSubbab.replaceChildren();
  elemen.daftarTujuan.replaceChildren();
  tautanSubbab.clear();
  bagianSubbab = [];

  latihan = null;
  latihanSiap = false;
  jumlahPercobaan = 0;
  latihanBenar = false;
  modulAktif = null;
  katalogModul = [];

  elemen.tombolJalankan.disabled = true;
  elemen.tombolPeriksa.disabled = true;
  elemen.statusPython.textContent = "Modul tidak tersedia.";
  aturStatusLatihan("Tidak ada latihan");
  elemen.wadahTarget.hidden = true;
  sembunyikanUmpanBalik();
  tampilkanKuisKosong(
    elemen.wadahKuis,
    pesan,
    "Kuis tidak tersedia"
  );

  tampilkanTahap("belajar", { perbaruiHash: false });
}

async function muatMateri(folder, namaFile) {
  try {
    const respons = await fetch(`data/${folder}/${namaFile}`);

    if (!respons.ok) {
      throw new Error("Gagal mengambil materi pembelajaran.");
    }

    const html = await respons.text();

    // Materi berasal dari berkas proyek sendiri, bukan masukan pengguna.
    elemen.kontenMateri.innerHTML = html;
    siapkanSubbabDariMateri();
  } catch (error) {
    console.error("Kesalahan memuat materi:", error);

    elemen.kontenMateri.replaceChildren();

    const status = document.createElement("p");
    status.className = "status-materi status-materi--gagal";
    status.textContent = "Materi pembelajaran gagal dimuat.";
    elemen.kontenMateri.appendChild(status);
  }
}

// ------------------------------------------------------------
// Data dan status latihan
// ------------------------------------------------------------

function validasiLatihan(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Data latihan tidak valid.");
  }

  if (typeof data.outputDiharapkan !== "string") {
    throw new Error("Output yang diharapkan belum diisi.");
  }

  return {
    judul:
      typeof data.judul === "string" && data.judul.trim()
        ? data.judul.trim()
        : "Latihan Kode",
    instruksi:
      typeof data.instruksi === "string" ? data.instruksi.trim() : "",
    kodeAwal: typeof data.kodeAwal === "string" ? data.kodeAwal : "",
    outputDiharapkan: data.outputDiharapkan,
    petunjuk: Array.isArray(data.petunjuk)
      ? data.petunjuk.filter(
          (teks) => typeof teks === "string" && teks.trim()
        )
      : [],
    kunci: typeof data.kunci === "string" ? data.kunci : "",
  };
}

function aturKodeEditor(kode) {
  if (!editor) return;

  sedangMengisiKode = true;

  try {
    editor.isiKode(kode);
  } finally {
    sedangMengisiKode = false;
  }
}

function tanganiPerubahanKode() {
  if (sedangMengisiKode || !latihanBenar) return;

  // Kode yang diubah setelah berhasil harus diperiksa ulang.
  latihanBenar = false;
  perbaruiStatusLatihan();
  sembunyikanUmpanBalik();
}

function aturStatusLatihan(teks, jenis = "") {
  elemen.statusLatihan.textContent = teks;
  elemen.statusLatihan.classList.toggle("lencana--biru", jenis === "proses");
  elemen.statusLatihan.classList.toggle(
    "lencana--tersedia",
    jenis === "benar"
  );
  elemen.statusLatihan.classList.toggle("lencana--bahaya", jenis === "salah");
}

function perbaruiStatusLatihan() {
  if (!latihanSiap) {
    aturStatusLatihan("Latihan belum tersedia");
    return;
  }

  if (latihanBenar) {
    aturStatusLatihan("Benar", "benar");
    return;
  }

  if (jumlahPercobaan >= 3) {
    aturStatusLatihan("Solusi terbuka", "salah");
    return;
  }

  if (jumlahPercobaan > 0) {
    aturStatusLatihan(
      `Belum sesuai · ${jumlahPercobaan}/3`,
      "salah"
    );
    return;
  }

  aturStatusLatihan("Belum diperiksa");
}

function sembunyikanUmpanBalik() {
  elemen.umpanBalik.hidden = true;
  elemen.umpanBalik.classList.remove(
    "umpan-balik-latihan--benar",
    "umpan-balik-latihan--salah"
  );
  elemen.wadahPetunjuk.hidden = true;
  elemen.daftarPetunjuk.replaceChildren();
  elemen.wadahSolusi.hidden = true;
  elemen.teksSolusi.textContent = "";
  elemen.tombolLanjutKuis.hidden = true;
}

function tampilkanPetunjuk(jumlah) {
  const petunjuk = latihan.petunjuk.slice(0, jumlah);

  elemen.daftarPetunjuk.replaceChildren();

  petunjuk.forEach((teks) => {
    const item = document.createElement("li");
    item.textContent = teks;
    elemen.daftarPetunjuk.appendChild(item);
  });

  elemen.wadahPetunjuk.hidden = petunjuk.length === 0;
}

function tampilkanUmpanBalikBenar() {
  elemen.umpanBalik.hidden = false;
  elemen.umpanBalik.classList.remove("umpan-balik-latihan--salah");
  elemen.umpanBalik.classList.add("umpan-balik-latihan--benar");

  elemen.lencanaUmpanBalik.className = "lencana lencana--tersedia";
  elemen.lencanaUmpanBalik.textContent = "Benar";
  elemen.judulUmpanBalik.textContent = "Output sudah sesuai";
  elemen.pesanUmpanBalik.textContent =
    "Kerja bagus. Kamu sudah menyelesaikan latihan ini.";

  elemen.wadahPetunjuk.hidden = true;
  elemen.daftarPetunjuk.replaceChildren();
  elemen.wadahSolusi.hidden = true;
  elemen.teksSolusi.textContent = "";
  elemen.tombolLanjutKuis.hidden = false;
}

function tampilkanUmpanBalikSalah(hasil) {
  const batasTercapai = jumlahPercobaan >= 3;
  const jumlahPetunjuk = batasTercapai
    ? latihan.petunjuk.length
    : Math.min(jumlahPercobaan, latihan.petunjuk.length);

  elemen.umpanBalik.hidden = false;
  elemen.umpanBalik.classList.remove("umpan-balik-latihan--benar");
  elemen.umpanBalik.classList.add("umpan-balik-latihan--salah");

  elemen.lencanaUmpanBalik.className = "lencana lencana--bahaya";
  elemen.tombolLanjutKuis.hidden = true;

  if (hasil.dihentikan) {
    elemen.lencanaUmpanBalik.textContent = "Waktu habis";
    elemen.judulUmpanBalik.textContent = "Program melewati batas waktu";
    elemen.pesanUmpanBalik.textContent =
      "Program berhenti setelah 5 detik. Periksa kemungkinan perulangan yang tidak pernah selesai, lalu coba lagi.";
  } else if (hasil.error) {
    elemen.lencanaUmpanBalik.textContent = "Error";
    elemen.judulUmpanBalik.textContent = "Program mengalami error";
    elemen.pesanUmpanBalik.textContent =
      "Perbaiki kode berdasarkan pesan error di panel Output, lalu periksa lagi.";
  } else {
    elemen.lencanaUmpanBalik.textContent = "Belum sesuai";
    elemen.judulUmpanBalik.textContent = "Output belum sesuai";
    elemen.pesanUmpanBalik.textContent =
      "Bandingkan output di panel Output dengan target di atas, lalu periksa kembali.";
  }

  tampilkanPetunjuk(jumlahPetunjuk);

  const adaKunci = Boolean(latihan.kunci.trim());

  if (batasTercapai && adaKunci) {
    elemen.teksSolusi.textContent = latihan.kunci;
    elemen.wadahSolusi.hidden = false;
  } else {
    elemen.wadahSolusi.hidden = true;
    elemen.teksSolusi.textContent = "";

    if (batasTercapai) {
      elemen.pesanUmpanBalik.textContent +=
        " Solusi untuk latihan ini belum disediakan.";
    }
  }
}

function tampilkanUmpanBalikTeknis(pesan) {
  elemen.umpanBalik.hidden = false;
  elemen.umpanBalik.classList.remove("umpan-balik-latihan--benar");
  elemen.umpanBalik.classList.add("umpan-balik-latihan--salah");
  elemen.lencanaUmpanBalik.className = "lencana lencana--bahaya";
  elemen.lencanaUmpanBalik.textContent = "Gagal";
  elemen.judulUmpanBalik.textContent = "Pemeriksaan belum dapat dijalankan";
  elemen.pesanUmpanBalik.textContent = pesan;
  elemen.wadahPetunjuk.hidden = true;
  elemen.daftarPetunjuk.replaceChildren();
  elemen.wadahSolusi.hidden = true;
  elemen.teksSolusi.textContent = "";
  elemen.tombolLanjutKuis.hidden = true;
}

function nilaiLatihan(hasil) {
  if (!latihan) return false;

  const perbandingan = bandingkanOutput(
    hasil.output,
    latihan.outputDiharapkan
  );

  if (perbandingan.cocok && !hasil.error) {
    latihanBenar = true;
    jumlahPercobaan = 0;
    perbaruiStatusLatihan();
    tampilkanUmpanBalikBenar();
    return true;
  }

  jumlahPercobaan += 1;
  latihanBenar = false;
  perbaruiStatusLatihan();
  tampilkanUmpanBalikSalah(hasil);
  return true;
}

function tampilkanLatihan(data, modul) {
  elemen.judulLatihan.textContent = data.judul;
  elemen.instruksiLatihan.textContent =
    data.instruksi || "Kerjakan latihan berikut.";
  elemen.targetOutput.textContent =
    data.outputDiharapkan || "(tidak ada output)";
  elemen.wadahTarget.hidden = false;

  const kodeAwal = data.kodeAwal.trim()
    ? data.kodeAwal
    : modul.kodeAwal || "";

  aturKodeEditor(kodeAwal);
}

function tampilkanLatihanKosong(modul) {
  elemen.judulLatihan.textContent = "Latihan belum tersedia";
  elemen.instruksiLatihan.textContent =
    "Latihan untuk modul ini belum disiapkan.";
  elemen.wadahTarget.hidden = true;
  elemen.targetOutput.textContent = "";
  sembunyikanUmpanBalik();
  aturKodeEditor(modul.kodeAwal || "");
  perbaruiStatusLatihan();
}

async function muatLatihan(folder, modul) {
  aturStatusLatihan("Memuat latihan...", "proses");
  elemen.tombolPeriksa.disabled = true;

  try {
    const namaFile = modul.fileLatihan || "latihan.json";
    const respons = await fetch(`data/${folder}/${namaFile}`);

    if (!respons.ok) {
      throw new Error("Latihan belum tersedia untuk modul ini.");
    }

    const data = validasiLatihan(await respons.json());

    latihan = data;
    latihanSiap = true;
    jumlahPercobaan = 0;
    latihanBenar = false;

    sembunyikanUmpanBalik();
    tampilkanLatihan(data, modul);
    perbaruiStatusLatihan();
  } catch (error) {
    console.error("Kesalahan memuat latihan:", error);

    latihan = null;
    latihanSiap = false;
    jumlahPercobaan = 0;
    latihanBenar = false;
    tampilkanLatihanKosong(modul);
  } finally {
    aturTombol(false);
  }
}

function tentukanTujuanLanjut() {
  const id = Number(modulAktif?.id);

  if (!Number.isInteger(id)) {
    return { label: "Kembali ke Dashboard", href: "index.html" };
  }

  if (id >= 8) {
    return {
      label: "Lihat Halaman Penutup",
      href: "selesai.html?id=8",
    };
  }

  const berikutnya = katalogModul.find((modul) => modul.id === id + 1);

  if (berikutnya && berikutnya.status === "tersedia") {
    return {
      label: `Lanjut ke Modul ${berikutnya.id}`,
      href: `modul.html?id=${berikutnya.id}`,
    };
  }

  // Modul berikutnya belum tersedia: tutup alur lewat halaman penutup.
  return {
    label: "Lihat Halaman Penutup",
    href: `selesai.html?id=${id}`,
  };
}

async function muatKuis(folder, modul) {
  try {
    const namaFile = modul.fileKuis || "kuis.json";
    const respons = await fetch(`data/${folder}/${namaFile}`);

    if (!respons.ok) {
      throw new Error("Kuis belum tersedia untuk modul ini.");
    }

    const data = validasiKuis(await respons.json());

    buatKuis({
      wadah: elemen.wadahKuis,
      data,
      saatUlangi: () => {
        tampilkanTahap("belajar", { gulir: true, perbaruiHash: true });
      },
      dapatkanLanjut: tentukanTujuanLanjut,
    });
  } catch (error) {
    console.error("Kesalahan memuat kuis:", error);

    tampilkanKuisKosong(
      elemen.wadahKuis,
      "Kuis untuk modul ini belum tersedia. Kamu tetap dapat mempelajari materi dan mengerjakan latihan.",
      "Kuis belum tersedia"
    );
  }
}

function buatNavigasiModul(modul, arah, idElemen) {
  const panah = arah === "sebelumnya" ? "←" : "→";

  if (!modul) {
    const kosong = document.createElement("span");
    kosong.id = idElemen;
    kosong.className = "navigasi-modul__kosong";
    kosong.textContent =
      arah === "sebelumnya" ? "Modul pertama" : "Modul terakhir";
    return kosong;
  }

  const nomor = String(modul.id).padStart(2, "0");
  const isi = `${panah} Modul ${nomor} · ${modul.judul}`;

  if (modul.status !== "tersedia") {
    const segera = document.createElement("span");
    segera.id = idElemen;
    segera.className = "navigasi-modul__kosong";
    segera.textContent = `${isi} (segera)`;
    return segera;
  }

  const tautan = document.createElement("a");
  tautan.id = idElemen;
  tautan.className = "navigasi-modul__tautan";
  tautan.href = `modul.html?id=${modul.id}`;
  tautan.textContent = isi;
  return tautan;
}

async function muatNavigasiModul(id) {
  try {
    const respons = await fetch("data/daftar-modul.json");

    if (!respons.ok) {
      throw new Error("Katalog modul tidak dapat dimuat.");
    }

    const data = await respons.json();
    const daftar = Array.isArray(data.modul) ? data.modul : [];

    katalogModul = daftar;

    const sebelumnya = daftar.find((modul) => modul.id === id - 1);
    const berikutnya = daftar.find((modul) => modul.id === id + 1);

    const tautanSebelumnya = buatNavigasiModul(
      sebelumnya,
      "sebelumnya",
      "tautan-sebelumnya"
    );
    const tautanBerikutnya = buatNavigasiModul(
      berikutnya,
      "berikutnya",
      "tautan-berikutnya"
    );

    elemen.tautanSebelumnya.replaceWith(tautanSebelumnya);
    elemen.tautanBerikutnya.replaceWith(tautanBerikutnya);

    elemen.tautanSebelumnya = tautanSebelumnya;
    elemen.tautanBerikutnya = tautanBerikutnya;
  } catch (error) {
    console.error("Kesalahan memuat navigasi modul:", error);
  }
}

async function muatModul() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  if (!Number.isInteger(id) || id < 1 || id > 8) {
    tampilkanKesalahan(
      "Modul tidak ditemukan",
      "Nomor modul harus berada di antara 1 dan 8."
    );
    return;
  }

  const folder = `modul-${String(id).padStart(2, "0")}`;

  try {
    const respons = await fetch(`data/${folder}/meta.json`);

    if (!respons.ok) {
      throw new Error("Gagal mengambil data modul.");
    }

    const modul = await respons.json();

    modulAktif = modul;

    tampilkanHeader(modul);
    tampilkanTujuan(modul.tujuanPembelajaran);
    tampilkanNavigasiSubbab(modul.subbab);
    tampilkanVideo(modul.video || {});

    await Promise.all([
      muatLatihan(folder, modul),
      muatMateri(folder, modul.fileMateri || "materi.html"),
      muatNavigasiModul(modul.id || id),
      muatKuis(folder, modul),
    ]);
  } catch (error) {
    console.error("Kesalahan memuat modul:", error);

    tampilkanKesalahan(
      "Gagal memuat modul",
      "Pastikan halaman dibuka lewat HTTP server (Live Server), bukan file://, dan data modul tersedia."
    );
  }
}

// ------------------------------------------------------------
// Editor dan Python
// ------------------------------------------------------------

function aturTombol(jalan, bisaDihentikan = false) {
  sedangJalan = jalan;

  elemen.tombolJalankan.disabled = jalan || !editor;
  elemen.tombolStop.disabled = !bisaDihentikan;
  elemen.tombolPeriksa.disabled = jalan || !editor || !latihanSiap;
}

function siapkanEditor() {
  try {
    editor = buatEditor(elemen.areaKode, {
      saatBerubah: tanganiPerubahanKode,
    });
    elemen.tombolJalankan.disabled = false;
  } catch (error) {
    console.error("Kesalahan membuat editor:", error);

    elemen.statusPython.textContent = "Editor gagal dimuat.";
    elemen.tombolJalankan.disabled = true;
    elemen.tombolPeriksa.disabled = true;
  }
}

async function pastikanPython() {
  if (pythonSiap) return;

  elemen.statusPython.textContent =
    "Memuat Python... (pertama kali bisa beberapa detik)";

  await siapkanPython();

  pythonSiap = true;
}

function tampilkanOutput(hasil) {
  let teks = hasil.output || "(tidak ada output)";

  if (hasil.error) {
    teks += `\n[ERROR]\n${hasil.error}`;
  }

  elemen.output.textContent = teks;
}

async function jalankanProgram(periksa = false) {
  if (!editor || sedangJalan) return;
  if (periksa && (!latihanSiap || !latihan)) return;

  const mode = periksa ? "periksa" : "jalankan";
  modeJalan = mode;
  dibatalkanPengguna = false;
  let sudahDinilai = false;

  aturTombol(true, false);
  elemen.output.textContent = periksa
    ? "Menyiapkan pemeriksaan..."
    : "Menyiapkan Python...";
  elemen.statusPython.textContent =
    "Memuat Python... (pertama kali bisa beberapa detik)";

  if (periksa) {
    aturStatusLatihan("Memeriksa...", "proses");
  }

  try {
    await pastikanPython();

    if (
      dibatalkanPengguna ||
      modeJalan !== mode ||
      tahapAktif !== "latihan"
    ) {
      elemen.statusPython.textContent = "Program dibatalkan.";
      return;
    }

    // Tombol Stop baru aktif setelah program benar-benar mulai berjalan.
    aturTombol(true, true);
    elemen.statusPython.textContent = periksa
      ? "Memeriksa output..."
      : "Program berjalan...";

    const hasil = await jalankanKode(editor.ambilKode());
    tampilkanOutput(hasil);

    if (periksa && !dibatalkanPengguna) {
      sudahDinilai = nilaiLatihan(hasil);
    }

    if (hasil.dihentikan) {
      pythonSiap = false;
      elemen.statusPython.textContent = "Program dihentikan.";
    } else {
      elemen.statusPython.textContent = "Python siap.";
    }
  } catch (error) {
    pythonSiap = false;
    elemen.output.textContent = `Terjadi kesalahan: ${error.message}`;
    elemen.statusPython.textContent = "Gagal menjalankan kode.";

    if (periksa) {
      tampilkanUmpanBalikTeknis(
        "Pemeriksaan belum dapat dijalankan. Pastikan Python sudah termuat, lalu coba lagi."
      );
    }
  } finally {
    if (periksa && !sudahDinilai) {
      perbaruiStatusLatihan();
    }

    modeJalan = null;
    aturTombol(false);
    dibatalkanPengguna = false;
  }
}

elemen.tombolJalankan.addEventListener("click", () => {
  jalankanProgram(false);
});

elemen.tombolPeriksa.addEventListener("click", () => {
  jalankanProgram(true);
});

elemen.tombolStop.addEventListener("click", () => {
  dibatalkanPengguna = true;
  hentikan("Dihentikan oleh pengguna.");
});

elemen.tombolLanjutKuis.addEventListener("click", () => {
  tampilkanTahap("kuis", { gulir: true, perbaruiHash: true });
});

// ------------------------------------------------------------
// Mulai
// ------------------------------------------------------------

siapkanEditor();
tampilkanTahap(namaTahapDariHash(), { perbaruiHash: false, animasi: false });
terapkanMedia("teks");

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(perbaruiPenandaSidebar);
}

muatModul();
