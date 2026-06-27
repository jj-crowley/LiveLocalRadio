import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Show listings have been retired." }, { status: 410 });
}
