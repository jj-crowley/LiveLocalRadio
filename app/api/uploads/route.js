import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { saveUpload } from "@/lib/uploads";

export async function POST(request) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin login required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const upload = await saveUpload(file);

    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
