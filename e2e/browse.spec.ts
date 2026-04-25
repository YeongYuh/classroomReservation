import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads with platform title and search form', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('有氧課程一站式平台')).toBeVisible()
    await expect(page.getByRole('button', { name: '搜尋' })).toBeVisible()
  })

  test('shows course cards with teacher name and price', async ({ page }) => {
    await page.goto('/')
    // Seed has 3 ACTIVE courses by verified Chloe 老師
    await expect(page.getByText('Chloe 老師').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Zumba 派對舞蹈')).toBeVisible()
  })

  test('search by tag filters results', async ({ page }) => {
    await page.goto('/?tag=Zumba')
    await expect(page.getByText('Zumba 派對舞蹈')).toBeVisible()
    // HIIT course should not appear when filtering by Zumba
    await expect(page.getByText('高強度有氧燃脂班')).not.toBeVisible()
  })

  test('shows active banner advertisement', async ({ page }) => {
    await page.goto('/')
    // Seed creates a HOMEPAGE_BANNER linking to /courses
    const banner = page.locator('a[href="/courses"]').first()
    await expect(banner).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Course detail', () => {
  test('shows course info and "登入後預約" for unauthenticated user', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Zumba 派對舞蹈').click()
    await expect(page).toHaveURL(/\/courses\//)
    await expect(page.locator('h1')).toContainText('Zumba 派對舞蹈')
    await expect(page.getByText('登入後預約')).toBeVisible()
  })

  test('course detail shows teacher link', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Zumba 派對舞蹈').click()
    await expect(page.getByText('Chloe 老師')).toBeVisible()
  })

  test('non-existent course does not show 500 error', async ({ page }) => {
    await page.goto('/courses/nonexistent-id-12345')
    await expect(page.locator('body')).not.toContainText('500')
  })
})
