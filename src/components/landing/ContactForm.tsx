"use client";

import { useState, FormEvent } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="contact-success">
        <span className="contact-success-icon">&#10003;</span>
        <p>Wiadomość wysłana! Odezwiemy się najszybciej jak to możliwe.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-row">
        <input
          className="input-field"
          type="text"
          placeholder="Imię / firma"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          maxLength={100}
        />
        <input
          className="input-field"
          type="email"
          placeholder="Adres email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          maxLength={200}
        />
      </div>
      <textarea
        className="input-field contact-textarea"
        placeholder="Czym się zajmujesz i ile breloków potrzebujesz?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        required
        maxLength={2000}
        rows={4}
      />
      <button
        type="submit"
        className="btn-primary hero-btn contact-submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Wysyłanie..." : "Wyślij wiadomość"}
      </button>
      {status === "error" && (
        <p className="contact-error">
          Nie udało się wysłać. Napisz bezpośrednio na kontakt@twojenfc.pl
        </p>
      )}
    </form>
  );
}
