"use client";

import React from "react";
import { useParams } from "next/navigation";
import TagFormLayout from "@/components/tags/form/TagFormLayout";
import { useTagForm } from "@/components/tags/form/useTagForm";

export default function EditTagPage() {
  const params = useParams();
  const tagId = params.id as string;

  const form = useTagForm({
    mode: "edit",
    initialTagId: tagId,
  });

  return <TagFormLayout form={form} />;
}
