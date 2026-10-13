import fs from "node:fs";
import path from "node:path";
import { getRadioDir, getUploadDir } from "@/lib/paths";
import { radioDays } from "@/lib/radio";
import { slugify } from "@/lib/slug";

export function getScheduledRadioInventory() {
  const radioDir = getRadioDir();
  fs.mkdirSync(radioDir, { recursive: true });

  return [
    ...readRadioInventoryForDir({ baseDir: radioDir, day: "_root", label: "fallback" }),
    ...radioDays.flatMap((day) => readRadioInventoryForDir({
      baseDir: path.join(radioDir, day),
      day,
      label: day
    }))
  ];
}

export function removeScheduledRadioPath({ day, relativePath, removeBlock = false }) {
  const baseDir = resolveRadioBaseDir(day);
  const safeRelativePath = sanitizeRelativePath(relativePath);
  const targetPath = path.resolve(baseDir, safeRelativePath);

  if (!isInsideDirectory(targetPath, baseDir) || !fs.existsSync(targetPath)) {
    throw new Error("Scheduled radio item not found.");
  }

  const removed = [];

  if (removeBlock) {
    const stat = fs.statSync(targetPath);
    const blockDir = stat.isDirectory() ? targetPath : path.dirname(targetPath);

    if (!isInsideDirectory(blockDir, baseDir)) {
      throw new Error("Invalid radio block.");
    }

    collectFiles(blockDir).forEach((filePath) => removed.push(publicRadioPath(day, path.relative(baseDir, filePath))));
    fs.rmSync(blockDir, { recursive: true, force: true });
    return removed;
  }

  if (!targetPath.toLowerCase().endsWith(".mp3")) {
    throw new Error("Only MP3 tracks can be removed individually.");
  }

  fs.rmSync(targetPath, { force: true });
  removed.push(publicRadioPath(day, safeRelativePath));

  const metadataPath = `${targetPath}.json`;
  if (fs.existsSync(metadataPath)) {
    fs.rmSync(metadataPath, { force: true });
    removed.push(publicRadioPath(day, `${safeRelativePath}.json`));
  }

  removeEmptyParentBlock(targetPath, baseDir);
  return removed;
}

export function removeScheduledRadioForArtist(artistName) {
  const normalizedArtist = normalize(artistName);
  const artistSlug = slugify(artistName);
  const removed = [];
  const removedBlocks = new Set();

  getScheduledRadioInventory().forEach((item) => {
    const matchesArtist = normalize(item.band) === normalizedArtist ||
      item.blockName.toLowerCase().includes(artistSlug);

    if (!matchesArtist) {
      return;
    }

    if (item.blockRelativePath) {
      const blockKey = `${item.day}:${item.blockRelativePath}`;

      if (removedBlocks.has(blockKey)) {
        return;
      }

      removedBlocks.add(blockKey);
      removed.push(...removeScheduledRadioPath({
        day: item.day,
        relativePath: item.blockRelativePath,
        removeBlock: true
      }));
    } else {
      removed.push(...removeScheduledRadioPath({
        day: item.day,
        relativePath: item.relativePath
      }));
    }
  });

  return [...new Set(removed)];
}

export function deleteOriginalSubmissionFiles(submissions) {
  const uploadDir = getUploadDir();
  const removed = [];

  submissions.forEach((submission) => {
    const publicPaths = [
      ...(submission.photoPaths || []),
      ...(submission.audioPaths || []).map((audio) => typeof audio === "string" ? audio : audio.path)
    ].filter(Boolean);

    publicPaths.forEach((publicPath) => {
      const filePath = resolveUploadPublicPath(publicPath);

      if (!filePath || !isInsideDirectory(filePath, uploadDir) || !fs.existsSync(filePath)) {
        return;
      }

      fs.rmSync(filePath, { force: true });
      removed.push(publicPath);

      const metadataPath = `${filePath}.json`;
      if (fs.existsSync(metadataPath)) {
        fs.rmSync(metadataPath, { force: true });
        removed.push(`${publicPath}.json`);
      }
    });
  });

  return removed;
}

function readRadioInventoryForDir({ baseDir, day, label }) {
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const items = [];

  fs.readdirSync(baseDir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .forEach((entry) => {
      if (day === "_root" && entry.isDirectory() && radioDays.includes(entry.name.toLowerCase())) {
        return;
      }

      if (entry.isDirectory()) {
        const blockDir = path.join(baseDir, entry.name);
        listMp3Files(blockDir).forEach((filePath) => {
          const relativePath = path.relative(baseDir, filePath);
          const metadata = readTrackMetadata(filePath);
          items.push({
            id: `${day}:${relativePath}`,
            band: metadata.artist || artistFromBlock(entry.name),
            blockName: entry.name,
            blockRelativePath: entry.name,
            day,
            dayLabel: label,
            filename: path.basename(filePath),
            relativePath,
            song: metadata.title || path.basename(filePath, ".mp3")
          });
        });
        return;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp3")) {
        const filePath = path.join(baseDir, entry.name);
        const metadata = readTrackMetadata(filePath);
        items.push({
          id: `${day}:${entry.name}`,
          band: metadata.artist || artistFromFilename(entry.name),
          blockName: "",
          blockRelativePath: "",
          day,
          dayLabel: label,
          filename: entry.name,
          relativePath: entry.name,
          song: metadata.title || path.basename(entry.name, ".mp3")
        });
      }
    });

  return items;
}

function listMp3Files(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3"))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((entry) => path.join(dir, entry.name));
}

function readTrackMetadata(filePath) {
  const metadataPath = `${filePath}.json`;

  if (!fs.existsSync(metadataPath)) {
    return {};
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return {
      artist: String(metadata.artist || "").trim(),
      title: String(metadata.title || metadata.song || "").trim()
    };
  } catch {
    return {};
  }
}

function resolveRadioBaseDir(day) {
  if (day === "_root") {
    return path.resolve(getRadioDir());
  }

  const normalizedDay = String(day || "").toLowerCase();

  if (!radioDays.includes(normalizedDay)) {
    throw new Error("Invalid radio day.");
  }

  return path.resolve(getRadioDir(), normalizedDay);
}

function resolveUploadPublicPath(publicPath) {
  if (!String(publicPath || "").startsWith("/uploads/")) {
    return null;
  }

  return path.resolve(getUploadDir(), path.basename(publicPath));
}

function sanitizeRelativePath(relativePath) {
  return String(relativePath || "")
    .split("/")
    .map((segment) => path.basename(segment))
    .filter(Boolean)
    .join("/");
}

function isInsideDirectory(filePath, dir) {
  const relative = path.relative(path.resolve(dir), path.resolve(filePath));
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function collectFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  });

  return files;
}

function removeEmptyParentBlock(trackPath, baseDir) {
  const parentDir = path.dirname(trackPath);

  if (path.resolve(parentDir) === path.resolve(baseDir) || !isInsideDirectory(parentDir, baseDir)) {
    return;
  }

  const remainingMp3 = listMp3Files(parentDir);
  if (remainingMp3.length === 0) {
    fs.rmSync(parentDir, { recursive: true, force: true });
  }
}

function publicRadioPath(day, relativePath) {
  return `/radio/${day === "_root" ? "_root" : day}/${relativePath.split(path.sep).join("/")}`;
}

function artistFromBlock(blockName) {
  return blockName.replace(/^\d+\s*[-_.]\s*/, "").replace(/[-_]+/g, " ").trim() || "Unknown Artist";
}

function artistFromFilename(filename) {
  return path.basename(filename, ".mp3").split(" - ")[0]?.trim() || "Unknown Artist";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
