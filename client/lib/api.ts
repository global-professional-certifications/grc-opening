import { getToken as getStoredToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Clerk's getToken — registered by ClerkTokenRegistrar in _app.tsx so every
// apiFetch call gets a fresh, auto-refreshed Clerk JWT instead of the stale
// copy in localStorage (Clerk tokens expire in ~60 seconds).
let _clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function registerTokenGetter(fn: () => Promise<string | null>): void {
  _clerkTokenGetter = fn;
}

export async function apiFetch<T>(path: string, options?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...fetchOptions } = options || {};

  // Priority: explicit token > Clerk auto-refresh > localStorage fallback
  let actualToken: string | null = token ?? null;
  if (!actualToken) {
    if (_clerkTokenGetter) {
      actualToken = await _clerkTokenGetter();
    }
    // Always fall back to localStorage (used by local auth when Clerk is not active)
    if (!actualToken) {
      actualToken = getStoredToken();
    }
  }

  const isFormData = fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(actualToken ? { Authorization: `Bearer ${actualToken}` } : {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...fetchOptions,
    headers: {
      ...headers,
      ...fetchOptions?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
