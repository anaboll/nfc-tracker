"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TagFormLayout from "@/components/tags/form/TagFormLayout";
import { useTagForm } from "@/components/tags/form/useTagForm";

function NewTagPageInner() {
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") || undefined;
  const preselectedCampaignId = searchParams.get("campaignId") || undefined;

  const form = useTagForm({
    mode: "create",
    preselectedClientId,
    preselectedCampaignId,
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
