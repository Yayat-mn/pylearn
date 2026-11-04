/**
 * ============================================================
 * WORKER PYODIDE
 * ------------------------------------------------------------
 * Berkas ini berjalan di worker terpisah, bukan di halaman.
 * Peran : memuat Python sekali, lalu menjalankan kode yang dikirim
 *         halaman dan mengirim kembali keluaran/errornya.
 * Alur  : loadPyodide() -> setStdout/setStderr -> pesan "siap".
 *         Setiap pesan { kode, jawaban, interaktif } dijalankan di
 *         namespace baru.
 *         Bila kode memanggil input() dan jawaban habis, worker
 *         mengirim "minta-input" lalu halaman menjalankan ulang kode
 *         dengan jawaban tambahan.
 * ============================================================
 */

import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.mjs";

let pyodide = null;

/**
 * Kode Python yang dipasang sebelum kode pengguna.
 *
 * `input()` versi ini memakai jawaban yang sudah dikirim halaman.
 * Jika jawaban habis:
 * - mode interaktif berhenti dengan sinyal internal agar halaman dapat
 *   meminta jawaban baru;
 * - mode pemeriksaan melempar EOFError karena skenario uji sudah habis.
 */
const PEMBUKA_INPUT = `
import json as _json
import sys as _sys

_jawaban = _json.loads(_jawaban_json)
_interaktif = bool(_interaktif_json)

_menunggu_input = False
_prompt_aktif = ""


class _ButuhInput(Exception):
    pass


def input(prompt=""):
    global _menunggu_input, _prompt_aktif

    prompt = str(prompt)

    if _jawaban:
        jawaban = _jawaban.pop(0)
        print(f"{prompt}{jawaban}")
        return jawaban

    if _interaktif:
        _prompt_aktif = prompt
        _menunggu_input = True
        _sys.stdout.flush()
        raise _ButuhInput()

    raise EOFError(
        "Program meminta input lagi, tetapi skenario uji sudah habis."
    )
`;

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
 * @param {{jawaban: string[], interaktif: boolean}} opsi
 * @returns {{error: string|null, prompt: string|null}}
 */
function jalankan(kode, { jawaban, interaktif }) {
  const globalBaru = pyodide.globals.get("dict")();
  const hasil = { error: null, prompt: null };

  try {
    // Jawaban dikirim sebagai JSON agar tidak ada masalah escaping saat
    // dimasukkan ke kode Python.
    globalBaru.set("_jawaban_json", JSON.stringify(jawaban));
    globalBaru.set("_interaktif_json", Boolean(interaktif));

    pyodide.runPython(PEMBUKA_INPUT, { globals: globalBaru });
    pyodide.runPython(kode, { globals: globalBaru });
  } catch (err) {
    if (globalBaru.get("_menunggu_input")) {
      const prompt = globalBaru.get("_prompt_aktif");
      hasil.prompt = typeof prompt === "string" ? prompt : "";
    } else {
      hasil.error = err && err.message ? err.message : String(err);
    }
  } finally {
    // Bebaskan objek Python agar memori worker tidak terus bertambah.
    globalBaru.destroy();
  }

  return hasil;
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

  const data = event.data || {};
  const kode = String(data.kode || "");
  const jawaban = Array.isArray(data.jawaban)
    ? data.jawaban.map((nilai) => String(nilai))
    : [];
  const interaktif = Boolean(data.interaktif);

  const hasil = jalankan(kode, { jawaban, interaktif });

  if (hasil.prompt !== null) {
    self.postMessage({ jenis: "minta-input", prompt: hasil.prompt });
    return;
  }

  self.postMessage({ jenis: "selesai", error: hasil.error });
};
