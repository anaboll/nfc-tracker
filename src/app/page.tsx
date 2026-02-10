import Link from "next/link";

export default function HomePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0f0f1a, #1a1a2e, #16213e)" }}
    >
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8 text-4xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}>
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold mb-4">
          <span className="gradient-text">TwojeNFC</span>
        </h1>
        <p className="text-lg mb-12" style={{ color: "#a0a0c0" }}>
          Platforma analityczna dla Twoich tagow NFC
        </p>
        <Link
          href="/login"
          className="btn-primary inline-block text-lg px-8 py-4 rounded-xl hover:scale-105 transition-transform"
        >
          Zaloguj sie do panelu
        </Link>
        <p className="mt-6 text-xs" style={{ color: "#6060a0" }}>
          Dostep tylko dla administratorow
        </p>
      </div>
    </main>
  );
}
