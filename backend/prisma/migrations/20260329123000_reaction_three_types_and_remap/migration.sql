-- Remap legacy reaction types into the new 3-type model.
-- Avoid unique collisions by removing duplicates before updates.

-- 1) felt_this -> useful
DELETE FROM "Reaction" f
USING "Reaction" u
WHERE f."entryId" = u."entryId"
  AND f."userId" = u."userId"
  AND f."type" = 'felt_this'
  AND u."type" = 'useful';

UPDATE "Reaction"
SET "type" = 'useful'
WHERE "type" = 'felt_this';

-- 2) noted -> critical
DELETE FROM "Reaction" n
USING "Reaction" c
WHERE n."entryId" = c."entryId"
  AND n."userId" = c."userId"
  AND n."type" = 'noted'
  AND c."type" = 'critical';

UPDATE "Reaction"
SET "type" = 'critical'
WHERE "type" = 'noted';

-- 3) Enforce allowed types
ALTER TABLE "Reaction"
DROP CONSTRAINT IF EXISTS "reaction_type_check";

ALTER TABLE "Reaction"
ADD CONSTRAINT "reaction_type_check"
CHECK ("type" IN ('useful', 'critical', 'applied'));
