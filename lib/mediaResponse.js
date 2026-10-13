import fsp from "node:fs/promises";
import { NextResponse } from "next/server";

export async function createRangeResponse(request, filePath, contentType, cacheControl = "public, max-age=86400") {
  const stat = await fsp.stat(filePath);
  const range = request.headers.get("range");

  if (range) {
    const { start, end } = parseRange(range, stat.size);
    const file = await fsp.readFile(filePath);

    return new NextResponse(file.subarray(start, end + 1), {
      status: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": cacheControl,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  const file = await fsp.readFile(filePath);
  return new NextResponse(file, {
    headers: {
      "Accept-Ranges": "bytes",
      "Cache-Control": cacheControl,
      "Content-Length": String(stat.size),
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function parseRange(range, size) {
  const match = range.match(/bytes=(\d*)-(\d*)/);

  if (!match) {
    return { start: 0, end: size - 1 };
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : size - 1;

  return {
    start: Math.min(Math.max(0, start), size - 1),
    end: Math.min(Math.max(start, end), size - 1)
  };
}
