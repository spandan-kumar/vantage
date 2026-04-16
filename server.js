import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearAuthCookie, createAuthCookie, getAuthenticatedAccount, loginAccount, logoutAccount, registerAccount } from "./server/auth.js";
import {
  chatWithExecutiveLLM,
  evaluateTranscript,
  getArtifactReplay,
  getLocaleCalibration,
  getRecommendationsForUser,
  getUserAssessmentHistory,
  submitHumanRating,
} from "./server/gemini-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const app = express();
app.use(express.json({ limit: "1mb" }));

function resolveRequestUserId(req, fallbackUserId = "") {
  return req.auth?.user?.id || fallbackUserId || "";
}

app.use("/api", async (req, _res, next) => {
  try {
    req.auth = await getAuthenticatedAccount(req);
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    return res.json(req.auth || { authenticated: false, user: null, session: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, displayName } = req.body ?? {};
    const output = await registerAccount({ email, password, displayName });
    res.setHeader("Set-Cookie", createAuthCookie(output.token));
    return res.status(201).json({
      authenticated: true,
      user: {
        id: output.user.id,
        email: output.user.email,
        displayName: output.user.displayName,
        createdAt: output.user.createdAt,
        updatedAt: output.user.updatedAt,
      },
      session: {
        id: output.session.id,
        createdAt: output.session.createdAt,
        lastUsedAt: output.session.lastUsedAt,
        expiresAt: output.session.expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(400).json({ error: message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    const output = await loginAccount({ email, password });
    res.setHeader("Set-Cookie", createAuthCookie(output.token));
    return res.json({
      authenticated: true,
      user: {
        id: output.user.id,
        email: output.user.email,
        displayName: output.user.displayName,
        createdAt: output.user.createdAt,
        updatedAt: output.user.updatedAt,
      },
      session: {
        id: output.session.id,
        createdAt: output.session.createdAt,
        lastUsedAt: output.session.lastUsedAt,
        expiresAt: output.session.expiresAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(400).json({ error: message });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    await logoutAccount(req);
    res.setHeader("Set-Cookie", clearAuthCookie());
    return res.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, task, assessmentMode, locale, userId, sessionId } = req.body ?? {};
    if (!Array.isArray(messages) || !task || typeof task !== "object") {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const output = await chatWithExecutiveLLM(messages, task, assessmentMode, {
      locale,
      userId: resolveRequestUserId(req, userId),
      sessionId,
    });
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const { messages, task, assessmentMode, locale, userId, sessionId, scoringProfileId } = req.body ?? {};
    if (!Array.isArray(messages) || !task || typeof task !== "object") {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const output = await evaluateTranscript(messages, task, assessmentMode, {
      locale,
      userId: resolveRequestUserId(req, userId),
      sessionId,
      scoringProfileId,
    });
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/history", async (req, res) => {
  try {
    const userId = resolveRequestUserId(req, typeof req.query.userId === "string" ? req.query.userId : "");
    const skill = typeof req.query.skill === "string" ? req.query.skill : null;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }
    const output = await getUserAssessmentHistory(userId, skill);
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/recommendations", async (req, res) => {
  try {
    const userId = resolveRequestUserId(req, typeof req.query.userId === "string" ? req.query.userId : "");
    const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }
    const output = await getRecommendationsForUser(userId, locale);
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    const userId = resolveRequestUserId(req, typeof req.query.userId === "string" ? req.query.userId : "");
    const skill = typeof req.query.skill === "string" ? req.query.skill : null;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId query parameter" });
    }
    const output = await getUserAssessmentHistory(userId, skill);
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/locale-calibration", async (req, res) => {
  try {
    const locale = typeof req.query.locale === "string" ? req.query.locale : undefined;
    const output = await getLocaleCalibration(locale);
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.get("/api/artifacts/:artifactId", async (req, res) => {
  try {
    const artifact = await getArtifactReplay(req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ error: "Artifact not found" });
    }
    return res.json(artifact);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/internal/human-rating", async (req, res) => {
  try {
    const output = await submitHumanRating(req.body ?? {});
    return res.status(201).json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.use(express.static(distDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`Monolith server listening on port ${port}`);
});
