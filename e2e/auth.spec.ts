import { test, expect } from '@playwright/test'

test.describe('Register', () => {
  test('shows register form with all fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible()
    await expect(page.getByLabel('姓名')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('密碼')).toBeVisible()
    await expect(page.getByLabel('身份')).toBeVisible()
  })

  test('registers a new student and redirects to login', async ({ page }) => {
    await page.goto('/register')
    const unique = `e2e-${Date.now()}@test.com`
    await page.getByLabel('姓名').fill('E2E 測試')
    await page.getByLabel('Email').fill(unique)
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '建立帳號' }).click()
    await expect(page).toHaveURL('/login?registered=1', { timeout: 10_000 })
  })

  test('shows error for duplicate email', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('姓名').fill('重複帳號')
    await page.getByLabel('Email').fill('alice@example.com')
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '建立帳號' }).click()
    await expect(page.getByText('此 Email 已被註冊')).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Login', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: '登入' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('密碼')).toBeVisible()
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('alice@example.com')
    await page.getByLabel('密碼').fill('wrongpassword')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page.getByText('Email 或密碼錯誤')).toBeVisible({ timeout: 5_000 })
  })

  test('student logs in and reaches homepage', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('alice@example.com')
    await page.getByLabel('密碼').fill('Test1234!')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })

  test('unauthenticated access to /profile redirects to login', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test('unauthenticated access to /teacher redirects to login', async ({ page }) => {
    await page.goto('/teacher/schedule')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
