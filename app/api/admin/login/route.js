import { authenticateAdmin, createAdminSession } from "@/lib/adminAuth";
import { rejectCrossSitePost } from "@/lib/requestSecurity";
import { redirectTo } from "@/lib/redirect";

const loginAttempts = new Map();
const maxAttempts = 8;
const windowMs = 15 * 60 * 1000;

export async function POST(request) {
  const crossSite = rejectCrossSitePost(request);
  if (crossSite) {
    return crossSite;
  }

  const formData = await request.formData();
  const username = clean(formData.get("username"));
  const attemptKey = `${getClientAddress(request)}:${username.toLowerCase()}`;

  if (isRateLimited(attemptKey)) {
    return redirectTo(request, "/admin/login?error=1");
  }

  const admin = authenticateAdmin(username, clean(formData.get("password")));

  if (!admin) {
    recordFailedAttempt(attemptKey);
    return redirectTo(request, "/admin/login?error=1");
  }

  clearAttempts(attemptKey);
  const session = createAdminSession(admin.id);
  const response = redirectTo(request, "/admin/messages");

  response.cookies.set("route666_admin", session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt)
  });

  return response;
}

function clean(value) {
  return String(value || "").trim();
}

function getClientAddress(request) {
  return request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.expiresAt <= now) {
    return false;
  }

  return attempt.count >= maxAttempts;
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);

  if (!attempt || attempt.expiresAt <= now) {
    loginAttempts.set(key, { count: 1, expiresAt: now + windowMs });
    return;
  }

  loginAttempts.set(key, { ...attempt, count: attempt.count + 1 });
}

function clearAttempts(key) {
  loginAttempts.delete(key);
}
