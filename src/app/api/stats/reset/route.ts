import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tagId } = body;

  if (tagId) {
    // Reset stats for specific tag
    const deleted = await prisma.scan.deleteMany({ where: { tagId } });
    return NextResponse.json({ ok: true, deleted: deleted.count, scope: tagId });
  } else {
    // Reset ALL stats
    const deleted = await prisma.scan.deleteMany();
    return NextResponse.json({ ok: true, deleted: deleted.count, scope: "all" });
  }
}
