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
}

export interface Catalog {
  updated?: string;
  sections: Section[];
  entries: CatalogEntry[];
}

export const catalog = raw as Catalog;

export function entriesBySection(sectionId: SectionId): CatalogEntry[] {
  return catalog.entries.filter((entry) => entry.section === sectionId);
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
