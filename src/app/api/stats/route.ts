import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const tagFilter = url.searchParams.get("tag");
  // Multi-tag filter: ?tags=id1,id2,id3 — takes precedence over single ?tag=
  const tagsParam = url.searchParams.get("tags");
  const tagIdsFilter: string[] | null = tagsParam ? tagsParam.split(",").filter(Boolean) : null;
  const clientFilter = url.searchParams.get("clientId");
  const campaignFilter = url.searchParams.get("campaignId");
  const weekOffset = parseInt(url.searchParams.get("weekOffset") || "0");
  // source filter: "qr" | "nfc" | null (null = all)
  const sourceFilter = url.searchParams.get("source") || null;

  // Default: all-time when no date range is provided (consistent with clients/campaigns
  // badge counts which never apply a date filter). The UI date-filter is opt-in;
  // absence of from/to params means "show everything". Previously defaulted to last 30
  // days, causing the KPI card to diverge from the client-dropdown scan badges (Bug B3).
  const fromDate = fromParam ? new Date(fromParam) : new Date(0);
  const toDate = toParam ? new Date(toParam) : new Date();
  // Only normalise to end-of-day when caller sent a date-only string (no "T" separator)
  if (!toParam || !toParam.includes("T")) {
    toDate.setHours(23, 59, 59, 999);
  }

  // Build tag ID filter based on client/campaign selection
  let filteredTagIds: string[] | null = null;
  if (campaignFilter) {
    const campaignTags = await prisma.tag.findMany({
      where: { campaignId: campaignFilter },
      select: { id: true },
    });
    filteredTagIds = campaignTags.map(t => t.id);
  } else if (clientFilter) {
    const clientTags = await prisma.tag.findMany({
      where: { clientId: clientFilter },
      select: { id: true },
    });
    filteredTagIds = clientTags.map(t => t.id);
  }

  // Base where clause — only include timestamp constraint when caller explicitly provided dates
  const whereBase: Record<string, unknown> = {};
  if (fromParam || toParam) {
    whereBase.timestamp = { gte: fromDate, lte: toDate };
  }
  if (tagIdsFilter && tagIdsFilter.length > 0) {
    // Multi-tag filter: explicitly selected tags
    whereBase.tagId = tagIdsFilter.length === 1 ? tagIdsFilter[0] : { in: tagIdsFilter };
  } else if (tagFilter) {
    whereBase.tagId = tagFilter;
  } else if (filteredTagIds !== null) {
    whereBase.tagId = { in: filteredTagIds };
  }
  // source filter: QR scans have eventSource="qr", NFC scans have eventSource="nfc" or null
  if (sourceFilter === "qr") {
    whereBase.eventSource = "qr";
  } else if (sourceFilter === "nfc") {
    whereBase.eventSource = { not: "qr" };
  }

  const [totalScans, uniqueIps, lastScan] = await Promise.all([
    prisma.scan.count({ where: whereBase }),
    prisma.scan.groupBy({ by: ["ipHash"], where: whereBase, _count: true }),
    prisma.scan.findFirst({ where: whereBase, orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
  ]);

  const uniqueCount = uniqueIps.length;
  const avgScansPerUser = uniqueCount > 0 ? Math.round((totalScans / uniqueCount) * 10) / 10 : 0;

  // Device breakdown
  const deviceStats = await prisma.scan.groupBy({
    by: ["deviceType"],
    where: whereBase,
    _count: { deviceType: true },
  });
  const deviceMap: Record<string, number> = {};
  for (const d of deviceStats) deviceMap[d.deviceType] = d._count.deviceType;

  // Top tags - with unique user counts per tag
  const topTags = await prisma.scan.groupBy({
    by: ["tagId"],
    where: whereBase,
    _count: { tagId: true },
    orderBy: { _count: { tagId: "desc" } },
    take: 10,
  });
  const tagIds = topTags.map((t) => t.tagId);
  const tagDetails = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
    select: { id: true, name: true },
  });
  const tagNameMap = Object.fromEntries(tagDetails.map((t) => [t.id, t.name]));

  // Unique users per tag
  const tagUniqueStats = tagIds.length > 0 ? await prisma.scan.groupBy({
    by: ["tagId", "ipHash"],
    where: { ...whereBase, tagId: { in: tagIds } },
    _count: true,
  }) : [];
  const tagUniqueMap: Record<string, number> = {};
  for (const row of tagUniqueStats) {
    tagUniqueMap[row.tagId] = (tagUniqueMap[row.tagId] || 0) + 1;
  }

  const topTagsData = topTags.map((t) => ({
    tagId: t.tagId,
    tagName: tagNameMap[t.tagId] || t.tagId,
    count: t._count.tagId,
    uniqueUsers: tagUniqueMap[t.tagId] || 0,
    percent: totalScans > 0 ? Math.round((t._count.tagId / totalScans) * 100) : 0,
  }));

  // Countries - with unique users
  const countryStats = await prisma.scan.groupBy({
    by: ["country"],
    where: { ...whereBase, country: { not: null } },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });
  const countryNames = countryStats.map(c => c.country).filter(Boolean) as string[];
  const countryUniqueStats = countryNames.length > 0 ? await prisma.scan.groupBy({
    by: ["country", "ipHash"],
    where: { ...whereBase, country: { in: countryNames } },
    _count: true,
  }) : [];
  const countryUniqueMap: Record<string, number> = {};
  for (const row of countryUniqueStats) {
    const key = row.country || "Unknown";
    countryUniqueMap[key] = (countryUniqueMap[key] || 0) + 1;
  }
  const topCountries = countryStats.map((c) => ({
    country: c.country || "Unknown",
    count: c._count.country,
    uniqueUsers: countryUniqueMap[c.country || "Unknown"] || 0,
    percent: totalScans > 0 ? Math.round((c._count.country / totalScans) * 100) : 0,
  }));

  // Cities - with unique users
  const cityStats = await prisma.scan.groupBy({
    by: ["city", "country"],
    where: { ...whereBase, city: { not: null } },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 10,
  });
  const cityNames = cityStats.map(c => c.city).filter(Boolean) as string[];
  const cityUniqueStats = cityNames.length > 0 ? await prisma.scan.groupBy({
    by: ["city", "ipHash"],
    where: { ...whereBase, city: { in: cityNames } },
    _count: true,
  }) : [];
  const cityUniqueMap: Record<string, number> = {};
  for (const row of cityUniqueStats) {
    const key = row.city || "Unknown";
    cityUniqueMap[key] = (cityUniqueMap[key] || 0) + 1;
  }
  const topCities = cityStats.map((c) => ({
    city: c.city || "Unknown",
    country: c.country || "",
    count: c._count.city,
    uniqueUsers: cityUniqueMap[c.city || "Unknown"] || 0,
  }));

  // Languages - with unique users
  const langStats = await prisma.scan.groupBy({
    by: ["browserLang"],
    where: { ...whereBase, browserLang: { not: null } },
    _count: { browserLang: true },
    orderBy: { _count: { browserLang: "desc" } },
    take: 10,
  });
  const totalLangs = langStats.reduce((sum, l) => sum + l._count.browserLang, 0);
  const langNames = langStats.map(l => l.browserLang).filter(Boolean) as string[];
  const langUniqueStats = langNames.length > 0 ? await prisma.scan.groupBy({
    by: ["browserLang", "ipHash"],
    where: { ...whereBase, browserLang: { in: langNames } },
    _count: true,
  }) : [];
  const langUniqueMap: Record<string, number> = {};
  for (const row of langUniqueStats) {
    const key = row.browserLang || "unknown";
    langUniqueMap[key] = (langUniqueMap[key] || 0) + 1;
  }
  const topLanguages = langStats.map((l) => ({
    lang: l.browserLang || "unknown",
    count: l._count.browserLang,
    uniqueUsers: langUniqueMap[l.browserLang || "unknown"] || 0,
    percent: totalLangs > 0 ? Math.round((l._count.browserLang / totalLangs) * 100) : 0,
  }));

  // Weekly trend (always scoped to the specific calendar week, independent of main filter)
  const now = new Date();
  const dow = now.getDay();
  const diff = now.getDate() - dow + (dow === 0 ? -6 : 1);
  const weekStart = new Date(now);
  weekStart.setDate(diff + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Weekly where always uses its own explicit date range
  const weeklyWhere: Record<string, unknown> = {
    timestamp: { gte: weekStart, lte: weekEnd },
  };
  if (tagIdsFilter && tagIdsFilter.length > 0) {
    weeklyWhere.tagId = tagIdsFilter.length === 1 ? tagIdsFilter[0] : { in: tagIdsFilter };
  } else if (tagFilter) {
    weeklyWhere.tagId = tagFilter;
  } else if (filteredTagIds !== null) {
    weeklyWhere.tagId = { in: filteredTagIds };
  }
  if (sourceFilter === "qr") {
    weeklyWhere.eventSource = "qr";
  } else if (sourceFilter === "nfc") {
    weeklyWhere.eventSource = { not: "qr" };
  }

  // Weekly: fetch timestamp + ipHash for unique counting on client
  const weeklyScans = await prisma.scan.findMany({
    where: weeklyWhere,
    select: { timestamp: true, ipHash: true },
  });

  const weekDays = ["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"];
  const weeklyData = weekDays.map((day, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    const dayScans = weeklyScans.filter((s) => {
      const t = new Date(s.timestamp);
      return t >= dayStart && t <= dayEnd;
    });
    const uniqueIpsDay = new Set(dayScans.map(s => s.ipHash));
    return { day, date: dayDate.toISOString().split("T")[0], count: dayScans.length, uniqueUsers: uniqueIpsDay.size };
  });

  // NFC chip breakdown
  let nfcChips: { nfcId: string; count: number }[] = [];
  try {
    const nfcStats = await prisma.scan.groupBy({
      by: ["nfcId"],
      where: { ...whereBase, nfcId: { not: null } },
      _count: { nfcId: true },
      orderBy: { _count: { nfcId: "desc" } },
      take: 50,
    });
    nfcChips = nfcStats.map((n) => ({
      nfcId: n.nfcId || "unknown",
      count: n._count.nfcId,
    }));
  } catch { /* nfcId column may not exist yet */ }

  // Hourly: send timestamp + ipHash so client can compute both total and unique per hour
  const hourlyScans = await prisma.scan.findMany({
    where: whereBase,
    select: { timestamp: true, ipHash: true },
  });
  const hourlyRaw = hourlyScans.map(s => ({ t: s.timestamp.toISOString(), ip: s.ipHash }));

  // All tags list (for filter dropdown)
  const tagWhere: Record<string, unknown> = {};
  if (campaignFilter) {
    tagWhere.campaignId = campaignFilter;
  } else if (clientFilter) {
    tagWhere.clientId = clientFilter;
  }
  const allTags = await prisma.tag.findMany({
    where: tagWhere,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    kpi: { totalScans, uniqueUsers: uniqueCount, lastScan: lastScan?.timestamp || null, avgScansPerUser },
    devices: { iOS: deviceMap["iOS"] || 0, Android: deviceMap["Android"] || 0, Desktop: deviceMap["Desktop"] || 0, total: totalScans },
    topTags: topTagsData,
    topCountries,
    topCities,
    topLanguages,
    nfcChips,
    weeklyTrend: { data: weeklyData, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() },
    hourlyRaw,
    allTags,
  });
}
