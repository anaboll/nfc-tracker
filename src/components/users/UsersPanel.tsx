"use client";

import React, { useState, useEffect, useCallback } from "react";

interface UserClient {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  mustChangePass: boolean;
  viewerSections: string | null;
  createdAt: string;
  clients: UserClient[];
}

/* All possible viewer dashboard sections */
const ALL_VIEWER_SECTIONS = [
  { key: "kpi", label: "Metryki (KPI)" },
  { key: "vcards", label: "Wizytowki" },
  { key: "tags", label: "Inne tagi" },
  { key: "hourly", label: "Wykres godzinowy" },
  { key: "weekly", label: "Wykres tygodniowy" },
  { key: "geo", label: "Top kraje" },
  { key: "devices", label: "Urzadzenia" },
] as const;

const DEFAULT_SECTIONS = ALL_VIEWER_SECTIONS.map((s) => s.key);

interface ClientOption {
  id: string;
  name: string;
}

interface UsersPanelProps {
  open: boolean;
  onClose: () => void;
  clients: ClientOption[];
}

export function UsersPanel({ open, onClose, clients }: UsersPanelProps) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "viewer">("viewer");
  const [formClientIds, setFormClientIds] = useState<string[]>([]);
  const [formViewerSections, setFormViewerSections] = useState<string[]>([...DEFAULT_SECTIONS]);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Błąd pobierania użytkowników");
        return;
      }
      setUsers(await res.json());
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const resetForm = () => {
    setFormEmail("");
    setFormName("");
    setFormPassword("");
    setFormRole("viewer");
    setFormClientIds([]);
    setFormViewerSections([...DEFAULT_SECTIONS]);
    setEditUser(null);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setFormEmail(u.email);
    setFormName(u.name || "");
    setFormPassword("");
    setFormRole(u.role as "admin" | "viewer");
    setFormClientIds(u.clients.map((c) => c.id));
    // Parse viewerSections from JSON string or use defaults
    try {
      const parsed = u.viewerSections ? JSON.parse(u.viewerSections) : null;
      setFormViewerSections(Array.isArray(parsed) ? parsed : [...DEFAULT_SECTIONS]);
    } catch {
      setFormViewerSections([...DEFAULT_SECTIONS]);
    }
    setMode("edit");
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            name: formName || undefined,
            role: formRole,
            clientIds: formRole === "viewer" ? formClientIds : [],
            viewerSections: formRole === "viewer" ? formViewerSections : null,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || "Błąd tworzenia");
          return;
        }
        setSuccess("Użytkownik utworzony");
      } else if (mode === "edit" && editUser) {
        const body: Record<string, unknown> = {
          id: editUser.id,
          email: formEmail,
          name: formName,
          role: formRole,
          clientIds: formRole === "viewer" ? formClientIds : [],
          viewerSections: formRole === "viewer" ? formViewerSections : null,
        };
        if (formPassword) body.password = formPassword;
        const res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error || "Błąd aktualizacji");
          return;
        }
        setSuccess("Użytkownik zaktualizowany");
      }
      await fetchUsers();
      setMode("list");
      resetForm();
    } catch {
      setError("Błąd połączenia");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Czy na pewno usunąć użytkownika "${email}"?`)) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Błąd usuwania");
        return;
      }
      setSuccess("Użytkownik usunięty");
      await fetchUsers();
    } catch {
      setError("Błąd połączenia");
    }
  };

  const toggleClient = (cid: string) => {
    setFormClientIds((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  };

  const toggleSection = (key: string) => {
    setFormViewerSections((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  if (!open) return null;

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(520px, 100vw)",
    height: "100vh",
    background: "#0a0f1c",
    borderLeft: "1px solid #1C2541",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 9998,
  };

  const headerStyle: React.CSSProperties = {
    padding: "18px 20px",
    borderBottom: "1px solid #1C2541",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  const btnPrimary: React.CSSProperties = {
    background: "#38BDF8",
    color: "#0B0F1A",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };

  const btnSecondary: React.CSSProperties = {
    background: "#243052",
    border: "1px solid #1C2541",
    color: "#94A3B8",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 12,
    cursor: "pointer",
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    background: "#0f1524",
    border: "1px solid #1C2541",
    color: "#F1F5F9",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 4,
    fontWeight: 600,
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={panelStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F1F5F9", margin: 0 }}>
            {mode === "list" && "Użytkownicy"}
            {mode === "create" && "Nowy użytkownik"}
            {mode === "edit" && "Edytuj użytkownika"}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {mode === "list" && (
              <button style={btnPrimary} onClick={openCreate}>
                + Nowy
              </button>
            )}
            <button
              style={btnSecondary}
              onClick={() => {
                if (mode !== "list") {
                  setMode("list");
                  resetForm();
                } else {
                  onClose();
                }
              }}
            >
              {mode !== "list" ? "Wstecz" : "Zamknij"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ padding: "10px 20px", background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: 12 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "10px 20px", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 12 }}>
            {success}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {mode === "list" && (
            <>
              {loading && <p style={{ color: "#64748B", fontSize: 13 }}>Ładowanie...</p>}
              {!loading && users.length === 0 && (
                <p style={{ color: "#64748B", fontSize: 13 }}>Brak użytkowników.</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {users.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: "#0f1524",
                      border: "1px solid #1C2541",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div>
                        <span style={{ color: "#F1F5F9", fontWeight: 600, fontSize: 14 }}>
                          {u.name || u.email}
                        </span>
                        {u.name && (
                          <span style={{ color: "#64748B", fontSize: 12, marginLeft: 8 }}>
                            {u.email}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: u.role === "admin" ? "rgba(0,200,160,0.15)" : "rgba(59,130,246,0.15)",
                          color: u.role === "admin" ? "#7dd3fc" : "#38BDF8",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {u.role}
                      </span>
                    </div>

                    {u.role === "viewer" && u.clients.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: "#64748B" }}>Klienci: </span>
                        {u.clients.map((c) => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: 10,
                              background: "rgba(16,185,129,0.1)",
                              color: "#10b981",
                              padding: "2px 6px",
                              borderRadius: 4,
                              marginRight: 4,
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {u.role === "viewer" && u.clients.length === 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: "#f59e0b" }}>Brak przypisanych klientów</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                      <button
                        style={{ ...btnSecondary, padding: "4px 12px", fontSize: 11 }}
                        onClick={() => openEdit(u)}
                      >
                        Edytuj
                      </button>
                      <button
                        style={{
                          ...btnSecondary,
                          padding: "4px 12px",
                          fontSize: 11,
                          color: "#f87171",
                          borderColor: "rgba(239,68,68,0.2)",
                        }}
                        onClick={() => handleDelete(u.id, u.email)}
                      >
                        Usuń
                      </button>
                      {u.mustChangePass && (
                        <span style={{ fontSize: 10, color: "#f59e0b", alignSelf: "center" }}>
                          wymaga zmiany hasła
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {(mode === "create" || mode === "edit") && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>Email (login)</label>
                <input
                  style={inputStyle}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="np. jan@firma.pl"
                />
              </div>

              <div>
                <label style={labelStyle}>Nazwa wyświetlana</label>
                <input
                  style={inputStyle}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>

              <div>
                <label style={labelStyle}>
                  {mode === "create" ? "Hasło" : "Nowe hasło (zostaw puste aby nie zmieniać)"}
                </label>
                <input
                  style={inputStyle}
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={mode === "create" ? "min. 6 znaków" : "••••••"}
                />
              </div>

              <div>
                <label style={labelStyle}>Rola</label>
                <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #1C2541", width: "fit-content" }}>
                  <button
                    type="button"
                    onClick={() => setFormRole("admin")}
                    style={{
                      padding: "8px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      background: formRole === "admin" ? "#7dd3fc" : "#243052",
                      color: formRole === "admin" ? "#0B0F1A" : "#94A3B8",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole("viewer")}
                    style={{
                      padding: "8px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      borderLeft: "1px solid #1C2541",
                      cursor: "pointer",
                      background: formRole === "viewer" ? "#38BDF8" : "#243052",
                      color: formRole === "viewer" ? "#fff" : "#94A3B8",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    Viewer
                  </button>
                </div>
                <p style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
                  {formRole === "admin"
                    ? "Admin — pełny dostęp do wszystkich klientów i ustawień"
                    : "Viewer — widzi tylko przypisanych klientów (bez edycji)"}
                </p>
              </div>

              {formRole === "viewer" && (
                <div>
                  <label style={labelStyle}>Przypisani klienci</label>
                  {clients.length === 0 ? (
                    <p style={{ fontSize: 11, color: "#64748B" }}>Brak klientow do przypisania</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {clients.map((c) => {
                        const selected = formClientIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleClient(c.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: 11,
                              fontWeight: 600,
                              borderRadius: 6,
                              cursor: "pointer",
                              border: selected ? "1px solid #10b981" : "1px solid #1C2541",
                              background: selected ? "rgba(16,185,129,0.15)" : "#243052",
                              color: selected ? "#10b981" : "#94A3B8",
                              transition: "all 0.15s",
                            }}
                          >
                            {selected ? "\u2713 " : ""}
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {formRole === "viewer" && (
                <div>
                  <label style={labelStyle}>Widoczne sekcje dashboardu</label>
                  <p style={{ fontSize: 10, color: "#64748B", marginBottom: 6 }}>
                    Wybierz, ktore sekcje ten uzytkownik zobaczy na swoim panelu
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ALL_VIEWER_SECTIONS.map((s) => {
                      const selected = formViewerSections.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => toggleSection(s.key)}
                          style={{
                            padding: "6px 12px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 6,
                            cursor: "pointer",
                            border: selected ? "1px solid #38BDF8" : "1px solid #1C2541",
                            background: selected ? "rgba(56,189,248,0.12)" : "#243052",
                            color: selected ? "#38BDF8" : "#94A3B8",
                            transition: "all 0.15s",
                          }}
                        >
                          {selected ? "\u2713 " : ""}
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      style={{ ...btnSecondary, padding: "4px 10px", fontSize: 10 }}
                      onClick={() => setFormViewerSections([...DEFAULT_SECTIONS])}
                    >
                      Zaznacz wszystkie
                    </button>
                    <button
                      type="button"
                      style={{ ...btnSecondary, padding: "4px 10px", fontSize: 10 }}
                      onClick={() => setFormViewerSections([])}
                    >
                      Odznacz wszystkie
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  style={{
                    ...btnPrimary,
                    opacity: saving ? 0.6 : 1,
                    pointerEvents: saving ? "none" : "auto",
                  }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Zapisywanie..." : mode === "create" ? "Utwórz użytkownika" : "Zapisz zmiany"}
                </button>
                <button
                  style={btnSecondary}
                  onClick={() => {
                    setMode("list");
                    resetForm();
                  }}
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
