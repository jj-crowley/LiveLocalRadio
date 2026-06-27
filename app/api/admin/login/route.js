import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession } from "@/lib/adminAuth";

export async function POST(request) {
  const formData = await request.formData();
  const admin = authenticateAdmin(clean(formData.get("username")), clean(formData.get("password")));

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 303 });
  }

  const session = createAdminSession(admin.id);
  const response = NextResponse.redirect(new URL("/admin/messages", request.url), { status: 303 });

  response.cookies.set("route666_admin", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt)
  });

  return response;
}

function clean(value) {
  return String(value || "").trim();
}
