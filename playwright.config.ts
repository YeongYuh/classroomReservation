import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth setup — runs once before all other tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Unauthenticated browsing (auth, browse)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /\/(auth|browse)\.spec\.ts/,
    },
    // Authenticated as student (reservation)
    {
      name: 'student',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/student.json',
      },
      dependencies: ['setup'],
      testMatch: /\/reservation\.spec\.ts/,
    },
    // Authenticated as teacher
    {
      name: 'teacher',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/teacher.json',
      },
      dependencies: ['setup'],
      testMatch: /\/teacher\.spec\.ts/,
    },
    // Authenticated as admin
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /\/admin\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
