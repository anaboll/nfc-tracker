"use client";

import React from "react";
import TagFormHeader from "./TagFormHeader";
import TagFormTypeSelector from "./TagFormTypeSelector";
import TagFormBasicSection from "./TagFormBasicSection";
import TagFormUrlSection from "./TagFormUrlSection";
import TagFormFileSection from "./TagFormFileSection";
import TagFormMultilinkSection from "./TagFormMultilinkSection";
import TagFormVCardSection from "./TagFormVCardSection";
import TagFormVCardPreview from "./TagFormVCardPreview";
import TagFormAdvancedSection from "./TagFormAdvancedSection";
import TagFormSuccessScreen from "./TagFormSuccessScreen";
import type { UseTagFormReturn } from "./useTagForm";

interface Props {
  form: UseTagFormReturn;
}

export default function TagFormLayout({ form }: Props) {
  /* Success screen after creation */
  if (form.created && form.createdTagId) {
    return (
      <div style={styles.page}>
        <TagFormHeader
          mode={form.mode}
          onSave={() => {}}
          saving={false}
          readOnly={true}
          isDirty={false}
          clientId={form.clientId}
          campaignId={form.campaignId}
        />
        <TagFormSuccessScreen
          tagId={form.createdTagId}
          tagType={form.tagType}
          channel={form.channel}
        />
      </div>
    );
  }

  /* Loading skeleton */
  if (form.loading) {
    return (
      <div style={styles.page}>
        <TagFormHeader
          mode={form.mode}
          onSave={() => {}}
          saving={false}
          readOnly={true}
          isDirty={false}
        />
        <div style={styles.container}>
          <div style={styles.skeleton} />
          <div style={{ ...styles.skeleton, height: 120 }} />
          <div style={{ ...styles.skeleton, height: 80 }} />
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const result = await form.submit();
    if (result.success && form.mode === "edit") {
      /* After saving edit, stay on page — show toast or similar */
    }
  };

  const showVideoHint = form.tagType === "video";

  return (
    <div style={styles.page}>
      {/* Responsive: hide preview on mobile */}
      <style>{`
        @media (max-width: 768px) {
          .tagform-preview-col { display: none !important; }
          .tagform-two-col { flex-direction: column !important; }
        }
      `}</style>
      <TagFormHeader
        mode={form.mode}
        tagName={form.name || form.tagId || undefined}
        onSave={handleSave}
        saving={form.submitting}
        justSaved={form.justSaved}
        readOnly={form.readOnly}
        isDirty={form.isDirty}
        clientId={form.clientId}
        campaignId={form.campaignId}
      />

      <div style={styles.container}>
        {/* Error banner */}
        {form.submitError && (
          <div style={styles.errorBanner}>{form.submitError}</div>
        )}

        <div style={styles.twoCol} className="tagform-two-col">
          {/* Main form column */}
          <div style={styles.mainCol}>
            <TagFormBasicSection
              mode={form.mode}
              readOnly={form.readOnly}
              tagId={form.tagId}
              setTagId={form.setTagId}
              name={form.name}
              setName={form.setName}
              description={form.description}
              setDescription={form.setDescription}
              channel={form.channel}
              setChannel={form.setChannel}
              clientId={form.clientId}
              setClientId={form.setClientId}
              campaignId={form.campaignId}
              setCampaignId={form.setCampaignId}
              clients={form.clients}
              campaignsForClient={form.campaignsForClient}
              errors={form.errors}
              clearFieldError={form.clearFieldError}
            />

            <TagFormTypeSelector
              value={form.tagType}
              onChange={form.setTagType}
              disabled={form.mode === "edit" || form.readOnly}
            />

            <TagFormUrlSection
              tagType={form.tagType}
              targetUrl={form.targetUrl}
              setTargetUrl={form.setTargetUrl}
              readOnly={form.readOnly}
              errors={form.errors}
              clearFieldError={form.clearFieldError}
            />

            <TagFormFileSection
              tagType={form.tagType}
              tagId={form.tagId}
              targetUrl={form.targetUrl}
              setTargetUrl={form.setTargetUrl}
              readOnly={form.readOnly}
              errors={form.errors}
              clearFieldError={form.clearFieldError}
            />

            <TagFormMultilinkSection
              tagType={form.tagType}
              links={form.links}
              setLinks={form.setLinks}
              readOnly={form.readOnly}
              errors={form.errors}
              clearFieldError={form.clearFieldError}
            />

            <TagFormVCardSection
              tagType={form.tagType}
              vcard={form.vcard}
              setVcard={form.setVcard}
              readOnly={form.readOnly}
              errors={form.errors}
              clearFieldError={form.clearFieldError}
              tagId={form.tagId}
              mode={form.mode}
            />

            {showVideoHint && (
              <div style={styles.videoHint}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9f67ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  URL zostanie ustawiony automatycznie na <code>/watch/{form.tagId || "ID"}</code>.
                  Wgraj video po zapisaniu tagu.
                </span>
              </div>
            )}

            <TagFormAdvancedSection
              mode={form.mode}
              tagId={form.tagId}
              tagType={form.tagType}
              readOnly={form.readOnly}
              onResetStats={form.resetStats}
              onDeleteTag={form.deleteTag}
              resetting={form.resetting}
              editTokenUrl={form.editTokenUrl}
              editTokenLoading={form.editTokenLoading}
              onGenerateEditToken={form.generateEditToken}
              onRevokeEditToken={form.revokeEditToken}
            />
          </div>

          {/* Preview column (vCard only) — hidden on mobile via CSS */}
          {form.tagType === "vcard" && (
            <div style={styles.previewCol} className="tagform-preview-col">
              <TagFormVCardPreview
                tagType={form.tagType}
                vcard={form.vcard}
                tagId={form.tagId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--txt)",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "24px 20px 48px",
  },
  twoCol: {
    display: "flex",
    gap: 24,
    alignItems: "stretch",
  },
  mainCol: {
    flex: "1 1 0%",
    minWidth: 0,
  },
  previewCol: {
    width: 300,
    flexShrink: 0,
    position: "relative" as const,
  },
  errorBanner: {
    padding: "12px 16px",
    borderRadius: 10,
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.3)",
    color: "var(--error)",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
  },
  videoHint: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 16px",
    borderRadius: 10,
    background: "rgba(159,103,255,0.08)",
    border: "1px solid rgba(159,103,255,0.2)",
    fontSize: 13,
    color: "var(--txt-sec)",
    marginBottom: 28,
  },
  skeleton: {
    height: 200,
    borderRadius: 8,
    background: "linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%)",
    backgroundSize: "400% 100%",
    animation: "skeleton-shimmer 1.5s ease-in-out infinite",
    marginBottom: 20,
  },
};
