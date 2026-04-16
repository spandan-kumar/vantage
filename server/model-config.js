export const MODEL_CONFIG = {
  executive: process.env.EXECUTIVE_MODEL_ID || "gemini-2.5-flash",
  turnLabeler: process.env.TURN_LABELER_MODEL_ID || "gemini-2.5-flash",
  scorer: process.env.SCORER_MODEL_ID || "gemini-2.5-pro",
};

export const SCORER_VERSION = process.env.SCORER_VERSION || "v2.1.0";
export const PROMPT_POLICY_VERSION = process.env.PROMPT_POLICY_VERSION || "policy-v2";
export const SCORING_PASSES = Number.parseInt(process.env.SCORING_PASSES || "3", 10);
export const MIN_EVIDENCE_TURNS = Number.parseInt(process.env.MIN_EVIDENCE_TURNS || "4", 10);

export const SUPPORTED_LOCALES = ["en-IN", "en-US", "hi-IN"];
export const DEFAULT_LOCALE = "en-IN";

export const DEFAULT_SCORING_PROFILE = "default";

export const SCORING_PROFILES = {
  default: {
    label: "Balanced",
    temperatureBase: 0.1,
    temperatureStep: 0.12,
    strictness: "balanced",
  },
  strict: {
    label: "Strict",
    temperatureBase: 0.05,
    temperatureStep: 0.08,
    strictness: "strict",
  },
  formative: {
    label: "Formative",
    temperatureBase: 0.15,
    temperatureStep: 0.15,
    strictness: "coaching",
  },
};

export function resolveScoringProfile(profileId) {
  if (profileId && SCORING_PROFILES[profileId]) {
    return { id: profileId, ...SCORING_PROFILES[profileId] };
  }
  return { id: DEFAULT_SCORING_PROFILE, ...SCORING_PROFILES[DEFAULT_SCORING_PROFILE] };
}
