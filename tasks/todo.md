# tasks/todo.md — 執行清單

> 按順序執行，每個 ✅ Checkpoint 前需全部通過驗收才繼續。

## Phase 0：地基

- [x] T0 — 專案鷹架（Next.js 16 + TS + Vitest + Playwright）
- [x] T1 — Prisma Schema + Migration + Seed
- [x] T2 — NextAuth.js + Middleware + Role-based routing

**✅ Checkpoint A**：三 role 可登入，路由保護正確，DB seed 完整

---

## Phase 1：老師供給側

- [x] T3 — 老師審核流程（待審核頁 + Admin 審核按鈕）
- [x] T4 — 老師個人檔案編輯器（Cloudinary 上傳）
- [x] T5 — 課程建立（日曆介面 + 標籤）
- [x] T6 — 公開課程瀏覽頁（搜尋 + 老師詳情頁）

**✅ Checkpoint B**：老師完整流程可跑，消費者可搜尋課程

---

## Phase 2：預約與付款

- [x] T7 — 學員預約（含超賣保護）
- [x] T8 — LINE Pay 付款整合（含 Webhook + signature 驗證）
- [x] T9 — QR Code 產生 + Resend Email 確認
- [x] T10 — 學員個人課表頁

**✅ Checkpoint C**：搜尋→預約→付款→QR Code→Email 全流程通

---

## Phase 3：課程生命週期

- [x] T11 — 老師預約管理介面（名單不含 email）
- [x] T12 — QR Code 掃描簽到
- [x] T13 — 學員取消預約 + 退款（24h 規則）
- [x] T14 — 老師取消課程 + 批量退款 + Email 通知
- [x] T15 — 學員評價系統

**✅ Checkpoint D**：完整生命週期與退款路徑驗證通過

---

## Phase 4：通知與訊息

- [x] T16 — LINE Notify 推播（付款成功後通知老師）
- [x] T17 — 站內私訊（老師 ↔ 學員）

**✅ Checkpoint E**：通知沙盒測試通過，私訊權限正確

---

## Phase 5：管理後台

- [x] T18 — Admin 老師管理（審核 + 停權 + 分潤設定）
- [x] T19 — 分潤自動計算 + 月結報表 CSV 匯出
- [x] T20 — 自動停權 Cron Job（月費逾期）
- [x] T21 — 行銷數據看板（收入、熱門老師、熱門時段）
- [x] T22 — 廣告版位管理（Banner + 推薦老師）

**✅ Checkpoint F**：平台完整可自運作，E2E 全流程通過
