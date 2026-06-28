-- AlterTable: store AES-encrypted password for creator-only recovery
ALTER TABLE "users" ADD COLUMN "passwordEncrypted" TEXT;
