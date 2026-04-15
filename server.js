import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chatWithExecutiveLLM, evaluateTranscript } from "./server/gemini-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, "dist");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, task } = req.body ?? {};
    if (!Array.isArray(messages) || !task || typeof task !== "object") {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const output = await chatWithExecutiveLLM(messages, task);
    return res.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/evaluate", async (req, res) => {
  try {
    const { messages, task } = req.body ?? {};
    if (!Array.isArray(messages) || !task || typeof task !== "object") {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const output = await evaluateTranscript(messages, task);
    return res.json(output);
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
