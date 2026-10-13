import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

export async function POST(request) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  const response = redirectTo(request, "/admin/login");
  response.cookies.delete("route666_admin");
  return response;
}
