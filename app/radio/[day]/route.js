import { NextResponse } from "next/server";
import { createRangeResponse } from "@/lib/mediaResponse";
import { resolveRadioTrackPath } from "@/lib/radio";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { day: rawFilename } = await params;
  const filename = decodeURIComponent(rawFilename);

  if (!filename.toLowerCase().endsWith(".mp3")) {
    return NextResponse.json({ error: "Radio track not found" }, { status: 404 });
  }

  try {
    const filePath = resolveRadioTrackPath("", filename);
    return await createRangeResponse(request, filePath, "audio/mpeg");
  } catch {
    return NextResponse.json({ error: "Radio track not found" }, { status: 404 });
  }
}
