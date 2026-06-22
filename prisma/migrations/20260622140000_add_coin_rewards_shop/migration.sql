-- CreateEnum
CREATE TYPE "CoinRewardCategory" AS ENUM ('DRINK', 'FOOD', 'DISCOUNT', 'OTHER');

-- AlterEnum
ALTER TYPE "CoinTransactionType" ADD VALUE 'REDEEMED';
ALTER TYPE "CoinTransactionSource" ADD VALUE 'REWARD_SHOP';

-- AlterTable
ALTER TABLE "coin_transactions" ADD COLUMN "rewardId" TEXT;

-- CreateTable
CREATE TABLE "coin_rewards" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coinCost" INTEGER NOT NULL,
    "category" "CoinRewardCategory" NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎁',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coin_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_rewards_slug_key" ON "coin_rewards"("slug");
CREATE INDEX "coin_rewards_isActive_sortOrder_idx" ON "coin_rewards"("isActive", "sortOrder");
CREATE INDEX "coin_transactions_rewardId_idx" ON "coin_transactions"("rewardId");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "coin_rewards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default rewards
INSERT INTO "coin_rewards" ("id", "slug", "title", "description", "coinCost", "category", "icon", "isActive", "sortOrder", "updatedAt") VALUES
  ('reward_coffee', 'free-coffee', 'Free Coffee', 'Redeem for one coffee at the JEFF lounge.', 25, 'DRINK', '☕', true, 1, CURRENT_TIMESTAMP),
  ('reward_tea', 'free-tea', 'Free Tea', 'Redeem for a hot or iced tea.', 15, 'DRINK', '🍵', true, 2, CURRENT_TIMESTAMP),
  ('reward_juice', 'fresh-juice', 'Fresh Juice', 'Redeem for a fresh juice of your choice.', 20, 'DRINK', '🧃', true, 3, CURRENT_TIMESTAMP),
  ('reward_croissant', 'croissant-snack', 'Croissant & Snack', 'Redeem for a croissant or pastry snack.', 30, 'FOOD', '🥐', true, 10, CURRENT_TIMESTAMP),
  ('reward_sandwich', 'lunch-sandwich', 'Lunch Sandwich', 'Redeem for a sandwich combo at the lounge.', 45, 'FOOD', '🥪', true, 11, CURRENT_TIMESTAMP),
  ('reward_pizza', 'pizza-slice', 'Pizza Slice', 'Redeem for one slice of pizza.', 50, 'FOOD', '🍕', true, 12, CURRENT_TIMESTAMP),
  ('reward_discount_10', 'discount-10', '10% Discount Voucher', '10% off your next course payment or merch purchase.', 60, 'DISCOUNT', '🏷️', true, 20, CURRENT_TIMESTAMP),
  ('reward_discount_15', 'discount-15', '15% Discount Voucher', '15% off your next course payment.', 90, 'DISCOUNT', '💳', true, 21, CURRENT_TIMESTAMP),
  ('reward_exam_discount', 'exam-fee-discount', '20% Exam Fee Discount', '20% off your next mock exam booking fee.', 80, 'DISCOUNT', '📝', true, 22, CURRENT_TIMESTAMP);
