import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

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

  const format = req.nextUrl.searchParams.get("format") ?? "png"; // png | svg | pdf

  const appUrl = (process.env.APP_URL ?? "https://twojenfc.pl").replace(/\/$/, "");
  const qrData = `${appUrl}/s/${tagId}?source=qr`;

  // ── PNG ─────────────────────────────────────────────────────────────────────
  if (format === "png") {
    const pngBuffer: Buffer = await QRCode.toBuffer(qrData, {
      type: "png",
      width: 1024,              // 1024×1024 — crisp at 300dpi on ~8.5cm
      margin: 4,                // quiet zone: 4 modules per spec
      errorCorrectionLevel: "H",
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

  // ── SVG ─────────────────────────────────────────────────────────────────────
  if (format === "svg") {
    const svgString: string = await QRCode.toString(qrData, {
      type: "svg",
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    });

    return new NextResponse(svgString, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="qr-${tagId}.svg"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // ── PDF print page (HTML → browser print → PDF) ──────────────────────────────
  // Returns an HTML page with @media print styles that auto-triggers window.print()
  // No external PDF library needed; works in all browsers.
  if (format === "pdf") {
    const tag = await prisma.tag.findUnique({ where: { id: tagId }, select: { name: true } });
    const tagName = tag?.name ?? tagId;

    // Embed QR as SVG inline (vector, no pixel blur at any size)
    const svgString: string = await QRCode.toString(qrData, {
      type: "svg",
      margin: 4,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    });

    // Escape for safe HTML embedding
    const escapedName = tagName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const escapedUrl = qrData.replace(/&/g, "&amp;");
    const escapedId = tagId.replace(/&/g, "&amp;");

    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>QR Print – ${escapedName}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Helvetica,Arial,sans-serif;background:#fff;color:#111}
  .page{width:210mm;min-height:297mm;padding:20mm 20mm 16mm;display:flex;flex-direction:column;align-items:center}
  .header{width:100%;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #f5b731;padding-bottom:10px;margin-bottom:24px}
  .logo{font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#0c1220}
  .logo span{color:#f5b731}
  .subtitle{font-size:10px;color:#8b95a8;margin-top:2px}
  .tag-name{font-size:20px;font-weight:700;color:#0c1220;margin-bottom:4px;text-align:center}
  .tag-id{font-size:10px;color:#8b95a8;margin-bottom:24px;font-family:monospace}
  .qr-box{width:200px;height:200px;margin-bottom:18px}
  .qr-box svg{width:200px!important;height:200px!important;display:block;image-rendering:crisp-edges}
  .url-box{font-size:8px;color:#5a6478;font-family:monospace;margin-bottom:20px;text-align:center;word-break:break-all;max-width:200px}
  .instruction{background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px 20px;width:100%;max-width:360px;margin-bottom:auto}
  .instruction h3{font-size:12px;font-weight:700;color:#0c1220;margin-bottom:6px}
  .instruction ol{padding-left:16px}
  .instruction li{font-size:10.5px;color:#374151;margin-bottom:3px;line-height:1.5}
  .footer{width:100%;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:24px;display:flex;justify-content:space-between;font-size:8px;color:#9ca3af}
  @media print{
    body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
    @page{size:A4 portrait;margin:0}
    .page{padding:15mm 15mm 12mm}
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Twoje<span>NFC</span></div>
      <div class="subtitle">Karta wydruku akcji</div>
    </div>
    <div style="text-align:right;font-size:9px;color:#8b95a8">
      Error correction: H (30%)<br>
      Quiet zone: 4 moduły
    </div>
  </div>

  <div class="tag-name">${escapedName}</div>
  <div class="tag-id">ID: ${escapedId}</div>

  <div class="qr-box">${svgString}</div>
  <div class="url-box">${escapedUrl}</div>

  <div class="instruction">
    <h3>Jak używać?</h3>
    <ol>
      <li>Skieruj aparat telefonu na kod QR powyżej</li>
      <li>Poczekaj na automatyczne rozpoznanie przez system</li>
      <li>Kliknij link, który pojawi się na ekranie</li>
    </ol>
  </div>

  <div class="footer">
    <span>Wygenerowano przez twojenfc.pl</span>
    <span>${escapedUrl}</span>
  </div>
</div>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),400))</script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Invalid format. Use: png, svg, pdf" }, { status: 400 });
}
