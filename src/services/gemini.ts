import { Message, Task, AssessmentResult } from "../types";

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

export async function chatWithExecutiveLLM(messages: Message[], task: Task): Promise<Message[]> {
  return postJson<Message[]>("/api/chat", { messages, task });
}

export async function evaluateTranscript(messages: Message[], task: Task): Promise<AssessmentResult> {
  return postJson<AssessmentResult>("/api/evaluate", { messages, task });
}
