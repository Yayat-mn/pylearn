/**
 * ============================================================
 * PEMBANDING OUTPUT LATIHAN
 * ------------------------------------------------------------
 * Peran   : menormalkan keluaran Python lalu membandingkannya dengan
 *           `outputDiharapkan` pada latihan.json.
 * Dipakai : js/pages/modul.js (nilaiLatihan).
 * Aturan  : akhir baris diseragamkan, spasi akhir baris dibuang,
 *           baris kosong di awal/akhir diabaikan, huruf tetap
 *           dibedakan (case-sensitive).
 * ============================================================
 */

/**
 * Menyeragamkan akhir baris dan membuang spasi/baris kosong yang tidak
 * bermakna. Spasi di awal baris sengaja dipertahankan karena indentasi
 * Python berpengaruh pada output.
 *
 * @param {string|null|undefined} teks
 * @returns {string}
 */
export function normalisasiOutput(teks) {
  return String(teks ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((baris) => baris.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

/**
 * Membandingkan output aktual dengan target.
 *
 * @param {string} aktual
 * @param {string} diharapkan
 * @returns {{cocok: boolean, outputAktual: string, outputDiharapkan: string}}
 */
export function bandingkanOutput(aktual, diharapkan) {
  const outputAktual = normalisasiOutput(aktual);
  const outputDiharapkan = normalisasiOutput(diharapkan);

  return {
    cocok: outputAktual === outputDiharapkan,
    outputAktual,
    outputDiharapkan,
  };
}
