/**
 * ============================================================
 * WRAPPER CODEMIRROR
 * ------------------------------------------------------------
 * Peran   : mengubah <textarea> menjadi editor Python dan
 *           menyembunyikan detail API CodeMirror dari halaman.
 * Dipakai : js/pages/modul.js (siapkanEditor).
 * Catatan : editor dikunci saat program berjalan agar output
 *           selalu berasal dari kode yang terlihat di layar.
 * ============================================================
 */

/**
 * Membuat editor dari textarea yang sudah ada.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {{saatBerubah?: () => void}} [opsi]
 * @returns {{
 *   ambilKode: () => string,
 *   isiKode: (kode: string) => void,
 *   segarkan: () => void,
 *   aturBolehUbah: (boleh: boolean) => void
 * }}
 */
export function buatEditor(textarea, { saatBerubah } = {}) {
  if (typeof CodeMirror === "undefined") {
    throw new Error("CodeMirror belum termuat.");
  }

  const editor = CodeMirror.fromTextArea(textarea, {
    mode: "python",
    lineNumbers: true,
    tabSize: 4,
    indentUnit: 4,
    indentWithTabs: false,
    extraKeys: {
      Tab: (cm) =>
        cm.somethingSelected()
          ? cm.execCommand("indentMore")
          : cm.execCommand("insertSoftTab"),
      "Shift-Tab": (cm) => cm.execCommand("indentLess"),
    },
  });

  if (typeof saatBerubah === "function") {
    editor.on("change", saatBerubah);
  }

  return {
    ambilKode: () => editor.getValue(),
    isiKode: (kode) => editor.setValue(kode),
    // Dipanggil saat panel editor baru ditampilkan agar ukurannya dihitung ulang.
    segarkan: () => editor.refresh(),
    // Saat true, pengguna tidak dapat mengubah kode yang sedang dijalankan.
    aturBolehUbah: (boleh) => editor.setOption("readOnly", !boleh),
  };
}
