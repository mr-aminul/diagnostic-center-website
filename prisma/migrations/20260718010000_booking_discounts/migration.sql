-- CreateEnum
CREATE TYPE "BookingLedgerKind" AS ENUM ('PAYMENT', 'DISCOUNT');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "booking_payments" ADD COLUMN "kind" "BookingLedgerKind" NOT NULL DEFAULT 'PAYMENT';
ALTER TABLE "booking_payments" ALTER COLUMN "method" DROP NOT NULL;

-- Convert waived remaining balances into discount rows
INSERT INTO "booking_payments" ("id", "bookingId", "kind", "amount", "method", "reference", "note", "paidAt", "createdAt")
SELECT
  gen_random_uuid()::text,
  b."id",
  'DISCOUNT',
  GREATEST(b."estimatedTotal" - b."amountPaid", 0),
  NULL,
  NULL,
  'Migrated from waived balance',
  COALESCE(b."paidAt", b."updatedAt"),
  COALESCE(b."paidAt", b."updatedAt")
FROM "bookings" b
WHERE b."paymentStatus" = 'WAIVED'
  AND (b."estimatedTotal" - b."amountPaid") > 0
  AND NOT EXISTS (
    SELECT 1 FROM "booking_payments" p
    WHERE p."bookingId" = b."id" AND p."kind" = 'DISCOUNT'
  );

UPDATE "bookings" b
SET
  "discountTotal" = GREATEST(b."estimatedTotal" - b."amountPaid", 0),
  "paymentStatus" = 'PAID'
WHERE b."paymentStatus" = 'WAIVED';