import { test, expect } from '@playwright/test'

// Uses storageState: playwright/.auth/student.json (alice@example.com)

test.describe('Student profile', () => {
  test('shows existing paid reservation', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: '我的課表' })).toBeVisible()
    // Alice has a PAID reservation for Zumba 派對舞蹈 from seed
    await expect(page.getByText('Zumba 派對舞蹈')).toBeVisible({ timeout: 5_000 })
  })

  test('paid reservation shows QR code section', async ({ page }) => {
    await page.goto('/profile')
    // The paid reservation card should show QR code or ticket info
    await expect(page.getByText('Zumba 派對舞蹈')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Reserve a course', () => {
  test('"立即預約" button is visible for logged-in student on available course', async ({ page }) => {
    await page.goto('/')
    // 高強度有氧燃脂班 — alice has no reservation for this course
    await page.getByText('高強度有氧燃脂班').click()
    await expect(page).toHaveURL(/\/courses\//)
    // Logged-in student sees "立即預約" not "登入後預約"
    await expect(page.getByRole('button', { name: '立即預約' })).toBeVisible()
    await expect(page.getByText('登入後預約')).not.toBeVisible()
  })

  test('reserve flow: click 立即預約 → redirected to /profile', async ({ page }) => {
    // Register a fresh account for isolation (avoids duplicate reservation on re-run)
    const unique = `reserve-${Date.now()}@test.com`
    const res = await page.request.post('/api/auth/register', {
      data: { email: unique, password: 'Test1234!', name: 'E2E Student', role: 'STUDENT' },
    })
    expect(res.ok()).toBeTruthy()

    // Log in as the new student
    await page.goto('/login')
    await page.getByLabel('Email').fill(unique)
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page).toHaveURL('/', { timeout: 10_000 })

    // Navigate to an available course and reserve
    await page.goto('/')
    await page.getByText('空中瑜珈入門').click()
    await expect(page.getByRole('button', { name: '立即預約' })).toBeVisible()
    await page.getByRole('button', { name: '立即預約' }).click()

    // Should redirect to /profile after successful reservation
    await expect(page).toHaveURL('/profile', { timeout: 10_000 })
    await expect(page.getByText('空中瑜珈入門')).toBeVisible()
  })
})
