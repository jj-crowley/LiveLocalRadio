const fs = require("node:fs");
const path = require("node:path");

const [, , siteNameArg, siteUrlArg] = process.argv;

if (!siteNameArg || !siteUrlArg) {
  console.error("Usage: npm run site:configure -- \"Site Name\" \"https://example.org\"");
  process.exit(1);
}

const siteName = siteNameArg.trim();
const siteUrl = siteUrlArg.trim().replace(/\/+$/, "");
const hostname = siteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const packageName = slugify(siteName);
const stationEmail = `station@${hostname}`;

const replacements = [
  ["Route666.live", siteName],
  ["Route666", siteName],
  ["route666.live", hostname],
  ["www.route666.live", `www.${hostname}`],
  ["station@route666.live", stationEmail],
  ["route666-live", packageName],
  ["Route666 Video Player", `${siteName} Video Player`],
  ["Route666 video player", `${siteName} video player`],
  ["Route666 video", `${siteName} video`],
  ["Route666 live radio", `${siteName} live radio`],
  ["Route666 Desk", `${siteName} Desk`],
  ["native Route666 form", `native ${siteName} form`],
  ["directly to Route666", `directly to ${siteName}`]
];

const files = [
  "README.md",
  "package.json",
  "app/layout.jsx",
  "app/page.jsx",
  "app/submit/page.jsx",
  "app/contact/page.jsx",
  "app/artists/page.jsx",
  "app/band/video/page.jsx",
  "app/embed/band/video/route.js",
  "app/local-noise/page.jsx",
  "app/ok-gramps/page.jsx",
  "app/articles/[slug]/page.jsx",
  "app/admin/accounts/page.jsx",
  "app/admin/articles/page.jsx",
  "app/admin/login/page.jsx",
  "app/admin/messages/page.jsx",
  "app/admin/profiles/page.jsx",
  "app/admin/radio/page.jsx",
  "app/admin/setup/page.jsx",
  "app/api/profile-submissions/route.js",
  "components/BandVideoPlayer.jsx",
  "components/RadioPlayer.jsx",
  "components/RadioSchedule.jsx",
  "components/SiteFooter.jsx",
  "components/SiteHeader.jsx",
  "components/VideoShareBox.jsx",
  "deploy/nginx.route666.live.conf",
  "deploy/ubuntu-systemd.service"
];

for (const relativePath of files) {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  let contents = fs.readFileSync(filePath, "utf8");

  for (const [from, to] of replacements) {
    contents = contents.split(from).join(to);
  }

  fs.writeFileSync(filePath, contents);
}

console.log(`Configured site as ${siteName} (${siteUrl})`);
console.log(`Suggested station email: ${stationEmail}`);

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "local-music-site";
}
