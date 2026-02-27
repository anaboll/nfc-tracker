import { NextRequest, NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/public/uploads";

const MIME_TYPES: Record<string, string> = {
  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  // Videos (fallback — /api/video still handles range requests)
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path;

  // Only allow a single filename, no subdirectories
  if (!segments || segments.length !== 1) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filename = segments[0];

  // Security: reject path traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_TYPES[ext];

  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Belt-and-suspenders: verify resolved path is within upload dir
  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(UPLOAD_DIR);
  if (!resolvedPath.startsWith(resolvedDir + path.sep) && resolvedPath !== resolvedDir) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  let fileStats;
  try {
    fileStats = await stat(resolvedPath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!fileStats.isFile()) {
    return NextResponse.json({ error: "Not a file" }, { status: 400 });
  }

  // For images: read entire file (images are small, no range requests needed)
  const buffer = await readFile(resolvedPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileStats.size.toString(),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
