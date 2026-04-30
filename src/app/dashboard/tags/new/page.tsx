"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TagFormLayout from "@/components/tags/form/TagFormLayout";
import { useTagForm } from "@/components/tags/form/useTagForm";

function NewTagPageInner() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") || undefined;
  const preselectedCampaignId = searchParams.get("campaignId") || undefined;
  /* ?cloneFrom=<tagId> - tryb klonu: hook fetch-uje zrodlowego taga i wypelnia
   * formularz jego danymi (ale czysci pola identity). Linkowane z edytora przez
   * przycisk "Klonuj" w TagFormHeader. */
  const cloneFromId = searchParams.get("cloneFrom") || undefined;

  const form = useTagForm({
    mode: "create",
    preselectedClientId,
    preselectedCampaignId,
    cloneFromId,
  });

  return <TagFormLayout form={form} />;
}

export default function NewTagPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <NewTagPageInner />
    </Suspense>
  );
}
