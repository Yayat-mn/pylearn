// Tugas berkas ini: mengubah sebuah <textarea> menjadi editor kode Python.

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
  };
}