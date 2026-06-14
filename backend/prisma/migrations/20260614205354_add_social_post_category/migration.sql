/*
  Warnings:

  - The values [design_decision,technical_challenge,tradeoff,lesson_learned,bug_autopsy,integration_note] on the enum `ReflectionCategory` will be removed. If these variants are still used in the database, this will fail.
  - The values [public,private] on the enum `Visibility` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReflectionCategory_new" AS ENUM ('DESIGN_DECISION', 'TECHNICAL_CHALLENGE', 'TRADEOFF', 'LESSON_LEARNED', 'BUG_AUTOPSY', 'INTEGRATION_NOTE', 'SOCIAL_POST');
ALTER TABLE "Reflection" ALTER COLUMN "category" TYPE "ReflectionCategory_new" USING ("category"::text::"ReflectionCategory_new");
ALTER TYPE "ReflectionCategory" RENAME TO "ReflectionCategory_old";
ALTER TYPE "ReflectionCategory_new" RENAME TO "ReflectionCategory";
DROP TYPE "public"."ReflectionCategory_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Visibility_new" AS ENUM ('PUBLIC', 'PRIVATE');
ALTER TABLE "public"."Collection" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "public"."Reflection" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "visibility" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "visibility" TYPE "Visibility_new" USING ("visibility"::text::"Visibility_new");
ALTER TABLE "Reflection" ALTER COLUMN "visibility" TYPE "Visibility_new" USING ("visibility"::text::"Visibility_new");
ALTER TABLE "Collection" ALTER COLUMN "visibility" TYPE "Visibility_new" USING ("visibility"::text::"Visibility_new");
ALTER TYPE "Visibility" RENAME TO "Visibility_old";
ALTER TYPE "Visibility_new" RENAME TO "Visibility";
DROP TYPE "public"."Visibility_old";
ALTER TABLE "Collection" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
ALTER TABLE "Reflection" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
ALTER TABLE "User" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "Reflection" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';
