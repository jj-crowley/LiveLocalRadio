import { getBandVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const video = getBandVideo(url.searchParams.get("v") || url.searchParams.get("file"));
  const videoSrc = video ? escapeHtmlAttribute(video.src) : "";
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Route666 Video Player</title>
  <style>
    html, body { margin: 0; width: 100%; height: 100%; background: #080706; }
    body { display: grid; place-items: center; color: #efe5d0; font-family: Georgia, serif; }
    video { width: 100%; height: 100%; object-fit: contain; background: #080706; }
    .empty { padding: 24px; text-align: center; }
  </style>
</head>
<body>
  ${video ? `<video controls playsinline preload="metadata" src="${videoSrc}"></video>` : `<div class="empty">Route666 video not loaded.</div>`}
</body>
</html>`;

  return new Response(body, {
    headers: {
      "Content-Security-Policy": "default-src 'none'; media-src 'self'; style-src 'unsafe-inline';",
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
