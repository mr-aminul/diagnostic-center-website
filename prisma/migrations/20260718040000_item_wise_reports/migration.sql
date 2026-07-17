-- Report moves from one-per-booking to one-per-booking-item.

ALTER TABLE "reports" ADD COLUMN "bookingItemId" TEXT;

-- Attach legacy booking-level reports to the first line item.
UPDATE "reports" AS r
SET "bookingItemId" = (
  SELECT bi."id"
  FROM "booking_items" AS bi
  WHERE bi."bookingId" = r."bookingId"
  ORDER BY bi."id" ASC
  LIMIT 1
);

-- Drop reports that have no items to attach to.
DELETE FROM "reports" WHERE "bookingItemId" IS NULL;

DROP INDEX IF EXISTS "reports_bookingId_key";

ALTER TABLE "reports" ALTER COLUMN "bookingItemId" SET NOT NULL;

CREATE UNIQUE INDEX "reports_bookingItemId_key" ON "reports"("bookingItemId");
CREATE INDEX "reports_bookingId_idx" ON "reports"("bookingId");

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_bookingItemId_fkey"
  FOREIGN KEY ("bookingItemId") REFERENCES "booking_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
