const { PrismaClient } = require("@prisma/client");

/**
 * Post-migration schema validator.
 * Checks that all expected columns and indexes exist.
 * Exits with code 1 if anything is missing.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("\n=== Schema Validation ===\n");

    // -----------------------------------------------------------------------
    // 1. Validate columns
    // -----------------------------------------------------------------------
    const EXPECTED_COLUMNS = {
      Scan: [
        "id", "tagId", "timestamp", "ipHash", "deviceType", "userAgent",
        "browserLang", "city", "country", "region", "isReturning", "referrer",
        "eventSource", "nfcId",
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "path", "query", "rawMeta", "ipPrefix", "ipVersion",
      ],
      LinkClick: [
        "id", "tagId", "linkUrl", "linkLabel", "linkIcon", "timestamp", "ipHash",
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "userAgent", "deviceType", "referrer", "path", "query", "rawMeta",
        "ipPrefix", "ipVersion",
      ],
      VideoEvent: [
        "id", "tagId", "event", "timestamp", "ipHash", "watchTime",
        "visitorId", "sessionId", "utmSource", "utmMedium", "utmCampaign",
        "utmContent", "utmTerm", "gclid", "fbclid", "acceptLanguage",
        "userAgent", "deviceType", "referrer", "path", "query", "rawMeta",
        "ipPrefix", "ipVersion",
      ],
      Tag: ["id", "name", "tagType", "targetUrl", "isActive", "clientId", "campaignId"],
      Client: ["id", "name", "slug", "isActive"],
      Campaign: ["id", "name", "clientId", "isActive"],
    };

    const missingColumns = [];
    for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
      const result = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        table
      );
      const existing = new Set(result.map((r) => r.column_name));

      for (const col of columns) {
        if (!existing.has(col)) {
          missingColumns.push(`${table}.${col}`);
        }
      }
      console.log(`  ${table}: ${existing.size} columns found, ${columns.length} expected`);
    }

    if (missingColumns.length > 0) {
      console.error("\nFATAL: Missing columns:", missingColumns.join(", "));
      process.exit(1);
    }
    console.log("  OK: All expected columns exist\n");

    // -----------------------------------------------------------------------
    // 2. Validate indexes
    // -----------------------------------------------------------------------
    const EXPECTED_INDEXES = [
      // Scan
      "Scan_tagId_timestamp_idx",
      "Scan_visitorId_timestamp_idx",
      "Scan_nfcId_idx",
      // LinkClick
      "LinkClick_tagId_timestamp_idx",
      "LinkClick_visitorId_timestamp_idx",
      // VideoEvent
      "VideoEvent_tagId_timestamp_idx",
      "VideoEvent_visitorId_timestamp_idx",
    ];

    const indexResult = await prisma.$queryRawUnsafe(
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
    );
    const existingIndexes = new Set(indexResult.map((r) => r.indexname));

    const missingIndexes = [];
    for (const idx of EXPECTED_INDEXES) {
      if (!existingIndexes.has(idx)) {
        missingIndexes.push(idx);
      }
    }

    if (missingIndexes.length > 0) {
      console.error("FATAL: Missing indexes:", missingIndexes.join(", "));
      process.exit(1);
    }
    console.log(`  OK: All ${EXPECTED_INDEXES.length} expected indexes exist`);

    console.log("\n=== Schema validation passed ===\n");
  } catch (e) {
    console.error("FATAL: Schema validation failed:", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
