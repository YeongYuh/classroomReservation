-- CreateTable
CREATE TABLE "MonthlyPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT
);

-- CreateIndex
CREATE INDEX "MonthlyPayment_yearMonth_idx" ON "MonthlyPayment"("yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPayment_teacherId_yearMonth_key" ON "MonthlyPayment"("teacherId", "yearMonth");
