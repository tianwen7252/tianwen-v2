/**
 * Screenshot journey for the Tianwen V2 user training manual.
 * Captures ~58 screenshots across 6 sections.
 *
 * Sections:
 *   00 — 首次設定 (6 shots)
 *   10 — 點餐操作 (14 shots)
 *   20 — 打卡與出勤 (8 shots)
 *   30 — 管理功能  (12 shots)
 *   40 — 雲端備份  (12 shots)
 *   90 — 疑難排解  (6 shots)
 *
 * Run with:
 *   pnpm exec playwright test tests/screenshots/user-guide.spec.ts --project=ipad-11
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import path from 'path'

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE = 'docs/user-guide/screenshots'

// Admin user injected via localStorage — matches ADMIN_SUBS in app-store.ts
const FAKE_ADMIN = {
  sub: '104772046405393920960',
  name: 'Eric (Test)',
  email: 'eric@test.local',
}
const FAKE_ACCESS_TOKEN = 'fake-access-token-for-screenshots'

// ─── Store injection script ───────────────────────────────────────────────────
//
// Vite bundles ESM modules in dev mode. The Zustand stores are module
// singletons. We capture them on window.__stores via an init-script that
// monkey-patches the module-system-exposed stores AFTER the app loads.
// The reliable way: inject stores onto window inside page.evaluate AFTER
// the React app has mounted — by the time we call evaluate, Vite's
// module registry has the stores in memory. We reach them via the Vite
// module registry (__vite__mapDeps / import.meta.glob is not available
// in evaluate). Instead we use a small trick: we request the store module
// via dynamic import inside evaluate, which in Vite dev hits the same
// singleton because modules are cached.

const STORE_INIT_SCRIPT = `
  // Expose stores on window for test use
  // Called once after app mounts to make stores accessible to page.evaluate()
  async function exposeStores() {
    try {
      // Dynamic import in the page context hits Vite's module cache
      const initStoreMod = await import('/src/stores/init-store.ts');
      window.__initStore = initStoreMod.useInitStore;
      const appStoreMod = await import('/src/stores/app-store.ts');
      window.__appStore = appStoreMod.useAppStore;
    } catch(e) {
      // If direct TS import doesn't work (prod build), stores won't be available
    }
  }
  exposeStores();
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Save screenshot to docs/user-guide/screenshots/{section}/{id}.png */
async function shot(page: Page, section: string, id: string): Promise<void> {
  const filePath = path.join(BASE, section, `${id}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
}

/** Inject admin auth directly into localStorage before app mounts */
async function injectAdminAuth(page: Page): Promise<void> {
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem('admin-info', JSON.stringify(user))
      localStorage.setItem('gapi-token', token)
      localStorage.setItem('login-at', String(Date.now()))
    },
    { user: FAKE_ADMIN, token: FAKE_ACCESS_TOKEN },
  )
}

/**
 * Seed default employees into the DB via dynamic import.
 * The db-worker does NOT seed employees on bootstrap (by design) —
 * they are only seeded from the dev test-data page. For screenshots
 * we call insertDefaultEmployeesAsync directly after bootstrap.
 */
async function seedDefaultEmployees(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      const { insertDefaultEmployeesAsync } = await import('/src/lib/default-data.ts')
      const { getDatabase } = await import('/src/lib/repositories/provider.ts')
      const db = getDatabase()
      await insertDefaultEmployeesAsync(db)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[seedDefaultEmployees] failed:', e)
    }
  })
}

/**
 * Navigate to a page, bootstrap, seed employees, reload so UI picks them up.
 * Within a single Playwright test, OPFS persists across reloads, so the
 * second bootstrap finds the DB already exists and goes straight to content.
 */
async function gotoWithEmployees(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await waitForBootstrap(page)
  await seedDefaultEmployees(page)
  // Reload so the UI picks up the newly-seeded employees
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForBootstrap(page)
  // Wait for employee cards to render (they are div[role="button"], not <button>)
  await page.waitForSelector('[data-testid="employee-card"]', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(500)
}

/** Wait for the app bootstrap (SQLite WASM + OPFS) to finish.
 *  Polls for the absence of the init-spinner or the presence of nav links.
 *  Automatically retries once if the error overlay appears (transient OPFS error). */
async function waitForBootstrap(page: Page, retries = 2): Promise<void> {
  // Wait up to 30s for the nav to appear
  await page.waitForSelector('header nav, header a', { timeout: 30_000 })
  // If the spinner is still visible, wait until it disappears
  const spinner = page.locator('[data-testid="init-spinner"]')
  try {
    if (await spinner.isVisible({ timeout: 2000 })) {
      await spinner.waitFor({ state: 'hidden', timeout: 30_000 })
    }
  } catch {
    // spinner may not exist
  }
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  // Detect transient OPFS/SQLite errors (error overlay with h1="ERROR")
  // and retry — the lock contention may resolve after a brief pause.
  const errorHeading = page.locator('h1').filter({ hasText: /^ERROR$/ })
  const headingVisible = await errorHeading.isVisible({ timeout: 500 }).catch(() => false)
  if (headingVisible && retries > 0) {
    // Wait for OPFS to settle, then reload the page in the same context
    await page.waitForTimeout(3000)
    await page.goto(page.url(), { waitUntil: 'domcontentloaded' })
    return waitForBootstrap(page, retries - 1)
  }
}

/** Expose Zustand stores on window.__initStore / __appStore via dynamic import */
async function exposeStores(page: Page): Promise<void> {
  await page.evaluate(async () => {
    try {
      const initMod = await import('/src/stores/init-store.ts')
      ;(window as typeof window & { __initStore: unknown }).
        __initStore = initMod.useInitStore
    } catch {
      // Dev TS import may not work in all configs — ignore
    }
    try {
      const appMod = await import('/src/stores/app-store.ts')
      ;(window as typeof window & { __appStore: unknown }).
        __appStore = appMod.useAppStore
    } catch {
      // Ignore
    }
  })
}

/** Call setForceWaitingUI(true) on the init store if accessible */
async function forceWaitingUI(page: Page, enabled: boolean): Promise<void> {
  await exposeStores(page)
  await page.evaluate((en) => {
    const w = window as typeof window & {
      __initStore?: { getState: () => { setForceWaitingUI: (v: boolean) => void } }
    }
    w.__initStore?.getState().setForceWaitingUI(en)
  }, enabled)
}

/** Call setForceInitUI(true) on the init store if accessible */
async function forceInitUI(page: Page, enabled: boolean): Promise<void> {
  await exposeStores(page)
  await page.evaluate((en) => {
    const w = window as typeof window & {
      __initStore?: { getState: () => { setForceInitUI: (v: boolean) => void } }
    }
    w.__initStore?.getState().setForceInitUI(en)
  }, enabled)
}

/** Trigger error overlay via setErrorOverlayType */
async function setErrorOverlay(
  page: Page,
  type: '404' | 'error' | null,
  message?: string,
): Promise<void> {
  await exposeStores(page)
  await page.evaluate(
    ({ t, m }) => {
      const w = window as typeof window & {
        __initStore?: {
          getState: () => {
            setErrorOverlayType: (
              type: '404' | 'error' | null,
              message?: string,
            ) => void
          }
        }
      }
      w.__initStore?.getState().setErrorOverlayType(t, m)
    },
    { t: type, m: message },
  )
}

// ─── Section 00 — 首次設定 ────────────────────────────────────────────────────

test.describe.serial('00 — 首次設定', () => {
  test('00-01: InitOverlay during bootstrap', async ({ page }) => {
    // Start navigation and immediately watch for the init overlay
    const gotoPromise = page.goto('/', { waitUntil: 'commit' })

    // Attempt to capture the init overlay before bootstrap completes
    await page.waitForTimeout(600)
    const spinner = page.locator('[data-testid="init-spinner"]')

    try {
      if (await spinner.isVisible({ timeout: 3000 })) {
        await shot(page, '00', '00-01')
      } else {
        throw new Error('spinner not visible')
      }
    } catch {
      // Bootstrap was too fast — use forceInitUI fallback
      await gotoPromise
      await waitForBootstrap(page)
      await forceInitUI(page, true)
      await page.waitForTimeout(1000)
      await shot(page, '00', '00-01')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      return
    }

    await gotoPromise
  })

  test('00-02: OrderPage main view after bootstrap', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await shot(page, '00', '00-02')
  })

  test('00-03: AppHeader navigation bar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
    await shot(page, '00', '00-03')
  })

  test('00-04: AppHeader user menu expanded', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(500)
    // The user menu button is the last interactive element in the header
    // (HeaderUserMenu component — contains user avatar or person icon)
    const header = page.locator('header')
    const buttons = header.locator('button')
    const btnCount = await buttons.count()
    if (btnCount > 0) {
      await buttons.last().click()
      await page.waitForTimeout(700)
    }
    await shot(page, '00', '00-04')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('00-05: Settings page tab navigation', async ({ page }) => {
    await page.goto('/settings/system-info', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await shot(page, '00', '00-05')
  })

  test('00-06: ClockInPage with employee cards (overview)', async ({ page }) => {
    await gotoWithEmployees(page, '/clock-in')
    await page.waitForTimeout(400)
    await shot(page, '00', '00-06')
  })
})

// ─── Section 10 — 點餐操作 ────────────────────────────────────────────────────

test.describe.serial('10 — 點餐操作', () => {
  // Allow time for previous section's OPFS/SQLite contexts to release fully
  test.beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000))
  })

  /** Add N products from the grid (first N cards) */
  async function addProductsToCart(page: Page, count: number): Promise<void> {
    await page.waitForSelector('.grid', { timeout: 10_000 })
    const cards = page.locator('.grid > *')
    const total = await cards.count()
    const toAdd = Math.min(count, total)
    for (let i = 0; i < toAdd; i++) {
      await cards.nth(i).click()
      await page.waitForTimeout(300)
    }
  }

  test('10-01: ProductGrid full view', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await page.waitForSelector('.grid', { timeout: 10_000 })
    await page.waitForTimeout(500)
    await shot(page, '10', '10-01')
  })

  test('10-02: Category tabs (different category selected)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await page.waitForSelector('.grid', { timeout: 10_000 })
    // Try to click "單點" tab
    const singleTab = page
      .locator('button, [role="tab"]')
      .filter({ hasText: '單點' })
      .first()
    if (await singleTab.isVisible({ timeout: 3000 })) {
      await singleTab.click()
      await page.waitForTimeout(500)
    }
    await shot(page, '10', '10-02')
  })

  test('10-03: Add first item to cart', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(600)
    await shot(page, '10', '10-03')
  })

  test('10-04: Quantity adjustment — add same item twice', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await page.waitForSelector('.grid', { timeout: 10_000 })
    // Click the same card twice to bump quantity to 2
    const firstCard = page.locator('.grid > *').first()
    await firstCard.click()
    await page.waitForTimeout(300)
    await firstCard.click()
    await page.waitForTimeout(600)
    await shot(page, '10', '10-04')
  })

  test('10-05: Multiple items in cart', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 3)
    await page.waitForTimeout(600)
    await shot(page, '10', '10-05')
  })

  test('10-06: Item note input in cart row', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    // Cart item rows show an inline note input or a note icon/button
    const noteInput = page.locator('input[placeholder*="備註"], input[placeholder*="note"]').first()
    if (await noteInput.isVisible({ timeout: 2000 })) {
      await noteInput.fill('不加蛋')
      await page.waitForTimeout(400)
    } else {
      // Look for a pencil/edit icon next to the cart item
      const editIcon = page.locator('[aria-label*="備註"], [aria-label*="note"], [aria-label*="edit"]').first()
      if (await editIcon.isVisible({ timeout: 2000 })) {
        await editIcon.click()
        await page.waitForTimeout(400)
        const popupInput = page.locator('input, textarea').last()
        if (await popupInput.isVisible({ timeout: 1000 })) {
          await popupInput.fill('不加蛋')
          await page.waitForTimeout(400)
        }
      }
    }
    await shot(page, '10', '10-06')
  })

  test('10-07: Open calculator overlay', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await page.waitForSelector('.grid', { timeout: 10_000 })
    const calcBtn = page.locator('button[aria-label="計算機"]').first()
    await expect(calcBtn).toBeVisible({ timeout: 5000 })
    await calcBtn.click()
    await page.waitForTimeout(800)
    await shot(page, '10', '10-07')
  })

  test('10-08: Calculator with numeric input', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await page.waitForSelector('.grid', { timeout: 10_000 })
    const calcBtn = page.locator('button[aria-label="計算機"]').first()
    await expect(calcBtn).toBeVisible({ timeout: 5000 })
    await calcBtn.click()
    await page.waitForTimeout(800)
    // Type 150 using physical keyboard
    await page.keyboard.press('1')
    await page.keyboard.press('5')
    await page.keyboard.press('0')
    await page.waitForTimeout(400)
    await shot(page, '10', '10-08')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('10-09: Cart with discount (negative calculator entry)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    const calcBtn = page.locator('button[aria-label="計算機"]').first()
    await calcBtn.click()
    await page.waitForTimeout(600)
    // Enter -50 for a discount
    await page.keyboard.press('Minus')
    await page.keyboard.press('5')
    await page.keyboard.press('0')
    await page.waitForTimeout(400)
    // Submit via calculator submit button
    const submitCalcBtn = page.locator('button').filter({ hasText: '確定送出' }).first()
    if (await submitCalcBtn.isVisible({ timeout: 2000 })) {
      await submitCalcBtn.click()
      await page.waitForTimeout(600)
    } else {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
    await shot(page, '10', '10-09')
  })

  test('10-10: Submit order confirmation modal', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    // Disable quick submit so the confirmation modal appears
    const quickSwitch = page.locator('[role="switch"], input[type="checkbox"]').first()
    if (await quickSwitch.isVisible({ timeout: 2000 })) {
      const checked = await quickSwitch.getAttribute('aria-checked')
      if (checked === 'true') {
        await quickSwitch.click()
        await page.waitForTimeout(400)
      }
    }
    const submitBtn = page.locator('button').filter({ hasText: '送出訂單' }).first()
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click()
      await page.waitForTimeout(600)
    }
    await shot(page, '10', '10-10')
    // Dismiss confirm if modal appeared
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('10-11: Order success toast', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    const submitBtn = page.locator('button').filter({ hasText: '送出訂單' }).first()
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click()
      await page.waitForTimeout(500)
      // Accept confirm if it appears
      const confirmBtn = page.locator('button').filter({ hasText: '確認送出' }).first()
      if (await confirmBtn.isVisible({ timeout: 1500 })) {
        await confirmBtn.click()
      }
      await page.waitForTimeout(1000)
    }
    await shot(page, '10', '10-11')
  })

  test('10-12: Recent orders tab', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    // Submit an order first
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    const submitBtn = page.locator('button').filter({ hasText: '送出訂單' }).first()
    if (await submitBtn.isVisible({ timeout: 3000 })) {
      await submitBtn.click()
      await page.waitForTimeout(400)
      const confirmBtn = page.locator('button').filter({ hasText: '確認送出' }).first()
      if (await confirmBtn.isVisible({ timeout: 1500 })) {
        await confirmBtn.click()
        await page.waitForTimeout(500)
      }
    }
    // Switch to recent orders tab
    const recentTab = page.locator('[role="tab"]').filter({ hasText: '近期訂單' }).first()
    await expect(recentTab).toBeVisible({ timeout: 5000 })
    await recentTab.click()
    await page.waitForTimeout(1000)
    await shot(page, '10', '10-12')
  })

  test('10-13: Edit order from recent orders (swipe to reveal actions)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    // Submit an order first (quickSubmit=true by default, no confirm modal)
    await addProductsToCart(page, 2)
    await page.waitForTimeout(400)
    const submitBtn = page.locator('button').filter({ hasText: /送出訂單/ }).first()
    await submitBtn.click()
    await page.waitForTimeout(1500)
    // Switch to 近期訂單 tab
    const recentTab = page.locator('[role="tab"]').filter({ hasText: '近期訂單' }).first()
    if (await recentTab.isVisible({ timeout: 3000 })) {
      await recentTab.click()
      await page.waitForTimeout(1000)
    }
    // Swipe left on the first order card to reveal edit/delete actions
    const orderCard = page.locator('[data-testid="order-history-card"]').first()
    if (await orderCard.isVisible({ timeout: 3000 })) {
      const box = await orderCard.boundingBox()
      if (box) {
        // Simulate swipe-left gesture
        await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 15 })
        await page.mouse.up()
        await page.waitForTimeout(600)
      }
    }
    await shot(page, '10', '10-13')
  })

  test('10-14: Order marked as 已送餐', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    // Submit an order (quick mode)
    await addProductsToCart(page, 1)
    await page.waitForTimeout(400)
    const submitBtn = page.locator('button').filter({ hasText: /送出訂單/ }).first()
    await submitBtn.click()
    await page.waitForTimeout(1500)
    // Switch to 近期訂單 tab
    const recentTab = page.locator('[role="tab"]').filter({ hasText: '近期訂單' }).first()
    if (await recentTab.isVisible({ timeout: 3000 })) {
      await recentTab.click()
      await page.waitForTimeout(1000)
    }
    // Tap the order card to toggle served status (onTap → toggleServed)
    const orderCard = page.locator('[data-testid="order-history-card"]').first()
    if (await orderCard.isVisible({ timeout: 3000 })) {
      await orderCard.click()
      await page.waitForTimeout(800)
    }
    // Now the card should have bg-[#f0f5ed] (served state)
    await shot(page, '10', '10-14')
  })
})

// ─── Section 20 — 打卡與出勤 ──────────────────────────────────────────────────

test.describe.serial('20 — 打卡與出勤', () => {
  /** Helper: navigate to /clock-in, seed employees, reload to render cards */
  async function gotoClockInReady(page: Page) {
    await gotoWithEmployees(page, '/clock-in')
  }

  test('20-01: ClockInPage — employee cards grid', async ({ page }) => {
    await gotoClockInReady(page)
    await page.waitForTimeout(400)
    await shot(page, '20', '20-01')
  })

  test('20-02: Click employee card → attendance modal', async ({ page }) => {
    await gotoClockInReady(page)
    const employeeCard = page
      .locator('button')
      .filter({ hasText: 'Eric' })
      .first()
    if (await employeeCard.isVisible({ timeout: 5000 })) {
      await employeeCard.click()
    } else {
      // Fallback: click any card in the grid
      const gridCard = page.locator('.grid > *').first()
      if (await gridCard.isVisible({ timeout: 3000 })) {
        await gridCard.click()
      }
    }
    await page.waitForTimeout(800)
    await shot(page, '20', '20-02')
  })

  test('20-03: Clock-in confirmation state', async ({ page }) => {
    await gotoClockInReady(page)
    // Open modal for Eric
    const employeeCard = page.locator('button').filter({ hasText: 'Eric' }).first()
    if (await employeeCard.isVisible({ timeout: 5000 })) {
      await employeeCard.click()
      await page.waitForTimeout(500)
      // Click clock-in / 上班 button
      const clockInBtn = page.locator('button').filter({ hasText: '上班' }).first()
      if (await clockInBtn.isVisible({ timeout: 2000 })) {
        await clockInBtn.click()
        await page.waitForTimeout(800)
      }
    }
    await shot(page, '20', '20-03')
  })

  test('20-04: Employee shows clocked-in state after successful clock-in', async ({ page }) => {
    await gotoClockInReady(page)
    // Clock in Eric so his card shows "正在上班" state
    const ericCard = page.locator('[data-testid="employee-card"]').filter({ hasText: 'Eric' }).first()
    await ericCard.click()
    const clockInBtn = page.locator('button').filter({ hasText: '確認打卡' })
    await clockInBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    if (await clockInBtn.isVisible()) {
      await clockInBtn.click()
      await page.waitForTimeout(2000)
    }
    // Now Eric's card should show clocked-in state with arrival time
    await shot(page, '20', '20-04')
  })

  test('20-05: Clock-out flow (clock-in first, then open clock-out modal)', async ({ page }) => {
    await gotoClockInReady(page)
    // Step 1: Click Eric's card (div role="button" data-testid="employee-card")
    const ericCard = page.locator('[data-testid="employee-card"]').filter({ hasText: 'Eric' }).first()
    await ericCard.click()
    // Step 2: Wait for modal with "確認打卡" button, then click it
    const clockInBtn = page.locator('button, [role="button"]').filter({ hasText: '確認打卡' }).first()
    await clockInBtn.waitFor({ state: 'visible', timeout: 5000 })
    await clockInBtn.click()
    // Step 3: Wait for modal to close + DB refresh + toast
    await page.waitForTimeout(2500)
    // Step 4: Click Eric again — now should show clock-out modal
    await ericCard.click()
    await page.waitForTimeout(1000)
    await shot(page, '20', '20-05')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('20-06: Leave/vacation request — show 休假 confirmation modal', async ({ page }) => {
    test.setTimeout(60_000)
    await gotoClockInReady(page)
    // The "休假" button is INSIDE the employee card (not in modal).
    // For an employee with no records, the card shows two buttons: "打卡上班" + "休假".
    // Click the 休假 button directly on 妞妞's card to open vacation confirm modal.
    const niuniuCard = page.locator('[data-testid="employee-card"]').filter({ hasText: '妞妞' }).first()
    const vacBtn = niuniuCard.locator('button').filter({ hasText: '休假' })
    await vacBtn.waitFor({ state: 'visible', timeout: 5000 })
    await vacBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, '20', '20-06')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('20-07: Attendance records list/calendar', async ({ page }) => {
    await page.goto('/settings/records', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(1500)
    await shot(page, '20', '20-07')
  })

  test('20-08: Attendance records page (Settings → records tab)', async ({ page }) => {
    // Seed employees first, then navigate to records via settings
    await gotoWithEmployees(page, '/')
    // Navigate to records tab within settings
    await page.goto('/settings/records', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(1500)
    await shot(page, '20', '20-08')
  })
})

// ─── Section 30 — 管理功能 ────────────────────────────────────────────────────

test.describe.serial('30 — 管理功能', () => {
  /** Go to a URL with admin auth injected into localStorage */
  async function gotoAsAdmin(page: Page, url: string): Promise<void> {
    // First visit the root to set localStorage on the correct origin
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await injectAdminAuth(page)
    // Now navigate to the target URL (store will rehydrate from localStorage)
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
  }

  test('30-01: Settings page overview (system-info tab)', async ({ page }) => {
    await page.goto('/settings/system-info', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(800)
    await shot(page, '30', '30-01')
  })

  test('30-02: Staff admin — employee list', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/staff-admin')
    await shot(page, '30', '30-02')
  })

  test('30-03: Add employee form', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/staff-admin')
    const addBtn = page
      .locator('button')
      .filter({ hasText: /新增|Add/ })
      .first()
    if (await addBtn.isVisible({ timeout: 5000 })) {
      await addBtn.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '30', '30-03')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('30-04: Edit employee form', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/staff-admin')
    // Find edit icon — aria-label may include "edit", "編輯", or similar
    const editBtn = page
      .locator('button[aria-label*="edit" i], button[aria-label*="編輯"]')
      .first()
    if (await editBtn.isVisible({ timeout: 3000 })) {
      await editBtn.click()
      await page.waitForTimeout(700)
    } else {
      // Try clicking the employee row itself
      const empRow = page
        .locator('tr:nth-child(2), [class*="employee-row"], [class*="staff-row"]')
        .first()
      if (await empRow.isVisible({ timeout: 2000 })) {
        await empRow.click()
        await page.waitForTimeout(700)
      }
    }
    await shot(page, '30', '30-04')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('30-05: Delete employee confirmation modal', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/staff-admin')
    const deleteBtn = page
      .locator('button[aria-label*="delete" i], button[aria-label*="刪除"]')
      .first()
    if (await deleteBtn.isVisible({ timeout: 3000 })) {
      await deleteBtn.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '30', '30-05')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('30-06: Google OAuth "Link Google" button (entrance only)', async ({ page }) => {
    // Caption: "點擊此按鈕後會出現 Google 登入畫面"
    await gotoAsAdmin(page, '/settings/staff-admin')
    // Find the Google login button — do NOT click it
    const googleBtn = page
      .locator('button')
      .filter({ hasText: /Google|綁定|登入/ })
      .first()
    if (await googleBtn.isVisible({ timeout: 5000 })) {
      await googleBtn.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
    }
    await shot(page, '30', '30-06')
  })

  test('30-07: Product management — commodity type tabs and list', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/product-management')
    await page.waitForTimeout(600)
    await shot(page, '30', '30-07')
  })

  test('30-08: Edit commodity modal', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/product-management')
    await page.waitForTimeout(600)
    // Click on a commodity item to open edit modal
    const item = page
      .locator('button, [class*="card"], [class*="commodity"], [class*="item"]')
      .first()
    if (await item.isVisible({ timeout: 3000 })) {
      await item.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '30', '30-08')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('30-09: Product management list close-up', async ({ page }) => {
    await gotoAsAdmin(page, '/settings/product-management')
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollBy(0, 200))
    await page.waitForTimeout(600)
    await shot(page, '30', '30-09')
  })

  test('30-10: Analytics dashboard full view', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(2000)
    await shot(page, '30', '30-10')
  })

  test('30-11: Analytics date range or filter section', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(1200)
    // Click any date picker or filter control
    const datePicker = page
      .locator('button, input[type="date"]')
      .filter({ hasText: /日期|今日|本週|本月|date/ })
      .first()
    if (await datePicker.isVisible({ timeout: 3000 })) {
      await datePicker.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '30', '30-11')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('30-12: Analytics chart close-up', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(2000)
    // Scroll down to the chart area
    await page.evaluate(() => window.scrollBy(0, 400))
    await page.waitForTimeout(800)
    await shot(page, '30', '30-12')
  })
})

// ─── Section 40 — 雲端備份 ────────────────────────────────────────────────────

test.describe.serial('40 — 雲端備份', () => {
  const MOCK_BACKUPS = [
    {
      filename: 'tianwen-backup-2026-04-10_08-00-00.sqlite.gz',
      size: 2457600,
      createdAt: '2026-04-10T08:00:00.000Z',
      deviceName: 'iPad-Main',
    },
    {
      filename: 'tianwen-backup-2026-04-09_08-00-00.sqlite.gz',
      size: 2359296,
      createdAt: '2026-04-09T08:00:00.000Z',
      deviceName: 'iPad-Main',
    },
    {
      filename: 'tianwen-backup-2026-04-08_08-00-00.sqlite.gz',
      size: 2260992,
      createdAt: '2026-04-08T08:00:00.000Z',
      deviceName: 'iPad-Main',
    },
  ]

  async function gotoCloudBackup(page: Page): Promise<void> {
    // Set auth before navigation
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await injectAdminAuth(page)

    // Mock the backup API
    await page.route('**/api/backup**', async (route) => {
      const method = route.request().method()
      const url = route.request().url()

      // GET /api/backup/list → return fake list
      if (method === 'GET' || url.includes('list')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_BACKUPS }),
        })
      } else {
        // POST (manual backup) → return success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    await page.goto('/settings/cloud-backup', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(1200)
  }

  test('40-01: Cloud backup status panel overview', async ({ page }) => {
    await gotoCloudBackup(page)
    await shot(page, '40', '40-01')
  })

  test('40-02: Backup schedule picker', async ({ page }) => {
    await gotoCloudBackup(page)
    // Scroll to reveal schedule options
    await page.evaluate(() => window.scrollBy(0, 300))
    await page.waitForTimeout(600)
    await shot(page, '40', '40-02')
  })

  test('40-03: Manual backup button area', async ({ page }) => {
    await gotoCloudBackup(page)
    // Scroll to action buttons area
    await page.evaluate(() => window.scrollBy(0, 250))
    await page.waitForTimeout(600)
    const backupBtn = page
      .locator('button')
      .filter({ hasText: /立即備份|手動備份|備份/ })
      .first()
    if (await backupBtn.isVisible({ timeout: 3000 })) {
      await backupBtn.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
    }
    await shot(page, '40', '40-03')
  })

  test('40-04: Cloud backup complete state (overview)', async ({ page }) => {
    await gotoCloudBackup(page)
    // Same view as 40-01 but shows "latest backup" info from mock data
    await page.waitForTimeout(600)
    await shot(page, '40', '40-04')
  })

  test('40-05: Cloud backup history list', async ({ page }) => {
    await gotoCloudBackup(page)
    // Scroll down to the history section
    await page.evaluate(() => window.scrollBy(0, 700))
    await page.waitForTimeout(800)
    await shot(page, '40', '40-05')
  })

  test('40-06: Import confirmation modal', async ({ page }) => {
    await gotoCloudBackup(page)
    await page.evaluate(() => window.scrollBy(0, 700))
    await page.waitForTimeout(800)
    const importBtn = page.locator('button').filter({ hasText: '匯入' }).first()
    if (await importBtn.isVisible({ timeout: 5000 })) {
      await importBtn.click()
      await page.waitForTimeout(800)
    }
    await shot(page, '40', '40-06')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('40-07: Import in progress (InitOverlay)', async ({ page }) => {
    await gotoCloudBackup(page)
    // Simulate the import overlay via forceInitUI
    await forceInitUI(page, true)
    await page.waitForTimeout(1200)
    await shot(page, '40', '40-07')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('40-08: Local database stats panel', async ({ page }) => {
    await gotoCloudBackup(page)
    await page.waitForTimeout(600)
    await shot(page, '40', '40-08')
  })

  test('40-09: Tables list — "查看全部" expanded', async ({ page }) => {
    await gotoCloudBackup(page)
    await page.waitForTimeout(600)
    // Look for "查看全部" expand button
    const viewAllBtn = page.locator('button').filter({ hasText: '查看全部' }).first()
    if (await viewAllBtn.isVisible({ timeout: 5000 })) {
      await viewAllBtn.scrollIntoViewIfNeeded()
      await viewAllBtn.click()
      await page.waitForTimeout(600)
    }
    await shot(page, '40', '40-09')
  })

  test('40-10: Delete prev DB confirmation modal', async ({ page }) => {
    await gotoCloudBackup(page)
    // Find delete button near "前次資料庫" section
    // The button uses Trash2 icon (no text label) — look for aria-label or nearby context
    const deleteBtn = page
      .locator('button[aria-label*="刪除"], button[aria-label*="delete" i]')
      .first()
    if (await deleteBtn.isVisible({ timeout: 5000 })) {
      await deleteBtn.scrollIntoViewIfNeeded()
      await deleteBtn.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '40', '40-10')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('40-11: Restore prev DB confirmation modal', async ({ page }) => {
    await gotoCloudBackup(page)
    // Find restore button
    const restoreBtn = page
      .locator('button[aria-label*="還原"], button[aria-label*="restore" i]')
      .first()
    if (await restoreBtn.isVisible({ timeout: 5000 })) {
      await restoreBtn.scrollIntoViewIfNeeded()
      await restoreBtn.click()
      await page.waitForTimeout(700)
    }
    await shot(page, '40', '40-11')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('40-12: V1 import section', async ({ page }) => {
    await gotoCloudBackup(page)
    // Scroll to the bottom (V1 import is the last section)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(800)
    await shot(page, '40', '40-12')
  })
})

// ─── Section 90 — 疑難排解 ────────────────────────────────────────────────────

test.describe.serial('90 — 疑難排解', () => {
  async function gotoReady(page: Page): Promise<void> {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(600)
  }

  test('90-01: ErrorOverlay type="error"', async ({ page }) => {
    await gotoReady(page)
    await setErrorOverlay(page, 'error', '資料庫初始化失敗，請重新整理頁面')
    await page.waitForTimeout(1500)
    await shot(page, '90', '90-01')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('90-02: ErrorOverlay type="404"', async ({ page }) => {
    await gotoReady(page)
    await setErrorOverlay(page, '404')
    await page.waitForTimeout(1500)
    await shot(page, '90', '90-02')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('90-03: InitOverlay — stuck loading state', async ({ page }) => {
    await gotoReady(page)
    await forceInitUI(page, true)
    await page.waitForTimeout(1500)
    await shot(page, '90', '90-03')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })

  test('90-04: SwUpdatePrompt modal', async ({ page }) => {
    await gotoReady(page)
    // The SwUpdatePrompt is driven by the useSwUpdate hook's needRefresh state.
    // We can't easily access the hook's internal setState from outside.
    // Dispatch known events that vite-plugin-pwa uses — best effort.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('vite-plugin-pwa:needRefresh'))
      window.dispatchEvent(new CustomEvent('vite-pwa:needRefresh'))
    })
    await page.waitForTimeout(1500)
    // The modal may or may not appear; capture whatever is visible
    await shot(page, '90', '90-04')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  })

  test('90-05: Backup failed — error state in cloud backup', async ({ page }) => {
    // Show cloud backup page with a failing API to demonstrate error state
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await injectAdminAuth(page)
    // Mock the backup API to return an error
    await page.route('**/api/backup**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: '備份失敗：網路連線逾時' }),
      })
    })
    await page.goto('/settings/cloud-backup', { waitUntil: 'domcontentloaded' })
    await waitForBootstrap(page)
    await page.waitForTimeout(1200)
    await shot(page, '90', '90-05')
  })

  test('90-06: WaitingOverlay — landscape/orientation prompt', async ({ page }) => {
    await gotoReady(page)
    await forceWaitingUI(page, true)
    await page.waitForTimeout(1500)
    await shot(page, '90', '90-06')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  })
})
