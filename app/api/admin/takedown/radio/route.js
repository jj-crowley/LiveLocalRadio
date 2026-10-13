import { getCurrentAdmin } from "@/lib/adminAuth";
import { createTakedownLog } from "@/lib/db";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";
import { removeScheduledRadioPath } from "@/lib/takedown";

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
    const day = clean(formData.get("day"));
    const relativePath = clean(formData.get("relativePath"));
    const reason = clean(formData.get("reason"));
    const removeBlock = clean(formData.get("removeBlock")) === "1";

    if (!day || !relativePath || !reason) {
      throw new Error("Radio item and reason are required.");
    }

    const removed = removeScheduledRadioPath({ day, relativePath, removeBlock });
    createTakedownLog({
      adminUserId: admin.id,
      action: removeBlock ? "radio_block_takedown" : "radio_track_takedown",
      targetType: "radio",
      targetLabel: `${day}/${relativePath}`,
      reason,
      details: {
        removed
      }
    });

    return redirectTo(request, "/admin/takedown?radioRemoved=1");
  } catch {
    return redirectTo(request, "/admin/takedown?error=1");
  }
}

function clean(value) {
  return String(value || "").trim();
}
