# SPEC.md — 有氧課程一站式服務平台

## 1. Objective

打造一個三端整合的有氧課程平台，核心價值是**流程數位化與商業自動化**——不只是課程展示頁，而是完整的 SaaS 商業系統：

| 端 | 核心價值 |
|---|---|
| **老師端** | 自助維護課表、零管理成本 |
| **消費者端** | 縮短猶豫期、順暢預約付款 |
| **管理後台** | 分潤自動化、數據驅動行銷 |

**目標用戶：**
- 有氧課程老師（主要供給方）
- 運動愛好者（付費消費者）
- 平台管理員（本人/團隊）

---

## 2. Tech Stack

```
Frontend/Backend  Next.js 15 (App Router + Server Actions)
Database          PostgreSQL
ORM               Prisma
Auth              NextAuth.js v5 (email + Google OAuth)
Storage           Cloudinary（老師照片、證照、影片縮圖）
Payment           LINE Pay API（綠界 ECPay 為備援）
Messaging         LINE Notify API（通知）+ 站內私訊（DB-backed）
Email             Resend
Search            PostgreSQL Full-Text Search（初期）→ Algolia（後期）
Deploy            Vercel（前端）+ Railway 或 Supabase（PostgreSQL）
```

---

## 3. Core Domain Models

```
User              id, email, passwordHash, role(teacher|student|admin), createdAt
TeacherProfile    userId, displayName, bio, avatarUrl, certUrls[], youtubeUrl, isVerified, isHidden
Course            id, teacherId, title, type(tag), description, location, 
                  startAt, durationMin, maxSlots, price, status(active|cancelled)
Reservation       id, courseId, userId, status(pending|paid|attended|cancelled),
                  qrCode, paidAt, cancelledAt
Payment           id, reservationId, method(linepay|credit), amount, 
                  platformFee, teacherAmount, txnId, status
Review            id, courseId, userId, rating(1-5), comment, createdAt
Message           id, senderId, receiverId, body, readAt, createdAt
Commission        teacherId, plan(percentage|monthly), rate, billingDay
Advertisement     id, slot(homepage_banner|featured_teacher), imageUrl, 
                  linkUrl, startAt, endAt, isActive
```

---

## 4. Features & Acceptance Criteria

### 4-A 老師端 `/teacher`

#### 個人檔案
- [ ] 老師可上傳大頭照、師資證照（PDF/JPG）
- [ ] 可填寫教學風格描述、YouTube 試教影片連結
- [ ] 變更儲存後即時反映在消費者頁面

#### 課表系統
- [ ] 視覺化日曆介面，可新增課程（標題、時間、地點、人數上限、價格）
- [ ] 可取消已發布課程（若已有人報名，系統自動通知退款）
- [ ] 課程支援分類標籤（高強度有氧、Zumba、空中瑜珈 等，可自訂）

#### 預約管理
- [ ] 老師可即時看到已報名人數與學員名單
- [ ] 當課程報名達上限時自動關閉，老師收到通知

#### 通訊
- [ ] 站內私訊（老師 ↔ 學員）
- [ ] LINE Notify 整合：新報名時推播通知給老師

---

### 4-B 消費者端 `/`（公開頁面）

#### 搜尋與篩選
- [ ] 首頁依「地區、日期、課程類型、老師名稱」篩選
- [ ] 搜尋結果顯示：課程名稱、老師頭像、時間、剩餘名額、價格、平均評分
- [ ] 老師詳情頁：個人介紹、完整課表、學員評價牆

#### 預約與付款
- [ ] 選課後進入結帳頁，支援 LINE Pay
- [ ] 付款成功後產生 QR Code 電子票券，寄送 Email 確認信
- [ ] QR Code 供老師現場掃描簽到

#### 個人中心 `/profile`
- [ ] 查看所有已預約課程（upcoming / history）
- [ ] 取消預約（課程開始前 N 小時內可取消，退款規則可設定）
- [ ] 完課後可留下評分與評語

---

### 4-C 管理後台 `/admin`

#### 分帳與分潤
- [ ] 可對每位老師設定抽成比例（百分比）或月費方案
- [ ] 每筆 Payment 自動計算 `platformFee` 與 `teacherAmount`
- [ ] 匯出老師月結報表（CSV）

#### 自動化催收/停權
- [ ] 若老師月費未在 billingDay+N 天內繳交，系統自動將 `isHidden=true`
- [ ] 補繳後恢復上架
- [ ] 可手動覆寫停權狀態

#### 行銷數據看板
- [ ] 熱門老師排行（依預約數/評分）
- [ ] 熱門時段熱圖（week × hour）
- [ ] 總收入、平台抽成、老師應付款金額

#### 廣告版位
- [ ] 首頁 Banner 管理（上傳圖片、設定連結、有效日期）
- [ ] 熱門老師推薦位管理

---

## 5. API Surface（REST over Next.js API Routes）

```
# Auth
POST   /api/auth/[...nextauth]

# Teacher
GET    /api/teachers              公開：列出所有老師
GET    /api/teachers/:id          公開：老師詳情
PATCH  /api/teacher/profile       老師：更新個人檔案

# Courses
GET    /api/courses               公開：搜尋/篩選課程
POST   /api/courses               老師：新增課程
PATCH  /api/courses/:id           老師：更新/取消課程
GET    /api/courses/:id/enrollments 老師：查看名單

# Reservations
POST   /api/reservations          消費者：建立預約
DELETE /api/reservations/:id      消費者：取消預約
GET    /api/reservations/mine     消費者：我的課表

# Payments (LINE Pay)
POST   /api/payments/linepay/request   發起付款
POST   /api/payments/linepay/confirm   LINE Pay callback
POST   /api/payments/linepay/cancel    取消付款

# QR Code
GET    /api/qr/:reservationId     取得電子票券
POST   /api/qr/scan               老師：掃描簽到

# Messages
GET    /api/messages/:threadId    取得對話
POST   /api/messages              送出訊息

# Admin
GET    /api/admin/dashboard       數據看板
GET    /api/admin/teachers        老師列表＋分潤設定
PATCH  /api/admin/teachers/:id    更新老師狀態/方案
GET    /api/admin/ads             廣告列表
POST   /api/admin/ads             新增廣告
```

---

## 6. Project Structure

```
classroomReservation/
├── app/
│   ├── (public)/           # 消費者端（無需登入）
│   │   ├── page.tsx        # 首頁：搜尋 + 廣告 Banner
│   │   ├── teachers/[id]/  # 老師詳情頁
│   │   └── courses/[id]/   # 課程詳情 + 結帳入口
│   ├── (student)/          # 需登入（學員）
│   │   └── profile/        # 我的課表、評價
│   ├── teacher/            # 老師端 Dashboard
│   │   ├── layout.tsx
│   │   ├── schedule/       # 課表管理
│   │   ├── enrollments/    # 預約名單
│   │   └── profile/        # 個人檔案編輯
│   ├── admin/              # 管理後台
│   │   ├── dashboard/
│   │   ├── teachers/
│   │   └── ads/
│   └── api/                # API Routes
├── components/
│   ├── ui/                 # shadcn/ui 元件
│   ├── calendar/           # 課表日曆元件
│   ├── search/             # 搜尋篩選元件
│   └── qr/                 # QR Code 產生/掃描
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # NextAuth config
│   ├── linepay.ts          # LINE Pay SDK wrapper
│   └── cloudinary.ts       # 上傳 helper
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts            # 路由保護（role-based）
```

---

## 7. Code Style

- TypeScript strict mode
- ESLint + Prettier（Airbnb config）
- Server Components 優先，僅在需要互動時降為 Client Components
- Server Actions 處理表單，API Routes 處理 webhook（LINE Pay callback）
- Zod 驗證所有 API 輸入邊界
- Prisma transactions 處理「付款 → 建立 Reservation → 發 QR Code」原子操作

---

## 8. Testing Strategy

```
Unit tests      Vitest — lib/ 下的純函式（分潤計算、QR Code 生成、時段衝突檢查）
Integration     Vitest + Prisma test DB — API Routes 的完整流程
E2E             Playwright — 關鍵路徑：搜尋 → 預約 → 付款 → QR Code
```

測試覆蓋重點：
- 同一課程同時段超賣保護（race condition）
- 分潤計算正確性
- 取消退款邏輯
- 老師停權後課程隱藏

---

## 9. Boundaries

### Always do
- 所有 API 路由做 role-based middleware 檢查（不依賴前端隱藏）
- 付款 callback 用 LINE Pay signature 驗證，防止偽造
- 老師個人資料變更需 revalidatePath

### Decisions locked (2026-04-24)
- **課程標籤**：老師自訂，無需審核，管理員可後台刪除不當標籤
- **取消退款規則**：平台統一，課程開始前 24 小時可全額退款，24 小時內不退（寫死於 `lib/refund.ts`，未來可設定化）
- **老師帳號審核**：人工審核流程——老師註冊後 `isVerified=false`，管理員在後台審核通過後才能發課；`isVerified=false` 期間課程不對外顯示

### Never do
- 在前端 expose 其他用戶的 email/電話
- 在 Git 中提交 LINE Pay API keys、DB credentials
- 在 client component 直接 query DB（所有 DB 操作走 Server Action 或 API Route）

---

## 10. Phase 2 — 教室管理 & Dark Mode（2026-04-26 新增）

### 10-A 教室管理（Admin CRUD）

#### 資料模型

```prisma
model Classroom {
  id          String   @id @default(cuid())
  name        String                       // 教室名稱，e.g. "A館 101"
  capacity    Int                          // 最大容納人數
  location    String                       // 地址 / 樓層說明
  equipment   String?                      // 設備描述（投影機、鏡牆…）
  openHours   String   @default("[]")      // JSON: [{ day:0-6, open:"09:00", close:"22:00" }]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  bookings    ClassroomBooking[]
  courses     Course[]
}

model ClassroomBooking {
  id          String    @id @default(cuid())
  classroomId String
  courseId    String    @unique          // 一堂課對應一筆 booking
  startAt     DateTime
  endAt       DateTime                   // startAt + durationMin
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@index([classroomId, startAt])
}
```

`Course` 新增 `classroomId String?`（可選，未指定教室仍可建課）。

#### Admin 後台 `/admin/classrooms`

| 功能 | 路由 / Action |
|---|---|
| 教室列表（含使用率） | `GET /admin/classrooms` |
| 新增教室 | Server Action `createClassroom` |
| 編輯教室 | Server Action `updateClassroom` |
| 停用教室 | Server Action `setClassroomActive` |

**驗收：**
- 管理員可 CRUD 教室（名稱、容量、地點、設備、開放時段）
- 停用教室不刪除歷史資料，但老師選課時不顯示
- 教室列表顯示「本月預約次數 / 使用率」

---

### 10-B 教師登記教室（整合進建立課程流程）

#### 流程

```
老師建立課程
  → 選教室（下拉，僅顯示 isActive=true 的教室）
  → 選時段（startAt + durationMin 已填）
  → 前端即時查詢衝突（GET /api/classrooms/:id/availability?startAt=&endAt=）
  → 若衝突 → 顯示「該時段已被預約，請選其他時間或教室」，阻擋送出
  → 若 OK → 建立 Course + ClassroomBooking（同一 transaction）
  → maxSlots 自動上限為 min(老師設定值, classroom.capacity)
```

#### API

```
GET  /api/classrooms                     公開列出 active 教室（供老師選課用）
GET  /api/classrooms/:id/availability    查詢時段衝突（?startAt=ISO&endAt=ISO）
                                          回傳 { available: boolean, conflicts: [...] }
POST /api/admin/classrooms               Admin: 建立教室
PATCH /api/admin/classrooms/:id          Admin: 更新
```

#### 衝突邏輯（純函式，放 `lib/classroom-conflict.ts`）

```ts
// 有任何重疊即衝突（不含首尾相接）
function hasConflict(
  existing: { startAt: Date; endAt: Date }[],
  newStart: Date,
  newEnd: Date,
): boolean {
  return existing.some(e => newStart < e.endAt && newEnd > e.startAt)
}
```

**驗收：**
- 老師建立課程時可選教室（或留空）
- 選定教室 + 時段後，即時顯示是否有衝突
- 衝突時阻擋送出並顯示已預約資訊
- maxSlots 無法超過教室容量
- 取消課程時，對應的 ClassroomBooking 隨之刪除（Cascade）

---

### 10-C Dark Mode

#### 實作方式

使用 **`next-themes`** 管理 light/dark/system 三態：

```ts
// app/layout.tsx
import { ThemeProvider } from 'next-themes'
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Tailwind 設定 `darkMode: 'class'`，所有元件用 `dark:` variant。

#### Toggle 元件

- 位置：Header / Navbar 右上角
- 三態循環：System → Light → Dark → System
- 圖示：Sun / Moon / Monitor icon（lucide-react）
- 使用者選擇存 `localStorage`（next-themes 內建）

#### 色系規範（Dark Mode）

| 用途 | Light | Dark |
|---|---|---|
| 主背景 | `gray-50` | `gray-950` |
| 卡片背景 | `white` | `gray-900` |
| 邊框 | `gray-100` / `gray-200` | `gray-800` |
| 主文字 | `gray-900` | `gray-100` |
| 次文字 | `gray-500` | `gray-400` |
| 品牌主色（按鈕、連結） | `indigo-600` | `indigo-400` |
| 品牌 hover | `indigo-700` | `indigo-300` |
| 成功 | `green-600` | `green-400` |
| 危險 | `red-600` | `red-400` |

**驗收：**
- 所有現有頁面在 Dark Mode 下可讀（無白底殘留）
- Toggle 狀態在頁面重整後保持
- 首次進入依系統偏好自動套用
- Admin 後台、老師 Dashboard、公開頁面、登入/註冊頁全部支援

---

### 10-D 新增任務（Phase 2）

優先順序：
1. **Dark Mode 基礎設施**（ThemeProvider + Tailwind config）→ 全站套色
2. **教室 CRUD（Admin）** → schema migration → Admin UI
3. **衝突檢查邏輯**（純函式 + 單元測試）
4. **課程建立整合教室**（老師端 UI 改版）
5. **E2E 測試**（教室預約 + 衝突阻擋）

---

### 10-E 更新的邊界規則

**Always do（新增）：**
- 教室時段衝突在 DB transaction 內做最終確認（防 race condition），不只靠前端即時查詢
- `maxSlots` 在 Server Action 強制 `Math.min(userInput, classroom.capacity)`

**Never do（新增）：**
- 不讓老師看到其他老師的 ClassroomBooking 詳情（只能看「此時段已被預約」）
- 不在前端做唯一的衝突檢查（一定要在 transaction 內做 DB 級別的二次確認）

---

## 11. Phase 2 — 忘記密碼 / 重設密碼（2026-04-26 新增）

### 11-A 資料模型

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique   // SHA-256(rawToken)，rawToken 只出現在 email URL
  expiresAt DateTime            // createdAt + 1 小時
  usedAt    DateTime?           // 用過後設定，防止重複使用
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### 11-B 完整流程

```
[忘記密碼頁 /forgot-password]
  → 用戶輸入 Email，送出
  → POST /api/auth/forgot-password
      ① Rate limit: 同一 email 5 分鐘內只能送 1 封（用現有 checkRateLimit）
      ② 查 User by email —— 無論是否存在，一律回 200（防止 email 列舉）
      ③ 若存在：randomBytes(32).toString('hex') 產生 rawToken
                 tokenHash = SHA-256(rawToken)
                 寫入 PasswordResetToken { userId, tokenHash, expiresAt: now+1h }
      ④ 用 Resend 寄信，連結：https://domain/reset-password?token=<rawToken>
  → 前端顯示「如果此 Email 已註冊，你將在幾分鐘內收到重設連結」

[重設密碼頁 /reset-password?token=xxx]
  → 頁面載入：驗證 token 是否有效（server-side）
      ① tokenHash = SHA-256(token query param)
      ② 查 PasswordResetToken：tokenHash 存在 AND usedAt IS NULL AND expiresAt > now
      ③ 無效 / 過期 → 顯示錯誤頁「連結已失效，請重新申請」
  → 有效：顯示新密碼輸入表單（min 8 字元）
  → 送出：POST /api/auth/reset-password
      ① 再次驗證 token（防 race condition）
      ② bcrypt.hash(newPassword, 12)
      ③ Transaction：更新 User.passwordHash + 設 PasswordResetToken.usedAt = now
      ④ 回 200，前端導向 /login?reset=1
  → 登入頁顯示「密碼已重設，請重新登入」提示
```

### 11-C API

```
POST /api/auth/forgot-password
  Body: { email: string }
  Response: 200（一律，不洩漏 email 是否存在）
  Rate limit: checkRateLimit(`forgot-password:${email}`, { maxAttempts: 1, windowMs: 5*60*1000 })

POST /api/auth/reset-password
  Body: { token: string, password: string (min 8) }
  Response: 200 | 400 (token invalid/expired) | 422 (password too short)
```

### 11-D 頁面

| 路由 | 說明 |
|---|---|
| `/forgot-password` | Email 輸入表單，送出後顯示說明文字 |
| `/reset-password?token=...` | Server Component 驗 token → 有效才顯示密碼表單（Client Component）|

兩頁皆放在 `app/(auth)/` 下，與現有 login / register 同一 layout。

### 11-E 安全規則

**Always do：**
- rawToken 永遠不存 DB，只存 SHA-256 hash
- 無論 email 是否存在，forgot-password 一律回相同 200 response
- reset-password 在 DB transaction 內原子完成（更新密碼 + 標記 token 已用）
- token 使用後立即標記 usedAt，不可重複使用

**Never do：**
- 不在 response 中透露「此 email 未註冊」
- 不讓同一 email 在 5 分鐘內收到兩封重設信
- 不以明文存 reset token

### 11-F 驗收標準

- [ ] 登入頁有「忘記密碼？」連結
- [ ] 送出 Email 後顯示說明（無論帳號存在與否）
- [ ] 收到的連結有效期 1 小時，過期顯示錯誤
- [ ] 連結點擊後顯示新密碼表單，送出後導回登入頁
- [ ] 同一連結第二次點擊顯示「已失效」
- [ ] 5 分鐘內重複送出同一 email 顯示 rate limit 提示
- [ ] 新密碼少於 8 字元顯示驗證錯誤
- [ ] 單元測試：token 過期邏輯、hash 正確性、rate limit
