const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "nfcId" TEXT'
    );
    console.log("nfcId column ensured");

    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Scan_nfcId_idx" ON "Scan"("nfcId")'
    );
    console.log("nfcId index ensured");
  } catch (e) {
    console.log("Column check error (non-fatal):", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
