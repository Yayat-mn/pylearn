// Transisi antarhalaman: lapisan latar memudar sebelum berpindah halaman.

const KELAS_AKTIF = "transisi-halaman--aktif";
const KELAS_KELUAR = "halaman-keluar";
const DURASI_MS = 190;

export function siapkanTransisiHalaman() {
  const kurangiGerak = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  let sedangPindah = false;
  let waktuPindah = null;

  const lapisan = document.createElement("div");
  lapisan.className = "transisi-halaman";
  lapisan.setAttribute("aria-hidden", "true");
  document.body.appendChild(lapisan);

  function reset() {
    sedangPindah = false;
    clearTimeout(waktuPindah);
    document.body.classList.remove(KELAS_KELUAR);
    lapisan.classList.remove(KELAS_AKTIF);
  }

  document.addEventListener("click", (event) => {
    if (sedangPindah) {
      event.preventDefault();
      return;
    }

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const target =
      event.target instanceof Element
        ? event.target
        : event.target.parentElement;

    const tautan = target?.closest("a");

    if (!tautan) return;
    if (tautan.target && tautan.target !== "_self") return;
    if (tautan.hasAttribute("download")) return;
    if (tautan.getAttribute("href")?.startsWith("#")) return;

    const url = new URL(tautan.href, window.location.href);

    if (url.origin !== window.location.origin) return;
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    // Tautan ke bagian yang sama tetap memakai smooth scroll halaman.
    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash
    ) {
      return;
    }

    if (url.href === window.location.href) return;

    event.preventDefault();

    if (kurangiGerak.matches) {
      window.location.href = url.href;
      return;
    }

    sedangPindah = true;
    document.body.classList.add(KELAS_KELUAR);
    lapisan.classList.add(KELAS_AKTIF);

    waktuPindah = window.setTimeout(() => {
      window.location.href = url.href;
    }, DURASI_MS);
  }, true);

  // Saat halaman dipulihkan dari cache browser, bersihkan keadaan transisi.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) reset();
  });

  window.addEventListener("pagehide", () => {
    clearTimeout(waktuPindah);
  });
}
