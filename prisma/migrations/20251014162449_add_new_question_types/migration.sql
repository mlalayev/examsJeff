/*
  Warnings:

  - The values [MCQ,ORDER,DND_MATCH] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('TF', 'MCQ_SINGLE', 'MCQ_MULTI', 'SELECT', 'GAP', 'ORDER_SENTENCE', 'DND_GAP', 'SHORT_TEXT', 'ESSAY');
ALTER TABLE "questions" ALTER COLUMN "qtype" TYPE "QuestionType_new" USING ("qtype"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "public"."QuestionType_old";
COMMIT;
