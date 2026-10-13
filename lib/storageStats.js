import fs from "node:fs";
import path from "node:path";
import { getRadioDir, getUploadDir, getVideoDir } from "@/lib/paths";

export function getStorageStats() {
  const storageRoot = path.dirname(getUploadDir());
  const uploadDir = getUploadDir();
  const radioDir = getRadioDir();
  const videoDir = getVideoDir();
  const totalBytes = getDirectorySize(storageRoot);
  const disk = getDiskStats(storageRoot);

  return {
    disk,
    folders: [
      {
        label: "Uploads",
        path: uploadDir,
        bytes: getDirectorySize(uploadDir)
      },
      {
        label: "Radio",
        path: radioDir,
        bytes: getDirectorySize(radioDir)
      },
      {
        label: "Videos",
        path: videoDir,
        bytes: getDirectorySize(videoDir)
      }
    ],
    path: storageRoot,
    totalBytes,
    totalLabel: formatBytes(totalBytes)
  };
}

export function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes || 0);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function getDirectorySize(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }

  return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return total + getDirectorySize(entryPath);
    }

    if (entry.isFile()) {
      return total + fs.statSync(entryPath).size;
    }

    return total;
  }, 0);
}

function getDiskStats(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const stats = fs.statfsSync(dir);
    const totalBytes = stats.blocks * stats.bsize;
    const freeBytes = stats.bavail * stats.bsize;
    const usedBytes = totalBytes - freeBytes;

    return {
      freeBytes,
      freeLabel: formatBytes(freeBytes),
      totalBytes,
      totalLabel: formatBytes(totalBytes),
      usedBytes,
      usedLabel: formatBytes(usedBytes),
      usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0
    };
  } catch {
    return {
      freeBytes: 0,
      freeLabel: "Unknown",
      totalBytes: 0,
      totalLabel: "Unknown",
      usedBytes: 0,
      usedLabel: "Unknown",
      usedPercent: 0
    };
  }
}
