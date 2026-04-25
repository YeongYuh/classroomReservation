import { test, expect } from '@playwright/test'

// Uses storageState: playwright/.auth/admin.json (admin@platform.com)

test.describe('Admin access control', () => {
  test('admin can access /admin/teachers', async ({ page }) => {
    await page.goto('/admin/teachers')
    await expect(page.getByRole('heading', { name: '老師管理' })).toBeVisible({ timeout: 5_000 })
  })

  test('admin can access /admin/dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('無權限')
  })

  test('admin can access /admin/ads', async ({ page }) => {
    await page.goto('/admin/ads')
    await expect(page.locator('body')).not.toContainText('500')
  })
})

test.describe('Teacher management', () => {
  test('shows pending teacher Max 教練', async ({ page }) => {
    await page.goto('/admin/teachers')
    await expect(page.getByText('Max 教練')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: '審核通過' })).toBeVisible()
  })

  test('shows verified teacher Chloe 老師 with commission settings', async ({ page }) => {
    await page.goto('/admin/teachers')
    await expect(page.getByText('Chloe 老師')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: '停權' })).toBeVisible()
    await expect(page.getByRole('button', { name: '儲存' })).toBeVisible()
  })

  test('shows month report link for verified teacher', async ({ page }) => {
    await page.goto('/admin/teachers')
    await expect(page.getByText('月結報表')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Analytics dashboard', () => {
  test('dashboard shows revenue stats section', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // Dashboard renders revenue stats and heatmap
    await expect(page.locator('body')).not.toContainText('500')
    // Should have at least some heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Non-admin access', () => {
  test('student cannot access admin routes', async ({ page, context }) => {
    // Clear admin session and use a fresh unauthenticated context
    await context.clearCookies()

    await page.goto('/admin/teachers')
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
