import { buatEditor } from "../features/editor.js";
import { siapkanPython, jalankanKode, hentikan } from "../features/python-runner.js";

const editor = buatEditor(document.getElementById("kode"));
const tombol = document.getElementById("tombol-jalankan");
const tombolStop = document.getElementById("tombol-stop");
const status = document.getElementById("status-python");
const output = document.getElementById("output");

function aturTombol(sedangJalan) {
  tombol.disabled = sedangJalan;
  tombolStop.disabled = !sedangJalan;
}

function muatPython() {
  tombol.disabled = true;
  tombolStop.disabled = true;
  status.textContent = "Memuat Python... (pertama kali bisa beberapa detik)";

  siapkanPython()
    .then(() => {
      status.textContent = "Python siap.";
      aturTombol(false);
    })
    .catch((err) => {
      status.textContent = "Gagal memuat Python: " + err.message;
    });
}

tombol.addEventListener("click", async () => {
  aturTombol(true);
  output.textContent = "Menjalankan...";
  status.textContent = "Program berjalan...";

  const hasil = await jalankanKode(editor.ambilKode());

  let teks = hasil.output || "(tidak ada output)";
  if (hasil.error) {
    teks += "\n[ERROR]\n" + hasil.error;
  }
  output.textContent = teks;

  if (hasil.dihentikan) {
    muatPython(); // worker lama sudah dimatikan, siapkan yang baru
  } else {
    status.textContent = "Python siap.";
    aturTombol(false);
  }
});

tombolStop.addEventListener("click", () => hentikan("Dihentikan oleh pengguna."));

muatPython();

window.editorUji = editor;