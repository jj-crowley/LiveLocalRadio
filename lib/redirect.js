import { NextResponse } from "next/server";

export function redirectTo(request, path, init = { status: 303 }) {
  const requestUrl = new URL(request.url);
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host = forwardedHost || firstHeaderValue(request.headers.get("host")) || requestUrl.host;
  const proto = forwardedProto || requestUrl.protocol.replace(":", "");
  const url = new URL(path, `${proto}://${host}`);

  return NextResponse.redirect(url, init);
}

function firstHeaderValue(value) {
  return value?.split(",")[0]?.trim() || "";
}
