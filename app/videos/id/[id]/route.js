import { NextResponse } from "next/server";
import { createRangeResponse } from "@/lib/mediaResponse";
import { getVideoContentType, resolveVideoPathById } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const filePath = resolveVideoPathById(id);

    if (!filePath) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return createRangeResponse(request, filePath, getVideoContentType(filePath));
  } catch {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }
}
