"use client";

import React, { useState, useEffect } from "react";
import type { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  session: Session;
}

export default function SettingsPage({ session }: Props) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  /* -- Profile state -- */
  const [profile, setProfile] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  /* -- Password state -- */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  /* -- Load profile -- */
  useEffect(() => {
    fetch("/api/users/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setProfile({ name: data.name || "", email: data.email || "", role: data.role || "viewer" });
      })
      .catch(() => {
        toastError("Nie udalo sie wczytac profilu");
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -- Change password -- */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toastError("Nowe haslo musi miec min. 8 znakow");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Hasla nie sa identyczne");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Blad zmiany hasla");
      }

      toastSuccess("Haslo zostalo zmienione");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Blad zmiany hasla";
      toastError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">Ladowanie...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button
          type="button"
          className="settings-back-btn"
          onClick={() => router.push("/dashboard")}
        >
          &larr; Wroc do panelu
        </button>
        <h1 className="settings-title">Ustawienia konta</h1>
        <p className="settings-subtitle">Zarzadzaj swoim kontem i preferencjami</p>
      </div>

      {/* Profile section */}
      <div className="settings-card">
        <h2 className="settings-section-title">Profil</h2>
        <div className="settings-profile-grid">
          <div className="settings-field">
            <label className="settings-label">Email</label>
            <div className="settings-value">{profile?.email || session.user?.email}</div>
          </div>
          <div className="settings-field">
            <label className="settings-label">Rola</label>
            <span className={`settings-role-badge ${profile?.role === "admin" ? "settings-role-badge--admin" : ""}`}>
              {profile?.role === "admin" ? "Administrator" : "Viewer"}
            </span>
          </div>
        </div>
      </div>

      {/* Password section */}
      <div className="settings-card">
        <h2 className="settings-section-title">Zmiana hasla</h2>
        <form onSubmit={handleChangePassword} className="settings-form">
          <div className="settings-field">
            <label className="settings-label" htmlFor="currentPassword">Obecne haslo</label>
            <input
              id="currentPassword"
              type="password"
              className="settings-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Wpisz obecne haslo"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="settings-password-row">
            <div className="settings-field">
              <label className="settings-label" htmlFor="newPassword">Nowe haslo</label>
              <input
                id="newPassword"
                type="password"
                className="settings-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 znakow"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="confirmPassword">Potwierdz haslo</label>
              <input
                id="confirmPassword"
                type="password"
                className="settings-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Powtorz nowe haslo"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="settings-error-hint">Hasla nie sa identyczne</p>
          )}
          <button
            type="submit"
            className="settings-btn settings-btn--primary"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? "Zapisywanie..." : "Zmien haslo"}
          </button>
        </form>
      </div>

    </div>
  );
}
