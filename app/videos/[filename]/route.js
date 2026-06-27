import path from "node:path";
import { NextResponse } from "next/server";
import { createRangeResponse } from "@/lib/mediaResponse";
import { getVideoContentType, resolveVideoPath } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { filename: rawFilename } = await params;
  const filename = path.basename(decodeURIComponent(rawFilename));

  try {
    return await createRangeResponse(request, resolveVideoPath(filename), getVideoContentType(filename));
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
