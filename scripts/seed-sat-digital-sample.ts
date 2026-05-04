/**
 * CLI: creates the SAT Digital sample exam (same data as POST /api/admin/exams/seed-sat-sample).
 *
 * From repo root (requires DATABASE_URL, e.g. production in env):
 *   npx tsx scripts/seed-sat-digital-sample.ts
 *
 * Recreate only when the sample has no bookings (safe replace):
 *   npx tsx scripts/seed-sat-digital-sample.ts --force
 */

import { PrismaClient } from "@prisma/client";
import { seedSatDigitalSample } from "../src/lib/seed-sat-digital-sample";

const prisma = new PrismaClient();

async function main() {
  const force = process.argv.includes("--force");
  const result = await seedSatDigitalSample(prisma, { replaceIfSafe: force });
  console.log(result.message);
  console.log("examId:", result.examId, "action:", result.action);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
