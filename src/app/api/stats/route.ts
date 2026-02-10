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
  const weekOffset = parseInt(url.searchParams.get("weekOffset") || "0");

  const fromDate = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = toParam ? new Date(toParam) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const whereBase: Record<string, unknown> = {
    timestamp: { gte: fromDate, lte: toDate },
  };
  if (tagFilter) {
    whereBase.tagId = tagFilter;
  }

  const [totalScans, uniqueIps, lastScan, returningCount] = await Promise.all([
    prisma.scan.count({ where: whereBase }),
    prisma.scan.groupBy({ by: ["ipHash"], where: whereBase, _count: true }),
    prisma.scan.findFirst({ where: whereBase, orderBy: { timestamp: "desc" }, select: { timestamp: true } }),
    prisma.scan.count({ where: { ...whereBase, isReturning: true } }),
  ]);

  const uniqueCount = uniqueIps.length;
  const returningPercent = totalScans > 0 ? Math.round((returningCount / totalScans) * 100) : 0;

  // Device breakdown
  const deviceStats = await prisma.scan.groupBy({
    by: ["deviceType"],
    where: whereBase,
    _count: { deviceType: true },
  });
  const deviceMap: Record<string, number> = {};
  for (const d of deviceStats) deviceMap[d.deviceType] = d._count.deviceType;

  // Top tags
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
  const topTagsData = topTags.map((t) => ({
    tagId: t.tagId,
    tagName: tagNameMap[t.tagId] || t.tagId,
    count: t._count.tagId,
    percent: totalScans > 0 ? Math.round((t._count.tagId / totalScans) * 100) : 0,
  }));

  // Countries
  const countryStats = await prisma.scan.groupBy({
    by: ["country"],
    where: { ...whereBase, country: { not: null } },
    _count: { country: true },
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });
  const topCountries = countryStats.map((c) => ({
    country: c.country || "Unknown",
    count: c._count.country,
    percent: totalScans > 0 ? Math.round((c._count.country / totalScans) * 100) : 0,
  }));

  // Cities
  const cityStats = await prisma.scan.groupBy({
    by: ["city", "country"],
    where: { ...whereBase, city: { not: null } },
    _count: { city: true },
    orderBy: { _count: { city: "desc" } },
    take: 10,
  });
  const topCities = cityStats.map((c) => ({
    city: c.city || "Unknown",
    country: c.country || "",
    count: c._count.city,
  }));

  // Languages
  const langStats = await prisma.scan.groupBy({
    by: ["browserLang"],
    where: { ...whereBase, browserLang: { not: null } },
    _count: { browserLang: true },
    orderBy: { _count: { browserLang: "desc" } },
    take: 10,
  });
  const totalLangs = langStats.reduce((sum, l) => sum + l._count.browserLang, 0);
  const topLanguages = langStats.map((l) => ({
    lang: l.browserLang || "unknown",
    count: l._count.browserLang,
    percent: totalLangs > 0 ? Math.round((l._count.browserLang / totalLangs) * 100) : 0,
  }));

  // Weekly trend
  const now = new Date();
  const dow = now.getDay();
  const diff = now.getDate() - dow + (dow === 0 ? -6 : 1);
  const weekStart = new Date(now);
  weekStart.setDate(diff + weekOffset * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weeklyScans = await prisma.scan.findMany({
    where: {
      timestamp: { gte: weekStart, lte: weekEnd },
      ...(tagFilter ? { tagId: tagFilter } : {}),
    },
    select: { timestamp: true },
  });

  const weekDays = ["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"];
  const weeklyData = weekDays.map((day, index) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + index);
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    const count = weeklyScans.filter((s) => {
      const t = new Date(s.timestamp);
      return t >= dayStart && t <= dayEnd;
    }).length;
    return { day, date: dayDate.toISOString().split("T")[0], count };
  });

  // NFC chip breakdown (physical keychains) - wrapped in try/catch
  // in case nfcId column doesn't exist yet (migration not run)
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

  // All tags list (for filter dropdown)
  const allTags = await prisma.tag.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    kpi: { totalScans, uniqueUsers: uniqueCount, lastScan: lastScan?.timestamp || null, returningPercent },
    devices: { iOS: deviceMap["iOS"] || 0, Android: deviceMap["Android"] || 0, Desktop: deviceMap["Desktop"] || 0, total: totalScans },
    topTags: topTagsData,
    topCountries,
    topCities,
    topLanguages,
    nfcChips,
    weeklyTrend: { data: weeklyData, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() },
    allTags,
  });
}
