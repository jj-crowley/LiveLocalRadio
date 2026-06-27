import fs from "node:fs";
import path from "node:path";
import { getMp3DurationSeconds } from "@/lib/mp3Duration";
import { getRadioDir } from "@/lib/paths";

export const radioDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const stationTimeZone = process.env.ROUTE666_TIME_ZONE || "America/Denver";

export function getRadioTracks() {
  const { day, dir, isFallback } = getActiveRadioDirectory();

  return readTracksFromDirectory(dir, day, isFallback);
}

export function getRadioState() {
  ensureRadioDayDirectories();

  const clock = getStationClock();
  const { day, dir, isFallback } = getActiveRadioDirectory(clock.day);
  const tracks = readTracksFromDirectory(dir, day, isFallback);
  const totalDuration = tracks.reduce((total, track) => total + track.durationSeconds, 0);

  if (!tracks.length || totalDuration <= 0) {
    return {
      day,
      isFallback,
      stationTime: Date.now(),
      stationTimeZone,
      tracks,
      nowPlaying: null
    };
  }

  let stationOffset = positiveModulo(clock.secondsSinceMidnight, totalDuration);
  let trackIndex = 0;

  for (let index = 0; index < tracks.length; index += 1) {
    const duration = tracks[index].durationSeconds;

    if (stationOffset < duration) {
      trackIndex = index;
      break;
    }

    stationOffset -= duration;
  }

  return {
    day,
    isFallback,
    stationTime: Date.now(),
    stationTimeZone,
    totalDuration,
    tracks,
    nowPlaying: {
      trackIndex,
      offsetSeconds: stationOffset,
      track: tracks[trackIndex]
    }
  };
}

export function getRadioSchedule() {
  const state = getRadioState();
  const tracks = state.tracks || [];

  if (!tracks.length || !state.totalDuration) {
    return {
      ...state,
      entries: []
    };
  }

  const clock = getStationClock();
  const entries = [];
  let startSeconds = 0;
  let playIndex = 0;

  while (startSeconds < 24 * 60 * 60) {
    const trackIndex = playIndex % tracks.length;
    const track = tracks[trackIndex];
    const durationSeconds = Math.max(1, track.durationSeconds || 180);
    const endSeconds = Math.min(startSeconds + durationSeconds, 24 * 60 * 60);

    entries.push({
      id: `${playIndex}-${track.filename}`,
      endSeconds,
      isCurrent: clock.secondsSinceMidnight >= startSeconds && clock.secondsSinceMidnight < endSeconds,
      playNumber: playIndex + 1,
      startLabel: formatScheduleTime(startSeconds),
      startSeconds,
      track,
      trackIndex
    });

    startSeconds += durationSeconds;
    playIndex += 1;
  }

  return {
    ...state,
    entries
  };
}

export function ensureRadioDayDirectories() {
  const radioDir = getRadioDir();
  fs.mkdirSync(radioDir, { recursive: true });

  radioDays.forEach((day) => {
    fs.mkdirSync(path.join(radioDir, day), { recursive: true });
  });
}

export function resolveRadioTrackPath(day, filename) {
  ensureRadioDayDirectories();

  const normalizedDay = normalizeDay(day);
  const safeFilename = sanitizeTrackPath(filename);
  const dayPath = path.join(getRadioDir(), normalizedDay, safeFilename);

  if (fs.existsSync(dayPath)) {
    return dayPath;
  }

  const fallbackPath = path.join(getRadioDir(), safeFilename);

  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return dayPath;
}

function getActiveRadioDirectory(preferredDay = getStationClock().day) {
  ensureRadioDayDirectories();

  const radioDir = getRadioDir();
  const day = normalizeDay(preferredDay);
  const dayDir = path.join(radioDir, day);
  const dayTracks = readTracksFromDirectory(dayDir, day, false);

  if (dayTracks.length > 0) {
    return { day, dir: dayDir, isFallback: false };
  }

  return { day, dir: radioDir, isFallback: true };
}

function readTracksFromDirectory(dir, day, isFallback) {
  const artistBlockTracks = listArtistDirectories(dir, isFallback)
    .flatMap((artistDir) => {
      const blockDir = path.join(dir, artistDir.name);

      return listMp3Entries(blockDir)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map((entry) => buildTrack({
          blockName: artistDir.name,
          day,
          filename: entry.name,
          filePath: path.join(blockDir, entry.name),
          isFallback,
          relativePath: `${artistDir.name}/${entry.name}`
        }));
    });

  const looseTracks = listMp3Entries(dir)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((entry) => buildTrack({
      day,
      filename: entry.name,
      filePath: path.join(dir, entry.name),
      isFallback,
      relativePath: entry.name
    }));

  return [...artistBlockTracks, ...looseTracks];
}

function listMp3Entries(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3"));
}

function listArtistDirectories(dir, isFallback) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !isFallback || !radioDays.includes(entry.name.toLowerCase()))
    .filter((entry) => listMp3Entries(path.join(dir, entry.name)).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

function buildTrack({ blockName = "", day, filename, filePath, isFallback, relativePath }) {
  const metadata = readTrackMetadata(filePath);
  const baseName = path.basename(filename, path.extname(filename));
  const [rawBand, ...songParts] = baseName.replace(/^\d+\s*[-_.]\s*/, "").split(" - ");
  const blockArtist = blockName.replace(/^\d+\s*[-_.]\s*/, "").replace(/[-_]+/g, " ").trim();
  const band = metadata.artist || blockArtist || rawBand?.trim() || "Unknown Band";
  const song = metadata.title || (blockArtist ? cleanBlockSongTitle(baseName, blockArtist) : songParts.join(" - ").trim() || "Untitled Track");
  const encodedPath = relativePath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  const fallbackSrc = relativePath.includes("/")
    ? `/radio/_root/${encodedPath}`
    : `/radio/${encodedPath}`;

  return {
    blockName,
    filename,
    band,
    day,
    durationSeconds: getMp3DurationSeconds(filePath),
    isFallback,
    relativePath,
    song,
    src: isFallback
      ? fallbackSrc
      : `/radio/${encodeURIComponent(day)}/${encodedPath}`
  };
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

function sanitizeTrackPath(trackPath) {
  return String(trackPath || "")
    .split("/")
    .map((segment) => path.basename(segment))
    .filter(Boolean)
    .join("/");
}

function cleanBlockSongTitle(baseName, blockArtist) {
  const withoutTrackNumber = baseName.replace(/^\d+\s*[-_.]\s*/, "").trim();
  const artistPrefix = `${blockArtist} - `;

  if (withoutTrackNumber.toLowerCase().startsWith(artistPrefix.toLowerCase())) {
    return withoutTrackNumber.slice(artistPrefix.length).trim() || "Untitled Track";
  }

  return withoutTrackNumber || "Untitled Track";
}

function getStationClock(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    minute: "numeric",
    second: "numeric",
    timeZone: stationTimeZone,
    weekday: "long"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour === "24" ? "0" : values.hour);
  const minute = Number(values.minute || 0);
  const second = Number(values.second || 0);

  return {
    day: normalizeDay(values.weekday),
    secondsSinceMidnight: hour * 3600 + minute * 60 + second
  };
}

function normalizeDay(day) {
  const normalized = String(day || "").trim().toLowerCase();
  return radioDays.includes(normalized) ? normalized : "sunday";
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function formatScheduleTime(totalSeconds) {
  const seconds = Math.max(0, Math.min(totalSeconds, 24 * 60 * 60 - 1));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
