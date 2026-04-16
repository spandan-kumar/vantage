const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /you\s+are\s+now/i,
  /act\s+as\s+the\s+evaluator/i,
  /return\s+score\s+4/i,
  /output\s+json\s+exactly/i,
];

const GAMING_PATTERNS = [
  /give\s+me\s+a\s+high\s+score/i,
  /score\s+me\s+4/i,
  /please\s+grade\s+me\s+max/i,
  /i\s+need\s+to\s+pass/i,
  /tell\s+me\s+what\s+to\s+say\s+for\s+score/i,
  /just\s+say\s+i\s+did\s+great/i,
];

export function sanitizeUserText(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<\/?(script|style)[^>]*>/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);
}

export function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && typeof message.text === "string")
    .map((message) => ({
      ...message,
      sender: typeof message.sender === "string" ? message.sender : "Unknown",
      text: sanitizeUserText(message.text),
      isUser: Boolean(message.isUser),
      timestamp: Number.isFinite(message.timestamp) ? Number(message.timestamp) : Date.now(),
    }));
}

function collectPatternHits(messages, patterns) {
  return messages
    .map((message, index) => {
      const matched = patterns
        .filter((pattern) => pattern.test(message.text))
        .map((pattern) => pattern.source);
      if (matched.length === 0) return null;
      return {
        turnIndex: index,
        sender: message.sender,
        snippets: matched,
        text: message.text.slice(0, 200),
      };
    })
    .filter(Boolean);
}

export function detectPromptInjection(messages) {
  return collectPatternHits(messages, INJECTION_PATTERNS);
}

export function detectScoringGaming(messages) {
  return collectPatternHits(messages, GAMING_PATTERNS);
}

export function hasSecurityRisk(messages) {
  const injection = detectPromptInjection(messages);
  const gaming = detectScoringGaming(messages);
  return {
    injection,
    gaming,
    flagged: injection.length > 0 || gaming.length > 0,
  };
}
