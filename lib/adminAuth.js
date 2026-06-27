import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";

const cookieName = "route666_admin";
const sessionDays = 7;

export function hasAdminUsers() {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM admin_users")
    .get();

  return row.count > 0;
}

export function createAdminUser(username, password) {
  if (!username || !password || password.length < 8) {
    throw new Error("Username is required and password must be at least 8 characters.");
  }

  const passwordHash = hashPassword(password);
  const result = getDb()
    .prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);

  return getDb()
    .prepare("SELECT id, username, created_at FROM admin_users WHERE id = ?")
    .get(result.lastInsertRowid);
}

export function getAdminUsers() {
  return getDb()
    .prepare("SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC")
    .all()
    .map((admin) => ({ ...admin }));
}

export function authenticateAdmin(username, password) {
  const admin = getDb()
    .prepare("SELECT * FROM admin_users WHERE username = ?")
    .get(username);

  if (!admin || !verifyPassword(password, admin.password_hash)) {
    return null;
  }

  return {
    id: admin.id,
    username: admin.username
  };
}

export function createAdminSession(adminUserId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();

  getDb()
    .prepare("INSERT INTO admin_sessions (admin_user_id, token, expires_at) VALUES (?, ?, ?)")
    .run(adminUserId, token, expiresAt);

  return {
    token,
    expiresAt
  };
}

export async function setAdminCookie(token, expiresAt) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const admin = getDb()
    .prepare(`
      SELECT admin_users.id, admin_users.username
      FROM admin_sessions
      JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id
      WHERE admin_sessions.token = ?
        AND datetime(admin_sessions.expires_at) > datetime('now')
    `)
    .get(token);

  return admin || null;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");

  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
