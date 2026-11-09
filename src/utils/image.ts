/**
 * image.ts
 *
 * Utilitas gambar untuk dokumentasi lapangan.
 *
 * Foto dari kamera HP dikompres di sisi browser menjadi data-URL JPEG
 * (maksimum 900px sisi terpanjang, kualitas 0.72) sehingga ukuran teks yang
 * tersimpan di kolom text tetap wajar.
 */

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(reader.result as string);
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}
