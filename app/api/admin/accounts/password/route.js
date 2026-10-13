import { changeOwnAdminPassword, getCurrentAdmin } from "@/lib/adminAuth";
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
    const currentPassword = clean(formData.get("currentPassword"));
    const newPassword = clean(formData.get("newPassword"));
    const confirmPassword = clean(formData.get("confirmPassword"));

    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    changeOwnAdminPassword(admin.id, currentPassword, newPassword);
    return redirectTo(request, "/admin/accounts?passwordChanged=1");
  } catch {
    return redirectTo(request, "/admin/accounts?passwordError=1");
  }
}

function clean(value) {
  return String(value || "").trim();
}
