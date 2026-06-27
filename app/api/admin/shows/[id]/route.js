import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ error: "Show management has been retired." }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Show management has been retired." }, { status: 410 });
}
