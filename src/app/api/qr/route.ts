import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";

// Only allow safe tag IDs: alphanumeric, hyphen, underscore, dot, plus — max 128 chars
const SAFE_ID = /^[a-zA-Z0-9\-_.+]{1,128}$/;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tagId = req.nextUrl.searchParams.get("tagId") ?? "";
  if (!SAFE_ID.test(tagId)) {
    return NextResponse.json({ error: "Invalid tagId" }, { status: 400 });
  }

  const appUrl = (process.env.APP_URL ?? "https://twojenfc.pl").replace(/\/$/, "");
  const qrData = `${appUrl}/s/${tagId}?source=qr`;

  const pngBuffer: Buffer = await QRCode.toBuffer(qrData, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${tagId}.png"`,
      "Cache-Control": "no-store",
    },
  });
}
