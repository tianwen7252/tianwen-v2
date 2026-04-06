import { create } from 'zustand'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Google user profile info returned after OAuth login */
export interface GoogleUser {
  readonly sub: string
  readonly name: string
  readonly email: string
  readonly picture?: string
}

/**
 * Global app store — UI state that doesn't belong to a specific feature.
 * Feature-specific state (employees, orders, etc.) should use
 * separate stores or TanStack Query.
 */
interface AppState {
  /** Currently authenticated Google user (null = not logged in) */
  readonly googleUser: GoogleUser | null
  /** Whether the app is in admin mode */
  readonly isAdmin: boolean
  /** Google OAuth access token for API calls (e.g., Drive) */
  readonly accessToken: string | null

  /** Global font size, same as var(--font-size) */
  readonly fontSize: number

  // Legacy compatibility
  /** @deprecated Use googleUser instead */
  readonly currentEmployeeId: string | null
}

interface AppActions {
  setGoogleUser: (
    user: GoogleUser,
    accessToken: string,
    isAdmin: boolean,
  ) => void
  /** @deprecated Use setGoogleUser instead */
  setCurrentEmployee: (employeeId: string | null, isAdmin: boolean) => void
  logout: () => void
}

// ─── Persistence ─────────────────────────────────────────────────────────────

const STORAGE_KEY_USER = 'admin-info'
const STORAGE_KEY_TOKEN = 'gapi-token'
const STORAGE_KEY_LOGIN_AT = 'login-at'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 1 day

/**
 * Checks whether the stored login timestamp is still within the valid
 * session window (7 days). Returns false if no timestamp exists or if
 * the session has expired. Does not modify localStorage.
 */
export function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGIN_AT)
    if (raw === null) return false
    const loginAt = Number(raw)
    if (!Number.isFinite(loginAt)) return false
    return Date.now() - loginAt < SESSION_DURATION_MS
  } catch {
    return false
  }
}

function loadPersistedUser(): {
  user: GoogleUser | null
  token: string | null
} {
  try {
    if (!isSessionValid()) {
      // Clear stale data so the next login starts fresh
      localStorage.removeItem(STORAGE_KEY_USER)
      localStorage.removeItem(STORAGE_KEY_TOKEN)
      localStorage.removeItem(STORAGE_KEY_LOGIN_AT)
      return { user: null, token: null }
    }

    const userJson = localStorage.getItem(STORAGE_KEY_USER)
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    if (userJson && token) {
      return { user: JSON.parse(userJson) as GoogleUser, token }
    }
  } catch {
    // Ignore storage errors
  }
  return { user: null, token: null }
}

function persistUser(user: GoogleUser, token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
    localStorage.setItem(STORAGE_KEY_TOKEN, token)
    localStorage.setItem(STORAGE_KEY_LOGIN_AT, String(Date.now()))
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_LOGIN_AT)
  } catch {
    // Ignore storage errors
  }
}

// ─── Admin whitelist (V1 compatible) ────────────────────────────────────────

export const ADMIN_SUBS = [
  '112232479673923380065', // Tianwen
  '108824661831026509560', // dev
] as const

/** Tianwen (owner) Google sub ID */
export const TIANWEN_SUB = ADMIN_SUBS[0]

export function isAdminUser(sub: string): boolean {
  return (ADMIN_SUBS as readonly string[]).includes(sub)
}

// ─── Store ───────────────────────────────────────────────────────────────────

const persisted = loadPersistedUser()

export const useAppStore = create<AppState & AppActions>(set => ({
  googleUser: persisted.user,
  accessToken: persisted.token,
  isAdmin: persisted.user ? isAdminUser(persisted.user.sub) : false,
  currentEmployeeId: persisted.user?.sub ?? null,
  fontSize: 18,
  setGoogleUser: (user, accessToken, isAdmin) => {
    persistUser(user, accessToken)
    set({
      googleUser: user,
      accessToken,
      isAdmin,
      currentEmployeeId: user.sub,
    })
  },

  setCurrentEmployee: (employeeId, isAdmin) =>
    set({ currentEmployeeId: employeeId, isAdmin }),

  logout: () => {
    clearPersistedUser()
    set({
      googleUser: null,
      accessToken: null,
      isAdmin: false,
      currentEmployeeId: null,
    })
  },
}))
