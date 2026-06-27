import { NextResponse } from "next/server";
import { getBands } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ bands: getBands() });
}
