import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/uploads";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const upload = await saveUpload(file);

    return NextResponse.json({ upload }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
