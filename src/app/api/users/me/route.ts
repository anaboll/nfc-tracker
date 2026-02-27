import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/me — get current user's profile + viewerSections
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, viewerSections: true },
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

  return NextResponse.json({
    name: user.name,
    email: user.email,
    role: user.role,
    viewerSections: sections,
  });
}

// PUT /api/users/me — update profile (name, viewerSections)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  // Update name (optional)
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }

  // Update viewerSections (optional — array of section keys)
  if (Array.isArray(body.viewerSections)) {
    data.viewerSections = JSON.stringify(body.viewerSections);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Brak danych do aktualizacji" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { name: true, email: true, role: true, viewerSections: true },
  });

  let sections: string[] | null = null;
  if (updated.viewerSections) {
    try {
      const parsed = JSON.parse(updated.viewerSections);
      sections = Array.isArray(parsed) ? parsed : null;
    } catch {
      sections = null;
    }
  }

  return NextResponse.json({
    name: updated.name,
    email: updated.email,
    role: updated.role,
    viewerSections: sections,
  });
}
