import crypto from "node:crypto";
import {
  createAuthSession,
  findAuthSessionById,
  findAuthUserByEmail,
  findAuthUserById,
  listAuthSessionsForUser,
  upsertAuthUser,
  updateAuthSession,
} from "./storage.js";

const COOKIE_NAME = "vantage_auth";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.GEMINI_API_KEY || "dev-auth-secret-change-me";
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeCookieValue(data) {
  const payload = base64UrlEncode(JSON.stringify(data));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function decodeCookieValue(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  if (signPayload(payload) !== signature) return null;
  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index <= 0) return acc;
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

export function createAuthCookie(token) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearAuthCookie() {
  const parts = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeDisplayName(displayName, email) {
  const trimmed = String(displayName || "").trim();
  if (trimmed) return trimmed.slice(0, 80);
  return normalizeEmail(email).split("@")[0] || "Member";
}

function validatePassword(password) {
  return typeof password === "string" && password.trim().length >= 8;
}

function createPasswordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const nextHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(nextHash, "hex"));
}

function createSessionToken(session) {
  return encodeCookieValue({
    sid: session.id,
    uid: session.userId,
    exp: session.expiresAt,
    iat: session.createdAt,
  });
}

async function createSessionRecord(userId) {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  const session = {
    id: crypto.randomUUID(),
    userId,
    createdAt: now,
    lastUsedAt: now,
    expiresAt,
    revokedAt: null,
  };
  await createAuthSession(session);
  return session;
}

async function getValidSessionFromToken(token) {
  const payload = decodeCookieValue(token);
  if (!payload?.sid || !payload?.uid || !payload?.exp) {
    return null;
  }
  if (Date.now() > Date.parse(payload.exp)) {
    return null;
  }
  const session = await findAuthSessionById(payload.sid);
  if (!session || session.revokedAt || session.userId !== payload.uid) {
    return null;
  }
  return session;
}

export async function getAuthContext(req) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return { authenticated: false, user: null, session: null, token: null };
  }

  const session = await getValidSessionFromToken(token);
  if (!session) {
    return { authenticated: false, user: null, session: null, token: null };
  }

  const user = await findAuthUserById(session.userId);
  if (!user) {
    return { authenticated: false, user: null, session: null, token: null };
  }

  await updateAuthSession(session.id, { lastUsedAt: new Date().toISOString() });

  return {
    authenticated: true,
    user,
    session,
    token,
  };
}

export async function registerAccount({ email, password, displayName }) {
  const safeEmail = normalizeEmail(email);
  if (!safeEmail || !safeEmail.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }
  if (!validatePassword(password)) {
    throw new Error("Password must be at least 8 characters long.");
  }
  const existing = await findAuthUserByEmail(safeEmail);
  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const passwordRecord = createPasswordHash(password);
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    email: safeEmail,
    displayName: normalizeDisplayName(displayName, safeEmail),
    passwordHash: passwordRecord.hash,
    passwordSalt: passwordRecord.salt,
    createdAt: now,
    updatedAt: now,
  };

  await upsertAuthUser(user);
  const session = await createSessionRecord(user.id);
  return { user, session, token: createSessionToken(session) };
}

export async function loginAccount({ email, password }) {
  const safeEmail = normalizeEmail(email);
  const user = await findAuthUserByEmail(safeEmail);
  if (!user) {
    throw new Error("No account found for that email.");
  }
  if (!validatePassword(password)) {
    throw new Error("Please enter your password.");
  }
  const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!isValid) {
    throw new Error("Incorrect password.");
  }

  const session = await createSessionRecord(user.id);
  return { user, session, token: createSessionToken(session) };
}

export async function logoutAccount(req) {
  const context = await getAuthContext(req);
  if (context.session) {
    await updateAuthSession(context.session.id, { revokedAt: new Date().toISOString() });
  }
  return { ok: true };
}

export async function getAuthenticatedAccount(req) {
  const context = await getAuthContext(req);
  if (!context.authenticated) {
    return { authenticated: false, user: null, session: null };
  }
  return {
    authenticated: true,
    user: {
      id: context.user.id,
      email: context.user.email,
      displayName: context.user.displayName,
      createdAt: context.user.createdAt,
      updatedAt: context.user.updatedAt,
    },
    session: {
      id: context.session.id,
      createdAt: context.session.createdAt,
      lastUsedAt: context.session.lastUsedAt,
      expiresAt: context.session.expiresAt,
    },
  };
}

export async function getAccountSessionHistory(userId) {
  return listAuthSessionsForUser(userId);
}
