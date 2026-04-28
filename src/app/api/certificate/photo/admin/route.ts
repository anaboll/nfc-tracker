import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/* ------------------------------------------------------------------ */
/*  POST — upload zdjecia dla certyfikatu autentycznosci.              */
/*  Wywolywane z formularza admina w trakcie edycji / tworzenia tagu. */
/*  Zwraca path `/api/uploads/<filename>` ktory frontend wklei do     */
/*  CertificateData.photos[] albo signaturePhoto / artistLogo.         */
/*                                                                     */
/*  Upload jest stateless — nie dotykamy Tag.links. Gdy user kliknie   */
/*  Zapisz na formularzu, links zostanie nadpisane przez PUT z         */
/*  aktualnymi sciezkami. Dzieki temu mozemy uploadowac zdjecia        */
/*  PRZED zapisem taga, a photos[] zbiera frontend.                    */
/* ------------------------------------------------------------------ */

const MAX_SIZE_MB = 10;   // Certyfikaty moga miec wiekszy hero photo niz vcard avatar
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tagId = (formData.get("tagId") as string | null) || "new";
    /* purpose: "photo" | "signature" | "logo" — tylko do prefiksu pliku */
    const purpose = (formData.get("purpose") as string | null) || "photo";

    if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Dozwolone formaty: JPEG, PNG, WebP" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Maksymalny rozmiar: ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safePurpose = ["photo", "signature", "logo"].includes(purpose) ? purpose : "photo";
    const filename = `cert-${safePurpose}-${tagId}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({ ok: true, path: `/api/uploads/${filename}` });
  } catch (err) {
    console.error("Certificate photo upload error:", err);
    return NextResponse.json({ error: "Blad uploadu" }, { status: 500 });
  }
}
