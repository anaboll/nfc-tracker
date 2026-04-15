import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";
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
  // Videos (fallback — /api/video still handles range requests explicitly)
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  // Documents
  ".pdf": "application/pdf",
};

// Types that benefit from streaming (large payloads where the client may
// request byte ranges for progressive rendering — e.g. PDFs, videos).
const STREAMABLE_EXTS = new Set([".pdf", ".mp4", ".webm", ".mov"]);

/**
 * Parse a single-range "Range: bytes=start-end" header.
 * Supports: "bytes=0-499", "bytes=500-", "bytes=-500" (suffix length).
 * Returns null if header is missing/malformed/multi-range.
 */
function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return null;
  const startStr = match[1];
  const endStr = match[2];

  let start: number;
  let end: number;

  if (startStr === "" && endStr === "") return null;

  if (startStr === "") {
    // Suffix length: "bytes=-500" → last 500 bytes
    const suffixLen = parseInt(endStr, 10);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return null;
    start = Math.max(0, size - suffixLen);
    end = size - 1;
  } else {
    start = parseInt(startStr, 10);
    end = endStr === "" ? size - 1 : parseInt(endStr, 10);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < 0 || start > end || start >= size) return null;
  if (end >= size) end = size - 1;

  return { start, end };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path;

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

  const totalSize = fileStats.size;
  const isStreamable = STREAMABLE_EXTS.has(ext);
  const rangeHeader = request.headers.get("range");
  const range = isStreamable ? parseRange(rangeHeader, totalSize) : null;

  const commonHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400, immutable",
    "Last-Modified": fileStats.mtime.toUTCString(),
  };

  // Advertise range support for streamable files so the browser knows it can
  // request partial content on subsequent requests (progressive PDF/video).
  if (isStreamable) {
    commonHeaders["Accept-Ranges"] = "bytes";
  }

  // ---- 206 Partial Content (client asked for a byte range) ----
  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;
    const nodeStream = createReadStream(resolvedPath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Content-Length": chunkSize.toString(),
      },
    });
  }

  // ---- 416 Range Not Satisfiable (header present but malformed/out of bounds) ----
  if (rangeHeader && isStreamable && !range) {
    return new NextResponse(null, {
      status: 416,
      headers: {
        ...commonHeaders,
        "Content-Range": `bytes */${totalSize}`,
      },
    });
  }

  // ---- 200 OK full response ----
  if (isStreamable) {
    // Stream the file from disk (no RAM blow-up for large PDFs/videos)
    const nodeStream = createReadStream(resolvedPath);
    const webStream = Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...commonHeaders,
        "Content-Length": totalSize.toString(),
      },
    });
  }

  // Small static file (image): read into memory once (fast, simple)
  const fh = await open(resolvedPath, "r");
  const buffer = Buffer.alloc(totalSize);
  await fh.read(buffer, 0, totalSize, 0);
  await fh.close();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      ...commonHeaders,
      "Content-Length": totalSize.toString(),
    },
  });
}
