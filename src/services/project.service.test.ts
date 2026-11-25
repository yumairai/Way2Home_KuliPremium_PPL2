/**
 * White Box Testing — src/services/project.service.ts
 *
 * Fungsi yang diuji (pure / mudah diisolasi):
 * - validateBudget
 * - sanitizeFileName
 * - getAndValidateExtension
 * - validateFile
 *
 * Teknik: Statement, Branch, Condition, Boundary Value, Error Handling
 */

import { describe, it, expect } from "vitest";
import {
  validateBudget,
  sanitizeFileName,
  getAndValidateExtension,
  validateFile,
} from "./project.service";

// ---------------------------------------------------------------------------
// validateBudget
// ---------------------------------------------------------------------------
describe("validateBudget — validasi anggaran proyek", () => {
  // Branch: undefined / null / empty string
  it("harus invalid jika budgetInput undefined", () => {
    const result = validateBudget(undefined, 100_000_000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("harus invalid jika budgetInput null", () => {
    const result = validateBudget(null, 100_000_000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("wajib");
  });

  it("harus invalid jika budgetInput string kosong", () => {
    const result = validateBudget("", 100_000_000);
    expect(result.valid).toBe(false);
  });

  // Branch: NaN / bukan angka
  it("harus invalid jika budget bukan angka (string non-numerik)", () => {
    const result = validateBudget("abc", 100_000_000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("angka valid");
  });

  // Branch: nilai <= 0
  it("harus invalid jika budget = 0", () => {
    const result = validateBudget(0, 100_000_000);
    expect(result.valid).toBe(false);
  });

  it("harus invalid jika budget negatif", () => {
    const result = validateBudget(-500_000, 100_000_000);
    expect(result.valid).toBe(false);
  });

  // Branch: budget < minCost
  it("harus invalid jika budget < estimasi biaya desain", () => {
    const result = validateBudget(50_000_000, 100_000_000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("estimasi biaya");
  });

  // Branch: budget == minCost (boundary: tepat di batas)
  it("harus valid jika budget sama persis dengan minCost", () => {
    const result = validateBudget(100_000_000, 100_000_000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  // Branch: budget > minCost
  it("harus valid jika budget melebihi estimasi biaya", () => {
    const result = validateBudget(200_000_000, 100_000_000);
    expect(result.valid).toBe(true);
  });

  // Boundary: minCost = 0
  it("harus valid jika minCost = 0 dan budget = 1", () => {
    const result = validateBudget(1, 0);
    expect(result.valid).toBe(true);
  });

  // Input string numerik
  it("harus valid jika budgetInput berupa string angka yang valid", () => {
    const result = validateBudget("150000000", 100_000_000);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sanitizeFileName
// ---------------------------------------------------------------------------
describe("sanitizeFileName — sanitasi nama file", () => {
  it("harus membuang path dan hanya menyisakan nama file", () => {
    const result = sanitizeFileName("C:/Users/user/document.pdf");
    expect(result).toBe("document.pdf");
  });

  it("harus membuang path dengan backslash", () => {
    const result = sanitizeFileName("C:\\Users\\user\\file.jpg");
    expect(result).toBe("file.jpg");
  });

  it("harus mengganti karakter tidak valid dengan underscore", () => {
    const result = sanitizeFileName("my file (1).pdf");
    expect(result).toBe("my_file__1_.pdf");
  });

  it("harus mempertahankan huruf, angka, titik, dash, underscore", () => {
    const result = sanitizeFileName("valid-file_name.123.pdf");
    expect(result).toBe("valid-file_name.123.pdf");
  });

  it("boundary: nama file tanpa path", () => {
    const result = sanitizeFileName("simple.png");
    expect(result).toBe("simple.png");
  });

  it("boundary: nama file dengan spasi dan karakter khusus", () => {
    const result = sanitizeFileName("foto proyek #1!.jpg");
    expect(result).toBe("foto_proyek__1_.jpg");
  });

  it("boundary: nama file dengan unicode", () => {
    const result = sanitizeFileName("berkas_sertifikat_tanah_ñ.pdf");
    // Karakter ñ harus diganti _
    expect(result).not.toContain("ñ");
  });
});

// ---------------------------------------------------------------------------
// getAndValidateExtension
// ---------------------------------------------------------------------------
describe("getAndValidateExtension — validasi ekstensi file", () => {
  // Branch: mimeType tidak dikenal → null
  it("harus null untuk mimeType tidak dikenal", () => {
    const result = getAndValidateExtension("file.exe", "application/x-msdownload");
    expect(result).toBeNull();
  });

  // Branch: image/jpeg valid dengan ext jpg
  it("harus mengembalikan 'jpg' untuk file.jpg dengan mimeType image/jpeg", () => {
    const result = getAndValidateExtension("foto.jpg", "image/jpeg");
    expect(result).toBe("jpg");
  });

  // Branch: image/jpeg valid dengan ext jpeg
  it("harus mengembalikan 'jpeg' untuk file.jpeg dengan mimeType image/jpeg", () => {
    const result = getAndValidateExtension("foto.jpeg", "image/jpeg");
    expect(result).toBe("jpeg");
  });

  // Branch: image/png valid
  it("harus mengembalikan 'png' untuk file.png dengan mimeType image/png", () => {
    const result = getAndValidateExtension("gambar.png", "image/png");
    expect(result).toBe("png");
  });

  // Branch: application/pdf valid
  it("harus mengembalikan 'pdf' untuk file.pdf dengan mimeType application/pdf", () => {
    const result = getAndValidateExtension("dokumen.pdf", "application/pdf");
    expect(result).toBe("pdf");
  });

  // Branch: ekstensi tidak cocok dengan mimeType → null
  it("harus null jika ekstensi tidak sesuai mimeType (jpg padahal pdf)", () => {
    const result = getAndValidateExtension("file.pdf", "image/jpeg");
    expect(result).toBeNull();
  });

  it("harus null jika ekstensi tidak sesuai mimeType (png padahal jpeg)", () => {
    const result = getAndValidateExtension("foto.png", "image/jpeg");
    expect(result).toBeNull();
  });

  // Branch: file tanpa ekstensi
  it("harus null jika file tidak memiliki ekstensi", () => {
    const result = getAndValidateExtension("tanpakekstensi", "image/jpeg");
    expect(result).toBeNull();
  });

  // Case insensitive extension
  it("harus null jika ekstensi uppercase (PNG) untuk image/jpeg", () => {
    const result = getAndValidateExtension("foto.JPG", "image/jpeg");
    // Karena toLowerCase dipakai, JPG → jpg → valid
    expect(result).toBe("jpg");
  });
});

// ---------------------------------------------------------------------------
// validateFile
// ---------------------------------------------------------------------------
describe("validateFile — validasi ukuran dan tipe file", () => {
  function makeFile(
    name: string,
    type: string,
    sizeBytes: number,
  ): File {
    const content = new Uint8Array(sizeBytes);
    return new File([content], name, { type });
  }

  // Branch: ukuran file > 2MB → error
  it("harus mengembalikan error jika ukuran > 2MB", () => {
    const file = makeFile("big.jpg", "image/jpeg", 3 * 1024 * 1024);
    const result = validateFile(file);
    expect(result).toContain("2MB");
  });

  // Boundary: tepat 2MB → valid
  it("harus valid jika ukuran tepat 2MB", () => {
    const file = makeFile("exact.jpg", "image/jpeg", 2 * 1024 * 1024);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  // Boundary: 1 byte di bawah 2MB → valid
  it("harus valid jika ukuran = 2MB - 1 byte", () => {
    const file = makeFile("small.jpg", "image/jpeg", 2 * 1024 * 1024 - 1);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  // Boundary: 1 byte di atas 2MB → invalid
  it("harus invalid jika ukuran = 2MB + 1 byte", () => {
    const file = makeFile("toolarge.jpg", "image/jpeg", 2 * 1024 * 1024 + 1);
    const result = validateFile(file);
    expect(result).toContain("2MB");
  });

  // Branch: mimeType tidak diizinkan
  it("harus mengembalikan error jika mimeType tidak diizinkan (gif)", () => {
    const file = makeFile("anim.gif", "image/gif", 100_000);
    const result = validateFile(file);
    expect(result).toContain("JPG, PNG, atau PDF");
  });

  // Branch: mimeType tidak diizinkan (docx)
  it("harus mengembalikan error untuk file .docx", () => {
    const file = makeFile(
      "doc.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      50_000,
    );
    const result = validateFile(file);
    expect(result).toContain("JPG, PNG, atau PDF");
  });

  // Branch: mimeType valid tapi ekstensi tidak cocok
  it("harus mengembalikan error jika ekstensi tidak sesuai mimeType", () => {
    const file = makeFile("foto.txt", "image/jpeg", 50_000);
    const result = validateFile(file);
    expect(result).toContain("JPG, PNG, atau PDF");
  });

  // Branch: file valid (jpg)
  it("harus valid untuk file jpg berukuran kecil", () => {
    const file = makeFile("foto.jpg", "image/jpeg", 100_000);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  // Branch: file valid (png)
  it("harus valid untuk file png berukuran kecil", () => {
    const file = makeFile("gambar.png", "image/png", 100_000);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  // Branch: file valid (pdf)
  it("harus valid untuk file pdf berukuran kecil", () => {
    const file = makeFile("dokumen.pdf", "application/pdf", 100_000);
    const result = validateFile(file);
    expect(result).toBeNull();
  });

  // Boundary: file size = 0
  it("boundary: file size 0 byte harus lolos validasi ukuran", () => {
    const file = makeFile("empty.jpg", "image/jpeg", 0);
    const result = validateFile(file);
    expect(result).toBeNull(); // ukuran 0 tidak di-reject, tipe valid
  });
});
