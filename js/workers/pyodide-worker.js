/**
 * ============================================================
 * WORKER PYODIDE
 * ------------------------------------------------------------
 * Berkas ini berjalan di worker terpisah, bukan di halaman.
 * Peran : memuat Python sekali, lalu menjalankan kode yang dikirim
 *         halaman dan mengirim kembali keluaran/errornya.
 * Alur  : loadPyodide() -> setStdout/setStderr -> pesan "siap".
 *         Setiap pesan { kode } dijalankan di global baru.
 * ============================================================
 */

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.mjs";

let pyodide = null;

/**
 * Mengirim keluaran Python ke halaman.
 *
 * @param {string} teks
 * @param {boolean} galat true bila berasal dari stderr
 */
function kirimOutput(teks, galat = false) {
  self.postMessage({ jenis: "output", teks, galat: Boolean(galat) });
}

/**
 * Memuat Pyodide dan menyiapkan saluran stdout/stderr.
 * Kegagalan dikirim sebagai pesan "gagal"; halaman akan membuang
 * worker ini dan membuat worker baru saat mencoba lagi.
 */
async function mulai() {
  try {
    pyodide = await loadPyodide();

    pyodide.setStdout({
      batched: (teks) => kirimOutput(teks),
    });

    // Pesan peringatan Python tetap terlihat, tetapi tidak dianggap error.
    pyodide.setStderr({
      batched: (teks) => kirimOutput(teks, true),
    });

    self.postMessage({ jenis: "siap" });
  } catch (err) {
    self.postMessage({
      jenis: "gagal",
      error: err && err.message ? err.message : String(err),
    });
  }
}

const siap = mulai();

/**
 * Menjalankan satu program di namespace baru.
 * Namespace baru mencegah variabel dari eksekusi sebelumnya bocor ke
 * eksekusi berikutnya, sehingga hasil latihan selalu mencerminkan kode
 * yang baru dijalankan.
 *
 * @param {string} kode
 * @returns {string|null} pesan error, atau null bila berhasil
 */
function jalankan(kode) {
  const globalBaru = pyodide.globals.get("dict")();

  try {
    pyodide.runPython(kode, { globals: globalBaru });
    return null;
  } catch (err) {
    return err && err.message ? err.message : String(err);
  } finally {
    // Bebaskan objek Python agar memori worker tidak terus bertambah.
    globalBaru.destroy();
  }
}

self.onmessage = async (event) => {
  await siap;

  if (!pyodide) {
    self.postMessage({
      jenis: "selesai",
      error: "Python belum siap. Muat ulang halaman lalu coba lagi.",
    });
    return;
  }

  const kode = String(event.data && event.data.kode ? event.data.kode : "");
  const error = jalankan(kode);

  self.postMessage({ jenis: "selesai", error });
};
