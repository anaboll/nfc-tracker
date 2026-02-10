const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    // Scan.nfcId
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "nfcId" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Scan_nfcId_idx" ON "Scan"("nfcId")'
    );
    console.log("Scan.nfcId ensured");

    // Client table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Client" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "color" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "Client_slug_key" ON "Client"("slug")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Client_isActive_idx" ON "Client"("isActive")'
    );
    console.log("Client table ensured");

    // Tag.clientId
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "clientId" TEXT'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "Tag_clientId_idx" ON "Tag"("clientId")'
    );
    console.log("Tag.clientId ensured");

    // LinkClick table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LinkClick" (
        "id" TEXT NOT NULL,
        "tagId" TEXT NOT NULL,
        "linkUrl" TEXT NOT NULL,
        "linkLabel" TEXT,
        "linkIcon" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipHash" TEXT,
        CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "LinkClick_tagId_idx" ON "LinkClick"("tagId")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "LinkClick_timestamp_idx" ON "LinkClick"("timestamp")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "LinkClick_tagId_linkUrl_idx" ON "LinkClick"("tagId", "linkUrl")'
    );
    console.log("LinkClick table ensured");

    // VideoEvent table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VideoEvent" (
        "id" TEXT NOT NULL,
        "tagId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipHash" TEXT,
        "watchTime" DOUBLE PRECISION,
        CONSTRAINT "VideoEvent_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "VideoEvent_tagId_idx" ON "VideoEvent"("tagId")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "VideoEvent_timestamp_idx" ON "VideoEvent"("timestamp")'
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS "VideoEvent_tagId_event_idx" ON "VideoEvent"("tagId", "event")'
    );
    console.log("VideoEvent table ensured");
  } catch (e) {
    console.log("Column check error (non-fatal):", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
