import { AuthMeResponse } from '../types';

type ApiError = {
  error?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const data = (await response.json()) as ApiError;
      if (data.error) errorMessage = data.error;
    } catch {
      // Ignore parse errors and keep fallback message.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

export async function fetchCurrentUser(): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/api/auth/me', { method: 'GET' });
}

export async function signUp(email: string, password: string, displayName: string): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

export async function signIn(email: string, password: string): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut(): Promise<{ ok: true }> {
  return request<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
