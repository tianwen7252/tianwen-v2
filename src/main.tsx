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

// Initialize i18n before rendering (side-effect import)
import './lib/i18n'

// Prevent pinch-to-zoom on iPad (Safari ignores viewport meta for gestures)
document.addEventListener('gesturestart', e => e.preventDefault())
document.addEventListener('gesturechange', e => e.preventDefault())
document.addEventListener('gestureend', e => e.preventDefault())

// Prevent double-tap zoom
// comment this out since it prevents the button from being clicked repeatedly.
// document.addEventListener(
//   'touchend',
//   (e) => {
//     if (e.touches.length > 0) return
//     const now = Date.now()
//     const DOUBLE_TAP_THRESHOLD = 300
//     const lastTouch = (document as unknown as Record<string, number>)
//       .__lastTouchEnd ?? 0
//     if (now - lastTouch < DOUBLE_TAP_THRESHOLD) {
//       e.preventDefault()
//     }
//     ;(document as unknown as Record<string, number>).__lastTouchEnd = now
//   },
//   { passive: false },
// )

import './styles/globals.css'
import { router } from './routes/router'

// Request persistent storage for OPFS protection (fire-and-forget)
requestStoragePersistence()

if (import.meta.env.DEV) {
  logStorageEstimate()
}

const rootElement = document.getElementById('root')!

// ─── Dev-mode DB reset ──────────────────────────────────────────────────────

const FORCE_RESET_KEY = 'FORCE_RESET_DB'

// ─── Initialize SQLite WASM database via Web Worker, then render the app ───

async function bootstrap() {
  const forceReset = localStorage.getItem(FORCE_RESET_KEY) === '1'
  if (forceReset) localStorage.removeItem(FORCE_RESET_KEY)

  const worker = new Worker(new URL('./lib/db-worker.ts', import.meta.url), {
    type: 'module',
  })

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

  createRoot(rootElement).render(
    <StrictMode>
      <QueryProvider>
        <RouterProvider router={router} />
        <Toaster />
      </QueryProvider>
    </StrictMode>,
  )
}

bootstrap().catch(err => {
  const msg = err instanceof Error ? err.message : String(err)

  const container = document.createElement('div')
  container.style.cssText =
    'padding:2rem;font-family:monospace;display:flex;flex-direction:column;gap:1rem;'

  const p = document.createElement('p')
  p.textContent = `Failed to initialize database: ${msg}`
  container.appendChild(p)

  if (import.meta.env.DEV) {
    const btn = document.createElement('button')
    btn.textContent = '重置資料庫'
    btn.style.cssText =
      'padding:0.5rem 1rem;background:#ef4444;color:#fff;border:none;border-radius:0.375rem;font-size:1rem;cursor:pointer;width:fit-content;'
    btn.addEventListener('click', () => {
      localStorage.setItem(FORCE_RESET_KEY, '1')
      location.reload()
    })
    container.appendChild(btn)
  }

  rootElement.replaceChildren(container)
})
