/*
  Warnings:

  - The `visibility` column on the `Collection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `template_type` on the `Reflection` table. All the data in the column will be lost.
  - The `impact` column on the `Reflection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `visibility` column on the `Reflection` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isPrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordResetToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Reaction` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `category` on the `Reflection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `content` on table `Reflection` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ReflectionCategory" AS ENUM ('design_decision', 'technical_challenge', 'tradeoff', 'lesson_learned', 'bug_autopsy', 'integration_note');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "IndexState" AS ENUM ('UNINDEXED', 'QUEUED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('MINOR', 'MODERATE', 'CRITICAL', 'BREAKING');

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_userId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_entryId_fkey";

-- DropForeignKey
ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_userId_fkey";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "visibility",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'public';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Reflection" DROP COLUMN "template_type",
ADD COLUMN     "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "category",
ADD COLUMN     "category" "ReflectionCategory" NOT NULL,
DROP COLUMN "impact",
ADD COLUMN     "impact" "ImpactLevel" NOT NULL DEFAULT 'MINOR',
ALTER COLUMN "content" SET NOT NULL,
DROP COLUMN "visibility",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'public';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isPrivate",
DROP COLUMN "passwordResetToken",
ADD COLUMN     "passwordResetTokenHash" TEXT,
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'public';

-- DropTable
DROP TABLE "Reaction";

-- CreateTable
CREATE TABLE "ProjectMembers" (
    "id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Codebase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "indexState" "IndexState" NOT NULL DEFAULT 'UNINDEXED',
    "lastIndexedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Codebase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionThread" (
    "id" TEXT NOT NULL,
    "reflectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReflectionThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMembers_userId_projectId_key" ON "ProjectMembers"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_entryId_userId_key" ON "Vote"("entryId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReflectionThread_reflectionId_key" ON "ReflectionThread"("reflectionId");

-- CreateIndex
CREATE INDEX "Reflection_userId_occurredAt_idx" ON "Reflection"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "Reflection_projectId_occurredAt_idx" ON "Reflection"("projectId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- AddForeignKey
ALTER TABLE "ProjectMembers" ADD CONSTRAINT "ProjectMembers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMembers" ADD CONSTRAINT "ProjectMembers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Codebase" ADD CONSTRAINT "Codebase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionThread" ADD CONSTRAINT "ReflectionThread_reflectionId_fkey" FOREIGN KEY ("reflectionId") REFERENCES "Reflection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadMessage" ADD CONSTRAINT "ThreadMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ReflectionThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadMessage" ADD CONSTRAINT "ThreadMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
