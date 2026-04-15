import { GoogleGenAI, Type } from "@google/genai";

const COLLABORATION_RUBRIC = `
# Collaboration Rubric

## Conflict Resolution
1. Overall: Fails to identify conflicts (1) -> Recognizes presence but struggles to address (2) -> Effectively responds to acknowledged conflicts (3) -> Proactively identifies and resolves conflicts, investigating root causes (4).
2. Conflict Identification: Fails to identify (1) -> Acknowledges only when prompted (2) -> Clearly identifies overt conflicts (3) -> Proactively surfaces potential gaps (4).
3. Scoping and Analysis: Mischaracterizes conflict (1) -> Oversimplifies in binary terms (2) -> Scopes the 'width' of the conflict (3) -> Investigates the conflict's 'depth' and 'type' (4).
4. Strategy Application: Applies detrimental strategies like stonewalling (1) -> Applies limited/mismatched strategy (2) -> Applies standard resolution practices like voting (3) -> Applies adaptive resolution practices tailored to conflict type (4).
5. Monitoring and Regulation: Creates hostile environment (1) -> Shows signs of negative emotional response (2) -> Maintains respectful tone (3) -> Fosters psychological safety and de-escalates tension (4).

## Project Management
1. Overall Competence: Antagonistic/apathetic (1) -> Reactive participation (2) -> Active participation (3) -> Leads co-construction and adaptive planning proactively (4).
2. Goal Setting & Shared Task Definition: Ignores/undermines goals (1) -> Passively accepts goals (2) -> Actively contributes to defining goals (3) -> Initiates and facilitates co-construction of clear goals (4).
3. Collaborative Planning & Role Definition: Ignores planning/roles (1) -> Relies on others for defining plan (2) -> Actively contributes practical ideas (3) -> Leads co-construction and adaptive planning proactively (4).
4. Mutual Status Monitoring: Limits shared awareness (1) -> Has limited contribution to shared awareness (2) -> Contributes to shared awareness by openly sharing status (3) -> Creates shared awareness and prompts team members (4).
`;

const CREATIVITY_RUBRIC = `
# Creativity Rubric

## Generating Ideas
1. Fluidity: Produces well below average number of distinct ideas (1) -> Below average (2) -> Average/above average (3) -> Well above average number of distinct ideas (4).
2. Originality: Produces well-known/predictable solutions (1) -> Slight variations on common solutions (2) -> Unconventional solutions (3) -> Surprising or novel solutions (4).
3. Quality: Suggestions are clearly irrelevant/infeasible (1) -> Address only a portion of the problem (2) -> Relevant and feasible, satisfy main constraints (3) -> Meet all criteria and adaptable to changing conditions (4).

## Evaluating Ideas
1. Elaborating: Provides little to no detail (1) -> Surface-level description (2) -> Details beyond surface-level specs (3) -> Substantive explanations including functionality (4).
2. Selecting: Chooses ideas that fail to address core problem (1) -> Chooses ideas that only partially address problem (2) -> Chooses feasible ideas that address core problem (3) -> Chooses ideas that are adaptable and balance utility/novelty (4).

## Building on Ideas
1. Overall Competence: Ignores/dismisses others' suggestions (1) -> Focuses on adjusting own ideas rather than incorporating others (2) -> Actively adapts and improves concepts by incorporating others' ideas (3) -> Seamlessly weaves together own ideas with others to create a stronger concept (4).
`;

const CRITICAL_THINKING_RUBRIC = `
# Critical Thinking Rubric

## Interpret and Analyze
1. Overall: Treats text as flat narrative, relies on others (1) -> Interprets rigidly in isolation (2) -> Clarifies ambiguous terms, maps structure accurately (3) -> Considers intent along with context, identifies missing info (4).
2. Clarifying Intent: Misidentifies core components (1) -> Distinguishes informational content from filler but miscategorizes (2) -> Accurately categorizes informational statements (3) -> Considers intent along with context (4).
3. Outlining Arguments: Fails to detect arguments (1) -> Mislabels components or relationships (2) -> Deconstructs and maps structure accurately (3) -> Identifies hidden assumptions and subtle gaps (4).

## Evaluate and Judge
1. Overall: Evaluates based on personal agreement (1) -> Evaluates based on surface traits (2) -> Evaluates using established criteria, identifies fallacies (3) -> Evaluates quality of sources, explains why argument is flawed (4).
2. Assessing Information: Selects based on pre-existing beliefs (1) -> Evaluates based on surface characteristics (2) -> Systematically evaluates using established criteria (3) -> Evaluates evidence with respect to specific claims, considers subtle issues (4).
3. Assessing Reasoning: Evaluates based on agreement with conclusion (1) -> Identifies obvious flaws but fails to diagnose (2) -> Identifies invalid logic or unsound arguments (3) -> Explains exactly why an argument is valid/sound or not (4).
`;

const DIMENSIONS_BY_SKILL = {
  Collaboration: ["Conflict Resolution", "Project Management"],
  Creativity: ["Generating Ideas", "Evaluating Ideas", "Building on Ideas"],
  "Critical Thinking": ["Interpret and Analyze", "Evaluate and Judge"],
};

const DIMENSION_KEYWORDS = {
  Collaboration: {
    "Conflict Resolution": ["disagree", "conflict", "resolve", "compromise", "middle ground", "tradeoff"],
    "Project Management": ["plan", "timeline", "next step", "role", "assign", "goal", "priority", "track"],
  },
  Creativity: {
    "Generating Ideas": ["idea", "what if", "option", "alternative", "brainstorm", "concept"],
    "Evaluating Ideas": ["pros", "cons", "feasible", "cost", "impact", "risk", "best option"],
    "Building on Ideas": ["build on", "combine", "improve", "iterate", "expand", "adapt"],
  },
  "Critical Thinking": {
    "Interpret and Analyze": ["claim", "assumption", "evidence", "argument", "interpret", "context"],
    "Evaluate and Judge": ["bias", "fallacy", "credible", "valid", "causation", "correlation", "reasoning"],
  },
};

let ai = null;

function getAiClient() {
  if (ai) return ai;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
}

function getRubricForSkill(skill) {
  switch (skill) {
    case "Collaboration":
      return COLLABORATION_RUBRIC;
    case "Creativity":
      return CREATIVITY_RUBRIC;
    case "Critical Thinking":
      return CRITICAL_THINKING_RUBRIC;
    default:
      return "";
  }
}

function toAssessmentMode(value) {
  return value === "practice" ? "practice" : "assessment";
}

function getUserMessages(messages) {
  return (Array.isArray(messages) ? messages : []).filter((m) => m && m.isUser && typeof m.text === "string");
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeText(value) {
  return typeof value === "string" ? value : "";
}

function extractCoverage(messages, skill) {
  const userMessages = getUserMessages(messages);
  const dimensions = DIMENSIONS_BY_SKILL[skill] || [];
  const keywordMap = DIMENSION_KEYWORDS[skill] || {};

  const dimensionEvidence = dimensions.map((dimension) => {
    const keywords = keywordMap[dimension] || [];
    const evidenceCount = userMessages.reduce((count, m) => {
      const text = safeText(m.text).toLowerCase();
      return keywords.some((keyword) => text.includes(keyword)) ? count + 1 : count;
    }, 0);

    return {
      dimension,
      evidenceCount,
    };
  });

  return {
    userTurnCount: userMessages.length,
    dimensionEvidence,
    uncoveredDimensions: dimensionEvidence.filter((d) => d.evidenceCount === 0).map((d) => d.dimension),
  };
}

function parseTeammateMessages(rawOutput, task) {
  const teammates = Array.isArray(task?.teammates) ? task.teammates : [];
  const fallbackSpeaker = teammates[0] || "Teammate";

  let parsed;
  try {
    const cleaned = safeText(rawOutput).replace(/^```json\n/, "").replace(/\n```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = null;
  }

  if (parsed && Array.isArray(parsed.messages)) {
    const structured = parsed.messages
      .filter((m) => m && typeof m.text === "string" && typeof m.speaker === "string")
      .map((m) => ({
        id: `${Date.now()}-${Math.random()}`,
        sender: teammates.includes(m.speaker) ? m.speaker : fallbackSpeaker,
        text: m.text.trim(),
        isUser: false,
        timestamp: Date.now(),
      }))
      .filter((m) => m.text.length > 0);

    if (structured.length > 0) {
      return structured;
    }
  }

  const text = safeText(rawOutput);
  const teammateNames = teammates.join("|");
  const regex = new RegExp(`(?:^|\\s)(${teammateNames}):\\s*`, "g");
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0 && text.trim().length > 0) {
    return [
      {
        id: `${Date.now()}`,
        sender: fallbackSpeaker,
        text: text.trim(),
        isUser: false,
        timestamp: Date.now(),
      },
    ];
  }

  const parsedMessages = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const sender = match[1];
    const startContent = (match.index || 0) + match[0].length;
    const endContent = i + 1 < matches.length ? (matches[i + 1].index || text.length) : text.length;
    const messageText = text.substring(startContent, endContent).trim();

    if (messageText) {
      parsedMessages.push({
        id: `${Date.now()}-${Math.random()}`,
        sender,
        text: messageText,
        isUser: false,
        timestamp: Date.now(),
      });
    }
  }

  return parsedMessages;
}

function scoreLevelName(score) {
  if (score === "NA") return "Insufficient Evidence";
  if (score >= 4) return "Excelling";
  if (score >= 3) return "Demonstrating";
  if (score >= 2) return "Emerging";
  return "Beginning";
}

function defaultDevelopmentPlan() {
  return {
    immediateActions: ["State your plan in one sentence before proposing solutions."],
    nextActions: ["Ask one clarifying question and one tradeoff question in each scenario."],
    stretchActions: ["Summarize team progress every 3-4 turns and adapt strategy if needed."],
  };
}

function normalizeEvaluation(result, task, coverage, assessmentMode) {
  const expectedDimensions = DIMENSIONS_BY_SKILL[task.skill] || [];
  const dimensionMap = new Map();

  for (const entry of Array.isArray(result?.dimensions) ? result.dimensions : []) {
    if (!entry || typeof entry.dimension !== "string") continue;
    dimensionMap.set(entry.dimension, entry);
  }

  const normalizedDimensions = expectedDimensions.map((dimension) => {
    const source = dimensionMap.get(dimension) || {};
    const evidenceCount = Number.isFinite(source.evidenceCount)
      ? Number(source.evidenceCount)
      : coverage.dimensionEvidence.find((d) => d.dimension === dimension)?.evidenceCount || 0;
    const confidence = clamp(Number(source.confidence) || (evidenceCount > 0 ? 0.6 : 0.25), 0, 1);
    const numericScore = clamp(Math.round(Number(source.score) || 1), 1, 4);
    const score = evidenceCount === 0 || confidence < 0.25 ? "NA" : numericScore;

    return {
      dimension,
      score,
      levelName: safeText(source.levelName) || scoreLevelName(score),
      confidence,
      evidenceCount,
      feedback:
        safeText(source.feedback) ||
        (score === "NA"
          ? "Not enough direct behavioral evidence was observed for this dimension."
          : "Performance indicates partial competence with room for growth."),
      excerpt: safeText(source.excerpt) || "No direct quote captured.",
      nextProbe:
        safeText(source.nextProbe) ||
        `Prompt the learner to provide a concrete action for ${dimension.toLowerCase()}.`,
    };
  });

  const scored = normalizedDimensions.filter((d) => d.score !== "NA");
  const overallScore =
    scored.length === 0 ? "NA" : Math.round(scored.reduce((sum, d) => sum + Number(d.score), 0) / scored.length);

  const inferredConfidence =
    normalizedDimensions.length === 0
      ? 0.2
      : normalizedDimensions.reduce((sum, d) => sum + d.confidence, 0) / normalizedDimensions.length;

  const minimumEvidenceMet = coverage.userTurnCount >= 4 && coverage.uncoveredDimensions.length <= 1;
  const reliabilityFlags = Array.isArray(result?.reliabilityFlags) ? [...result.reliabilityFlags] : [];

  if (coverage.userTurnCount < 4) {
    reliabilityFlags.push("Low interaction volume: fewer than 4 user turns can reduce score stability.");
  }
  if (coverage.uncoveredDimensions.length > 0) {
    reliabilityFlags.push(
      `Coverage gap: no direct evidence for ${coverage.uncoveredDimensions.join(", ")}; interpretation should remain cautious.`
    );
  }
  if (!minimumEvidenceMet) {
    reliabilityFlags.push("Minimum evidence threshold not fully met; treat this as directional feedback.");
  }

  return {
    skill: task.skill,
    assessmentMode,
    overallScore,
    overallConfidence: clamp(Number(result?.overallConfidence) || inferredConfidence, 0, 1),
    summary: safeText(result?.summary) || "The conversation provides an initial signal of durable skills with moderate uncertainty.",
    dimensions: normalizedDimensions,
    reliabilityFlags: [...new Set(reliabilityFlags)],
    validityNotes: Array.isArray(result?.validityNotes)
      ? result.validityNotes
      : [
          "Scores reflect observed chat behavior and should be interpreted alongside additional tasks.",
          "Construct coverage is stronger when each dimension has direct transcript evidence.",
        ],
    fairnessChecks: Array.isArray(result?.fairnessChecks)
      ? result.fairnessChecks
      : [
          "Language style should not be treated as equivalent to skill unless behavior is explicit.",
          "No demographic attributes were used for scoring.",
        ],
    developmentPlan: result?.developmentPlan || defaultDevelopmentPlan(),
    evidenceCoverage: coverage.dimensionEvidence,
    minimumEvidenceMet,
    metadata: {
      userTurnCount: coverage.userTurnCount,
      uncoveredDimensions: coverage.uncoveredDimensions,
      generatedAt: new Date().toISOString(),
    },
  };
}

export async function chatWithExecutiveLLM(messages, task, requestedMode) {
  const assessmentMode = toAssessmentMode(requestedMode);
  const aiClient = getAiClient();
  const coverage = extractCoverage(messages, task.skill);
  const formattedHistory = (Array.isArray(messages) ? messages : [])
    .map((m) => `${m.sender}: ${safeText(m.text)}`)
    .join("\n");

  const adaptiveGuidance =
    coverage.uncoveredDimensions.length > 0
      ? `Prioritize eliciting evidence for: ${coverage.uncoveredDimensions.join(", ")}.`
      : "Continue naturally while preserving balanced participation and challenge.";

  const modeGuidance =
    assessmentMode === "practice"
      ? "Practice mode: include one brief coaching cue in each teammate response."
      : "Assessment mode: stay neutral and avoid direct coaching beyond light facilitation.";

  const prompt =
    `Conversation History:\n${formattedHistory}\n\n` +
    `Coverage Snapshot: ${JSON.stringify(coverage.dimensionEvidence)}\n` +
    `${adaptiveGuidance}\n${modeGuidance}\n\n` +
    "Return JSON with this shape only:\n" +
    `{"messages":[{"speaker":"${task.teammates[0] || "Teammate"}","text":"..."}],"focusDimensions":["..."],"facilitatorNote":"..."}`;

  const response = await aiClient.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: task.systemPrompt,
      temperature: assessmentMode === "practice" ? 0.75 : 0.65,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          messages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["speaker", "text"],
            },
          },
          focusDimensions: { type: Type.ARRAY, items: { type: Type.STRING } },
          facilitatorNote: { type: Type.STRING },
        },
        required: ["messages", "focusDimensions", "facilitatorNote"],
      },
    },
  });

  return parseTeammateMessages(response.text || "", task);
}

export async function evaluateTranscript(messages, task, requestedMode) {
  const assessmentMode = toAssessmentMode(requestedMode);
  const aiClient = getAiClient();
  const rubric = getRubricForSkill(task.skill);
  const coverage = extractCoverage(messages, task.skill);
  const formattedHistory = (Array.isArray(messages) ? messages : [])
    .map((m) => `${m.sender}: ${safeText(m.text)}`)
    .join("\n");

  const prompt =
    `You are an expert evaluator for durable skills.\n` +
    `Skill: ${task.skill}\nMode: ${assessmentMode}\n` +
    `Task Description: ${task.description}\n\n` +
    `Rubric:\n${rubric}\n\n` +
    `Transcript:\n${formattedHistory}\n\n` +
    `Heuristic pre-analysis: ${JSON.stringify(coverage)}\n\n` +
    "Instructions:\n" +
    "1) Evaluate only the human participant named 'User'.\n" +
    "2) Calibrate confidence lower where evidence is weak or indirect.\n" +
    "3) Include at least one quoted excerpt per dimension when evidence exists.\n" +
    "4) Provide reliability flags and fairness checks explicitly.\n" +
    "5) Keep feedback concrete and behavior-based.\n";

  const response = await aiClient.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          overallConfidence: { type: Type.NUMBER },
          dimensions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dimension: { type: Type.STRING },
                score: { type: Type.NUMBER },
                levelName: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                evidenceCount: { type: Type.NUMBER },
                feedback: { type: Type.STRING },
                excerpt: { type: Type.STRING },
                nextProbe: { type: Type.STRING },
              },
              required: [
                "dimension",
                "score",
                "levelName",
                "confidence",
                "evidenceCount",
                "feedback",
                "excerpt",
                "nextProbe",
              ],
            },
          },
          reliabilityFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          validityNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          fairnessChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
          developmentPlan: {
            type: Type.OBJECT,
            properties: {
              immediateActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              nextActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              stretchActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["immediateActions", "nextActions", "stretchActions"],
          },
        },
        required: [
          "summary",
          "overallConfidence",
          "dimensions",
          "reliabilityFlags",
          "validityNotes",
          "fairnessChecks",
          "developmentPlan",
        ],
      },
    },
  });

  let text = response.text || "{}";
  text = text.replace(/^```json\n/, "").replace(/\n```$/, "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```.*\n/, "").replace(/\n```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  return normalizeEvaluation(parsed, task, coverage, assessmentMode);
}
