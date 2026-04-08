import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryProvider } from './providers/query-provider'
import { Toaster } from '@/components/ui/sonner'
import {
  requestStoragePersistence,
  logStorageEstimate,
} from '@/lib/storage-persist'
import {
  ENABLE_DEFAULT_DATA,
  DELETE_DEFAULT_DATA,
  CLEAR_DB_DATA,
} from '@/constants/default-data'
import {
  shouldResetDefaultData,
  markDefaultDataVersion,
} from '@/lib/default-data'
import {
  createWorkerDatabase,
  initWorkerDb,
  waitForWorkerReady,
} from '@/lib/worker-database'
import { initRepositories } from '@/lib/repositories'
import { installGlobalErrorLogger } from '@/lib/error-logger'
import { useInitStore } from '@/stores/init-store'

// Initialize i18n before rendering (side-effect import)
import './lib/i18n'

// Prevent pinch-to-zoom on iPad (Safari ignores viewport meta for gestures)
document.addEventListener('gesturestart', e => e.preventDefault())
document.addEventListener('gesturechange', e => e.preventDefault())
document.addEventListener('gestureend', e => e.preventDefault())

import './styles/globals.css'
import { router } from './routes/router'

// Sync system dark mode preference to .dark class on <html>.
// This activates the dark theme CSS variables defined in globals.css.
function syncDarkMode() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDark)

  // Update both theme-color metas so the iPadOS PWA status bar matches
  const headerBg = getComputedStyle(document.documentElement)
    .getPropertyValue('--header-bg')
    .trim()
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach(meta => {
      meta.content = headerBg
    })
}
syncDarkMode()
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', syncDarkMode)

// Request persistent storage for OPFS protection (fire-and-forget)
requestStoragePersistence()

if (import.meta.env.DEV) {
  logStorageEstimate()
}

// ─── Timing constants ─────────────────────────────────────────────────────

/** Wait this long before showing init UI (ms) */
const SHOW_DELAY = 1000
/** Once shown, display init UI for at least this long (ms) */
const MIN_DISPLAY = 5000

// ─── DB initialization flag ─────────────────────────────────────────────────

const DB_INITIALIZED_KEY = 'DB_INITIALIZED'
const FORCE_RESET_KEY = 'FORCE_RESET_DB'

/** True if the DB has been successfully initialized at least once before */
const hasInitializedBefore = localStorage.getItem(DB_INITIALIZED_KEY) === '1'

// ─── Render immediately — before DB initialization ──────────────────────────

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster />
    </QueryProvider>
  </StrictMode>,
)

// ─── Bootstrap database asynchronously after render ─────────────────────────

async function bootstrapDatabase(): Promise<void> {
  const forceReset = localStorage.getItem(FORCE_RESET_KEY) === '1'
  if (forceReset) {
    localStorage.removeItem(FORCE_RESET_KEY)
    localStorage.removeItem(DB_INITIALIZED_KEY)
  }

  const worker = new Worker(new URL('./lib/db-worker.ts', import.meta.url), {
    type: 'module',
  })

  // Terminate the worker on page hide so iPad Safari releases OPFS
  // access handles before the next page context (e.g. reload, PWA update)
  // tries to acquire them.
  const handlePageHide = () => worker.terminate()
  window.addEventListener('pagehide', handlePageHide)

  await waitForWorkerReady(worker)
  const resetData = shouldResetDefaultData()
  await initWorkerDb(
    worker,
    ENABLE_DEFAULT_DATA,
    DELETE_DEFAULT_DATA,
    forceReset || CLEAR_DB_DATA,
    resetData,
  )
  markDefaultDataVersion()

  const db = createWorkerDatabase(worker)
  initRepositories(db)
  installGlobalErrorLogger()

  // Mark DB as initialized for future loads
  try { localStorage.setItem(DB_INITIALIZED_KEY, '1') } catch { /* ignore */ }

  // Hydrate backup schedule from DB (async, non-blocking)
  import('@/stores/backup-store').then(m => void m.hydrateBackupScheduleFromDb())
}

// ─── Init UI timing logic ───────────────────────────────────────────────────
// 1. If DB was initialized before → skip init UI entirely (no timer)
// 2. Otherwise: start 1s timer; if bootstrap finishes < 1s → never show
// 3. If 1s elapses and not done → show init UI for at least 5s

const showTimer = hasInitializedBefore
  ? undefined
  : setTimeout(() => {
      if (!useInitStore.getState().bootstrapDone) {
        useInitStore.getState().setShowInitUI(true)
      }
    }, SHOW_DELAY)

bootstrapDatabase()
  .then(() => {
    if (showTimer !== undefined) clearTimeout(showTimer)
    const { showInitUI, shownAt } = useInitStore.getState()

    if (showInitUI && shownAt !== null) {
      // Init UI is visible — keep it for at least MIN_DISPLAY ms
      const elapsed = Date.now() - shownAt
      const remaining = Math.max(0, MIN_DISPLAY - elapsed)
      setTimeout(() => {
        useInitStore.getState().setShowInitUI(false)
        useInitStore.getState().setBootstrapDone()
      }, remaining)
    } else {
      // Fast path — init UI was never shown
      useInitStore.getState().setBootstrapDone()
    }
  })
  .catch((err: unknown) => {
    if (showTimer !== undefined) clearTimeout(showTimer)
    const msg = err instanceof Error ? err.message : String(err)
    useInitStore.getState().setShowInitUI(false)
    useInitStore.getState().setError(msg)
  })
