-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'BKASH';
ALTER TYPE "PaymentMethod" ADD VALUE 'NAGAD';
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'BANK';
ALTER TYPE "PaymentMethod" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill fully paid bookings so due/paid/balance skim correctly
UPDATE "bookings"
SET
  "amountPaid" = "estimatedTotal",
  "paidAt" = "updatedAt"
WHERE "paymentStatus" = 'PAID';
