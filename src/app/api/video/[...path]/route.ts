import { NextRequest, NextResponse } from "next/server";
import { stat, open } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/public/uploads";

const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ogg": "video/ogg",
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path;

  // Validate: only allow a single filename, no subdirectories
  if (!segments || segments.length !== 1) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const filename = segments[0];

  // Security: reject any path traversal attempts
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
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 415 }
    );
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Verify the resolved path is still within UPLOAD_DIR (belt-and-suspenders)
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

  const fileSize = fileStats.size;
  const rangeHeader = request.headers.get("range");

  // --- Range request (for video seeking) ---
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (!match) {
      return new NextResponse("Invalid Range", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    const chunkSize = end - start + 1;

    const fileHandle = await open(resolvedPath, "r");
    const stream = fileHandle.createReadStream({ start, end });

    // Convert Node.js Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        stream.on("end", () => {
          controller.close();
          fileHandle.close();
        });
        stream.on("error", (err) => {
          controller.error(err);
          fileHandle.close();
        });
      },
      cancel() {
        stream.destroy();
        fileHandle.close();
      },
    });

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunkSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  }

  // --- Full file request ---
  const fileHandle = await open(resolvedPath, "r");
  const stream = fileHandle.createReadStream();

  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      stream.on("end", () => {
        controller.close();
        fileHandle.close();
      });
      stream.on("error", (err) => {
        controller.error(err);
        fileHandle.close();
      });
    },
    cancel() {
      stream.destroy();
      fileHandle.close();
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileSize.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
