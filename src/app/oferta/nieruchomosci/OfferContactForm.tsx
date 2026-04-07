"use client";

import { useState, FormEvent } from "react";

export default function OfferContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setStatus("sending");
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `[Oferta nieruchomości | ${params.get("utm_content") || "direct"}] ${form.message || "Proszę o kontakt"}`,
        }),
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
        <p>Dziękujemy! Odezwiemy się w ciągu 24h z indywidualną wyceną.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-row">
        <input
          className="input-field"
          type="text"
          placeholder="Imię i nazwisko"
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
        placeholder="Nazwa biura, ile agentów, pytania..."
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        maxLength={2000}
        rows={3}
      />
      <button
        type="submit"
        className="btn-primary hero-btn contact-submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Wysyłanie..." : "Poproś o wycenę"}
      </button>
      {status === "error" && (
        <p className="contact-error">
          Nie udało się wysłać. Napisz na kontakt@twojenfc.pl
        </p>
      )}
    </form>
  );
}
