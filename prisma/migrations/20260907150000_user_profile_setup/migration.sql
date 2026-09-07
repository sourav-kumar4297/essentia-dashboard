-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "team" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileSetupComplete" BOOLEAN NOT NULL DEFAULT false;

-- Existing known / super accounts skip onboarding; other rows stay false so they set up once.
UPDATE "User"
SET "profileSetupComplete" = true
WHERE "role" = 'SUPERADMIN'
   OR "email" IN (
     'admin@essentia.com',
     'member@essentia.com',
     'souravkumar4297@gmail.com'
   );
