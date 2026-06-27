import { NextResponse } from "next/server";
import { getArticles } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ articles: getArticles() });
}
