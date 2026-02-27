/* ------------------------------------------------------------------ */
/*  Dashboard types                                                     */
/*  Extracted from src/app/dashboard/page.tsx                           */
/* ------------------------------------------------------------------ */

export interface KPI {
  totalScans: number;
  uniqueUsers: number;
  lastScan: string | null;
  avgScansPerUser: number;
}

export interface Devices {
  iOS: number;
  Android: number;
  Desktop: number;
  total: number;
}

export interface TopTag {
  tagId: string;
  tagName: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

export interface Country {
  country: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

export interface City {
  city: string;
  country: string;
  count: number;
  uniqueUsers: number;
}

export interface Language {
  lang: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

export interface WeekDay {
  day: string;
  date: string;
  count: number;
  uniqueUsers: number;
}

export interface WeeklyTrend {
  data: WeekDay[];
  weekStart: string;
  weekEnd: string;
}

export interface NfcChip {
  nfcId: string;
  count: number;
}

export interface HourlyData {
  hour: number;
  count: number;
  uniqueUsers: number;
}

export interface HourlyRawEntry {
  t: string;
  ip: string;
}

export interface StatsData {
  kpi: KPI;
  devices: Devices;
  topTags: TopTag[];
  topCountries: Country[];
  topCities: City[];
  topLanguages: Language[];
  nfcChips: NfcChip[];
  weeklyTrend: WeeklyTrend;
  hourlyRaw: HourlyRawEntry[];
  allTags: { id: string; name: string }[];
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

export interface ScanRow {
  seq: number;
  id: string;
  tagId: string;
  tagName: string;
  tagType: string;
  timestamp: string;
  nfcId: string | null;
  deviceType: string;
  country: string | null;
  city: string | null;
  region: string | null;
  browserLang: string | null;
  isReturning: boolean;
  eventSource: string | null;
  guestKey: string | null;
  ipHash: string | null;
}

export interface ScansResponse {
  rows: ScanRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TagLink {
  label: string;
  url: string;
  icon: string;
}

export interface LinkClickStat {
  linkUrl: string;
  linkLabel: string | null;
  linkIcon: string | null;
  clicks: number;
  percent: number;
}

export interface LinkClickData {
  tagId: string;
  total: number;
  links: LinkClickStat[];
}

export interface VideoStats {
  tagId: string;
  plays: number;
  pauses: number;
  completions: number;
  progress25: number;
  progress50: number;
  progress75: number;
  progress100: number;
  avgWatchTime: number | null;
  maxWatchTime: number | null;
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

export interface ChipItem {
  key: string;
  node: React.ReactNode;
}

export interface FilterChipsBarProps {
  chips: ChipItem[];
  onReset: () => void;
  showOverflow: boolean;
  setShowOverflow: (v: boolean | ((prev: boolean) => boolean)) => void;
  overflowRef: React.RefObject<HTMLDivElement>;
}
