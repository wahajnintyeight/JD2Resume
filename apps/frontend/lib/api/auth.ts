import { apiFetch } from './client';

export type AuthProvider = 'google' | string;

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  provider: AuthProvider;
}

export async function fetchAuthMe(): Promise<AuthUser | null> {
  const res = await apiFetch('/auth/me', { credentials: 'include' });

  if (res.status === 401) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to fetch auth status (status ${res.status})`);
  }

  const payload = (await res.json()) as { user: AuthUser | null };
  return payload.user ?? null;
}

export async function logout(): Promise<void> {
  const res = await apiFetch('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    // Ignore logout errors; session cookie may already be gone.
    return;
  }
}
