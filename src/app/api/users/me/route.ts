import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/me — get current user's viewerSections
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { viewerSections: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let sections: string[] | null = null;
  if (user.viewerSections) {
    try {
      const parsed = JSON.parse(user.viewerSections);
      sections = Array.isArray(parsed) ? parsed : null;
    } catch {
      sections = null;
    }
  }

  return NextResponse.json({ viewerSections: sections });
}
