"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { TagFull, TagLink, ClientInfo, CampaignInfo } from "@/types/tag";
import type { VCardData } from "@/types/vcard";
import type { CertificateData } from "@/types/certificate";
import { DEFAULT_CERTIFICATE } from "@/types/certificate";
import { generateTagCode } from "@/lib/generate-tag-code";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UseTagFormOptions {
  mode: "create" | "edit";
  initialTagId?: string;
  preselectedClientId?: string;
  preselectedCampaignId?: string;
}

export interface UseTagFormReturn {
  /* Form fields */
  tagId: string;
  setTagId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  tagType: string;
  setTagType: (v: string) => void;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  channel: "nfc" | "qr" | "both";
  setChannel: (v: "nfc" | "qr" | "both") => void;
  clientId: string;
  setClientId: (v: string) => void;
  campaignId: string;
  setCampaignId: (v: string) => void;
  links: TagLink[];
  setLinks: (v: TagLink[]) => void;
  vcard: VCardData;
  setVcard: (v: VCardData) => void;
  certificate: CertificateData;
  setCertificate: (v: CertificateData) => void;

  /* Dropdown data */
  clients: ClientInfo[];
  campaigns: CampaignInfo[];
  campaignsForClient: CampaignInfo[];

  /* Validation */
  errors: Record<string, string>;
  setFieldError: (field: string, msg: string) => void;
  clearFieldError: (field: string) => void;
  validate: () => boolean;

  /* Submission */
  submitting: boolean;
  submitError: string;
  justSaved: boolean;   // true for ~2s after successful save (for UI feedback)
  submit: () => Promise<{ success: boolean; createdId?: string }>;

  /* Edit-mode extras */
  resetStats: (tagId: string) => Promise<void>;
  deleteTag: (tagId: string) => Promise<boolean>;
  resetting: boolean;

  /* State */
  mode: "create" | "edit";
  readOnly: boolean;
  isAdmin: boolean;
  loading: boolean;
  isDirty: boolean;
  resetToSnapshot: () => void;   // cofa wszystkie niezapisane zmiany do ostatniego save/load

  /* URL/slug edycja w trybie edit — domyslnie zamknieta (lock),
   * user musi zaznaczyc checkbox warningu + kliknac "Zmien URL" */
  originalTagId: string;
  idUnlocked: boolean;
  unlockIdEditing: () => void;
  lockIdEditing: () => void;

  /* Typ akcji edycja w trybie edit — domyslnie zablokowany, user musi swiadomie
   * kliknac "Zmien typ" (confirm dialog). Po zmianie typu link /s/<slug> dziala
   * dalej, tylko zmienia sie cel przekierowania. */
  tagTypeUnlocked: boolean;
  unlockTagTypeEditing: () => void;
  lockTagTypeEditing: () => void;

  /* Edit token (vCard) */
  editTokenUrl: string | null;
  editTokenLoading: boolean;
  generateEditToken: () => Promise<void>;
  revokeEditToken: () => Promise<void>;

  /* Success state */
  created: boolean;
  createdTagId: string | null;
}

/* ------------------------------------------------------------------ */
/*  Default vCard                                                      */
/* ------------------------------------------------------------------ */
const emptyVCard: VCardData = { firstName: "", lastName: "" };
const emptyLink: TagLink = { label: "", url: "", icon: "link" };

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useTagForm(opts: UseTagFormOptions): UseTagFormReturn {
  const { mode, initialTagId, preselectedClientId, preselectedCampaignId } = opts;
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "viewer";
  const isAdmin = role === "admin";
  const readOnly = !isAdmin;

  /* ---- Form state ---- */
  const [tagId, setTagId] = useState("");
  const [name, setName] = useState("");
  const [tagType, setTagType] = useState("url");
  const [targetUrl, setTargetUrl] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<"nfc" | "qr" | "both">("both");
  const [clientId, setClientIdRaw] = useState(preselectedClientId || "");
  const [campaignId, setCampaignId] = useState(preselectedCampaignId || "");
  const [links, setLinks] = useState<TagLink[]>([{ ...emptyLink }]);
  const [vcard, setVcard] = useState<VCardData>({ ...emptyVCard });
  const [certificate, setCertificate] = useState<CertificateData>({ ...DEFAULT_CERTIFICATE });

  /* ---- Dropdown data ---- */
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignInfo[]>([]);

  /* ---- Validation ---- */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---- Submission ---- */
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  /* ---- Edit extras ---- */
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [isDirty, setIsDirty] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState("");
  /* Oryginalne ID z bazy — niezmienne w trakcie edycji, uzywane jako klucz      * do PUT /api/tags. Dopiero na backendzie patrzymy na tagId z formularza jako  * `newId` i robimy rename jesli rozny. */
  const [originalTagId, setOriginalTagId] = useState("");
  /* Czy pole URL zostalo odblokowane w trybie edit (lock + warning confirmed).  * Jesli false, UI pokazuje tagId jako read-only. */
  const [idUnlocked, setIdUnlocked] = useState(false);
  /* Czy typ akcji zostal odblokowany do edycji w trybie edit. Domyslnie zablokowany
   * zeby user przypadkiem nie zmienil typu (co potencjalnie utraci dane wizytowki/
   * certyfikatu jesli formaty links nie sa zgodne). User unlocka swiadomie. */
  const [tagTypeUnlocked, setTagTypeUnlocked] = useState(false);

  /* ---- Edit token ---- */
  const [editTokenUrl, setEditTokenUrl] = useState<string | null>(null);
  const [editTokenLoading, setEditTokenLoading] = useState(false);

  /* ---- Success ---- */
  const [created, setCreated] = useState(false);
  const [createdTagId, setCreatedTagId] = useState<string | null>(null);

  /* ---- Client → Campaign cascade ---- */
  const setClientId = useCallback((v: string) => {
    setClientIdRaw(v);
    setCampaignId("");
  }, []);

  const campaignsForClient = useMemo(
    () => campaigns.filter((c) => (c as CampaignInfo & { clientId?: string }).clientId === clientId),
    [campaigns, clientId]
  );

  /* ---- Fetch clients & campaigns ---- */
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  /* ---- Auto-generate neutral tag code on new-tag mount ---- */
  useEffect(() => {
    if (mode === "create" && tagId === "") {
      setTagId(generateTagCode());
    }
    // Run once on mount — intentionally ignores tagId/setTagId deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* ---- Fetch tag for edit mode ---- */
  useEffect(() => {
    if (mode !== "edit" || !initialTagId) return;
    setLoading(true);
    fetch(`/api/tags/${encodeURIComponent(initialTagId)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Tag nie znaleziony");
        return r.json();
      })
      .then((tag: TagFull) => {
        setTagId(tag.id);
        setOriginalTagId(tag.id);  // oryginalne ID do later rename check
        setName(tag.name);
        setTagType(tag.tagType);
        setTargetUrl(tag.targetUrl);
        setDescription(tag.description || "");
        setClientIdRaw(tag.clientId || "");
        setCampaignId(tag.campaignId || "");

        let snapLinks: TagLink[];
        let snapVcard: VCardData;
        let snapCert: CertificateData = { ...DEFAULT_CERTIFICATE };
        if (tag.tagType === "vcard" && tag.links) {
          snapVcard = tag.links as unknown as VCardData;
          snapLinks = [{ ...emptyLink }];
          setVcard(snapVcard);
          setLinks(snapLinks);
        } else if (tag.tagType === "certificate" && tag.links) {
          snapCert = tag.links as unknown as CertificateData;
          snapLinks = [{ ...emptyLink }];
          snapVcard = { ...emptyVCard };
          setCertificate(snapCert);
          setLinks(snapLinks);
          setVcard(snapVcard);
        } else if (tag.links && Array.isArray(tag.links)) {
          snapLinks = tag.links as TagLink[];
          snapVcard = { ...emptyVCard };
          setLinks(snapLinks);
          setVcard(snapVcard);
        } else {
          snapLinks = [{ ...emptyLink }];
          snapVcard = { ...emptyVCard };
          setLinks(snapLinks);
          setVcard(snapVcard);
        }

        /* Snapshot for dirty tracking + "Przywróć" button.
         * Normalized shape — matches what save() writes on success, so
         * resetToSnapshot() round-trips cleanly. */
        setInitialSnapshot(JSON.stringify({
          tagId: tag.id,
          name: tag.name,
          tagType: tag.tagType,
          targetUrl: tag.targetUrl,
          description: tag.description || "",
          clientId: tag.clientId || "",
          campaignId: tag.campaignId || "",
          links: snapLinks,
          vcard: snapVcard,
          certificate: snapCert,
        }));
      })
      .catch(() => setSubmitError("Nie udalo sie zaladowac tagu"))
      .finally(() => setLoading(false));
  }, [mode, initialTagId]);

  /* ---- Dirty tracking ---- */
  useEffect(() => {
    if (mode === "create") {
      setIsDirty(
        tagId !== "" || name !== "" || targetUrl !== "" || description !== ""
      );
    } else if (initialSnapshot) {
      const current = JSON.stringify({ tagId, name, tagType, targetUrl, description, clientId, campaignId, links, vcard, certificate });
      setIsDirty(current !== initialSnapshot);
    }
  }, [mode, tagId, name, tagType, targetUrl, description, clientId, campaignId, links, vcard, certificate, initialSnapshot]);

  /* ---- Przywroc do ostatnio zapisanego stanu (bez pobierania z serwera) ----
   * Używane przez przycisk "Przywróć" w headerze formularza, gdy user nabałaganił
   * w motywie / polach i chce cofnąć WSZYSTKIE niezapisane zmiany, nie wychodząc
   * z edytora (Anuluj wyrzucal na listę — bolesne przy długich wizytówkach). */
  const resetToSnapshot = useCallback(() => {
    if (!initialSnapshot) return;
    try {
      const s = JSON.parse(initialSnapshot);
      setTagId(s.tagId || "");
      setName(s.name || "");
      setTagType(s.tagType || "url");
      setTargetUrl(s.targetUrl || "");
      setDescription(s.description || "");
      setClientIdRaw(s.clientId || "");
      setCampaignId(s.campaignId || "");
      setLinks(Array.isArray(s.links) ? s.links : [{ ...emptyLink }]);
      setVcard(s.vcard || { ...emptyVCard });
      setCertificate(s.certificate || { ...DEFAULT_CERTIFICATE });
      setErrors({});
      setSubmitError("");
      setIdUnlocked(false);  // przy cofnieciu zmian zamknij tez lock URL
    } catch {
      /* stary snapshot moze byc w innym ksztalcie (pre-refactor) — nic nie robimy */
    }
  }, [initialSnapshot]);

  const unlockIdEditing = useCallback(() => setIdUnlocked(true), []);
  const lockIdEditing = useCallback(() => {
    setIdUnlocked(false);
    // przy zamkniecie locka bez zapisu, restore original tagId
    if (originalTagId) setTagId(originalTagId);
  }, [originalTagId]);

  const unlockTagTypeEditing = useCallback(() => {
    /* Confirm bo zmiana typu moze stracic dane (np. vcard -> certificate
     * = vcardData jest zignorowany na backend, zostaje pusty certificate). */
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Zmiana typu akcji moze spowodowac utrate danych (np. dane wizytowki nie pasuja do certyfikatu).\n\n" +
        "Link NFC/QR /s/" + tagId + " zostanie zachowany — przekieruje sie na strone nowego typu.\n\n" +
        "Kontynuowac?"
      );
      if (!ok) return;
    }
    setTagTypeUnlocked(true);
  }, [tagId]);
  const lockTagTypeEditing = useCallback(() => setTagTypeUnlocked(false), []);

  /* ---- Validation ---- */
  const setFieldError = useCallback((field: string, msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (mode === "create" && !tagId.trim()) e.tagId = "ID akcji jest wymagane";
    if (!name.trim()) e.name = "Nazwa jest wymagana";
    if (!clientId) e.clientId = "Wybierz klienta";
    if (!campaignId) e.campaignId = "Wybierz kampanie";

    if ((tagType === "url" || tagType === "google-review") && !targetUrl.trim()) {
      e.targetUrl = "URL jest wymagany";
    }

    if (tagType === "file" && !targetUrl.trim()) {
      e.targetUrl = "Wgraj plik PDF";
    }

    if (tagType === "vcard") {
      const hasPersonName = !!(vcard.firstName?.trim() || vcard.lastName?.trim());
      const hasCompany = !!vcard.company?.trim();
      if (!hasPersonName && !hasCompany) {
        e.vcard = "Podaj imie/nazwisko albo nazwe firmy";
      }
    }

    if (tagType === "multilink") {
      const validLinks = links.filter((l) => l.url.trim() !== "");
      if (validLinks.length === 0) {
        e.links = "Dodaj przynajmniej jeden link z URL";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [mode, tagId, name, clientId, campaignId, tagType, targetUrl, vcard, links]);

  /* ---- Submit ---- */
  const submit = useCallback(async (): Promise<{ success: boolean; createdId?: string }> => {
    if (!validate()) return { success: false };
    setSubmitting(true);
    setSubmitError("");

    try {
      if (mode === "create") {
        const body: Record<string, unknown> = {
          id: tagId.trim(),
          name: name.trim(),
          tagType,
          description: description.trim() || null,
          clientId,
          campaignId,
        };

        if (tagType === "url" || tagType === "google-review" || tagType === "file") {
          body.targetUrl = targetUrl.trim();
        } else if (tagType === "video") {
          body.targetUrl = `/watch/${tagId.trim()}`;
        } else if (tagType === "multilink") {
          body.targetUrl = `/link/${tagId.trim()}`;
          body.links = links.filter((l) => l.url.trim() !== "");
        } else if (tagType === "vcard") {
          body.targetUrl = `/vcard/${tagId.trim()}`;
          body.links = vcard;
        } else if (tagType === "certificate") {
          body.targetUrl = `/cert/${tagId.trim()}`;
          body.links = certificate;   // serialNumber wypelni sie serverowo
        }

        const res = await fetch("/api/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Blad ${res.status}`);
        }

        const result = await res.json();
        setCreated(true);
        setCreatedTagId(result.id || tagId.trim());
        return { success: true, createdId: result.id || tagId.trim() };
      } else {
        /* Edit mode. PUT uzywa originalTagId jako klucza (zeby backend znal
         * stary rekord), oraz newId jesli user zmienil URL (rename). */
        const body: Record<string, unknown> = {
          id: originalTagId || tagId,
          name: name.trim(),
          description: description.trim() || null,
          tagType,
          clientId: clientId || null,
          campaignId: campaignId || null,
        };
        if (tagId !== originalTagId && originalTagId) {
          body.newId = tagId.trim();
        }

        if (tagType === "url" || tagType === "google-review" || tagType === "file") {
          body.targetUrl = targetUrl.trim();
        } else if (tagType === "video") {
          body.targetUrl = `/watch/${tagId}`;
        } else if (tagType === "multilink") {
          body.targetUrl = `/link/${tagId}`;
          body.links = links.filter((l) => l.url.trim() !== "");
        } else if (tagType === "vcard") {
          body.targetUrl = `/vcard/${tagId}`;
          body.links = vcard;
        } else if (tagType === "certificate") {
          body.targetUrl = `/cert/${tagId}`;
          body.links = certificate;
        }

        const res = await fetch("/api/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Blad ${res.status}`);
        }

        /* Po renamie tagId == nowy URL; oryginalne przesuwamy zeby potem
         * isDirty dla tagId uprawniezsie wracalo na false, a kolejny save
         * robil normalny update (bez newId jesli znow zostawiono). */
        setOriginalTagId(tagId);
        setIdUnlocked(false);  // zamyka lock UI po udanym zapisie
        /* Refresh snapshot so isDirty becomes false, then flash "Zapisano" feedback */
        setInitialSnapshot(JSON.stringify({
          tagId, name, tagType, targetUrl, description, clientId, campaignId, links, vcard, certificate,
        }));
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);

        return { success: true };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Blad zapisu";
      setSubmitError(msg);
      return { success: false };
    } finally {
      setSubmitting(false);
    }
  }, [validate, mode, tagId, name, tagType, targetUrl, description, clientId, campaignId, links, vcard]);

  /* ---- Reset stats ---- */
  const resetStats = useCallback(async (id: string) => {
    setResetting(true);
    try {
      await fetch("/api/stats/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: id }),
      });
    } finally {
      setResetting(false);
    }
  }, []);

  /* ---- Delete tag ---- */
  const deleteTag = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return false;
      router.push("/dashboard");
      return true;
    } catch {
      return false;
    }
  }, [router]);

  /* ---- Edit token ---- */
  const generateEditToken = useCallback(async () => {
    if (!tagId) return;
    setEditTokenLoading(true);
    try {
      const res = await fetch("/api/tags/edit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditTokenUrl(data.editUrl || null);
      }
    } finally {
      setEditTokenLoading(false);
    }
  }, [tagId]);

  const revokeEditToken = useCallback(async () => {
    if (!tagId) return;
    setEditTokenLoading(true);
    try {
      await fetch("/api/tags/edit-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      setEditTokenUrl(null);
    } finally {
      setEditTokenLoading(false);
    }
  }, [tagId]);

  return {
    tagId, setTagId,
    name, setName,
    tagType, setTagType,
    targetUrl, setTargetUrl,
    description, setDescription,
    channel, setChannel,
    clientId, setClientId,
    campaignId, setCampaignId,
    links, setLinks,
    vcard, setVcard,
    certificate, setCertificate,
    clients, campaigns, campaignsForClient,
    errors, setFieldError, clearFieldError, validate,
    submitting, submitError, justSaved, submit,
    resetStats, deleteTag, resetting,
    mode, readOnly, isAdmin, loading, isDirty, resetToSnapshot,
    originalTagId, idUnlocked, unlockIdEditing, lockIdEditing,
    tagTypeUnlocked, unlockTagTypeEditing, lockTagTypeEditing,
    editTokenUrl, editTokenLoading, generateEditToken, revokeEditToken,
    created, createdTagId,
  };
}
