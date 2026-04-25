# tasks/plan.md — 有氧課程平台實作計畫

> 原則：每個任務是一條**垂直切片**（DB → API → UI 完整貫穿），可獨立驗證。
> 任務編號即執行順序，帶 `→` 的是明確依賴。

---

## 依賴圖

```
T0 ──→ T1 ──→ T2 ──────────────────────────────────┐
                │                                   │
                ├──→ T3 ──→ T4 ──→ T5 ──→ T6       │
                │                    │              │
                │                    └──→ T7 ──→ T8 ──→ T9 ──→ T10
                │                              │
                │                    ┌─────────┘
                │                    ↓
                │         T11, T12, T13, T14, T15
                │
                └──→ T16, T17（通知/訊息，依賴 T8）
                     T18 → T19 → T20（Admin，依賴 T8）
                     T21（依賴 T8+T15）
                     T22（依賴 T0）
```

---

## Phase 0：地基（無依賴）

### T0 — 專案鷹架

**目標：** 可以跑起來的 Next.js 15 專案，開發體驗就位。

**任務：**
- `npx create-next-app@latest` with TypeScript, App Router, Tailwind
- 安裝 shadcn/ui、Vitest、Playwright
- 設定 ESLint (Airbnb) + Prettier
- 建立 `.env.example`（列出所有 secret key 名稱但無值）
- 建立空的 `lib/prisma.ts`, `lib/auth.ts`, `middleware.ts`

**驗收：**
- `npm run dev` 啟動無 TS 錯誤
- `npm run lint` 零警告
- `npm run test` 跑空測試套件通過

---

### T1 — Prisma Schema + Migration

**目標：** 所有 domain model 進 DB，seed 資料可用。

**依賴：** T0

**Schema（完整）：**
```prisma
model User {
  id            String          @id @default(cuid())
  email         String          @unique
  passwordHash  String?
  role          Role            @default(STUDENT)
  createdAt     DateTime        @default(now())
  teacherProfile TeacherProfile?
  reservations  Reservation[]
  sentMessages  Message[]       @relation("Sender")
  receivedMessages Message[]    @relation("Receiver")
  reviews       Review[]
}

enum Role { TEACHER STUDENT ADMIN }

model TeacherProfile {
  id          String    @id @default(cuid())
  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])
  displayName String
  bio         String?
  avatarUrl   String?
  certUrls    String[]
  youtubeUrl  String?
  isVerified  Boolean   @default(false)   -- 人工審核
  isHidden    Boolean   @default(false)   -- 停權/催收
  commission  Commission?
  courses     Course[]
}

model Course {
  id           String        @id @default(cuid())
  teacherId    String
  teacher      TeacherProfile @relation(fields: [teacherId], references: [id])
  title        String
  tags         String[]
  description  String?
  location     String
  startAt      DateTime
  durationMin  Int
  maxSlots     Int
  price        Decimal       @db.Decimal(10, 2)
  status       CourseStatus  @default(ACTIVE)
  reservations Reservation[]
  reviews      Review[]
  createdAt    DateTime      @default(now())
  @@index([startAt])
  @@index([tags])
}

enum CourseStatus { ACTIVE CANCELLED COMPLETED }

model Reservation {
  id          String            @id @default(cuid())
  courseId    String
  course      Course            @relation(fields: [courseId], references: [id])
  userId      String
  user        User              @relation(fields: [userId], references: [id])
  status      ReservationStatus @default(PENDING)
  qrCode      String?           @unique
  paidAt      DateTime?
  cancelledAt DateTime?
  payment     Payment?
  createdAt   DateTime          @default(now())
  @@unique([courseId, userId])  -- 同一用戶同一課程不能重複預約
}

enum ReservationStatus { PENDING PAID ATTENDED CANCELLED }

model Payment {
  id             String        @id @default(cuid())
  reservationId  String        @unique
  reservation    Reservation   @relation(fields: [reservationId], references: [id])
  method         PaymentMethod @default(LINEPAY)
  amount         Decimal       @db.Decimal(10, 2)
  platformFee    Decimal       @db.Decimal(10, 2)
  teacherAmount  Decimal       @db.Decimal(10, 2)
  txnId          String?
  status         PaymentStatus @default(PENDING)
  createdAt      DateTime      @default(now())
}

enum PaymentMethod { LINEPAY CREDIT }
enum PaymentStatus { PENDING COMPLETED REFUNDED FAILED }

model Review {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  rating    Int      -- 1-5
  comment   String?
  createdAt DateTime @default(now())
  @@unique([courseId, userId])  -- 每人每課只能評一次
}

model Message {
  id         String   @id @default(cuid())
  senderId   String
  sender     User     @relation("Sender", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("Receiver", fields: [receiverId], references: [id])
  body       String
  readAt     DateTime?
  createdAt  DateTime @default(now())
}

model Commission {
  id         String         @id @default(cuid())
  teacherId  String         @unique
  teacher    TeacherProfile @relation(fields: [teacherId], references: [id])
  plan       CommissionPlan @default(PERCENTAGE)
  rate       Decimal        @db.Decimal(5, 4)  -- e.g. 0.1500 = 15%
  billingDay Int?           -- monthly plan: day of month
}

enum CommissionPlan { PERCENTAGE MONTHLY }

model Advertisement {
  id        String   @id @default(cuid())
  slot      AdSlot
  imageUrl  String
  linkUrl   String?
  startAt   DateTime
  endAt     DateTime
  isActive  Boolean  @default(true)
}

enum AdSlot { HOMEPAGE_BANNER FEATURED_TEACHER }
```

**任務：**
- 寫出完整 `prisma/schema.prisma`
- `prisma migrate dev --name init`
- 寫 `prisma/seed.ts`：1 admin、2 teachers（1 已審核 1 未審核）、3 courses、mock reservations

**驗收：**
- `npx prisma studio` 可看到所有資料表
- Seed 後 DB 有測試資料
- `npx prisma validate` 無錯誤

---

### T2 — Auth + Middleware + Role-based Routing

**目標：** 三個 role 可以登入，路由保護就位。

**依賴：** T1

**任務：**
- 設定 NextAuth.js v5（email/password + Google OAuth）
- `middleware.ts`：
  - `/teacher/*` → 需要 TEACHER role
  - `/admin/*` → 需要 ADMIN role
  - `/profile/*` → 需要登入（任何 role）
- 登入/登出頁面（`/login`, `/register`）
- 老師註冊後自動建立 `TeacherProfile(isVerified=false)`

**驗收：**
- STUDENT 訪問 `/teacher/schedule` → 302 到 `/login`
- ADMIN 可訪問 `/admin`
- 老師用 Google 登入後，DB 有 `TeacherProfile` 記錄

---

## ✅ Checkpoint A

> **通過條件：**
> - `npm run dev` 跑起，三種 role 可分別登入
> - 路由保護正確（403/302 for wrong role）
> - DB seed 資料完整
>
> **通過後才能進 Phase 1**

---

## Phase 1：老師供給側

### T3 — 老師審核流程

**目標：** 老師註冊後看到「等待審核」畫面；admin 審核後老師可使用 dashboard。

**依賴：** T2

**任務：**
- `/teacher` layout：若 `isVerified=false`，顯示「審核中」頁，block 其他功能
- `PATCH /api/admin/teachers/:id`：admin 可設定 `isVerified=true`
- Admin 後台「待審核老師列表」頁（簡單 table + 審核按鈕）

**驗收：**
- 新老師登入 → 看到「等待審核」
- Admin 點審核通過 → DB `isVerified=true`
- 老師重整頁面 → 進入正常 dashboard

---

### T4 — 老師個人檔案編輯器

**目標：** 老師可編輯個人資訊，消費者頁立即反映。

**依賴：** T3

**任務：**
- `/teacher/profile` 頁：bio、YouTube 連結表單（Server Action 儲存）
- Cloudinary 上傳：大頭照（image）、師資證照（image/PDF）
- `revalidatePath('/teachers/[id]')` 在儲存後執行

**驗收：**
- 老師更新 bio → 消費者頁 `/teachers/[id]` 立即顯示新內容
- 上傳的 Cloudinary URL 存進 DB
- 上傳大於 10MB 的檔案 → 顯示錯誤訊息

---

### T5 — 課程建立（含日曆介面）

**目標：** 老師可新增/取消課程，支援標籤。

**依賴：** T4

**任務：**
- `/teacher/schedule` 視覺化日曆（使用 `react-big-calendar` 或 FullCalendar）
- 新增課程 modal：標題、標籤（tag input 自訂）、時間、地點、人數上限、價格
- Server Action：寫入 Course（`status=ACTIVE`）
- 取消課程：`PATCH /api/courses/:id` → `status=CANCELLED`（此階段無退款，Phase 3 補上）

**驗收：**
- 新增課程 → 日曆顯示該課程
- 取消課程 → 日曆移除
- 標籤欄位接受自訂文字，存為 `String[]`

---

### T6 — 公開課程瀏覽頁

**目標：** 消費者可搜尋課程、查看老師詳情。

**依賴：** T5

**任務：**
- 首頁 `app/(public)/page.tsx`：搜尋欄（地區、日期、類型、老師名）
- `GET /api/courses`：query 支援 `tag`, `date`, `location`, `teacherName`，只回傳 `isVerified=true AND isHidden=false AND status=ACTIVE`
- 課程卡片：老師頭像、課程名、時間、剩餘名額、價格、平均評分
- `/teachers/[id]`：老師介紹 + 課表 + 評價牆（此階段評價為空）

**驗收：**
- `isVerified=false` 的老師課程不出現在搜尋結果
- 搜尋「Zumba」 → 只顯示含 Zumba 標籤的課程
- 課程額滿（`_count(reservations where status=PAID) >= maxSlots`）時顯示「已額滿」

---

## ✅ Checkpoint B

> **通過條件：**
> - 老師完整流程：註冊 → 審核 → 編輯個人檔案 → 新增課程
> - 消費者可搜尋並瀏覽課程，未審核老師的課程不可見
>
> **通過後才能進 Phase 2**

---

## Phase 2：預約與付款核心

### T7 — 學員預約（付款前）

**目標：** 學員選課後進入預約狀態（PENDING），等待付款。

**依賴：** T6（課程存在）、T2（auth）

**任務：**
- `/courses/[id]`：課程詳情頁 + 「立即預約」按鈕
- `POST /api/reservations`：
  - 檢查課程 status=ACTIVE
  - 檢查剩餘名額（`SELECT FOR UPDATE` 防 race condition）
  - 建立 `Reservation(status=PENDING)`
  - 回傳 reservationId
- Zod 驗證 request body

**驗收：**
- 同一用戶同一課程第二次預約 → 400 錯誤
- 模擬 10 個並發請求只有 N 個（≤maxSlots）成功
- 額滿後新請求 → 409 錯誤

---

### T8 — LINE Pay 付款整合

**目標：** 預約可用 LINE Pay 完成付款，payment record 自動建立。

**依賴：** T7

**任務：**
- `lib/linepay.ts`：封裝 LINE Pay v3 API（request, confirm, cancel, refund）
- `POST /api/payments/linepay/request`：
  - 呼叫 LINE Pay request API
  - 存 `Payment(status=PENDING, txnId)`
  - 回傳 LINE Pay redirect URL
- `POST /api/payments/linepay/confirm`（webhook）：
  - 驗證 LINE Pay HMAC signature
  - 在 Prisma transaction 中：
    1. `Payment.status = COMPLETED`
    2. `Reservation.status = PAID`，記錄 `paidAt`
    3. 計算並填入 `platformFee` / `teacherAmount`（依 Commission 設定）
  - 觸發 QR Code 生成（T9）
- `POST /api/payments/linepay/cancel`：用戶從 LINE Pay 頁面返回取消

**驗收：**
- Sandbox 測試：付款成功 → Reservation 狀態變 PAID
- Webhook 偽造（錯誤 signature）→ 400 拒絕
- 付款成功後 Payment 欄位 platformFee + teacherAmount = amount

---

### T9 — QR Code 電子票券 + Email 確認

**目標：** 付款成功後自動產生 QR Code，Email 送達學員。

**依賴：** T8

**任務：**
- `lib/qr.ts`：用 `qrcode` npm 產生含 reservationId + HMAC 的 QR Code URL
- Payment confirm 的 transaction 中一併寫入 `Reservation.qrCode`
- `GET /api/qr/:reservationId`：驗證登入身份後回傳 QR Code image（base64）
- Resend 寄送確認信（含課程資訊 + QR Code 圖片）

**驗收：**
- 付款成功後 Email 在 2 分鐘內到達（Resend sandbox log 可查）
- QR Code 內嵌 HMAC，偽造的 QR Code 掃描 → 拒絕

---

### T10 — 學員個人課表

**目標：** 學員可看到自己所有預約。

**依賴：** T8

**任務：**
- `/profile` 頁面：分頁顯示 upcoming（PAID + 未開始）/ history（ATTENDED + CANCELLED）
- `GET /api/reservations/mine`：帶入當前 user session
- 每張課程卡顯示：課名、老師、時間、狀態、QR Code 按鈕（PAID 才顯示）

**驗收：**
- 付款前（PENDING）不顯示 QR Code 按鈕
- 付款後（PAID）可點擊取得 QR Code

---

## ✅ Checkpoint C

> **通過條件：**
> - 完整流程可跑通：搜尋 → 選課 → 預約 → LINE Pay → QR Code → Email
> - 並發超賣保護驗證通過
> - Webhook signature 驗證通過
>
> **通過後才能進 Phase 3**

---

## Phase 3：課程生命週期管理

### T11 — 老師預約管理介面

**目標：** 老師即時查看已報名人數與學員名單。

**依賴：** T8

**任務：**
- `/teacher/enrollments` 頁：列出所有課程，每課程可展開名單
- `GET /api/courses/:id/enrollments`：僅老師本人可訪問，回傳 `{userId, displayName, status}[]`（不 expose email）
- 課程達 maxSlots 時顯示「已額滿」標記

**驗收：**
- 老師無法查看其他老師的名單（403）
- 學員資訊不含 email

---

### T12 — QR Code 掃描簽到

**目標：** 老師用手機掃描學員 QR Code 完成簽到。

**依賴：** T9

**任務：**
- `/teacher/scan` 頁：使用 `react-qr-reader` 開啟相機掃描
- `POST /api/qr/scan`：
  - 驗證 QR Code HMAC
  - 確認 Reservation 屬於當前老師的課程
  - `Reservation.status = ATTENDED`
- 掃描結果即時顯示（成功/已使用/無效）

**驗收：**
- 有效 QR Code → 狀態變 ATTENDED，顯示學員名
- 已掃過的 QR Code → 顯示「已使用」
- 其他老師課程的 QR Code → 拒絕

---

### T13 — 學員取消預約 + 退款

**目標：** 學員可取消預約，符合退款規則時自動退款。

**依賴：** T8

**任務：**
- `lib/refund.ts`：
  ```typescript
  function isRefundable(course: Course): boolean {
    return differenceInHours(course.startAt, new Date()) >= 24
  }
  ```
- `DELETE /api/reservations/:id`：
  - 驗證是本人的預約
  - 若課程已開始 → 400
  - 若 `isRefundable` → 呼叫 LINE Pay Refund API → `Payment.status=REFUNDED`
  - `Reservation.status=CANCELLED`，記錄 `cancelledAt`

**驗收：**
- 課程前 25 小時取消 → 退款成功（Sandbox 確認）
- 課程前 23 小時取消 → 400，訊息說明不退款
- 已 ATTENDED 的預約 → 400（不可取消）

---

### T14 — 老師取消課程 + 批量退款

**目標：** 老師取消課程後，所有已付費學員自動退款並收到通知。

**依賴：** T13

**任務：**
- `PATCH /api/courses/:id` with `{ status: 'CANCELLED' }`
- 在 Prisma transaction：
  1. Course.status = CANCELLED
  2. 批量退款所有 `status=PAID` 的 Reservations（呼叫 LINE Pay，允許部分失敗）
  3. 批量更新 Reservation.status = CANCELLED
- Resend 寄送課程取消通知給所有已報名學員

**驗收：**
- 取消有 3 名付費學員的課程 → 3 筆退款，3 封 Email
- 某退款 API 失敗 → 其餘仍繼續（partial failure tolerance），失敗記錄 log

---

### T15 — 學員評價系統

**目標：** 完課後可評分，評價顯示在老師詳情頁。

**依賴：** T12（需 ATTENDED 狀態）

**任務：**
- `POST /api/reviews`：
  - 驗證 `Reservation.status=ATTENDED` 且屬於本人
  - 每人每課只能評一次（DB unique constraint 已設）
- 老師詳情頁 `/teachers/[id]` 顯示評價牆（評分星星 + 留言）
- 課程卡顯示平均評分（aggregate query）

**驗收：**
- 未 ATTENDED 的學員嘗試評價 → 403
- 第二次評價同一課程 → 409
- 評分更新後，老師頁的平均分即時反映

---

## ✅ Checkpoint D

> **通過條件：**
> - 完整生命週期：預約 → 出席 → 評價
> - 完整退款路徑：學員取消（>24h）、老師取消批量退款
> - 老師無法看到學員 email
>
> **通過後才能進 Phase 4**

---

## Phase 4：通知與訊息

### T16 — LINE Notify 通知

**目標：** 新報名時老師收到 LINE Notify 推播。

**依賴：** T8（付款完成時觸發）

**任務：**
- `lib/lineNotify.ts`：封裝 LINE Notify API
- 老師 profile 頁：綁定 LINE Notify token（OAuth flow）
- Payment confirm 流程末尾：若 teacher 有 notify token → 推播訊息

**驗收：**
- 付款成功後 1 分鐘內老師 LINE 收到通知
- 老師未綁定 → 不影響付款流程（silent fail + log）

---

### T17 — 站內私訊

**目標：** 老師與學員可互發私訊。

**依賴：** T2

**任務：**
- `/messages/[userId]` 頁面：對話介面（Client Component + polling 每 10 秒）
- `GET /api/messages/:threadId`、`POST /api/messages`
- 未讀訊息計數顯示在 navbar

**驗收：**
- 訊息只對 sender 和 receiver 可見（第三者訪問 → 403）
- 未讀紅點在發訊後出現，讀訊後消失

---

## ✅ Checkpoint E（Phase 5 前）

> **通過條件：**
> - LINE Notify 沙盒測試通過
> - 私訊只有雙方可見

---

## Phase 5：管理後台

### T18 — Admin 老師管理

**目標：** Admin 可審核、停權、設定分潤。

**依賴：** T3

**任務：**
- `/admin/teachers` 頁：
  - 待審核清單 + 審核按鈕（`isVerified=true`）
  - 現有老師列表 + 停權/恢復按鈕（`isHidden=true/false`）
  - 每位老師設定 commission（百分比 % 或月費 NT$）
- `PATCH /api/admin/teachers/:id`：role guard = ADMIN only

**驗收：**
- 審核通過後老師可發課
- 停權後老師課程立即從公開搜尋消失
- 非 ADMIN 呼叫 API → 403

---

### T19 — 分潤自動計算

**目標：** 每筆付款自動按設定分潤，結果可匯出。

**依賴：** T18（Commission 設定）、T8（Payment）

**任務：**
- T8 的 Payment confirm transaction 中，讀取 `Commission.rate` 計算：
  ```typescript
  platformFee = amount * commission.rate
  teacherAmount = amount - platformFee
  ```
- `/admin/teachers/[id]/report`：老師月結報表（月份篩選 + CSV 匯出）
- CSV 欄位：日期、課程名、學員、金額、平台抽成、老師所得

**驗收：**
- rate=0.15 → platformFee = amount × 0.15（精確到小數點兩位）
- CSV 匯出含正確數字，可用 Excel 開啟

---

### T20 — 自動停權（月費催收）

**目標：** 月費老師未繳費則自動隱藏課表。

**依賴：** T18（Commission.plan=MONTHLY）

**任務：**
- Vercel Cron Job（每日執行）：
  - 找出 `plan=MONTHLY` 且今天 > `billingDay + 5`（寬限 5 天）
  - 且本月無手動繳費記錄（需新增簡單 `MonthlyPayment` 記錄表）
  - 自動設 `isHidden=true`
- Admin 手動覆寫：可強制恢復（override flag）

**驗收：**
- 模擬逾期老師：cron 執行後 `isHidden=true`
- Admin 手動恢復 → `isHidden=false`，課程重新出現

---

### T21 — 行銷數據看板

**目標：** Admin 可看平台整體數據。

**依賴：** T8、T15

**任務：**
- `/admin/dashboard` 頁：
  - 總收入 / 平台抽成 / 老師應付款（本月 + 累計）
  - 熱門老師排行（依本月預約數 DESC）
  - 熱門時段熱圖（week × hour，PostgreSQL aggregate）
- 所有查詢加 `startAt >= 月初` 條件避免全表掃

**驗收：**
- Seed 資料下，看板顯示正確合計數字
- 熱圖 X 軸 = 星期一～日，Y 軸 = 0-23 時

---

### T22 — 廣告版位管理

**目標：** Admin 可管理首頁廣告，帶來額外收入。

**依賴：** T0（頁面存在即可）

**任務：**
- `/admin/ads` 頁：新增/停用廣告（Cloudinary 上傳 Banner 圖）
- 首頁讀取 `Advertisement where isActive=true AND startAt<=now AND endAt>=now`
- HOMEPAGE_BANNER：滿版輪播
- FEATURED_TEACHER：側邊推薦老師卡（連結到 `/teachers/[id]`）

**驗收：**
- 新增廣告 → 首頁立即顯示
- 超過 endAt → 自動不顯示（query 條件控制，無需 cron）

---

## ✅ Checkpoint F（完整平台）

> **通過條件：**
> - Admin 完整流程：審核老師 → 設定分潤 → 查看月結報表
> - 自動停權 cron 模擬測試通過
> - 廣告有效期控制正確
> - E2E Playwright 測試：完整購買流程無中斷

---

## 任務總覽

| # | 任務 | Phase | 依賴 | 預估複雜度 |
|---|------|-------|------|-----------|
| T0 | 專案鷹架 | 0 | — | S |
| T1 | Prisma Schema | 0 | T0 | M |
| T2 | Auth + Middleware | 0 | T1 | M |
| T3 | 老師審核流程 | 1 | T2 | S |
| T4 | 老師個人檔案 | 1 | T3 | M |
| T5 | 課程建立 | 1 | T4 | M |
| T6 | 公開瀏覽頁 | 1 | T5 | M |
| T7 | 學員預約 | 2 | T6 | M |
| T8 | LINE Pay 付款 | 2 | T7 | L |
| T9 | QR Code + Email | 2 | T8 | M |
| T10 | 學員個人課表 | 2 | T8 | S |
| T11 | 老師預約管理 | 3 | T8 | S |
| T12 | QR 掃描簽到 | 3 | T9 | M |
| T13 | 學員取消+退款 | 3 | T8 | M |
| T14 | 老師取消+批量退款 | 3 | T13 | M |
| T15 | 評價系統 | 3 | T12 | S |
| T16 | LINE Notify | 4 | T8 | S |
| T17 | 站內私訊 | 4 | T2 | M |
| T18 | Admin 老師管理 | 5 | T3 | M |
| T19 | 分潤計算+報表 | 5 | T18 | M |
| T20 | 自動停權 | 5 | T18 | M |
| T21 | 數據看板 | 5 | T8+T15 | M |
| T22 | 廣告管理 | 5 | T0 | S |

> S = 半天，M = 1 天，L = 2 天
