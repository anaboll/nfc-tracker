/* ------------------------------------------------------------------ */
/*  Shared tag-related types used across dashboard, editor, and API    */
/* ------------------------------------------------------------------ */

export interface TagLink {
  label: string;
  url: string;
  icon: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface ClientFull extends ClientInfo {
  description: string | null;
  isActive: boolean;
  tagCount: number;
  scanCount: number;
}

export interface CampaignInfo {
  id: string;
  name: string;
}

export interface CampaignFull extends CampaignInfo {
  description: string | null;
  clientId: string;
  client: ClientInfo;
  isActive: boolean;
  tagCount: number;
  scanCount: number;
}

export interface TagFull {
  id: string;
  name: string;
  targetUrl: string;
  description: string | null;
  videoFile: string | null;
  isActive: boolean;
  tagType: string;
  links: TagLink[] | null;
  clientId: string | null;
  client: ClientInfo | null;
  campaignId: string | null;
  campaign: CampaignInfo | null;
  _count: { scans: number };
}

export const TAG_TYPES = ["url", "video", "multilink", "vcard", "google-review", "file"] as const;
export type TagType = (typeof TAG_TYPES)[number];

export const TYPE_LABELS: Record<string, string> = {
  url: "URL",
  video: "Video",
  multilink: "Multi-link",
  vcard: "Wizytówka",
  "google-review": "Recenzja Google",
  file: "Plik",
};

export const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  url:             { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  video:           { bg: "rgba(159,103,255,0.12)", color: "#9f67ff" },
  multilink:       { bg: "rgba(0,200,160,0.12)",  color: "#2ee8c0" },
  vcard:           { bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  "google-review": { bg: "rgba(251,146,60,0.12)",  color: "#fb923c" },
  file:            { bg: "rgba(250,204,21,0.12)",  color: "#facc15" },
};
