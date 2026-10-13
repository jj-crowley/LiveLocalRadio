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

  if (file.size <= 0 || file.size > maxSize) {
    throw new Error(file.type.startsWith("audio/") ? "MP3 uploads must be 50MB or smaller." : "Image uploads must be 10MB or smaller.");
  }

  const uploadDir = getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const extension = allowedTypes.get(file.type);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const destination = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (!hasExpectedSignature(bytes, file.type)) {
    throw new Error("Upload content did not match its declared file type.");
  }

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

function hasExpectedSignature(bytes, mimeType) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/gif") {
    const header = bytes.subarray(0, 6).toString("ascii");
    return header === "GIF87a" || header === "GIF89a";
  }

  if (mimeType === "image/webp") {
    return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }

  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") {
    return bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  }

  return false;
}
