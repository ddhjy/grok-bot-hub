export const QUERY_EXPAND: Record<string, string[]> = {
  发布稿: ["introducing"],
  introducing: ["发布稿"],
  定价: ["plans", "用量", "计费", "ultra", "heavy"],
  技能: ["skill"],
  坑: ["踩坑", "安全边界", "风控"],
  anzhuang: ["安装"],
  dingjia: ["定价", "plans"],
  jineng: ["技能", "skill"],
  keng: ["坑", "踩坑"],
  jiaocheng: ["教程"],
  shequ: ["社区"],
  chajian: ["插件"],
  denglu: ["登录"],
  anquan: ["安全"],
};

/** A typed section name opens that partition, not a synonym dump. */
export const SECTION_QUERY: Record<string, string> = {
  技能: "skills",
  教程: "tutorials",
  官方资源: "official",
  实战案例: "cases",
  评测对比: "reviews",
  开源替代: "alternatives",
  社区与坑: "community",
  观点与实测: "takes",
};

const DENY_BEFORE = /(?:而不是|不是把|伪装成|不要把|并非|并不是)\s*$/;
const LIST_SEP = /[,，、/|]/;
const LATIN_TOKEN = /^[a-z0-9][a-z0-9 .'+-]*$/i;

export function normalizeQuery(value: string): string {
  return value.toLocaleLowerCase("zh-CN").trim();
}

/** Slack / Debbie: title and aliases, not a blurb comma-list. */
export function isLatinTokenQuery(query: string): boolean {
  return LATIN_TOKEN.test(query.trim());
}

/** 「Granola、Zoom、Gmail、Slack 跟进」is a list, not a Slack tutorial. */
export function isListContext(field: string, term: string): boolean {
  if (!term) return false;
  const hay = field.toLocaleLowerCase("zh-CN");
  const needle = term.toLocaleLowerCase("zh-CN");
  let from = 0;
  while (from < hay.length) {
    const index = hay.indexOf(needle, from);
    if (index < 0) return false;
    const before = hay.slice(Math.max(0, index - 24), index);
    const after = hay.slice(index + needle.length, index + needle.length + 24);
    if (LIST_SEP.test(before) || LIST_SEP.test(after)) return true;
    from = index + needle.length;
  }
  return false;
}

/** One Latin letter is still typing, not a query. */
export function isLatinLetterQuery(query: string): boolean {
  return [...query].length === 1 && /^[a-zA-Z]$/u.test(query);
}

/** Empty and one-letter Latin do not filter the grid. */
export function isActiveQuery(query: string): boolean {
  if (!query) return false;
  if (isLatinLetterQuery(query)) return false;
  return true;
}

/** Skip a hit that only exists to deny the noun (「而不是把它伪装成 Slack」). */
export function fieldMatches(field: string, term: string): boolean {
  if (!term) return true;
  const hay = field.toLocaleLowerCase("zh-CN");
  const needle = term.toLocaleLowerCase("zh-CN");
  let from = 0;
  while (from < hay.length) {
    const index = hay.indexOf(needle, from);
    if (index < 0) return false;
    const before = hay.slice(Math.max(0, index - 16), index);
    if (DENY_BEFORE.test(before)) {
      from = index + needle.length;
      continue;
    }
    return true;
  }
  return false;
}

export interface QueryExtras {
  url?: string;
  section?: string;
}

/**
 * Title/alias/tag hits, plus the typed query in the blurb.
 * One-letter Latin does not search (Cursor contains s; every URL is https).
 * A section name such as 技能 is that partition, plus a skill-titled official row.
 */
export function matchesQuery(
  primary: string,
  blurb: string,
  query: string,
  extras: QueryExtras = {},
): boolean {
  if (!isActiveQuery(query)) return true;
  const sectionHit = SECTION_QUERY[query];
  if (sectionHit) {
    if (extras.section === sectionHit) return true;
    if (query === "技能" && extras.section === "official" && fieldMatches(primary, query)) {
      return true;
    }
    return false;
  }
  if (fieldMatches(primary, query)) return true;
  if (!isLatinTokenQuery(query) && fieldMatches(blurb, query) && !isListContext(blurb, query)) {
    return true;
  }
  if ([...query].length <= 1) return false;
  if (extras.url && fieldMatches(extras.url, query)) return true;
  const extra = QUERY_EXPAND[query] ?? QUERY_EXPAND[query.replace(/\s+/g, "")];
  if (!extra) return false;
  return extra.some((term) => fieldMatches(primary, normalizeQuery(term)));
}
