import { getCurrentAdmin } from "@/lib/adminAuth";
import { markContactMessageRead } from "@/lib/db";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

export async function POST(request, { params }) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    return redirectTo(request, "/admin/login");
  }

  try {
    const { id } = await params;
    markContactMessageRead(Number(id));
    return redirectTo(request, "/admin/messages?read=1");
  } catch {
    return redirectTo(request, "/admin/messages?error=1");
  }
}
