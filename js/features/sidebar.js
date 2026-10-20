// Mengatur buka-tutup sidebar pada layar kecil.
// Dipakai oleh dashboard dan halaman modul agar perilakunya sama.

export function siapkanSidebar({ sidebar, tombolMenu, tirai }) {
  function aturSidebar(buka) {
    sidebar.classList.toggle("sidebar--terbuka", buka);
    tombolMenu.setAttribute("aria-expanded", String(buka));
    tombolMenu.setAttribute(
      "aria-label",
      buka ? "Tutup navigasi" : "Buka navigasi"
    );
    tirai.hidden = !buka;
    document.body.classList.toggle("tanpa-gulir", buka);
  }

  tombolMenu.addEventListener("click", () => {
    const sedangTerbuka = sidebar.classList.contains("sidebar--terbuka");
    aturSidebar(!sedangTerbuka);
  });

  tirai.addEventListener("click", () => aturSidebar(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      aturSidebar(false);
    }
  });

  sidebar.querySelectorAll("a").forEach((tautan) => {
    tautan.addEventListener("click", () => {
      if (window.innerWidth <= 1024) {
        aturSidebar(false);
      }
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      aturSidebar(false);
    }
  });

  return { aturSidebar };
}
