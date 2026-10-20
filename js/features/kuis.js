// Logika kuis: validasi data, penilaian, dan tampilan soal pilihan ganda.

const HURUF = ["A", "B", "C", "D"];

// Memastikan data kuis lengkap sebelum ditampilkan.
export function validasiKuis(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Data kuis tidak valid.");
  }

  if (!Array.isArray(data.soal) || data.soal.length === 0) {
    throw new Error("Kuis belum memiliki soal.");
  }

  const batasLulus = Number(data.batasLulus);

  if (!Number.isFinite(batasLulus) || batasLulus < 0 || batasLulus > 100) {
    throw new Error("Batas lulus kuis harus berada di antara 0 dan 100.");
  }

  const soal = data.soal.map((butir, indeks) => {
    const nomor = indeks + 1;

    if (!butir || typeof butir !== "object" || Array.isArray(butir)) {
      throw new Error(`Soal ${nomor} tidak valid.`);
    }

    const pertanyaan =
      typeof butir.pertanyaan === "string" ? butir.pertanyaan.trim() : "";

    if (!pertanyaan) {
      throw new Error(`Pertanyaan soal ${nomor} belum diisi.`);
    }

    if (!Array.isArray(butir.pilihan) || butir.pilihan.length < 2) {
      throw new Error(`Soal ${nomor} harus memiliki minimal dua pilihan.`);
    }

    if (butir.pilihan.length > HURUF.length) {
      throw new Error(`Soal ${nomor} memiliki terlalu banyak pilihan.`);
    }

    const pilihan = butir.pilihan.map((teks) =>
      typeof teks === "string" ? teks.trim() : ""
    );

    if (pilihan.some((teks) => !teks)) {
      throw new Error(`Pilihan jawaban soal ${nomor} belum lengkap.`);
    }

    const jawaban =
      typeof butir.jawaban === "string"
        ? butir.jawaban.trim().toUpperCase()
        : "";

    if (!HURUF.slice(0, pilihan.length).includes(jawaban)) {
      throw new Error(`Kunci jawaban soal ${nomor} tidak valid.`);
    }

    return {
      pertanyaan,
      pilihan,
      jawaban,
      pembahasan:
        typeof butir.pembahasan === "string"
          ? butir.pembahasan.trim()
          : "",
    };
  });

  return {
    judul:
      typeof data.judul === "string" && data.judul.trim()
        ? data.judul.trim()
        : "Kuis Evaluasi",
    batasLulus: Math.round(batasLulus),
    soal,
  };
}

// Nilai dibulatkan agar cocok dengan aturan penilaian pada skema data.
export function hitungNilai(jumlahBenar, jumlahSoal) {
  if (!Number.isFinite(jumlahBenar) || !Number.isFinite(jumlahSoal)) {
    return 0;
  }

  if (jumlahSoal <= 0) return 0;

  return Math.round((jumlahBenar / jumlahSoal) * 100);
}

function buatElemen(tag, kelas = "", teks) {
  const elemen = document.createElement(tag);

  if (kelas) elemen.className = kelas;
  if (teks !== undefined) elemen.textContent = teks;

  return elemen;
}

// Kartu informasi saat kuis belum dapat dimuat.
export function tampilkanKuisKosong(
  wadah,
  pesan,
  judul = "Kuis belum tersedia"
) {
  if (!wadah) return;

  wadah.replaceChildren();

  const kartu = buatElemen("div", "kartu-kosong");
  const ikon = buatElemen("span", "kartu-kosong__ikon", "?");
  const lencana = buatElemen("span", "lencana", "Tahap 3");
  const heading = buatElemen("h2", "kartu-kosong__judul", judul);
  const teks = buatElemen("p", "kartu-kosong__teks", pesan);

  ikon.setAttribute("aria-hidden", "true");
  kartu.append(ikon, lencana, heading, teks);
  wadah.appendChild(kartu);
}

// Menampilkan seluruh kuis dan mengelola jawaban di dalam satu wadah.
export function buatKuis({
  wadah,
  data,
  saatUlangi,
  saatLanjut,
  dapatkanLanjut,
}) {
  if (!wadah) return null;

  wadah.replaceChildren();

  let terkumpul = false;

  // ----------------------------------------------------------
  // Kepala kuis
  // ----------------------------------------------------------

  const kepala = buatElemen("div", "kuis__kepala");
  const lencana = buatElemen("span", "lencana lencana--biru", "Tahap 3");
  const judul = buatElemen("h2", "kuis__judul", data.judul);
  const teks = buatElemen(
    "p",
    "kuis__teks",
    `Jawab ${data.soal.length} soal berikut. Nilai minimal untuk lulus adalah ${data.batasLulus}.`
  );

  const meta = buatElemen("div", "kuis__meta");
  meta.append(
    buatElemen("span", "kuis__meta-item", `${data.soal.length} soal`),
    buatElemen("span", "kuis__meta-item", `Batas lulus ${data.batasLulus}`),
    buatElemen("span", "kuis__meta-item", "Pilihan ganda")
  );

  kepala.append(lencana, judul, teks, meta);

  // ----------------------------------------------------------
  // Form dan daftar soal
  // ----------------------------------------------------------

  const form = buatElemen("form", "kuis__form");
  form.noValidate = true;

  const peringatan = buatElemen("p", "kuis__peringatan");
  peringatan.hidden = true;
  peringatan.setAttribute("role", "alert");

  const daftar = buatElemen("div", "kuis__daftar");
  const soal = [];

  data.soal.forEach((butir, indeks) => {
    const nomorSoal = indeks + 1;
    const idLabel = `soal-kuis-${nomorSoal}`;

    const kartu = buatElemen("div", "soal-kuis");
    kartu.setAttribute("role", "group");
    kartu.setAttribute("aria-labelledby", idLabel);

    const judulSoal = buatElemen("div", "soal-kuis__legend");
    judulSoal.id = idLabel;

    const nomor = buatElemen(
      "span",
      "soal-kuis__nomor",
      String(nomorSoal).padStart(2, "0")
    );
    nomor.setAttribute("aria-hidden", "true");

    const pertanyaan = buatElemen(
      "span",
      "soal-kuis__pertanyaan",
      butir.pertanyaan
    );

    judulSoal.append(nomor, pertanyaan);

    const wadahPilihan = buatElemen("div", "soal-kuis__pilihan");
    const labelPilihan = [];
    const inputs = [];

    const status = buatElemen("p", "soal-kuis__status");
    status.hidden = true;

    butir.pilihan.forEach((teksPilihan, i) => {
      const huruf = HURUF[i];
      const label = buatElemen("label", "pilihan-kuis");
      label.dataset.huruf = huruf;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `soal-kuis-${nomorSoal}`;
      input.value = huruf;
      input.className = "pilihan-kuis__input";
      input.id = `soal-kuis-${nomorSoal}-${huruf}`;

      const bulatan = buatElemen("span", "pilihan-kuis__huruf", huruf);
      bulatan.setAttribute("aria-hidden", "true");

      const teksOpsi = buatElemen(
        "span",
        "pilihan-kuis__teks",
        teksPilihan
      );

      label.append(input, bulatan, teksOpsi);

      input.addEventListener("change", () => {
        labelPilihan.forEach((lain) => {
          lain.classList.remove("pilihan-kuis--dipilih");
        });
        label.classList.add("pilihan-kuis--dipilih");

        kartu.classList.remove("soal-kuis--belum");

        if (!terkumpul) {
          status.hidden = true;
          status.textContent = "";
          status.className = "soal-kuis__status";
        }
      });

      labelPilihan.push(label);
      inputs.push(input);
      wadahPilihan.appendChild(label);
    });

    const pembahasan = buatElemen("div", "pembahasan-kuis");
    pembahasan.hidden = true;
    pembahasan.append(
      buatElemen("strong", "", "Pembahasan"),
      buatElemen(
        "p",
        "",
        butir.pembahasan || "Pembahasan belum disediakan."
      )
    );

    kartu.append(judulSoal, wadahPilihan, status, pembahasan);
    daftar.appendChild(kartu);

    soal.push({
      butir,
      kartu,
      inputs,
      labelPilihan,
      status,
      pembahasan,
    });
  });

  // ----------------------------------------------------------
  // Aksi dan hasil
  // ----------------------------------------------------------

  const aksi = buatElemen("div", "kuis__aksi");
  const catatanAksi = buatElemen(
    "p",
    "kuis__aksi-teks",
    "Nilai muncul setelah semua soal dijawab dan dikumpulkan."
  );
  const tombolKumpulkan = buatElemen(
    "button",
    "tombol",
    "Kumpulkan Jawaban"
  );
  tombolKumpulkan.type = "submit";

  aksi.append(catatanAksi, tombolKumpulkan);

  const hasil = buatElemen("div", "kuis__hasil");
  hasil.hidden = true;
  hasil.setAttribute("role", "status");
  hasil.setAttribute("aria-live", "polite");

  form.append(peringatan, daftar, aksi, hasil);
  wadah.append(kepala, form);

  // ----------------------------------------------------------
  // Perilaku kuis
  // ----------------------------------------------------------

  function ulangi() {
    terkumpul = false;
    form.reset();

    peringatan.hidden = true;
    peringatan.textContent = "";
    tombolKumpulkan.disabled = false;
    tombolKumpulkan.textContent = "Kumpulkan Jawaban";

    soal.forEach((item) => {
      item.kartu.classList.remove(
        "soal-kuis--benar",
        "soal-kuis--salah",
        "soal-kuis--belum"
      );

      item.labelPilihan.forEach((label) => {
        label.classList.remove(
          "pilihan-kuis--dipilih",
          "pilihan-kuis--benar",
          "pilihan-kuis--salah",
          "pilihan-kuis--nonaktif"
        );
      });

      item.inputs.forEach((input) => {
        input.disabled = false;
      });

      item.status.hidden = true;
      item.status.textContent = "";
      item.status.className = "soal-kuis__status";
      item.pembahasan.hidden = true;
    });

    hasil.hidden = true;
    hasil.replaceChildren();
    hasil.className = "kuis__hasil";
  }

  function tampilkanHasil({ nilai, lulus, jumlahBenar, total }) {
    hasil.replaceChildren();
    hasil.hidden = false;
    hasil.className = `kuis__hasil ${
      lulus ? "kuis__hasil--lulus" : "kuis__hasil--gagal"
    }`;

    const ikon = buatElemen(
      "span",
      "kuis__hasil-ikon",
      lulus ? "✓" : "!"
    );
    ikon.setAttribute("aria-hidden", "true");

    const lencanaHasil = buatElemen(
      "span",
      `lencana ${lulus ? "lencana--tersedia" : "lencana--bahaya"}`,
      lulus ? "Lulus" : "Belum lulus"
    );

    const label = buatElemen("p", "kuis__hasil-label", "Nilai kamu");
    const skor = buatElemen("p", "kuis__skor");
    skor.append(
      document.createTextNode(String(nilai)),
      buatElemen("span", "", "/100")
    );

    const pesan = buatElemen(
      "p",
      "kuis__hasil-teks",
      lulus
        ? `Kamu menjawab benar ${jumlahBenar} dari ${total} soal dan memenuhi batas lulus ${data.batasLulus}.`
        : `Kamu menjawab benar ${jumlahBenar} dari ${total} soal. Batas lulus adalah ${data.batasLulus}. Pelajari kembali materi, lalu ulangi modul.`
    );

    const wadahAksi = buatElemen("div", "kuis__hasil-aksi");

    if (lulus) {
      const tujuan =
        typeof dapatkanLanjut === "function" ? dapatkanLanjut() : null;

      if (tujuan && tujuan.href) {
        const tautan = buatElemen(
          "a",
          "tombol",
          tujuan.label || "Lanjut"
        );
        tautan.href = tujuan.href;
        wadahAksi.appendChild(tautan);
      } else {
        const tombol = buatElemen("button", "tombol", "Lanjut");
        tombol.type = "button";
        tombol.addEventListener("click", () => {
          if (typeof saatLanjut === "function") {
            saatLanjut({ nilai, jumlahBenar, total });
          }
        });
        wadahAksi.appendChild(tombol);
      }
    } else {
      const tombol = buatElemen("button", "tombol", "Ulangi Modul");
      tombol.type = "button";
      tombol.addEventListener("click", () => {
        ulangi();

        if (typeof saatUlangi === "function") {
          saatUlangi();
        }
      });
      wadahAksi.appendChild(tombol);
    }

    const tautanDashboard = buatElemen(
      "a",
      "tombol tombol--garis",
      "Kembali ke Dashboard"
    );
    tautanDashboard.href = "index.html";
    wadahAksi.appendChild(tautanDashboard);

    hasil.append(ikon, lencanaHasil, label, skor, pesan, wadahAksi);

    requestAnimationFrame(() => {
      hasil.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (terkumpul) return;

    const belumDijawab = soal
      .map((item, indeks) =>
        item.inputs.some((input) => input.checked) ? null : indeks + 1
      )
      .filter((nomor) => nomor !== null);

    if (belumDijawab.length > 0) {
      soal.forEach((item) => {
        const kosong = item.inputs.every((input) => !input.checked);
        item.kartu.classList.toggle("soal-kuis--belum", kosong);

        if (kosong) {
          item.status.hidden = false;
          item.status.className =
            "soal-kuis__status soal-kuis__status--salah";
          item.status.textContent = "Soal ini belum dijawab.";
        } else {
          item.status.hidden = true;
          item.status.textContent = "";
          item.status.className = "soal-kuis__status";
        }
      });

      peringatan.hidden = false;
      peringatan.textContent =
        belumDijawab.length === 1
          ? `Soal ${belumDijawab[0]} belum dijawab.`
          : `Masih ada ${belumDijawab.length} soal yang belum dijawab: ${belumDijawab.join(", ")}.`;

      const pertama = soal[belumDijawab[0] - 1];
      pertama.kartu.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });

      const inputPertama = pertama.inputs[0];
      if (inputPertama) inputPertama.focus({ preventScroll: true });

      return;
    }

    peringatan.hidden = true;
    terkumpul = true;
    tombolKumpulkan.disabled = true;
    tombolKumpulkan.textContent = "Jawaban sudah dikumpulkan";

    let jumlahBenar = 0;

    soal.forEach((item) => {
      const dipilih = item.inputs.find((input) => input.checked);
      const jawabanPengguna = dipilih ? dipilih.value : "";
      const benar = jawabanPengguna === item.butir.jawaban;

      if (benar) jumlahBenar += 1;

      item.kartu.classList.remove("soal-kuis--belum");
      item.kartu.classList.add(
        benar ? "soal-kuis--benar" : "soal-kuis--salah"
      );

      item.inputs.forEach((input) => {
        input.disabled = true;
      });

      item.labelPilihan.forEach((label) => {
        label.classList.remove("pilihan-kuis--dipilih");
        label.classList.add("pilihan-kuis--nonaktif");

        const huruf = label.dataset.huruf;

        if (huruf === item.butir.jawaban) {
          label.classList.add("pilihan-kuis--benar");
        } else if (huruf === jawabanPengguna) {
          label.classList.add("pilihan-kuis--salah");
        }
      });

      item.status.hidden = false;
      item.status.className = `soal-kuis__status ${
        benar
          ? "soal-kuis__status--benar"
          : "soal-kuis__status--salah"
      }`;
      item.status.textContent = benar
        ? "Jawaban benar."
        : `Belum tepat. Jawaban benar: ${item.butir.jawaban}.`;
      item.pembahasan.hidden = false;
    });

    const nilai = hitungNilai(jumlahBenar, soal.length);
    const lulus = nilai >= data.batasLulus;

    tampilkanHasil({
      nilai,
      lulus,
      jumlahBenar,
      total: soal.length,
    });
  });

  return { ulangi };
}
