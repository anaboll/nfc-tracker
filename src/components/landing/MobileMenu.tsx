"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Zamknij menu" : "Otwórz menu"}
        aria-expanded={open}
      >
        <span className={`hamburger-line${open ? " hamburger-open" : ""}`} />
        <span className={`hamburger-line${open ? " hamburger-open" : ""}`} />
        <span className={`hamburger-line${open ? " hamburger-open" : ""}`} />
      </button>

      {open && (
        <div className="mobile-menu-overlay" onClick={close}>
          <nav
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <a href="#jak-to-dziala" onClick={close}>Jak to działa</a>
            <a href="#dla-kogo" onClick={close}>Zastosowania</a>
            <a href="#mozliwosci" onClick={close}>Możliwości</a>
            <a href="#kontakt" onClick={close}>Kontakt</a>
            <Link href="/login" className="mobile-menu-cta" onClick={close}>
              Panel klienta
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
