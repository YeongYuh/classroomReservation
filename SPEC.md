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
