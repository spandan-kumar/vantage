import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data", "runtime");
const ARTIFACT_DIR = path.join(DATA_DIR, "artifacts");
const HISTORY_DIR = path.join(DATA_DIR, "history");
const AUTH_DIR = path.join(DATA_DIR, "auth");
const USERS_FILE = path.join(AUTH_DIR, "users.json");
const AUTH_SESSIONS_FILE = path.join(AUTH_DIR, "sessions.json");
const HUMAN_RATINGS_FILE = path.join(DATA_DIR, "human-ratings.jsonl");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendJsonl(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

export async function saveAssessmentArtifact(artifact) {
  const safeDate = new Date().toISOString().slice(0, 10);
  const artifactFile = path.join(ARTIFACT_DIR, safeDate, `${artifact.artifactId}.json`);
  await writeJson(artifactFile, artifact);
  return artifactFile;
}

export async function getAssessmentArtifact(artifactId) {
  try {
    const dates = await fs.readdir(ARTIFACT_DIR);
    for (const dateFolder of dates) {
      const candidate = path.join(ARTIFACT_DIR, dateFolder, `${artifactId}.json`);
      try {
        const content = await fs.readFile(candidate, "utf8");
        return JSON.parse(content);
      } catch {
        // no-op
      }
    }
  } catch {
    // no-op
  }
  return null;
}

export async function appendUserHistory(userId, entry) {
  const safeUserId = userId || "anonymous";
  const historyFile = path.join(HISTORY_DIR, `${safeUserId}.json`);
  const history = await readJson(historyFile, []);
  const nextHistory = [entry, ...history].slice(0, 200);
  await writeJson(historyFile, nextHistory);
  return nextHistory;
}

export async function getUserHistory(userId) {
  const safeUserId = userId || "anonymous";
  const historyFile = path.join(HISTORY_DIR, `${safeUserId}.json`);
  return readJson(historyFile, []);
}

export async function loadAuthUsers() {
  return readJson(USERS_FILE, []);
}

export async function saveAuthUsers(users) {
  await writeJson(USERS_FILE, users);
  return users;
}

export async function loadAuthSessions() {
  return readJson(AUTH_SESSIONS_FILE, []);
}

export async function saveAuthSessions(sessions) {
  await writeJson(AUTH_SESSIONS_FILE, sessions);
  return sessions;
}

export async function findAuthUserByEmail(email) {
  const users = await loadAuthUsers();
  return users.find((user) => user.email === email) || null;
}

export async function findAuthUserById(userId) {
  const users = await loadAuthUsers();
  return users.find((user) => user.id === userId) || null;
}

export async function upsertAuthUser(user) {
  const users = await loadAuthUsers();
  const index = users.findIndex((item) => item.id === user.id);
  const nextUsers = index >= 0 ? [...users.slice(0, index), user, ...users.slice(index + 1)] : [user, ...users];
  await saveAuthUsers(nextUsers);
  return user;
}

export async function createAuthSession(session) {
  const sessions = await loadAuthSessions();
  const nextSessions = [session, ...sessions].slice(0, 500);
  await saveAuthSessions(nextSessions);
  return session;
}

export async function updateAuthSession(sessionId, patch) {
  const sessions = await loadAuthSessions();
  const nextSessions = sessions.map((session) => (session.id === sessionId ? { ...session, ...patch } : session));
  await saveAuthSessions(nextSessions);
  return nextSessions.find((session) => session.id === sessionId) || null;
}

export async function findAuthSessionById(sessionId) {
  const sessions = await loadAuthSessions();
  return sessions.find((session) => session.id === sessionId) || null;
}

export async function listAuthSessionsForUser(userId) {
  const sessions = await loadAuthSessions();
  return sessions.filter((session) => session.userId === userId);
}

export async function saveHumanRating(rating) {
  await appendJsonl(HUMAN_RATINGS_FILE, rating);
}

export async function loadHumanRatings() {
  try {
    const content = await fs.readFile(HUMAN_RATINGS_FILE, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function getLocaleCalibrationSummary() {
  const ratings = await loadHumanRatings();
  const localeStats = new Map();

  for (const rating of ratings) {
    const locale = rating.locale || "unknown";
    if (!localeStats.has(locale)) {
      localeStats.set(locale, { locale, humanRatings: 0, uniqueArtifacts: new Set(), uniqueRaters: new Set() });
    }
    const current = localeStats.get(locale);
    current.humanRatings += 1;
    if (rating.artifactId) current.uniqueArtifacts.add(rating.artifactId);
    if (rating.raterId) current.uniqueRaters.add(rating.raterId);
  }

  const summaries = [...localeStats.values()].map((stat) => ({
    locale: stat.locale,
    humanRatings: stat.humanRatings,
    artifactCount: stat.uniqueArtifacts.size,
    raterCount: stat.uniqueRaters.size,
    calibrated: stat.humanRatings >= 100 && stat.uniqueArtifacts.size >= 60 && stat.uniqueRaters.size >= 2,
  }));

  return summaries;
}

export async function listArtifacts(limit = 200) {
  const allArtifacts = [];
  try {
    const dates = await fs.readdir(ARTIFACT_DIR);
    for (const dateFolder of dates) {
      const folderPath = path.join(ARTIFACT_DIR, dateFolder);
      const files = await fs.readdir(folderPath);
      for (const fileName of files) {
        if (!fileName.endsWith(".json")) continue;
        const content = await fs.readFile(path.join(folderPath, fileName), "utf8");
        const parsed = JSON.parse(content);
        allArtifacts.push(parsed);
      }
    }
  } catch {
    return [];
  }

  return allArtifacts
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, limit);
}
