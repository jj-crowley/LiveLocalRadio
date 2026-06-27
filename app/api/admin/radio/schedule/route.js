import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getProfileSubmissionById } from "@/lib/db";
import { scheduleSubmissionForRadio } from "@/lib/radioScheduler";

export async function POST(request) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.redirect(new URL("/admin/login", request.url), { status: 303 });
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

    return NextResponse.redirect(new URL("/admin/radio?scheduled=1", request.url), { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/admin/radio?error=1", request.url), { status: 303 });
  }
}
