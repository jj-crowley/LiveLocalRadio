import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getUploadDir } from "@/lib/paths";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["audio/mpeg", ".mp3"],
  ["audio/mp3", ".mp3"]
]);

export async function saveUpload(file, options = {}) {
  if (!file || !file.type || !allowedTypes.has(file.type)) {
    throw new Error("Only JPG, PNG, WEBP, GIF, and MP3 uploads are allowed.");
  }

  const maxSize = file.type.startsWith("audio/") ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error(file.type.startsWith("audio/") ? "MP3 uploads must be 50MB or smaller." : "Image uploads must be 10MB or smaller.");
  }

  const uploadDir = getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = allowedTypes.get(file.type);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const destination = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(destination, bytes);

  if (options.metadata && file.type.startsWith("audio/")) {
    await fs.writeFile(`${destination}.json`, JSON.stringify(options.metadata, null, 2));
  }

  return {
    filename,
    path: `/uploads/${filename}`,
    mimeType: file.type,
    size: bytes.length
  };
}
