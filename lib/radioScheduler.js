import fs from "node:fs";
import path from "node:path";
import { getRadioDir, getUploadDir } from "@/lib/paths";
import { radioDays } from "@/lib/radio";
import { slugify } from "@/lib/slug";

export function scheduleSubmissionForRadio(submission, { blockNumber, day }) {
  if (!submission?.stream_permission) {
    throw new Error("Streaming permission is required before scheduling music.");
  }

  const normalizedDay = normalizeRadioDay(day);
  const audioItems = (submission.audioPaths || []).map(normalizeAudioItem).filter((item) => item.path);

  if (!audioItems.length) {
    throw new Error("Submission has no MP3s to schedule.");
  }

  const block = normalizeBlockNumber(blockNumber);
  const artistSlug = slugify(submission.band_name) || `artist-${submission.id}`;
  const destinationDir = path.join(getRadioDir(), normalizedDay, `${block}-${artistSlug}`);

  fs.mkdirSync(destinationDir, { recursive: true });

  audioItems.forEach((item, index) => {
    const sourcePath = resolveUploadPath(item.path);
    const trackNumber = String(index + 1).padStart(2, "0");
    const titleSlug = slugify(item.title) || `song-${trackNumber}`;
    const destinationFilename = `${trackNumber} - ${titleSlug}.mp3`;
    const destinationPath = path.join(destinationDir, destinationFilename);
    const metadataPath = `${destinationPath}.json`;
    const sourceMetadataPath = `${sourcePath}.json`;

    fs.copyFileSync(sourcePath, destinationPath);

    const metadata = fs.existsSync(sourceMetadataPath)
      ? JSON.parse(fs.readFileSync(sourceMetadataPath, "utf8"))
      : {};

    fs.writeFileSync(metadataPath, JSON.stringify({
      artist: submission.band_name,
      title: item.title || metadata.title || `Song ${index + 1}`
    }, null, 2));
  });

  return {
    day: normalizedDay,
    destinationDir
  };
}

function normalizeAudioItem(item) {
  if (typeof item === "string") {
    return { path: item, title: "" };
  }

  return {
    path: item?.path || "",
    title: item?.title || ""
  };
}

function normalizeRadioDay(day) {
  const normalized = String(day || "").trim().toLowerCase();

  if (!radioDays.includes(normalized)) {
    throw new Error("Invalid radio day.");
  }

  return normalized;
}

function normalizeBlockNumber(value) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1 || number > 999) {
    throw new Error("Block number must be between 1 and 999.");
  }

  return String(number).padStart(3, "0");
}

function resolveUploadPath(publicPath) {
  const filename = path.basename(publicPath);
  const filePath = path.join(getUploadDir(), filename);

  if (!fs.existsSync(filePath)) {
    throw new Error("Uploaded MP3 not found.");
  }

  return filePath;
}
