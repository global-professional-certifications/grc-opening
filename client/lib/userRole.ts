/**
 * userRole.ts
 *
 * Single source of truth for user-role storage and retrieval.
 *
 * Two-layer storage:
 *  - sessionStorage  "grc_pending_role"  ΓÇô set during registration, consumed
 *                                          once after OTP success, then deleted.
 *  - localStorage    "grc_user_role"     ΓÇô written after any successful auth
 *                                          (OTP or login), survives page refresh.
 *
 * Call order for registration:
 *   1. setPendingRole(role)          ΓåÉ in EmployerForm / CandidateForm
 *   2. consumePendingRole()          ΓåÉ in EmailVerificationFlow SuccessScreen
 *      ΓåÆ also calls saveRole() internally so localStorage is populated
 *
 * Call order for login:
 *   1. saveRole(role)                ΓåÉ in LoginForm after successful auth
 */

export type UserRole = "job_seeker" | "employer";

const ROLE_KEY         = "grc_user_role";
const PENDING_ROLE_KEY = "grc_pending_role";

/** Map a role to its post-auth destination. */
export function getDashboardPath(role: UserRole | null): string {
  return role === "employer" ? "/employer/dashboard" : "/dashboard";
}

// ΓöÇΓöÇ Session-scoped (registration flow) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

/**
 * Store the chosen role in sessionStorage so it survives the
 * /verify-email redirect without polluting localStorage prematurely.
 */
export function setPendingRole(role: UserRole): void {
  try {
    sessionStorage.setItem(PENDING_ROLE_KEY, role);
  } catch {
    // Private-browsing environments may block sessionStorage writes.
  }
}

/**
 * Read + delete the pending role. Also writes it to localStorage for
 * persistence (so page-refresh after first login still routes correctly).
 * Returns null if nothing was stored.
 */
export function consumePendingRole(): UserRole | null {
  try {
    const raw = sessionStorage.getItem(PENDING_ROLE_KEY);
    sessionStorage.removeItem(PENDING_ROLE_KEY);
    const role = raw === "employer" || raw === "job_seeker" ? raw : null;
    if (role) saveRole(role);
    return role;
  } catch {
    return null;
  }
}

// ΓöÇΓöÇ Persistent (login + page refresh) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

/** Persist the authenticated role to localStorage. */
export function saveRole(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_KEY, role);
  } catch {
    // Silently ignore if storage is blocked.
  }
}

/** Read the persisted role (survives page refresh). Returns null if absent. */
export function getSavedRole(): UserRole | null {
  try {
    const raw = localStorage.getItem(ROLE_KEY);
    return raw === "employer" || raw === "job_seeker" ? raw : null;
  } catch {
    return null;
  }
}

/** Clear stored role on logout. */
export function clearRole(): void {
  try {
    localStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(PENDING_ROLE_KEY);
  } catch {
    // ignore
  }
}
