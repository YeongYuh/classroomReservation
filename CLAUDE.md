# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

有氧課程一站式服務平台 — 三端整合（老師端 / 消費者端 / 管理後台），核心是流程數位化與商業自動化。詳細規格見 [SPEC.md](SPEC.md)，任務計畫見 [tasks/plan.md](tasks/plan.md)。

## Commands

```bash
npm run dev        # 開發伺服器 (http://localhost:3000)
npm run build      # 生產建置
npm run lint       # ESLint 檢查
npm run test       # Vitest 單元 + 整合測試
npm run test:e2e   # Playwright E2E 測試
npm run db:migrate # prisma migrate dev (SQLite local)
npm run db:studio  # Prisma Studio
npm run db:seed    # 載入測試資料
npx prisma generate # 更新 schema 後重新產生 client
```

## Architecture

**Stack：** Next.js 15 (App Router) · TypeScript strict · PostgreSQL · Prisma · NextAuth.js v5 · shadcn/ui · Tailwind · Vitest · Playwright

**三端路由：**
- `app/(public)/` — 消費者瀏覽（無需登入）
- `app/teacher/` — 老師 Dashboard（需 TEACHER role）
- `app/admin/` — 管理後台（需 ADMIN role）
- `app/(student)/profile/` — 學員個人中心（需登入）

**DB 注意事項（Prisma 7 + SQLite）：**
- 本地開發用 SQLite（`prisma/dev.db`），生產用 PostgreSQL（`DATABASE_URL` env）
- Prisma 7 需要 driver adapter：`PrismaLibSql` from `@prisma/adapter-libsql`
- `tags` 和 `certUrls` 以 JSON 字串存在 SQLite 中（`JSON.stringify`/`JSON.parse`）
- `prisma.config.ts` 只放 schema 路徑，不放 URL（URL 透過 `--url` 旗標或 env 傳入）

**關鍵規則：**
- Server Components 優先；只有在需要事件/state 時才加 `"use client"`
- 表單用 Server Actions，webhook（LINE Pay callback）用 API Routes
- 所有 DB 操作在 Server Action 或 API Route，禁止從 Client Component 直接 query
- Zod 驗證所有 API 輸入（`app/api/` 邊界）
- `lib/prisma.ts` 是唯一的 Prisma client singleton

**分潤計算：** `lib/commission.ts` — `platformFee = amount × rate`，在 Payment confirm transaction 中原子執行。

**退款規則：** `lib/refund.ts` — 課程開始前 ≥24 小時可全額退款，否則不退。

**老師上架條件：** `TeacherProfile.isVerified=true AND isHidden=false`，公開 API 查詢必須同時帶這兩個 where 條件。
