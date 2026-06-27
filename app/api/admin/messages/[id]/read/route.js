import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { markContactMessageRead } from "@/lib/db";

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  }

  try {
    const { id } = await params;
    markContactMessageRead(Number(id));
    return NextResponse.redirect(new URL("/admin/messages?read=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/admin/messages?error=1", request.url), { status: 303 });
  }
}
