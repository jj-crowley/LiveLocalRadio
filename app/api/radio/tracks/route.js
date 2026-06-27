import { NextResponse } from "next/server";
import { getRadioState } from "@/lib/radio";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getRadioState());
}
