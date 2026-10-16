// Tugas berkas ini: mengubah sebuah <textarea> menjadi editor kode Python.

export function buatEditor(textarea) {
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

  return {
    ambilKode: () => editor.getValue(),
    isiKode: (kode) => editor.setValue(kode),
  };
}