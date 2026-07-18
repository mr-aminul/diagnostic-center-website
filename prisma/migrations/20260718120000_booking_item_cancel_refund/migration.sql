-- AlterEnum
ALTER TYPE "BookingLedgerKind" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "booking_items" ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledById" TEXT,
ADD COLUMN "cancelReason" TEXT;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
