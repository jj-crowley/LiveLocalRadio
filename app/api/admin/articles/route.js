import { getCurrentAdmin } from "@/lib/adminAuth";
import { createArticle } from "@/lib/db";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";
import { saveUpload } from "@/lib/uploads";

const allowedSections = new Set(["ok_gramps", "local_noise", "home"]);

export async function POST(request) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    return redirectTo(request, "/admin/login");
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
      return redirectTo(request, "/admin/articles?error=missing");
    }

    let imagePath = "";

    if (isRealFile(photo)) {
      if (!photo.type.startsWith("image/")) {
        return redirectTo(request, "/admin/articles?error=image");
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

    return redirectTo(request, "/admin/articles?created=1");
  } catch {
    return redirectTo(request, "/admin/articles?error=upload");
  }
}

function clean(value) {
  return String(value || "").trim();
}

function isRealFile(file) {
  return file && typeof file === "object" && file.size > 0;
}
