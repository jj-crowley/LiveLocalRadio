import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { getVideoDir } from "@/lib/paths";

const videoTypes = {
  ".mp4": "video/mp4",
  ".ogg": "video/ogg",
  ".ogv": "video/ogg",
  ".webm": "video/webm"
};

export function getBandVideo(identifier) {
  const videos = getBandVideos();

  if (identifier) {
    const selected = videos.find((video) => video.id === identifier || video.filename === path.basename(identifier));
    if (selected) {
      return selected;
    }
  }

  return getDefaultBandVideo(videos);
}

export function getBandVideos() {
  const videoDir = getVideoDir();
  fs.mkdirSync(videoDir, { recursive: true });

  return fs
    .readdirSync(videoDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isVideoFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => buildVideo(filename));
}

export function getDefaultBandVideo(videos = getBandVideos()) {
  const configured = process.env.ROUTE666_BAND_VIDEO_FILE || "band-video.mp4";
  const configuredFilename = path.basename(configured);
  const configuredVideo = videos.find((video) => video.filename === configuredFilename);

  if (configuredVideo) {
    return configuredVideo;
  }

  return videos[0] || null;
}

export function resolveVideoPath(filename) {
  const safeFilename = path.basename(filename);
  return path.join(getVideoDir(), safeFilename);
}

export function resolveVideoPathById(id) {
  const video = getBandVideos().find((entry) => entry.id === id);
  return video ? resolveVideoPath(video.filename) : null;
}

export function getVideoContentType(filename) {
  return videoTypes[path.extname(filename).toLowerCase()] || "application/octet-stream";
}

function buildVideo(filename) {
  const metadata = readVideoMetadata(filename);
  const fallbackTitle = path.basename(filename, path.extname(filename)).replace(/[-_]+/g, " ");
  const title = metadata.title || [metadata.band, metadata.song].filter(Boolean).join(" - ") || fallbackTitle;

  return {
    id: buildVideoId(filename),
    filename,
    src: `/videos/id/${buildVideoId(filename)}`,
    title,
    band: metadata.band || metadata.artist || "",
    song: metadata.song || "",
    description: metadata.description || metadata.notes || "",
    year: metadata.year || "",
    venue: metadata.venue || "",
    credit: metadata.credit || ""
  };
}

function buildVideoId(filename) {
  return crypto.createHash("sha256").update(filename).digest("hex").slice(0, 16);
}

function isVideoFile(filename) {
  return Object.prototype.hasOwnProperty.call(videoTypes, path.extname(filename).toLowerCase());
}

function readVideoMetadata(filename) {
  const videoDir = getVideoDir();
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const metadataFiles = [
    path.join(videoDir, `${filename}.json`),
    path.join(videoDir, `${base}.json`)
  ];

  for (const metadataFile of metadataFiles) {
    if (!fs.existsSync(metadataFile)) {
      continue;
    }

    try {
      return JSON.parse(fs.readFileSync(metadataFile, "utf8"));
    } catch {
      return {};
    }
  }

  return {};
}
