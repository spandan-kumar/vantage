import {
  Message,
  Task,
  AssessmentResult,
  AssessmentMode,
  HistorySession,
  LocaleCalibrationResponse,
  LocaleCode,
  Recommendation,
  ScoringProfileId,
  UserHistoryResponse,
  RecommendationResponse,
} from "../types";

type ApiError = {
  error?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data.error) errorMessage = data.error;
    } catch {
      // Ignore JSON parse failures and keep fallback message.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data.error) errorMessage = data.error;
    } catch {
      // Ignore JSON parse failures and keep fallback message.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

interface EvaluationContext {
  locale?: LocaleCode;
  userId?: string;
  sessionId?: string;
  scoringProfileId?: ScoringProfileId;
}

export async function chatWithExecutiveLLM(
  messages: Message[],
  task: Task,
  assessmentMode: AssessmentMode,
  context: EvaluationContext = {}
): Promise<Message[]> {
  return postJson<Message[]>("/api/chat", { messages, task, assessmentMode, ...context });
}

export async function evaluateTranscript(
  messages: Message[],
  task: Task,
  assessmentMode: AssessmentMode,
  context: EvaluationContext = {}
): Promise<AssessmentResult> {
  return postJson<AssessmentResult>("/api/evaluate", { messages, task, assessmentMode, ...context });
}

export async function fetchAssessmentHistory(userId: string, skill?: string): Promise<HistorySession[]> {
  const query = new URLSearchParams({ userId });
  if (skill) query.set("skill", skill);
  const response = await getJson<UserHistoryResponse>(`/api/history?${query.toString()}`);
  return response.sessions;
}

export async function fetchRecommendations(userId: string, locale: LocaleCode): Promise<Recommendation[]> {
  const query = new URLSearchParams({ userId, locale });
  const response = await getJson<RecommendationResponse>(`/api/recommendations?${query.toString()}`);
  return response.recommendations;
}

export async function fetchLocaleCalibration(locale: LocaleCode): Promise<LocaleCalibrationResponse> {
  const query = new URLSearchParams({ locale });
  return getJson<LocaleCalibrationResponse>(`/api/locale-calibration?${query.toString()}`);
}
