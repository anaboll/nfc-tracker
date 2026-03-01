import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ------------------------------------------------------------------ */
/*  POST — Upload vCard avatar photo (admin session auth)              */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tagId = formData.get("tagId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    /* Validate file type */
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Dozwolone formaty: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    /* Max 5MB */
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Maksymalny rozmiar: 5MB" }, { status: 400 });
    }

    /* Save file */
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "jpg";
    const identifier = tagId || `temp-${Date.now()}`;
    const filename = `vcard-${identifier}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const photoPath = `/api/uploads/${filename}`;

    /* If tagId provided and tag exists, update links.photo */
    if (tagId) {
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });
      if (tag && tag.tagType === "vcard") {
        const currentLinks = (tag.links as Record<string, unknown>) || {};
        currentLinks.photo = photoPath;
        await prisma.tag.update({
          where: { id: tagId },
          data: {
            links: currentLinks as unknown as Record<string, string>,
            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ ok: true, path: photoPath });
  } catch (error) {
    console.error("Admin photo upload error:", error);
    return NextResponse.json({ error: "Upload nie powiodl sie" }, { status: 500 });
  }
}
