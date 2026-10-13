import { getCurrentAdmin } from "@/lib/adminAuth";
import { setSiteSetting } from "@/lib/db";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

const homepageIntroLimit = 1000;
const sidebarHeadlineLimit = 120;
const sidebarTextLimit = 600;

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
    const homepageIntro = String(formData.get("homepageIntro") || "").trim();
    const sidebarHeadline = String(formData.get("sidebarHeadline") || "").trim();
    const sidebarText = String(formData.get("sidebarText") || "").trim();

    if (
      !homepageIntro ||
      homepageIntro.length > homepageIntroLimit ||
      !sidebarHeadline ||
      sidebarHeadline.length > sidebarHeadlineLimit ||
      !sidebarText ||
      sidebarText.length > sidebarTextLimit
    ) {
      return redirectTo(request, "/admin/settings?error=1");
    }

    setSiteSetting("homepage_intro", homepageIntro);
    setSiteSetting("homepage_sidebar_headline", sidebarHeadline);
    setSiteSetting("homepage_sidebar_text", sidebarText);
    return redirectTo(request, "/admin/settings?saved=1");
  } catch {
    return redirectTo(request, "/admin/settings?error=1");
  }
}
