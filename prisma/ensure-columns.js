const { PrismaClient } = require("@prisma/client");

/**
 * Idempotent column/index migration for NFC Tracker.
 * Adds all telemetry columns (P0) to Scan, LinkClick, VideoEvent.
 *
 * Safety features:
 * - Advisory lock prevents concurrent runs
 * - Wrapped in transaction (BEGIN/COMMIT) for atomicity
 * - Post-migration validation checks all expected columns exist
 * - Hard-fails (exit 1) if anything fails
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    // -----------------------------------------------------------------------
    // Advisory lock – prevent concurrent migrations
    // -----------------------------------------------------------------------
    console.log("Acquiring advisory lock...");
    await prisma.$executeRawUnsafe("SELECT pg_advisory_lock(42424242)");
    console.log("  OK: Advisory lock acquired");

    // -----------------------------------------------------------------------
    // Begin transaction
    // -----------------------------------------------------------------------
    await prisma.$executeRawUnsafe("BEGIN");
    console.log("  OK: Transaction started");

    // -----------------------------------------------------------------------
    // Helper: run SQL with logging
    // -----------------------------------------------------------------------
    async function run(label, sql) {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  OK: ${label}`);
    }

    // =======================================================================
    // 1. SCAN TABLE – existing columns
    // =======================================================================
    console.log("\n--- Scan table ---");

    await run("Scan.nfcId column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "nfcId" TEXT');
    await run("Scan.nfcId index",
      'CREATE INDEX IF NOT EXISTS "Scan_nfcId_idx" ON "Scan"("nfcId")');

    // --- Scan P0 telemetry columns ---
    await run("Scan.visitorId column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "visitorId" TEXT');
    await run("Scan.sessionId column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "sessionId" TEXT');
    await run("Scan.utmSource column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "utmSource" TEXT');
    await run("Scan.utmMedium column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT');
    await run("Scan.utmCampaign column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT');
    await run("Scan.utmContent column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "utmContent" TEXT');
    await run("Scan.utmTerm column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT');
    await run("Scan.gclid column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "gclid" TEXT');
    await run("Scan.fbclid column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "fbclid" TEXT');
    await run("Scan.acceptLanguage column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "acceptLanguage" TEXT');
    await run("Scan.path column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "path" TEXT');
    await run("Scan.query column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "query" TEXT');
    await run("Scan.rawMeta column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "rawMeta" TEXT');
    await run("Scan.ipPrefix column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "ipPrefix" TEXT');
    await run("Scan.ipVersion column",
      'ALTER TABLE "Scan" ADD COLUMN IF NOT EXISTS "ipVersion" INTEGER');

    // --- Scan P0 telemetry indexes ---
    await run("Scan (tagId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "Scan_tagId_timestamp_idx" ON "Scan"("tagId", "timestamp")');
    await run("Scan (visitorId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "Scan_visitorId_timestamp_idx" ON "Scan"("visitorId", "timestamp")');

    console.log("Scan telemetry columns ensured");

    // =======================================================================
    // 2. CLIENT TABLE
    // =======================================================================
    console.log("\n--- Client table ---");

    await run("Client table",
      `CREATE TABLE IF NOT EXISTS "Client" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "color" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      )`);
    await run("Client.slug unique index",
      'CREATE UNIQUE INDEX IF NOT EXISTS "Client_slug_key" ON "Client"("slug")');
    await run("Client.isActive index",
      'CREATE INDEX IF NOT EXISTS "Client_isActive_idx" ON "Client"("isActive")');
    console.log("Client table ensured");

    // =======================================================================
    // 3. TAG – clientId
    // =======================================================================
    console.log("\n--- Tag.clientId ---");

    await run("Tag.clientId column",
      'ALTER TABLE "Tag" ADD COLUMN IF NOT EXISTS "clientId" TEXT');
    await run("Tag.clientId index",
      'CREATE INDEX IF NOT EXISTS "Tag_clientId_idx" ON "Tag"("clientId")');
    console.log("Tag.clientId ensured");

    // =======================================================================
    // 4. LINKCLICK TABLE + P0 telemetry
    // =======================================================================
    console.log("\n--- LinkClick table ---");

    await run("LinkClick table",
      `CREATE TABLE IF NOT EXISTS "LinkClick" (
        "id" TEXT NOT NULL,
        "tagId" TEXT NOT NULL,
        "linkUrl" TEXT NOT NULL,
        "linkLabel" TEXT,
        "linkIcon" TEXT,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipHash" TEXT,
        CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
      )`);
    await run("LinkClick.tagId index",
      'CREATE INDEX IF NOT EXISTS "LinkClick_tagId_idx" ON "LinkClick"("tagId")');
    await run("LinkClick.timestamp index",
      'CREATE INDEX IF NOT EXISTS "LinkClick_timestamp_idx" ON "LinkClick"("timestamp")');
    await run("LinkClick (tagId, linkUrl) index",
      'CREATE INDEX IF NOT EXISTS "LinkClick_tagId_linkUrl_idx" ON "LinkClick"("tagId", "linkUrl")');

    // --- LinkClick P0 telemetry columns ---
    await run("LinkClick.visitorId column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "visitorId" TEXT');
    await run("LinkClick.sessionId column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "sessionId" TEXT');
    await run("LinkClick.utmSource column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "utmSource" TEXT');
    await run("LinkClick.utmMedium column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT');
    await run("LinkClick.utmCampaign column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT');
    await run("LinkClick.utmContent column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "utmContent" TEXT');
    await run("LinkClick.utmTerm column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT');
    await run("LinkClick.gclid column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "gclid" TEXT');
    await run("LinkClick.fbclid column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "fbclid" TEXT');
    await run("LinkClick.acceptLanguage column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "acceptLanguage" TEXT');
    await run("LinkClick.userAgent column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "userAgent" TEXT');
    await run("LinkClick.deviceType column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "deviceType" TEXT');
    await run("LinkClick.referrer column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "referrer" TEXT');
    await run("LinkClick.path column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "path" TEXT');
    await run("LinkClick.query column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "query" TEXT');
    await run("LinkClick.rawMeta column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "rawMeta" TEXT');
    await run("LinkClick.ipPrefix column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "ipPrefix" TEXT');
    await run("LinkClick.ipVersion column",
      'ALTER TABLE "LinkClick" ADD COLUMN IF NOT EXISTS "ipVersion" INTEGER');

    // --- LinkClick P0 telemetry indexes ---
    await run("LinkClick (tagId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "LinkClick_tagId_timestamp_idx" ON "LinkClick"("tagId", "timestamp")');
    await run("LinkClick (visitorId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "LinkClick_visitorId_timestamp_idx" ON "LinkClick"("visitorId", "timestamp")');

    console.log("LinkClick telemetry columns ensured");

    // =======================================================================
    // 5. VIDEOEVENT TABLE + P0 telemetry
    // =======================================================================
    console.log("\n--- VideoEvent table ---");

    await run("VideoEvent table",
      `CREATE TABLE IF NOT EXISTS "VideoEvent" (
        "id" TEXT NOT NULL,
        "tagId" TEXT NOT NULL,
        "event" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipHash" TEXT,
        "watchTime" DOUBLE PRECISION,
        CONSTRAINT "VideoEvent_pkey" PRIMARY KEY ("id")
      )`);
    await run("VideoEvent.tagId index",
      'CREATE INDEX IF NOT EXISTS "VideoEvent_tagId_idx" ON "VideoEvent"("tagId")');
    await run("VideoEvent.timestamp index",
      'CREATE INDEX IF NOT EXISTS "VideoEvent_timestamp_idx" ON "VideoEvent"("timestamp")');
    await run("VideoEvent (tagId, event) index",
      'CREATE INDEX IF NOT EXISTS "VideoEvent_tagId_event_idx" ON "VideoEvent"("tagId", "event")');

    // --- VideoEvent P0 telemetry columns ---
    await run("VideoEvent.visitorId column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "visitorId" TEXT');
    await run("VideoEvent.sessionId column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "sessionId" TEXT');
    await run("VideoEvent.utmSource column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "utmSource" TEXT');
    await run("VideoEvent.utmMedium column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT');
    await run("VideoEvent.utmCampaign column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT');
    await run("VideoEvent.utmContent column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "utmContent" TEXT');
    await run("VideoEvent.utmTerm column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT');
    await run("VideoEvent.gclid column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "gclid" TEXT');
    await run("VideoEvent.fbclid column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "fbclid" TEXT');
    await run("VideoEvent.acceptLanguage column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "acceptLanguage" TEXT');
    await run("VideoEvent.userAgent column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "userAgent" TEXT');
    await run("VideoEvent.deviceType column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "deviceType" TEXT');
    await run("VideoEvent.referrer column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "referrer" TEXT');
    await run("VideoEvent.path column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "path" TEXT');
    await run("VideoEvent.query column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "query" TEXT');
    await run("VideoEvent.rawMeta column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "rawMeta" TEXT');
    await run("VideoEvent.ipPrefix column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "ipPrefix" TEXT');
    await run("VideoEvent.ipVersion column",
      'ALTER TABLE "VideoEvent" ADD COLUMN IF NOT EXISTS "ipVersion" INTEGER');

    // --- VideoEvent P0 telemetry indexes ---
    await run("VideoEvent (tagId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "VideoEvent_tagId_timestamp_idx" ON "VideoEvent"("tagId", "timestamp")');
    await run("VideoEvent (visitorId, timestamp) index",
      'CREATE INDEX IF NOT EXISTS "VideoEvent_visitorId_timestamp_idx" ON "VideoEvent"("visitorId", "timestamp")');

    console.log("VideoEvent telemetry columns ensured");

    // =======================================================================
    // COMMIT transaction
    // =======================================================================
    await prisma.$executeRawUnsafe("COMMIT");
    console.log("\n  OK: Transaction committed");

    // =======================================================================
    // POST-MIGRATION VALIDATION
    // =======================================================================
    console.log("\n--- Validating schema ---");

    const EXPECTED_COLUMNS = {
      Scan: [
        "id", "tagId", "timestamp", "ipHash", "deviceType", "userAgent",
        "browserLang", "city", "country", "region", "isReturning", "referrer",
        "eventSource", "nfcId",
        // P0 telemetry
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "path", "query", "rawMeta", "ipPrefix", "ipVersion",
      ],
      LinkClick: [
        "id", "tagId", "linkUrl", "linkLabel", "linkIcon", "timestamp", "ipHash",
        // P0 telemetry
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "userAgent", "deviceType", "referrer", "path", "query", "rawMeta",
        "ipPrefix", "ipVersion",
      ],
      VideoEvent: [
        "id", "tagId", "event", "timestamp", "ipHash", "watchTime",
        // P0 telemetry
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "userAgent", "deviceType", "referrer", "path", "query", "rawMeta",
        "ipPrefix", "ipVersion",
      ],
    };

    const missing = [];
    for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
      const result = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        table
      );
      const existing = new Set(result.map((r) => r.column_name));
      for (const col of columns) {
        if (!existing.has(col)) {
          missing.push(`${table}.${col}`);
        }
      }
    }

    if (missing.length > 0) {
      console.error("FATAL: Missing columns after migration:", missing.join(", "));
      process.exit(1);
    }
    console.log("  OK: All expected columns verified");

    // =======================================================================
    console.log("\n=== All ensure-columns completed successfully ===\n");
  } catch (e) {
    // Rollback on any error
    try {
      await prisma.$executeRawUnsafe("ROLLBACK");
      console.error("  Transaction rolled back");
    } catch (rollbackErr) {
      // Rollback may fail if not in transaction, that's OK
    }
    console.error("FATAL: ensure-columns failed:", e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    // Always release advisory lock
    try {
      await prisma.$executeRawUnsafe("SELECT pg_advisory_unlock(42424242)");
      console.log("  Advisory lock released");
    } catch { /* ignore */ }
    await prisma.$disconnect();
  }
}

main();
