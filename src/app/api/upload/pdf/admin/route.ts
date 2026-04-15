import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ------------------------------------------------------------------ */
/*  POST — Upload PDF (admin session auth)                             */
/*                                                                     */
/*  Used by:                                                           */
/*   - Tag type "file" (sets tag.targetUrl)                            */
/*   - vCard custom-link editor (sets DisplayItem.url)                 */
/*                                                                     */
/*  Returns { ok: true, path: "/api/uploads/<filename>" }.             */
/*  Does NOT touch the DB — caller persists the path in their own      */
/*  save flow (POST /api/tags or tag edit).                            */
/* ------------------------------------------------------------------ */

export const runtime = "nodejs";
// Allow up to 60s for large PDF uploads over slower connections
export const maxDuration = 60;

const MAX_SIZE_MB = 100;
const ALLOWED_TYPES = ["application/pdf"];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    // Optional: tagId is used only for the filename prefix so uploads are
    // traceable on disk. If missing, a generic prefix is used.
    const tagId = (formData.get("tagId") as string | null)?.trim() || null;
    // Optional: "context" lets the caller tag the filename (e.g. "catalog")
    const ctx = (formData.get("context") as string | null)?.trim() || "file";

    if (!file) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Dozwolony format: PDF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Maksymalny rozmiar: ${MAX_SIZE_MB}MB` },
        { status: 413 }
      );
    }

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Sanitize context + tagId for filesystem safety
    const safeCtx = ctx.replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "file";
    const safeTagId = tagId ? tagId.replace(/[^a-z0-9-]/gi, "").slice(0, 48) : `tmp-${Date.now()}`;
    const filename = `${safeTagId}-${safeCtx}-${Date.now()}.pdf`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const urlPath = `/api/uploads/${filename}`;

    return NextResponse.json({
      ok: true,
      path: urlPath,
      size: file.size,
      filename,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Upload nie powiodl sie" },
      { status: 500 }
    );
  }
}
