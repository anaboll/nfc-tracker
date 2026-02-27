import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Haslo musi miec min. 8 znakow" }, { status: 400 });
  }

  // Verify current password (skip for mustChangePass flow where currentPassword is not sent)
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true, mustChangePass: true } });
  if (!user) {
    return NextResponse.json({ error: "Nie znaleziono uzytkownika" }, { status: 404 });
  }

  if (currentPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Nieprawidlowe obecne haslo" }, { status: 400 });
    }
  } else if (!user.mustChangePass) {
    // currentPassword is required unless user is in mustChangePass flow
    return NextResponse.json({ error: "Obecne haslo jest wymagane" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed, mustChangePass: false },
  });

  return NextResponse.json({ ok: true });
}
