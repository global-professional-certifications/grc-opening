export interface StoredUser {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  headline?: string;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem('grc_token');
}

export function setToken(token: string): void {
  localStorage.setItem('grc_token', token);
}

export function getStoredUser(): StoredUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem('grc_user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem('grc_user', JSON.stringify(user));
}

export function isFirstLogin(userId: string): boolean {
  return !localStorage.getItem(`grc_visited_${userId}`);
}

export function markVisited(userId: string): void {
  localStorage.setItem(`grc_visited_${userId}`, '1');
}

export function clearProfileCache(userId: string): void {
  localStorage.removeItem(`grc_profile_${userId}`);
}

export function logout(): void {
  const user = getStoredUser();
  localStorage.removeItem('grc_token');
  localStorage.removeItem('grc_user');
  if (user?.id) {
    clearProfileCache(user.id);
  }
}
