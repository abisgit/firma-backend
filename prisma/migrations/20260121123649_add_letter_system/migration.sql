/*
  Warnings:

  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocumentWorkflow` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'SENT', 'RECEIVED', 'CC', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LetterType" AS ENUM ('HIERARCHICAL', 'CROSS_STRUCTURE', 'STAFF', 'C_STAFF', 'HEAD_OFFICE', 'GUEST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrganizationType" ADD VALUE 'SUB_ORGANIZATION';
ALTER TYPE "OrganizationType" ADD VALUE 'OFFICE';

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentWorkflow" DROP CONSTRAINT "DocumentWorkflow_actionById_fkey";

-- DropForeignKey
ALTER TABLE "DocumentWorkflow" DROP CONSTRAINT "DocumentWorkflow_documentId_fkey";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "location" TEXT,
ADD COLUMN     "parentOrganizationId" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "position" TEXT;

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "DocumentWorkflow";

-- DropEnum
DROP TYPE "DocumentStatus";

-- CreateTable
CREATE TABLE "LetterTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "letterType" "LetterType" NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LetterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Letter" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "letterType" "LetterType" NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "classification" "Classification" NOT NULL DEFAULT 'INTERNAL',
    "senderOrgId" TEXT NOT NULL,
    "recipientOrgId" TEXT,
    "recipientUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "templateId" TEXT,
    "letterDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Letter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterCC" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LetterCC_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetterAttachment" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LetterAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Letter_referenceNumber_key" ON "Letter"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LetterCC_letterId_organizationId_key" ON "LetterCC"("letterId", "organizationId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_parentOrganizationId_fkey" FOREIGN KEY ("parentOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_senderOrgId_fkey" FOREIGN KEY ("senderOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_recipientOrgId_fkey" FOREIGN KEY ("recipientOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Letter" ADD CONSTRAINT "Letter_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LetterTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterCC" ADD CONSTRAINT "LetterCC_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterCC" ADD CONSTRAINT "LetterCC_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetterAttachment" ADD CONSTRAINT "LetterAttachment_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
