# 有氧課程一站式平台

有氧、舞蹈、體適能課程的預約與管理平台，整合老師端、消費者端、管理後台三端。

## 功能總覽

| 端 | 功能 |
|---|---|
| **消費者** | 搜尋課程、LINE Pay 預約付款、QR Code 電子票券、取消退款、課後評價、站內私訊 |
| **老師** | 課程日曆管理、預約名單、QR Code 掃描簽到、LINE Notify 新報名通知 |
| **管理後台** | 老師審核與停權、分潤設定（百分比 / 月費）、月結報表 CSV、自動停權 Cron、數據看板、廣告版位管理 |

## 技術架構

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript strict
- **Database**: SQLite（本地開發）/ PostgreSQL（生產）via Prisma 7 + libSQL adapter
- **Auth**: NextAuth.js v5（Email/Password + Google OAuth）
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Payment**: LINE Pay v3
- **Email**: Resend
- **Storage**: Cloudinary（頭像、師資證照、廣告圖）
- **Testing**: Vitest（單元 / 整合）+ Playwright（E2E）
- **Deployment**: Vercel（含 Cron Jobs）

## 路由結構

```
app/
├── page.tsx           # 首頁搜尋 + 廣告
├── courses/[id]/      # 課程詳情 + 預約
├── teachers/[id]/     # 老師詳情 + 評價牆
├── (student)/
│   └── profile/       # 學員課表、取消、評價（需登入）
├── teacher/           # 老師 Dashboard（需 TEACHER role）
│   ├── schedule/      # 課程日曆
│   ├── enrollments/   # 預約名單
│   ├── scan/          # QR Code 掃描簽到
│   └── profile/       # 個人資料 + LINE Notify 綁定
├── admin/             # 管理後台（需 ADMIN role）
│   ├── dashboard/     # 數據看板
│   ├── teachers/      # 老師審核 + 停權 + 分潤
│   └── ads/           # 廣告版位管理
└── messages/[userId]/ # 站內私訊
```

## 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境變數

```bash
cp .env.example .env.local
```

填入下方所有必要欄位（詳見[環境變數說明](#環境變數說明)）。

### 3. 資料庫初始化

```bash
npm run db:migrate   # 建立 SQLite 本地 DB + 執行 migrations
npm run db:seed      # 載入測試資料
```

### 4. 啟動

```bash
npm run dev          # http://localhost:3000
```

### Seed 帳號

| Role | Email | 密碼 |
|---|---|---|
| Admin | admin@example.com | password |
| Teacher（已審核）| teacher@example.com | password |
| Student | student@example.com | password |

## 指令速查

```bash
npm run dev           # 開發伺服器
npm run build         # 生產建置
npm run lint          # ESLint 檢查
npm run test          # Vitest 單元 + 整合測試（179 個）
npm run test:watch    # 監聽模式
npm run test:e2e      # Playwright E2E 測試
npm run db:migrate    # prisma migrate dev（SQLite 本地）
npm run db:studio     # Prisma Studio GUI
npm run db:seed       # 載入測試資料
npx prisma generate   # 更新 schema 後重新產生 client
```

## 環境變數說明

### 核心（必要）

| 變數 | 說明 |
|---|---|
| `DATABASE_URL` | 生產 PostgreSQL 連線字串；本地不需設定（自動用 SQLite） |
| `AUTH_SECRET` | NextAuth 簽章金鑰（`openssl rand -hex 32`） |
| `QR_SECRET` | QR Code HMAC 簽章金鑰（`openssl rand -hex 32`） |
| `CRON_SECRET` | Vercel Cron 授權金鑰（`openssl rand -hex 32`） |

### Google OAuth（可選）

| 變數 | 說明 |
|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |

### Cloudinary

| 變數 | 說明 |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

### LINE Pay

| 變數 | 說明 |
|---|---|
| `LINEPAY_CHANNEL_ID` | Channel ID |
| `LINEPAY_CHANNEL_SECRET_KEY` | Channel Secret |
| `LINEPAY_IS_SANDBOX` | `"true"` 為沙盒模式（開發用） |

### LINE Notify

| 變數 | 說明 |
|---|---|
| `LINE_NOTIFY_CLIENT_ID` | OAuth App Client ID |
| `LINE_NOTIFY_CLIENT_SECRET` | OAuth App Client Secret |
| `LINE_NOTIFY_CALLBACK_URL` | 授權回調 URL，如 `https://yourdomain.com/api/line-notify/callback` |

### Resend（Email）

| 變數 | 說明 |
|---|---|
| `RESEND_API_KEY` | Resend API 金鑰 |
| `RESEND_FROM_EMAIL` | 寄件地址（需在 Resend 驗證網域） |

## 核心業務規則

- **老師上架條件**：`isVerified = true` 且 `isHidden = false`，缺一不可
- **退款規則**：課程開始前 ≥ 24 小時可全額退款，否則不退
- **月費自動停權**：帳單日 + 5 天寬限後無繳費記錄 → `isHidden = true`（每日 02:00 UTC by Cron）
- **QR Code 格式**：`reservationId:HMAC-SHA256(QR_SECRET, reservationId)`，timing-safe 驗證
- **分潤計算**：`platformFee = amount × rate`，在付款確認 transaction 中原子寫入

## 部署（Vercel）

1. 推上 GitHub 並連接 Vercel
2. 在 Vercel Dashboard 填入所有環境變數（`DATABASE_URL` 指向生產 PostgreSQL）
3. `vercel.json` 已設定每日 Cron，Vercel 會自動啟用

```jsonc
// vercel.json — 自動停權每日 02:00 UTC 執行
{ "crons": [{ "path": "/api/cron/auto-suspend", "schedule": "0 2 * * *" }] }
```

4. 首次部署後執行 migration：

```bash
npx prisma migrate deploy
```

## 測試

單元與整合測試覆蓋所有核心純函式，無 DB 依賴，CI 可直接執行：

```bash
npm run test
```

涵蓋：退款邏輯、QR 驗證、分潤計算、自動停權、廣告過濾、月結 CSV、訊息權限等。

E2E 測試需要執行中的 dev server 與有效的 LINE Pay sandbox 憑證：

```bash
npm run dev &
npm run test:e2e
```
