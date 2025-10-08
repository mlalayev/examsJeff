-- CreateTable
CREATE TABLE "finance_txns" (
    "id" TEXT NOT NULL,
    "branchId" TEXT,
    "kind" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AZN',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_txns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_txns_branchId_occurredAt_idx" ON "finance_txns"("branchId", "occurredAt");

-- CreateIndex
CREATE INDEX "finance_txns_kind_occurredAt_idx" ON "finance_txns"("kind", "occurredAt");

-- CreateIndex
CREATE INDEX "finance_txns_category_occurredAt_idx" ON "finance_txns"("category", "occurredAt");

-- AddForeignKey
ALTER TABLE "finance_txns" ADD CONSTRAINT "finance_txns_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
