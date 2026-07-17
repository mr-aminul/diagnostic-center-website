-- CreateTable
CREATE TABLE "booking_payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_payments_bookingId_paidAt_idx" ON "booking_payments"("bookingId", "paidAt");

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrate existing single-amount payments into ledger rows
INSERT INTO "booking_payments" ("id", "bookingId", "amount", "method", "reference", "note", "paidAt", "createdAt")
SELECT
  gen_random_uuid()::text,
  b."id",
  b."amountPaid",
  b."paymentMethod",
  b."paymentReference",
  'Migrated from previous payment record',
  COALESCE(b."paidAt", b."updatedAt"),
  COALESCE(b."paidAt", b."updatedAt")
FROM "bookings" b
WHERE b."amountPaid" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "booking_payments" p WHERE p."bookingId" = b."id"
  );
