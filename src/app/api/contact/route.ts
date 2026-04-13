import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.eu",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    const timestamp = new Date().toISOString();

    const entry = {
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      timestamp,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown",
    };

    // Backup do JSONL
    const dataDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dataDir, { recursive: true });
    const logPath = path.join(dataDir, "contact-messages.jsonl");
    await writeFile(logPath, JSON.stringify(entry) + "\n", { flag: "a" });

    // Wyslij email przez Zoho SMTP
    const contactEmail = process.env.CONTACT_EMAIL || "kontakt@twojenfc.pl";

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"TwojeNFC Formularz" <${process.env.SMTP_USER}>`,
        to: contactEmail,
        replyTo: trimmedEmail,
        subject: `Nowa wiadomość z twojenfc.pl od ${trimmedName}`,
        text: `Imię: ${trimmedName}\nEmail: ${trimmedEmail}\n\nWiadomość:\n${trimmedMessage}\n\n---\nWysłano: ${timestamp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0a0e1a; color: #00d2d3; padding: 20px 30px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0;">Nowa wiadomość z formularza</h2>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px;"><strong>Od:</strong> ${trimmedName}</p>
              <p style="margin: 0 0 20px;"><strong>Email:</strong> <a href="mailto:${trimmedEmail}">${trimmedEmail}</a></p>
              <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                <p style="margin: 0; white-space: pre-wrap;">${trimmedMessage}</p>
              </div>
            </div>
            <div style="background: #e9ecef; padding: 12px 30px; border-radius: 0 0 12px 12px; font-size: 12px; color: #6c757d;">
              Wysłano ${timestamp} | Kliknij "Odpowiedz" żeby odpisać klientowi
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Nie udało się wysłać wiadomości" },
      { status: 500 }
    );
  }
}
