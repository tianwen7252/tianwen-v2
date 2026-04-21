/**
 * Tutorial system E2E tests — targets the interactive tutorial flows.
 *
 * PREREQUISITE: `pnpm dev` must be running at https://localhost:5665 before
 * executing this suite. The playwright.config.ts does not start a web server.
 *
 * Run with:
 *   pnpm exec playwright test tests/tutorial.spec.ts --project=ipad-11
 */

import { test, expect } from '@playwright/test'

test.describe('Tutorial system', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for bootstrap — the tutorial launcher button is rendered by the
    // root app shell after the SQLite WASM store initializes.
    await page.waitForSelector('[data-tutorial-id="header.nav.home"]', {
      timeout: 10000,
    })
  })

  test('opens tutorial index when header ? icon is clicked', async ({
    page,
  }) => {
    await page.click('[data-tutorial-id="header.tutorialLauncher"]')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('admin chapters show lock hint when not signed in', async ({ page }) => {
    await page.click('[data-tutorial-id="header.tutorialLauncher"]')
    // Chapter 30 (管理功能) should be listed and locked for unauthenticated users
    const lockedCards = page.locator('button[aria-disabled="true"]')
    await expect(lockedCards.first()).toBeVisible()
  })

  test('starting first-setup tour navigates through steps', async ({
    page,
  }) => {
    await page.click('[data-tutorial-id="header.tutorialLauncher"]')
    // Click the first chapter card (首次設定)
    await page
      .getByRole('button', { name: /首次設定/ })
      .first()
      .click()
    // Runner should mount and show the first step popover
    await expect(page.getByRole('dialog')).toBeVisible()
    // Click "下一步" button
    const nextBtn = page.getByRole('button', { name: /下一步/ })
    await nextBtn.click()
    // Popover should still be visible (second step)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('skip button aborts the tour', async ({ page }) => {
    await page.click('[data-tutorial-id="header.tutorialLauncher"]')
    await page
      .getByRole('button', { name: /首次設定/ })
      .first()
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /跳過教學/ }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('Escape key aborts the tour', async ({ page }) => {
    await page.click('[data-tutorial-id="header.tutorialLauncher"]')
    await page
      .getByRole('button', { name: /首次設定/ })
      .first()
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})
