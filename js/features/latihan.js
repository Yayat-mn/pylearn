// Logika pemeriksaan latihan: menormalkan output lalu membandingkannya.

// Menyeragamkan akhir baris dan membuang spasi/baris kosong yang tidak bermakna.
export function normalisasiOutput(teks) {
  return String(teks ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((baris) => baris.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

// Perbandingan tetap case-sensitive agar teks yang ditampilkan harus sama.
export function bandingkanOutput(aktual, diharapkan) {
  const outputAktual = normalisasiOutput(aktual);
  const outputDiharapkan = normalisasiOutput(diharapkan);

  return {
    cocok: outputAktual === outputDiharapkan,
    outputAktual,
    outputDiharapkan,
  };
}
