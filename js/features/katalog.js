/**
 * ============================================================
 * KATALOG MODUL
 * ------------------------------------------------------------
 * Peran   : sumber tunggal data `data/daftar-modul.json`.
 * Dipakai : dashboard, halaman modul, dan halaman penutup agar
 *           status "tersedia/segera" tidak ditafsirkan berbeda.
 * Cache   : hasil muat disimpan; jika gagal, cache dibersihkan
 *           supaya percobaan berikutnya masih bisa berhasil.
 * ============================================================
 */

const URL_KATALOG = "data/daftar-modul.json";

let janjiKatalog = null;

/**
 * Memuat `data/daftar-modul.json` satu kali, lalu menyimpan hasilnya.
 * Pemanggilan berikutnya memakai cache. Jika gagal, cache dibersihkan
 * supaya percobaan berikutnya masih bisa berhasil.
 *
 * @returns {Promise<Array<object>>} daftar modul terurut berdasarkan id
 */
export function muatKatalog() {
  if (janjiKatalog) return janjiKatalog;

  janjiKatalog = fetch(URL_KATALOG)
    .then((respons) => {
      if (!respons.ok) {
        throw new Error("Katalog modul tidak dapat dimuat.");
      }

      return respons.json();
    })
    .then((data) => {
      if (!data || !Array.isArray(data.modul)) {
        throw new Error("Format katalog modul tidak sesuai.");
      }

      // Urutan tampilan tidak boleh bergantung pada urutan berkas JSON.
      return [...data.modul].sort((a, b) => a.id - b.id);
    })
    .catch((error) => {
      janjiKatalog = null;
      throw error;
    });

  return janjiKatalog;
}

/**
 * Mencari satu modul berdasarkan nomor.
 *
 * @param {Array<object>} daftar hasil `muatKatalog()`
 * @param {number|string} id nomor modul
 * @returns {object|null}
 */
export function cariModul(daftar, id) {
  if (!Array.isArray(daftar)) return null;

  const nomor = Number(id);

  if (!Number.isInteger(nomor)) return null;

  return daftar.find((modul) => Number(modul.id) === nomor) || null;
}

/**
 * Mengambil modul setelah nomor tertentu.
 *
 * @param {Array<object>} daftar hasil `muatKatalog()`
 * @param {number|string} id nomor modul saat ini
 * @returns {object|null}
 */
export function modulBerikutnya(daftar, id) {
  const nomor = Number(id);

  if (!Number.isInteger(nomor)) return null;

  return cariModul(daftar, nomor + 1);
}

/**
 * Modul hanya boleh dibuka bila isinya sudah siap.
 *
 * @param {object|null|undefined} modul entri katalog
 * @returns {boolean}
 */
export function modulTersedia(modul) {
  return Boolean(modul) && modul.status === "tersedia";
}
