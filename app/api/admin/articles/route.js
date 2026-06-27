import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { createArticle } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

const allowedSections = new Set(["ok_gramps", "local_noise", "home"]);

export async function POST(request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
  }

  try {
    const formData = await request.formData();
    const title = clean(formData.get("title"));
    const author = clean(formData.get("author")) || admin.username;
    const excerpt = clean(formData.get("excerpt"));
    const body = clean(formData.get("body"));
    const section = clean(formData.get("section"));
    const featured = clean(formData.get("featured")) === "1";
    const photo = formData.get("photo");

    if (!title || !excerpt || !body || !allowedSections.has(section)) {
      return NextResponse.redirect(new URL("/admin/articles?error=missing", request.url), { status: 303 });
    }

    let imagePath = "";

    if (isRealFile(photo)) {
      if (!photo.type.startsWith("image/")) {
        return NextResponse.redirect(new URL("/admin/articles?error=image", request.url), { status: 303 });
      }

      const upload = await saveUpload(photo);
      imagePath = upload.path;
    }

    createArticle({
      title,
      author,
      excerpt,
      body,
      imagePath,
      section,
      featured
    });

    return NextResponse.redirect(new URL("/admin/articles?created=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/admin/articles?error=upload", request.url), { status: 303 });
  }
}

function clean(value) {
  return String(value || "").trim();
}

function isRealFile(file) {
  return file && typeof file === "object" && file.size > 0;
}
