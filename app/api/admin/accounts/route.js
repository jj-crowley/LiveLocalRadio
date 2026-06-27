import { NextResponse } from "next/server";
import { createAdminUser, getCurrentAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  }

  try {
    const formData = await request.formData();
    createAdminUser(clean(formData.get("username")), clean(formData.get("password")));
    return NextResponse.redirect(new URL("/admin/accounts?created=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/admin/accounts?error=1", request.url), { status: 303 });
  }
}

function clean(value) {
  return String(value || "").trim();
}
