-- CreateEnum
CREATE TYPE "InquiryReplyChannel" AS ENUM ('EMAIL', 'SMS');

-- AlterTable
ALTER TABLE "contact_inquiries" ADD COLUMN "repliedAt" TIMESTAMP(3),
ADD COLUMN "replyBody" TEXT,
ADD COLUMN "replyChannel" "InquiryReplyChannel";
