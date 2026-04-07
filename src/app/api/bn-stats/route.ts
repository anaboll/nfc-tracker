import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Private read-only stats endpoint for the Bydgoszcz real estate campaign.
 *
 * Returns scan/visitor counts per agency, split by tracking type:
 *   - jtd     = hash tracker scans (#jak-to-dziala/CODE)
 *   - vcard   = vCard redirect scans (/s/wizytowka/CODE)
 *
 * Auth via ?token= query param matched against env BN_STATS_TOKEN.
 * CORS open so a local file:// HTML dashboard can poll it.
 *
 * Response shape:
 * {
 *   timestamp: ISO,
 *   campaignName: string,
 *   totalScans: number,
 *   totalUniqueVisitors: number,
 *   agencies: [
 *     { code, name, jtd: { scans, unique }, vcard: { scans, unique }, totalScans, anyClicks }
 *   ]
 * }
 */

const CAMPAIGN_NAME = "Biura Nieruchomości Bydgoszcz";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expectedToken = process.env.BN_STATS_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "BN_STATS_TOKEN not configured on server" },
      { status: 500, headers: corsHeaders() }
    );
  }

  if (!token || token !== expectedToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() }
    );
  }

  try {
    // Find the campaign
    const campaign = await prisma.campaign.findFirst({
      where: { name: CAMPAIGN_NAME },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404, headers: corsHeaders() }
      );
    }

    // Get all tags for this campaign
    const tags = await prisma.tag.findMany({
      where: { campaignId: campaign.id },
      select: { id: true, name: true },
    });

    // Build a map: code -> { name, jtdTagId, vcardTagId }
    // Hash tracker tags use the code directly (e.g. "2BPE")
    // vCard tracker tags use "wizytowka-CODE" (e.g. "wizytowka-2BPE")
    const agencyMap = new Map<string, { name: string; jtdTagId: string; vcardTagId: string }>();

    for (const tag of tags) {
      if (tag.id.startsWith("wizytowka-")) {
        const code = tag.id.substring("wizytowka-".length);
        const existing = agencyMap.get(code);
        if (existing) {
          existing.vcardTagId = tag.id;
        } else {
          agencyMap.set(code, {
            name: tag.name.replace(/^Wizytówka -> /, ""),
            jtdTagId: code, // assume hash tag exists
            vcardTagId: tag.id,
          });
        }
      } else {
        const existing = agencyMap.get(tag.id);
        if (existing) {
          existing.name = tag.name;
          existing.jtdTagId = tag.id;
        } else {
          agencyMap.set(tag.id, {
            name: tag.name,
            jtdTagId: tag.id,
            vcardTagId: `wizytowka-${tag.id}`,
          });
        }
      }
    }

    // Fetch scan counts for all relevant tags in one query
    const tagIds = Array.from(agencyMap.values()).flatMap((a) => [a.jtdTagId, a.vcardTagId]);

    const scans = await prisma.scan.findMany({
      where: { tagId: { in: tagIds } },
      select: { tagId: true, ipHash: true },
    });

    // Aggregate per tag
    const perTag = new Map<string, { scans: number; uniques: Set<string> }>();
    for (const scan of scans) {
      const entry = perTag.get(scan.tagId) || { scans: 0, uniques: new Set<string>() };
      entry.scans++;
      if (scan.ipHash) entry.uniques.add(scan.ipHash);
      perTag.set(scan.tagId, entry);
    }

    // Build agency rows
    const agencies = Array.from(agencyMap.entries())
      .map(([code, info]) => {
        const jtd = perTag.get(info.jtdTagId) || { scans: 0, uniques: new Set<string>() };
        const vcard = perTag.get(info.vcardTagId) || { scans: 0, uniques: new Set<string>() };
        return {
          code,
          name: info.name,
          jtd: { scans: jtd.scans, unique: jtd.uniques.size },
          vcard: { scans: vcard.scans, unique: vcard.uniques.size },
          totalScans: jtd.scans + vcard.scans,
          anyClicks: jtd.scans + vcard.scans > 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));

    // Total uniques (across all tags in campaign, deduplicated by ipHash)
    const allUniques = new Set<string>();
    for (const scan of scans) {
      if (scan.ipHash) allUniques.add(scan.ipHash);
    }

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        campaignName: CAMPAIGN_NAME,
        totalScans: scans.length,
        totalUniqueVisitors: allUniques.size,
        agencies,
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("bn-stats error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500, headers: corsHeaders() }
    );
  }
}
