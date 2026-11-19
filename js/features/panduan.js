/**
 * ============================================================
 * PANDUAN PENGGUNA
 * ------------------------------------------------------------
 * Peran   : menampilkan dialog panduan di dashboard dan mengisi
 *           isinya dari `data/panduan.json`.
 * Dipakai : js/pages/dashboard.js
 * Alur    : klik tombol -> dialog dibuka -> data dimuat sekali ->
 *           tiap bab dirender sebagai <details> buka-tutup.
 * Catatan : isi panduan dibuat dengan textContent, bukan innerHTML,
 *           agar aman bila data berubah.
 * ============================================================
 */

const URL_PANDUAN = "data/panduan.json";

let janjiPanduan = null;

/**
 * Memuat `data/panduan.json` satu kali lalu menyimpan hasilnya.
 * Jika gagal, cache dibersihkan supaya percobaan berikutnya masih
 * bisa berhasil.
 *
 * @returns {Promise<object>}
 */
function muatPanduan() {
  if (janjiPanduan) return janjiPanduan;

  janjiPanduan = fetch(URL_PANDUAN)
    .then((respons) => {
      if (!respons.ok) {
        throw new Error("Panduan tidak dapat dimuat.");
      }

      return respons.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.bab)) {
        throw new Error("Format panduan tidak sesuai.");
      }

      return data;
    })
    .catch((galat) => {
      janjiPanduan = null;
      throw galat;
    });

  return janjiPanduan;
}

/**
 * Membuat satu baris langkah panduan.
 *
 * @param {{judul: string, teks: string}} langkah
 * @returns {HTMLLIElement}
 */
function buatLangkah(langkah) {
  const item = document.createElement("li");

  const judul = document.createElement("strong");
  judul.textContent = langkah.judul;

  const teks = document.createElement("p");
  teks.textContent = langkah.teks;

  item.append(judul, teks);
  return item;
}

const DURASI_BAB = 260;
const KURVA_BAB = "cubic-bezier(0.22, 0.61, 0.36, 1)";

/**
 * Menghormati setelan sistem "kurangi gerak".
 *
 * @returns {boolean}
 */
function kurangiGerak() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Memasang animasi buka-tutup pada satu bab panduan.
 *
 * Bawaan <details> menampilkan isi secara mendadak. Klik pada judul
 * karena itu ditahan, lalu tinggi dan opasitas isi dianimasikan
 * sebelum keadaan `open` diubah.
 *
 * @param {HTMLDetailsElement} bagian
 */
function pasangAnimasiBab(bagian) {
  const ringkas = bagian.querySelector(".panduan__judul-bab");
  const isi = bagian.querySelector(".panduan__isi-bab");

  if (!ringkas || !isi) return;

  let animasi = null;

  // Keadaan yang dituju, bukan sekadar `bagian.open`. Saat animasi tutup
  // berjalan, `open` masih true; tanpa penanda ini klik cepat akan
  // mengulang animasi tutup, bukan membuka kembali.
  let niatTerbuka = bagian.open;

  function hentikanAnimasi() {
    if (animasi) {
      animasi.cancel();
      animasi = null;
    }
  }

  function buka() {
    hentikanAnimasi();
    niatTerbuka = true;
    bagian.open = true;

    if (kurangiGerak() || typeof isi.animate !== "function") return;

    const tinggi = isi.offsetHeight;
    if (!tinggi) return;

    animasi = isi.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${tinggi}px`, opacity: 1 },
      ],
      { duration: DURASI_BAB, easing: KURVA_BAB }
    );

    animasi.onfinish = () => {
      animasi = null;
    };
    animasi.oncancel = () => {
      animasi = null;
    };
  }

  function tutup() {
    hentikanAnimasi();
    niatTerbuka = false;

    if (kurangiGerak() || typeof isi.animate !== "function") {
      bagian.open = false;
      return;
    }

    const tinggi = isi.offsetHeight;
    if (!tinggi) {
      bagian.open = false;
      return;
    }

    animasi = isi.animate(
      [
        { height: `${tinggi}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: DURASI_BAB, easing: KURVA_BAB }
    );

    animasi.onfinish = () => {
      animasi = null;
      bagian.open = false;
    };
    animasi.oncancel = () => {
      animasi = null;
    };
  }

  ringkas.addEventListener("click", (peristiwa) => {
    // Buka-tutup diatur sendiri agar isi bisa dianimasikan.
    peristiwa.preventDefault();

    if (niatTerbuka) {
      tutup();
      return;
    }

    buka();
  });
}

/**
 * Merender seluruh bab panduan ke dalam wadah.
 *
 * @param {object} data hasil `muatPanduan()`
 * @param {HTMLElement} wadah
 */
function renderPanduan(data, wadah) {
  wadah.replaceChildren();

  data.bab.forEach((bab, indeks) => {
    const bagian = document.createElement("details");
    bagian.className = "panduan__bab";

    // Bab pertama dibuka agar pengguna langsung melihat isinya.
    if (indeks === 0) bagian.open = true;

    const ringkas = document.createElement("summary");
    ringkas.className = "panduan__judul-bab";
    ringkas.textContent = bab.judul;

    const daftar = document.createElement("ol");
    daftar.className = "panduan__langkah";
    bab.langkah.forEach((langkah) => daftar.append(buatLangkah(langkah)));

    // Pembungkus ini yang dianimasikan tinggi dan opasitasnya.
    const isi = document.createElement("div");
    isi.className = "panduan__isi-bab";
    isi.append(daftar);

    bagian.append(ringkas, isi);
    pasangAnimasiBab(bagian);
    wadah.append(bagian);
  });
}

/**
 * Memasang tombol pembuka dan dialog panduan.
 *
 * @param {{dialog: HTMLDialogElement, tombolBuka: HTMLButtonElement}} elemen
 * @returns {{buka: () => Promise<void>}|null}
 */
export function siapkanPanduan({ dialog, tombolBuka }) {
  if (!dialog || !tombolBuka) return null;

  const wadah = dialog.querySelector("[data-wadah-panduan]");
  if (!wadah) return null;

  let sudahDimuat = false;
  let fokusSebelumnya = null;

  // Pesan sementara selama data dimuat atau saat pemuatan gagal.
  function tampilkanStatus(teks, gagal = false) {
    const pesan = document.createElement("p");
    pesan.className = gagal
      ? "panduan__status panduan__status--gagal"
      : "panduan__status";
    pesan.textContent = teks;
    wadah.replaceChildren(pesan);
  }

  function tutup() {
    document.body.classList.remove("tanpa-gulir");

    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }

    // Kembalikan fokus ke tombol pembuka agar pengguna keyboard tidak
    // kehilangan posisi setelah dialog ditutup.
    const tujuan =
      fokusSebelumnya instanceof HTMLElement &&
      fokusSebelumnya !== document.body
        ? fokusSebelumnya
        : tombolBuka;

    window.setTimeout(() => tujuan.focus({ preventScroll: true }), 0);
    fokusSebelumnya = null;
  }

  async function buka() {
    if (dialog.open) return;

    fokusSebelumnya = document.activeElement;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    document.body.classList.add("tanpa-gulir");

    if (sudahDimuat) return;

    tampilkanStatus("Memuat panduan…");

    try {
      const data = await muatPanduan();
      renderPanduan(data, wadah);
      sudahDimuat = true;
    } catch {
      tampilkanStatus(
        "Panduan tidak dapat dimuat. Periksa koneksi lalu buka kembali tombol Panduan.",
        true
      );
    }
  }

  tombolBuka.addEventListener("click", buka);

  dialog.querySelectorAll("[data-tutup-panduan]").forEach((tombol) => {
    tombol.addEventListener("click", tutup);
  });

  // Klik pada latar gelap di luar kotak panduan menutup dialog.
  dialog.addEventListener("click", (peristiwa) => {
    if (peristiwa.target === dialog) tutup();
  });

  // showModal() mengunci gulir halaman secara visual; kelas ini
  // memastikan halaman di belakangnya tidak ikut bergulir.
  dialog.addEventListener("close", () => {
    document.body.classList.remove("tanpa-gulir");
  });

  dialog.addEventListener("cancel", () => {
    document.body.classList.remove("tanpa-gulir");
  });

  return { buka };
}
