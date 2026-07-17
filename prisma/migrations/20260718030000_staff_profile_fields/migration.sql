-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM (
  'RECEPTION',
  'LABORATORY',
  'RADIOLOGY',
  'SAMPLE_COLLECTION',
  'BILLING',
  'ADMINISTRATION',
  'CUSTOMER_CARE'
);

-- AlterTable
ALTER TABLE "staff_users" ADD COLUMN "department" "StaffDepartment" NOT NULL DEFAULT 'ADMINISTRATION';
ALTER TABLE "staff_users" ADD COLUMN "jobTitle" TEXT;
ALTER TABLE "staff_users" ADD COLUMN "employeeCode" TEXT;
ALTER TABLE "staff_users" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_employeeCode_key" ON "staff_users"("employeeCode");

-- AddForeignKey
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
