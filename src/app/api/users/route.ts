import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Protected admin accounts — cannot be deleted/edited by other users
const PROTECTED_ADMINS = ["marcins91", "admin"];

function isAdmin(session: { user: { role?: string } } | null): boolean {
  return session?.user?.role === "admin";
}

// GET /api/users — list all users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mustChangePass: true,
      viewerSections: true,
      createdAt: true,
      clients: {
        select: {
          client: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const result = users
    .filter((u) => !PROTECTED_ADMINS.includes(u.email))
    .map((u) => ({
      ...u,
      clients: u.clients.map((uc) => uc.client),
    }));

  return NextResponse.json(result);
}

// POST /api/users — create new user (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { email, password, name, role, clientIds, viewerSections } = body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    clientIds?: string[];
    viewerSections?: string[];
  };

  if (!email || !password) {
    return NextResponse.json({ error: "Email i hasło są wymagane" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Hasło musi mieć minimum 6 znaków" }, { status: 400 });
  }

  const validRoles = ["admin", "viewer"];
  const userRole = validRoles.includes(role || "") ? role! : "viewer";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Użytkownik z tym emailem już istnieje" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
      role: userRole,
      mustChangePass: true,
      viewerSections: viewerSections ? JSON.stringify(viewerSections) : null,
      ...(clientIds && clientIds.length > 0
        ? {
            clients: {
              create: clientIds.map((cid) => ({ clientId: cid })),
            },
          }
        : {}),
    },
    select: { id: true, email: true, name: true, role: true, viewerSections: true },
  });

  return NextResponse.json(user, { status: 201 });
}

// PUT /api/users — update user (admin only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { id, email, password, name, role, clientIds, viewerSections } = body as {
    id?: string;
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    clientIds?: string[];
    viewerSections?: string[] | null;
  };

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Użytkownik nie znaleziony" }, { status: 404 });

  // Protect master admin accounts
  if (PROTECTED_ADMINS.includes(existing.email)) {
    return NextResponse.json({ error: "Nie można edytować tego konta" }, { status: 403 });
  }

  // Prevent demoting yourself
  if (id === session.user.id && role && role !== "admin") {
    return NextResponse.json({ error: "Nie możesz zmienić swojej roli" }, { status: 400 });
  }

  const validRoles = ["admin", "viewer"];
  const data: Record<string, unknown> = {};

  if (email && email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) return NextResponse.json({ error: "Ten email jest już zajęty" }, { status: 409 });
    data.email = email;
  }
  if (name !== undefined) data.name = name || null;
  if (role && validRoles.includes(role)) data.role = role;
  if (password && password.length >= 6) {
    data.password = await bcrypt.hash(password, 12);
    data.mustChangePass = true;
  }
  if (viewerSections !== undefined) {
    data.viewerSections = viewerSections ? JSON.stringify(viewerSections) : null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, viewerSections: true },
  });

  // Update client assignments if provided
  if (clientIds !== undefined) {
    await prisma.userClient.deleteMany({ where: { userId: id } });
    if (clientIds.length > 0) {
      await prisma.userClient.createMany({
        data: clientIds.map((cid) => ({ userId: id, clientId: cid })),
      });
    }
  }

  return NextResponse.json(user);
}

// DELETE /api/users — delete user (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // Protect master admin accounts
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  if (target && PROTECTED_ADMINS.includes(target.email)) {
    return NextResponse.json({ error: "Nie można usunąć tego konta" }, { status: 403 });
  }

  // Prevent deleting yourself
  if (id === session.user.id) {
    return NextResponse.json({ error: "Nie możesz usunąć swojego konta" }, { status: 400 });
  }

  // Check at least one admin remains
  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  if (target?.role === "admin" && adminCount <= 1) {
    return NextResponse.json({ error: "Musi pozostać przynajmniej jeden admin" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
