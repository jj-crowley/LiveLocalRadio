import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

export async function POST(request) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  return redirectTo(request, "/admin/login");
}
