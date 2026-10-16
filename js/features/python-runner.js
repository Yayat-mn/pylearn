// Tugas berkas ini: menjalankan kode Python di Web Worker dan mengembalikan hasilnya.
// Bentuk pemakaian tetap: jalankanKode(kode) -> { output, error, dihentikan }

const URL_WORKER = new URL("../workers/pyodide-worker.js", import.meta.url);
const BATAS_WAKTU_MS = 5000;
const BATAS_OUTPUT = 10000;

let worker = null;
let janjiSiap = null;
let tugas = null; // data program yang sedang berjalan (null = tidak ada)

function buatWorker() {
  worker = new Worker(URL_WORKER, { type: "module" });
  janjiSiap = new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      const pesan = event.data;
      if (pesan.jenis === "siap") resolve();
      else if (pesan.jenis === "gagal") reject(new Error(pesan.error));
      else if (pesan.jenis === "output") tambahOutput(pesan.teks);
      else if (pesan.jenis === "selesai") akhiri({ error: pesan.error, dihentikan: false });
    };
    worker.onerror = (event) => {
      reject(new Error(event.message || "Worker gagal dimuat"));
    };
  });
}

function tambahOutput(teks) {
  if (!tugas || tugas.terpotong) return;
  tugas.output += teks + "\n";
  if (tugas.output.length > BATAS_OUTPUT) {
    tugas.output = tugas.output.slice(0, BATAS_OUTPUT) + "\n... (output dipotong)\n";
    tugas.terpotong = true;
  }
}

function akhiri({ error, dihentikan }) {
  if (!tugas) return;
  clearTimeout(tugas.timer);
  const { resolve, output } = tugas;
  tugas = null;
  resolve({ output, error, dihentikan });
}

// Memuat Python. Aman dipanggil berkali-kali.
export function siapkanPython() {
  if (!worker) buatWorker();
  return janjiSiap;
}

// Menjalankan kode. Selalu mengembalikan { output, error, dihentikan }.
export async function jalankanKode(kode) {
  if (tugas) {
    return { output: "", error: "Masih ada program yang berjalan.", dihentikan: false };
  }
  await siapkanPython();

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
    worker.postMessage({ kode });
  });
}

// Mematikan worker (dan program yang sedang berjalan di dalamnya).
export function hentikan(alasan = "Program dihentikan.") {
  if (!tugas) return;
  worker.terminate();
  worker = null;
  janjiSiap = null;
  akhiri({ error: alasan, dihentikan: true });
}