import { test, expect } from '@playwright/test'

// Uses storageState: playwright/.auth/teacher.json (chloe@yoga.com — verified)

test.describe('Teacher schedule', () => {
  test('redirects /teacher to /teacher/schedule', async ({ page }) => {
    await page.goto('/teacher')
    await expect(page).toHaveURL('/teacher/schedule', { timeout: 5_000 })
  })

  test('schedule page shows 課表管理 heading', async ({ page }) => {
    await page.goto('/teacher/schedule')
    await expect(page.getByRole('heading', { name: '課表管理' })).toBeVisible()
  })

  test('schedule page lists seeded courses', async ({ page }) => {
    await page.goto('/teacher/schedule')
    await expect(page.getByText('Zumba 派對舞蹈')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Teacher enrollments', () => {
  test('enrollments page loads without error', async ({ page }) => {
    await page.goto('/teacher/enrollments')
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('無權限')
  })
})

test.describe('Teacher profile editing', () => {
  test('profile page shows edit form', async ({ page }) => {
    await page.goto('/teacher/profile')
    await expect(page.locator('body')).not.toContainText('500')
    // Profile page should have some form fields
    await expect(page.locator('form')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('QR scan page', () => {
  test('scan page loads for verified teacher', async ({ page }) => {
    await page.goto('/teacher/scan')
    await expect(page.locator('body')).not.toContainText('500')
    await expect(page.locator('body')).not.toContainText('無權限')
  })
})

test.describe('Unverified teacher', () => {
  test('unverified teacher sees 帳號審核中 message', async ({ page, context }) => {
    // Override storage state inline to log in as max (unverified teacher)
    await context.clearCookies()

    await page.goto('/login')
    await page.getByLabel('Email').fill('max@aerobics.com')
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page).toHaveURL('/', { timeout: 10_000 })

    await page.goto('/teacher/schedule')
    await expect(page.getByText('帳號審核中')).toBeVisible({ timeout: 5_000 })
  })
})
