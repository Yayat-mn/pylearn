/**
 * ============================================================
 * SIDEBAR RESPONSIF
 * ------------------------------------------------------------
 * Peran   : mengatur buka-tutup sidebar pada layar kecil.
 * Dipakai : dashboard, halaman modul, dan halaman penutup agar
 *           perilakunya sama.
 * Catatan : di mobile, sidebar tertutup diberi `inert` agar
 *           tautannya tidak bisa dijangkau Tab dari balik tirai.
 * ============================================================
 */

const BATAS_DESKTOP = 1024;

/**
 * Memasang perilaku sidebar responsif.
 *
 * @param {{sidebar: HTMLElement, tombolMenu: HTMLElement, tirai: HTMLElement}} elemen
 * @returns {{aturSidebar: (buka: boolean, opsi?: {kembalikanFokus?: boolean}) => void}}
 */
export function siapkanSidebar({ sidebar, tombolMenu, tirai }) {
  let fokusSebelumnya = null;

  /**
   * Menerapkan keadaan buka/tutup. Di layar kecil, sidebar yang tertutup
   * dibuat inert agar tautannya tidak bisa dijangkau Tab dari balik tirai.
   *
   * @param {boolean} buka
   * @param {{kembalikanFokus?: boolean}} opsi
   */
  function aturSidebar(buka, { kembalikanFokus = false } = {}) {
    const modeMobile = window.innerWidth <= BATAS_DESKTOP;
    const terbuka = modeMobile && buka;

    sidebar.classList.toggle("sidebar--terbuka", terbuka);
    tombolMenu.setAttribute("aria-expanded", String(terbuka));
    tombolMenu.setAttribute(
      "aria-label",
      terbuka ? "Tutup navigasi" : "Buka navigasi"
    );

    tirai.hidden = !terbuka;
    document.body.classList.toggle("tanpa-gulir", terbuka);

    if (modeMobile) {
      sidebar.inert = !terbuka;
      sidebar.setAttribute("aria-hidden", String(!terbuka));
    } else {
      sidebar.inert = false;
      sidebar.removeAttribute("aria-hidden");
    }

    if (terbuka) {
      const tautanPertama = sidebar.querySelector("a");
      if (tautanPertama) tautanPertama.focus({ preventScroll: true });
      return;
    }

    if (kembalikanFokus) {
      // Pada klik sentuh, tombol menu belum tentu menerima fokus, jadi
      // kembalikan ke tombol menu bila elemen sebelumnya bukan elemen fokus.
      const tujuanFokus =
        fokusSebelumnya instanceof HTMLElement &&
        fokusSebelumnya !== document.body
          ? fokusSebelumnya
          : tombolMenu;

      // Fokus dipindahkan setelah browser merapikan fokus dari sidebar
      // yang baru saja diberi atribut inert.
      window.setTimeout(() => {
        tujuanFokus.focus({ preventScroll: true });
      }, 0);
    }

    fokusSebelumnya = null;
  }

  tombolMenu.addEventListener("click", () => {
    const sedangTerbuka = sidebar.classList.contains("sidebar--terbuka");

    if (sedangTerbuka) {
      aturSidebar(false, { kembalikanFokus: true });
      return;
    }

    fokusSebelumnya = document.activeElement;
    aturSidebar(true);
  });

  tirai.addEventListener("click", () => {
    aturSidebar(false, { kembalikanFokus: true });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sidebar.classList.contains("sidebar--terbuka")) {
      aturSidebar(false, { kembalikanFokus: true });
    }
  });

  sidebar.querySelectorAll("a").forEach((tautan) => {
    tautan.addEventListener("click", () => {
      // Navigasi tetap berjalan; fokus tidak perlu dikembalikan.
      if (window.innerWidth <= BATAS_DESKTOP) {
        aturSidebar(false);
      }
    });
  });

  window.addEventListener("resize", () => {
    // Pastikan status inert ikut berubah saat layar melewati batas desktop.
    if (window.innerWidth > BATAS_DESKTOP) {
      aturSidebar(false);
      return;
    }

    if (!sidebar.classList.contains("sidebar--terbuka")) {
      aturSidebar(false);
    }
  });

  // Keadaan awal: di mobile sidebar tertutup dan tidak dapat difokuskan.
  aturSidebar(false);

  return { aturSidebar };
}
