// Berkas ini berjalan di "pekerja" terpisah, bukan di halaman.
// Tugasnya: memuat Python lalu menjalankan kode yang dikirim halaman.

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.mjs";

let pyodide = null;

async function mulai() {
  try {
    pyodide = await loadPyodide();
    pyodide.setStdout({
      batched: (teks) => self.postMessage({ jenis: "output", teks }),
    });
    self.postMessage({ jenis: "siap" });
  } catch (err) {
    self.postMessage({ jenis: "gagal", error: err.message });
  }
}
const siap = mulai();

self.onmessage = async (event) => {
  await siap;
  if (!pyodide) return;

  try {
    pyodide.runPython(event.data.kode);
    self.postMessage({ jenis: "selesai", error: null });
  } catch (err) {
    self.postMessage({ jenis: "selesai", error: err.message });
  }
};