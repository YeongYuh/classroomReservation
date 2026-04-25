import { test as setup, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth')

async function loginAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storageFile: string,
) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('密碼').fill(password)
  await page.getByRole('button', { name: '登入' }).click()
  // Wait for redirect away from /login
  await expect(page).not.toHaveURL('/login', { timeout: 10_000 })
  await page.context().storageState({ path: storageFile })
}

setup('create auth storage states', async ({ page }) => {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  await loginAs(
    page,
    'alice@example.com',
    'Test1234!',
    path.join(AUTH_DIR, 'student.json'),
  )

  await loginAs(
    page,
    'chloe@yoga.com',
    'Test1234!',
    path.join(AUTH_DIR, 'teacher.json'),
  )

  await loginAs(
    page,
    'admin@platform.com',
    'Test1234!',
    path.join(AUTH_DIR, 'admin.json'),
  )
})
