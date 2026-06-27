import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadDir } from "@/lib/paths";

const contentTypes = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(_request, { params }) {
  const { filename: rawFilename } = await params;
  const filename = path.basename(rawFilename);
  const filePath = path.join(getUploadDir(), filename);
  const extension = path.extname(filename).toLowerCase();

  try {
    const file = await fs.readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }
}
