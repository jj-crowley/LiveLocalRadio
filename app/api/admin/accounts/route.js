import { createAdminUser, getCurrentAdmin } from "@/lib/adminAuth";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

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
    createAdminUser(clean(formData.get("username")), clean(formData.get("password")));
    return redirectTo(request, "/admin/accounts?created=1");
  } catch {
    return redirectTo(request, "/admin/accounts?error=1");
  }
}

function clean(value) {
  return String(value || "").trim();
}
