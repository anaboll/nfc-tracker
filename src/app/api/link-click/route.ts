import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, extractIp } from "@/lib/utils";

// POST - record a link click (public endpoint, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tagId, linkUrl, linkLabel, linkIcon } = body;

    if (!tagId || !linkUrl) {
      return NextResponse.json({ error: "tagId and linkUrl required" }, { status: 400 });
    }

    const headers = request.headers;
    const rawIp = extractIp(
      headers.get("x-forwarded-for"),
      headers.get("x-real-ip"),
      headers.get("cf-connecting-ip")
    );
    const ipHash = hashIp(rawIp);

    await prisma.linkClick.create({
      data: {
        tagId,
        linkUrl,
        linkLabel: linkLabel || null,
        linkIcon: linkIcon || null,
        ipHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LinkClick record error:", error);
    return NextResponse.json({ error: "Failed to record click" }, { status: 500 });
  }
}

// GET - get link click stats for a tag (protected)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId required" }, { status: 400 });
    }

    const clicks = await prisma.linkClick.groupBy({
      by: ["linkUrl", "linkLabel", "linkIcon"],
      where: { tagId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const total = clicks.reduce((sum, c) => sum + c._count.id, 0);

    const result = clicks.map((c) => ({
      linkUrl: c.linkUrl,
      linkLabel: c.linkLabel,
      linkIcon: c.linkIcon,
      clicks: c._count.id,
      percent: total > 0 ? Math.round((c._count.id / total) * 100) : 0,
    }));

    return NextResponse.json({ tagId, total, links: result });
  } catch (error) {
    console.error("LinkClick stats error:", error);
    return NextResponse.json({ error: "Failed to get click stats" }, { status: 500 });
  }
}
