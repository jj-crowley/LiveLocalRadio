import path from "node:path";

export const projectRoot = process.cwd();

export function getDatabasePath() {
  return process.env.ROUTE666_DB_PATH || path.join(projectRoot, "data", "route666.db");
}

export function getUploadDir() {
  return process.env.ROUTE666_UPLOAD_DIR || path.join(projectRoot, "storage", "uploads");
}

export function getRadioDir() {
  return process.env.ROUTE666_RADIO_DIR || path.join(projectRoot, "storage", "radio");
}

export function getVideoDir() {
  return process.env.ROUTE666_VIDEO_DIR || path.join(projectRoot, "storage", "videos");
}
