type ResizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_MAX_HEIGHT = 1280;
const DEFAULT_QUALITY = 0.72;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca gambar."));
      img.src = String(reader.result || "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

export async function resizeImageToDataUrl(file: File, opts: ResizeOptions = {}) {
  const image = await loadImage(file);
  const maxWidth = opts.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = opts.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas tidak tersedia pada browser ini.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  // Prefer jpeg for consistent compression size.
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length > 600_000) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.6);
  }
  return dataUrl;
}
