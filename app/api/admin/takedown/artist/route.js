import { getCurrentAdmin } from "@/lib/adminAuth";
import { createTakedownLog, deleteBandById, getBandById, getProfileSubmissionsByBandName, markProfileSubmissionsTakedownByBandName } from "@/lib/db";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";
import { deleteOriginalSubmissionFiles, removeScheduledRadioForArtist } from "@/lib/takedown";

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
    const bandId = Number(formData.get("bandId"));
    const reason = clean(formData.get("reason"));
    const deleteOriginals = clean(formData.get("deleteOriginals")) === "1";

    if (!bandId || !reason) {
      throw new Error("Artist and reason are required.");
    }

    const band = getBandById(bandId);

    if (!band) {
      throw new Error("Artist not found.");
    }

    const submissions = getProfileSubmissionsByBandName(band.name);
    const removedRadio = removeScheduledRadioForArtist(band.name);
    const removedOriginals = deleteOriginals ? deleteOriginalSubmissionFiles(submissions) : [];

    deleteBandById(band.id);
    markProfileSubmissionsTakedownByBandName(band.name);
    createTakedownLog({
      adminUserId: admin.id,
      action: "artist_takedown",
      targetType: "artist",
      targetLabel: band.name,
      reason,
      details: {
        deleteOriginals,
        removedOriginals,
        removedRadio
      }
    });

    return redirectTo(request, "/admin/takedown?artistRemoved=1");
  } catch {
    return redirectTo(request, "/admin/takedown?error=1");
  }
}

function clean(value) {
  return String(value || "").trim();
}
