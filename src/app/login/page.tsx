"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#06080d" }}>
        <p style={{ color: "#8b95a8" }}>Ladowanie...</p>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Wpisz login i haslo");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Nieprawidlowy login lub haslo");
        setLoading(false);
      } else if (result?.ok) {
        window.location.replace("/dashboard");
      } else {
        setError("Wystapil blad logowania");
        setLoading(false);
      }
    } catch {
      setError("Wystapil blad polaczenia. Sprobuj ponownie.");
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #06080d, #0c1220, #0f172a)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #e69500, #f5b731)", boxShadow: "0 8px 32px rgba(230,149,0,0.2)" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#06080d" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">TwojeNFC</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "#8b95a8" }}>
            Panel administracyjny
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Zaloguj sie</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#8b95a8" }}>
                Login
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="Wpisz login"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#8b95a8" }}>
                Haslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Wpisz haslo"
                className="input-field"
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Logowanie..." : "Zaloguj sie"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#5a6478" }}>
          Dostep tylko dla administratorow systemu
        </p>
      </div>
    </main>
  );
}
