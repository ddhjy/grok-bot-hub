import raw from "../../data/catalog.json";

export const SECTION_IDS = [
  "official",
  "tutorials",
  "cases",
  "skills",
  "reviews",
  "alternatives",
  "community",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const OFFICIAL_CLUSTERS = [
  { id: "start", label: "入门" },
  { id: "computer", label: "电脑" },
  { id: "billing", label: "计费" },
  { id: "safety", label: "安全" },
] as const;

export type ClusterId = (typeof OFFICIAL_CLUSTERS)[number]["id"];

export interface Section {
  id: SectionId;
  label: string;
}

export interface CatalogEntry {
  id: string;
  title: string;
  url: string;
  blurb: string;
  section: SectionId;
  tags?: string[];
  aliases?: string[];
  cluster?: ClusterId;
}

export interface Catalog {
  updated?: string;
  sections: Section[];
  entries: CatalogEntry[];
}

export const catalog = raw as Catalog;

export const START_PATH = [
  {
    id: "docs-get-started",
    label: "安装桌面端",
    hint: "macOS 或 Windows，用 Cursor 账号登录",
  },
  {
    id: "cursor-help-getting-started",
    label: "第一个 Bot",
    hint: "起名、限定职责，别把密钥贴进聊天",
  },
  {
    id: "forum-not-security-boundary",
    label: "必读坑",
    hint: "同一账号下的 Bot 并不互相隔离",
  },
] as const;

export function entriesBySection(sectionId: SectionId): CatalogEntry[] {
  return catalog.entries.filter((entry) => entry.section === sectionId);
}

export function entryById(id: string): CatalogEntry | undefined {
  return catalog.entries.find((entry) => entry.id === id);
}

export function officialByCluster(clusterId: ClusterId): CatalogEntry[] {
  return catalog.entries.filter((entry) => {
    if (entry.section !== "official") return false;
    return (entry.cluster ?? "start") === clusterId;
  });
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatZhDate(iso?: string): string {
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

export function hostTone(host: string): "cinnabar" | "ink" | "bronze" | "plum" {
  if (host === "x.ai" || host.endsWith(".x.ai")) return "cinnabar";
  if (host.includes("cursor.com")) return "bronze";
  if (host.includes("github.com")) return "ink";
  if (host.includes("apple.com")) return "plum";
  return "bronze";
}

export function searchHaystack(entry: CatalogEntry): string {
  return [entry.title, entry.blurb, entry.url, ...(entry.tags ?? []), ...(entry.aliases ?? [])]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}
