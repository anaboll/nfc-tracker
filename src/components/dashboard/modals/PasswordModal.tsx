"use client";

import React from "react";

interface Props {
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordError: string;
  passwordSaving: boolean;
  handlePasswordChange: (e: React.FormEvent) => void;
}

export default function PasswordModal({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  passwordSaving,
  handlePasswordChange,
}: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 16px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: "12px 12px 0 0",
            background: "var(--accent)",
          }}
        />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "var(--txt)" }}>
          Zmiana hasla
        </h2>
        <p style={{ fontSize: 13, color: "var(--txt-sec)", marginBottom: 20 }}>
          Ze wzgledow bezpieczenstwa musisz ustawic nowe haslo przy pierwszym logowaniu.
        </p>

        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--txt-sec)", marginBottom: 4, fontWeight: 500 }}>
              Nowe haslo
            </label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 znakow"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--txt-sec)", marginBottom: 4, fontWeight: 500 }}>
              Powtorz haslo
            </label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtorz nowe haslo"
            />
          </div>

          {passwordError && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                background: "rgba(239,68,68,0.1)",
                color: "var(--error)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {passwordError}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={passwordSaving}
            style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
          >
            {passwordSaving ? "Zapisywanie..." : "Ustaw nowe haslo"}
          </button>
        </form>
      </div>
    </div>
  );
}
