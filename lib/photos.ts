import { supabase } from "./supabase";

const BUCKET = "request-photos";

async function compressImage(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not compress image"))),
      "image/jpeg",
      0.72
    )
  );
}

export async function uploadRequestPhotos(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const blob = await compressImage(file);
    const path = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}