import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/db";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const name = clean(formData.get("name"));
    const email = clean(formData.get("email"));
    const message = clean(formData.get("message"));

    if (!name || !email || !message) {
      return NextResponse.redirect(new URL("/contact?error=1", request.url), { status: 303 });
    }

    createContactMessage({ name, email, message });
    return NextResponse.redirect(new URL("/contact?sent=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/contact?error=1", request.url), { status: 303 });
  }
}

function clean(value) {
  return String(value || "").trim();
}
