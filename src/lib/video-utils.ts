import path from "path";
import { unlink } from "fs/promises";
import { prisma } from "@/lib/prisma";

/**
 * Safely delete a video file from disk after verifying:
 * 1. The path is inside the uploads directory (no traversal).
 * 2. No other tag still references this file path.
 *
 * @param videoFile - the value stored in tag.videoFile, e.g. "/uploads/abc-123.mp4"
 */
export async function safeDeleteVideoFile(videoFile: string | null | undefined): Promise<void> {
  if (!videoFile) return;

  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

    // Extract only the basename — never trust the stored path directly.
    // Stored format is always "/uploads/<filename>" — take the last segment only.
    const basename = path.basename(videoFile);
    if (!basename || basename === "." || basename === "..") {
      console.warn("[video-utils] Rejected suspicious videoFile path:", videoFile);
      return;
    }

    // Resolve the absolute target path and verify it stays inside uploadDir.
    const resolved = path.resolve(uploadDir, basename);
    const resolvedDir = path.resolve(uploadDir);
    if (!resolved.startsWith(resolvedDir + path.sep) && resolved !== resolvedDir) {
      console.warn("[video-utils] Path traversal attempt blocked:", resolved);
      return;
    }

    // Check whether any other tag still references this exact videoFile string.
    const refCount = await prisma.tag.count({
      where: { videoFile },
    });
    if (refCount > 0) {
      // Another tag still uses the file — keep it.
      return;
    }

    await unlink(resolved);
    console.log("[video-utils] Deleted orphan video file:", basename);
  } catch (err: unknown) {
    // ENOENT = file already gone; either way do not propagate.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[video-utils] Failed to delete video file:", videoFile, err);
    }
  }
}
