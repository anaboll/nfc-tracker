import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Wszystkie pola są wymagane" }, { status: 400 });
    }
    if (typeof name !== "string" || name.length > 100) {
      return NextResponse.json({ error: "Nieprawidłowe imię" }, { status: 400 });
    }
    if (typeof email !== "string" || email.length > 200 || !email.includes("@")) {
      return NextResponse.json({ error: "Nieprawidłowy email" }, { status: 400 });
    }
    if (typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Wiadomość za długa" }, { status: 400 });
    }

    const entry = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown",
    };

    const dataDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dataDir, { recursive: true });

    const logPath = path.join(dataDir, "contact-messages.jsonl");
    await writeFile(logPath, JSON.stringify(entry) + "\n", { flag: "a" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Nie udało się wysłać wiadomości" },
      { status: 500 }
    );
  }
}
