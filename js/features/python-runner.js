/**
 * ============================================================
 * PYTHON RUNNER
 * ------------------------------------------------------------
 * Peran    : menjembatani halaman dengan Web Worker Pyodide.
 * Dipakai  : js/pages/modul.js (jalankanProgram, hentikan).
 * Alur     : siapkanPython() -> jalankanKode() -> pesan worker
 *            (output/selesai) -> akhiri() -> resolve.
 * Catatan  : Stop/timeout menghentikan worker total. Worker baru
 *            dibuat saat kode dijalankan lagi, sehingga Pyodide
 *            perlu dimuat ulang setelah penghentian.
 * ============================================================
 */

const URL_WORKER = new URL("../workers/pyodide-worker.js", import.meta.url);
const BATAS_WAKTU_MS = 5000;
const BATAS_OUTPUT = 10000;

let worker = null;
let janjiSiap = null;
let tugas = null; // Data program yang sedang berjalan (null = tidak ada).

/**
 * Membuang worker beserta janji kesiapannya.
 * Dipakai saat Stop, timeout, atau worker mengalami error.
 */
function bersihkanWorker() {
  if (worker) {
    worker.terminate();
  }

  worker = null;
  janjiSiap = null;
}

/**
 * Mengakhiri tugas aktif dan mengembalikan hasilnya ke pemanggil.
 *
 * @param {{error: string|null, dihentikan: boolean}} hasil
 */
function akhiri({ error, dihentikan }) {
  if (!tugas) return;

  clearTimeout(tugas.timer);

  const { resolve, output } = tugas;
  tugas = null;

  resolve({ output, error, dihentikan });
}

/**
 * Menambahkan keluaran program, sekaligus menegakkan batas ukuran.
 * Setelah batas tercapai, keluaran berikutnya diabaikan agar panel
 * Output tidak membengkak saat program mencetak ribuan baris.
 *
 * @param {string} teks
 */
function tambahOutput(teks) {
  if (!tugas || tugas.terpotong) return;
  if (typeof teks !== "string") return;

  tugas.output += teks + "\n";

  if (tugas.output.length > BATAS_OUTPUT) {
    tugas.output =
      tugas.output.slice(0, BATAS_OUTPUT) + "\n... (output dipotong)\n";
    tugas.terpotong = true;
  }
}

/**
 * Membuat worker baru dan janji yang selesai saat Pyodide siap.
 * Semua kegagalan memuat akan membersihkan worker supaya percobaan
 * berikutnya membuat worker baru, bukan memakai janji yang sudah gagal.
 */
function buatWorker() {
  const pekerja = new Worker(URL_WORKER, { type: "module" });
  worker = pekerja;

  janjiSiap = new Promise((resolve, reject) => {
    pekerja.onmessage = (event) => {
      const pesan = event.data || {};

      if (pesan.jenis === "siap") {
        resolve();
        return;
      }

      if (pesan.jenis === "gagal") {
        reject(new Error(pesan.error || "Pyodide gagal dimuat."));
        return;
      }

      if (pesan.jenis === "output") {
        tambahOutput(pesan.teks);
        return;
      }

      if (pesan.jenis === "selesai") {
        akhiri({ error: pesan.error, dihentikan: false });
      }
    };

    // Error di luar blok try/catch worker (misalnya Pyodide crash).
    pekerja.onerror = (event) => {
      const pesan = event.message || "Worker Python berhenti.";

      akhiri({ error: pesan, dihentikan: false });
      reject(new Error(pesan));
      bersihkanWorker();
    };

    // Terjadi bila pesan worker tidak dapat dideserialisasi.
    pekerja.onmessageerror = () => {
      const pesan = "Pesan dari worker Python tidak dapat dibaca.";

      akhiri({ error: pesan, dihentikan: false });
      reject(new Error(pesan));
      bersihkanWorker();
    };
  });

  // Tangani rejection agar tidak menjadi unhandled rejection. Pemanggil
  // tetap menerima error yang sama lewat janjiSiap.
  janjiSiap.catch(() => {
    if (worker === pekerja) {
      bersihkanWorker();
    }
  });
}

/**
 * Memuat Python. Aman dipanggil berkali-kali; setelah gagal, panggilan
 * berikutnya akan mencoba membuat worker baru.
 *
 * @returns {Promise<void>}
 */
export function siapkanPython() {
  if (!worker || !janjiSiap) {
    buatWorker();
  }

  return janjiSiap;
}

/**
 * Menjalankan kode di worker.
 * Selalu mengembalikan `{ output, error, dihentikan }`.
 *
 * @param {string} kode
 * @returns {Promise<{output: string, error: string|null, dihentikan: boolean}>}
 */
export async function jalankanKode(kode) {
  if (tugas) {
    return {
      output: "",
      error: "Masih ada program yang berjalan.",
      dihentikan: false,
    };
  }

  try {
    await siapkanPython();
  } catch (error) {
    bersihkanWorker();
    throw error;
  }

  // Worker bisa saja dibuang saat kode masih menunggu kesiapan.
  if (!worker) {
    return {
      output: "",
      error: "Worker Python tidak tersedia. Coba jalankan lagi.",
      dihentikan: false,
    };
  }

  return new Promise((resolve) => {
    tugas = {
      resolve,
      output: "",
      terpotong: false,
      timer: setTimeout(() => {
        hentikan(
          "Program dihentikan karena berjalan lebih dari " +
            BATAS_WAKTU_MS / 1000 +
            " detik. Periksa apakah ada perulangan yang tidak pernah berhenti."
        );
      }, BATAS_WAKTU_MS),
    };

    try {
      worker.postMessage({ kode });
    } catch (error) {
      bersihkanWorker();
      akhiri({
        error: error.message || "Kode tidak dapat dikirim ke worker.",
        dihentikan: false,
      });
    }
  });
}

/**
 * Menghentikan program aktif dengan mematikan worker.
 * Pyodide tidak bisa dihentikan dari dalam, jadi worker dibuang dan
 * akan dibuat ulang pada eksekusi berikutnya.
 *
 * @param {string} alasan pesan yang dikembalikan ke pemanggil
 */
export function hentikan(alasan = "Program dihentikan.") {
  if (!tugas) return;

  bersihkanWorker();
  akhiri({ error: alasan, dihentikan: true });
}
