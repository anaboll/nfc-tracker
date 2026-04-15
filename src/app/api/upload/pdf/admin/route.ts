import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, rename, stat, unlink } from "fs/promises";
import { spawn } from "child_process";
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
// Allow up to 60s for large PDF uploads over slower connections + linearization
export const maxDuration = 60;

const MAX_SIZE_MB = 100;
const ALLOWED_TYPES = ["application/pdf"];

/**
 * Linearize a PDF in-place using qpdf. Linearization reorders internal
 * structure so the first page (and cross-reference table) sit near the
 * start of the byte stream — combined with HTTP Range requests this
 * enables progressive rendering in browser PDF viewers.
 *
 * Fails gracefully: if qpdf is missing or the input PDF cannot be
 * linearized (rare — e.g. corrupt cross-ref tables), logs a warning
 * and leaves the original file untouched. The upload still succeeds.
 */
async function linearizePdf(filepath: string): Promise<{ linearized: boolean; warning?: string }> {
  const tmpPath = `${filepath}.lin.tmp`;
  return new Promise((resolve) => {
    const proc = spawn("qpdf", ["--linearize", filepath, tmpPath], {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      // Binary missing or spawn failed
      resolve({ linearized: false, warning: `qpdf spawn error: ${err.message}` });
    });

    proc.on("close", async (code) => {
      // qpdf: exit 0 = clean, 3 = warnings (still produces valid linearized output)
      if (code === 0 || code === 3) {
        try {
          const tmpStats = await stat(tmpPath);
          if (tmpStats.size > 0) {
            await rename(tmpPath, filepath);
            resolve({
              linearized: true,
              warning: code === 3 ? `qpdf warnings: ${stderr.slice(0, 200)}` : undefined,
            });
            return;
          }
        } catch {
          /* fall through */
        }
      }
      // Cleanup tmp file (best-effort)
      try { await unlink(tmpPath); } catch { /* ignore */ }
      resolve({
        linearized: false,
        warning: `qpdf exit ${code}: ${stderr.slice(0, 200)}`,
      });
    });
  });
}

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

    // Linearize for progressive browser rendering (web-optimized PDF).
    // Best-effort — if qpdf fails, the original (non-linearized) file
    // still serves correctly via /api/uploads, just renders slightly slower.
    const linResult = await linearizePdf(filepath);
    if (linResult.warning) {
      console.warn("PDF linearize:", linResult.warning);
    }

    // Size may shrink/grow slightly after linearization
    let finalSize = file.size;
    try {
      const s = await stat(filepath);
      finalSize = s.size;
    } catch { /* keep uploaded size */ }

    const urlPath = `/api/uploads/${filename}`;

    return NextResponse.json({
      ok: true,
      path: urlPath,
      size: finalSize,
      filename,
      linearized: linResult.linearized,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "Upload nie powiodl sie" },
      { status: 500 }
    );
  }
}
