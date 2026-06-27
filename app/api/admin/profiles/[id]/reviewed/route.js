import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { markProfileSubmissionReviewed } from "@/lib/db";

export async function POST(request, { params }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  }

  try {
    const { id } = await params;
    markProfileSubmissionReviewed(Number(id));
    return NextResponse.redirect(new URL("/admin/profiles?reviewed=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/admin/profiles?error=1", request.url), { status: 303 });
  }
}
