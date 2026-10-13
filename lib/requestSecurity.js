import { NextResponse } from "next/server";

export function rejectCrossSitePost(request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const requestUrl = new URL(request.url);
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host")) || requestUrl.host;
  const proto = forwardedProto || requestUrl.protocol.replace(":", "");

  if (origin !== `${proto}://${host}`) {
    return NextResponse.json({ error: "Cross-site form submission rejected." }, { status: 403 });
  }

  return null;
}

function firstHeaderValue(value) {
  return value?.split(",")[0]?.trim() || "";
}
