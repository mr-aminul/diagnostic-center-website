-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "doctor_appointments" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "gender" "Gender",
    "serialNumber" INTEGER NOT NULL,
    "appointmentDate" DATE NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_appointments_phone_idx" ON "doctor_appointments"("phone");

-- CreateIndex
CREATE INDEX "doctor_appointments_doctorId_appointmentDate_idx" ON "doctor_appointments"("doctorId", "appointmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_appointments_doctorId_appointmentDate_serialNumber_key" ON "doctor_appointments"("doctorId", "appointmentDate", "serialNumber");

-- AddForeignKey
ALTER TABLE "doctor_appointments" ADD CONSTRAINT "doctor_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
