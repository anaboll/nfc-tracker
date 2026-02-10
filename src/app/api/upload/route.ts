import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tagId = formData.get("tagId") as string | null;

    if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    if (!tagId) return NextResponse.json({ error: "Brak tagId" }, { status: 400 });

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Dozwolone formaty: MP4, WebM, MOV" }, { status: 400 });
    }

    // Max 500MB
    const maxSize = (parseInt(process.env.MAX_FILE_SIZE_MB || "500")) * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Max rozmiar pliku: ${process.env.MAX_FILE_SIZE_MB || 500}MB` }, { status: 400 });
    }

    // Check tag exists
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) return NextResponse.json({ error: "Tag nie istnieje" }, { status: 404 });

    // Save file
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() || "mp4";
    const filename = `${tagId}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update tag
    const videoUrl = `/uploads/${filename}`;
    await prisma.tag.update({
      where: { id: tagId },
      data: {
        videoFile: videoUrl,
        targetUrl: `/watch/${tagId}`,
      },
    });

    return NextResponse.json({ ok: true, videoUrl, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload nie powiodl sie" }, { status: 500 });
  }
}
