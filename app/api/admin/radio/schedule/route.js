import { getCurrentAdmin } from "@/lib/adminAuth";
import { getProfileSubmissionById } from "@/lib/db";
import { scheduleSubmissionForRadio } from "@/lib/radioScheduler";
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
    const submission = getProfileSubmissionById(Number(formData.get("submissionId")));

    if (!submission) {
      throw new Error("Submission not found.");
    }

    scheduleSubmissionForRadio(submission, {
      blockNumber: formData.get("blockNumber"),
      day: formData.get("day")
    });

    return redirectTo(request, "/admin/radio?scheduled=1");
  } catch {
    return redirectTo(request, "/admin/radio?error=1");
  }
}
