-- Add password reset fields to User
ALTER TABLE "User"
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpires" TIMESTAMP(3);
