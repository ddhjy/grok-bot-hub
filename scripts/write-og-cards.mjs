#!/usr/bin/env node
/** Emit OG card specs for every shareable catalog query. Keep in sync with src/lib/catalog.ts. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(root, "data/catalog.json"), "utf8"));
const catalogSrc = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

function readTsRecord(src, name) {
  const token = `const ${name}`;
  const i = src.indexOf(token);
  if (i < 0) return {};
  const start = src.indexOf("{", i);
  let depth = 0;
  let end = start;
  for (let j = start; j < src.length; j += 1) {
    if (src[j] === "{") depth += 1;
    else if (src[j] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = j;
        break;
      }
    }
  }
  const body = src.slice(start + 1, end);
  const out = {};
  const re = /["']?([A-Za-z0-9_-]+)["']?\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(body))) {
    out[match[1]] = match[2].replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  return out;
}

function readTsStringArray(src, name) {
  const token = `const ${name}`;
  const i = src.indexOf(token);
  if (i < 0) return [];
  const start = src.indexOf("[", i);
  const end = src.indexOf("]", start);
  const body = src.slice(start, end + 1);
  return [...body.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]);
}

const DISPLAY_TITLES = readTsRecord(catalogSrc, "DISPLAY_TITLES");
const DISPLAY_BLURBS = readTsRecord(catalogSrc, "DISPLAY_BLURBS");
const INDEX_LABELS = readTsRecord(catalogSrc, "INDEX_LABELS");
const SHARE_CORE = readTsStringArray(catalogSrc, "SHARE_CORE");
const SKIP = new Set([
  "技能",
  "教程",
  "官方资源",
  "实战案例",
  "评测对比",
  "开源替代",
  "社区与坑",
  "观点与实测",
  "全部",
]);

const QUERY_EXPAND = {
  发布稿: ["introducing"],
  introducing: ["发布稿"],
  定价: ["plans", "用量", "计费", "ultra", "heavy"],
  技能: ["skill"],
  坑: ["踩坑", "安全边界", "风控"],
};
const SECTION_QUERY = {
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
const CASE_TAKE_IDS = new Set([
  "leerob-four-bets",
  "logan-computer-unlock",
  "nates-twelve-bots",
  "jp-note-cloud-computer",
  "nine-to-five-mac-etihad",
  "derya-x-to-notion",
  "indra-warren-duffer",
]);

function displayTitle(entry) {
  return DISPLAY_TITLES[entry.id] ?? entry.title;
}

function displayBlurb(entry) {
  return DISPLAY_BLURBS[entry.id] ?? entry.blurb;
}

function indexLabel(entry) {
  return INDEX_LABELS[entry.id] ?? displayTitle(entry);
}

function ogHitName(entry) {
  if (INDEX_LABELS[entry.id]) return INDEX_LABELS[entry.id];
  const title = displayTitle(entry);
  const cut = title.split("：")[0];
  return [...cut].length <= 10 ? cut : title;
}

function isLatinTokenQuery(query) {
  return LATIN_TOKEN.test(query.trim());
}

function isListContext(field, term) {
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

function isLatinLetterQuery(query) {
  return [...query].length === 1 && /^[a-zA-Z]$/u.test(query);
}

function isActiveQuery(query) {
  if (!query) return false;
  if (isLatinLetterQuery(query)) return false;
  return true;
}

function fieldMatches(field, term) {
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

function matchesQuery(primary, blurb, query, extras = {}) {
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
  return extra.some((term) => fieldMatches(primary, term.toLocaleLowerCase("zh-CN")));
}

function primary(entry) {
  return [displayTitle(entry), indexLabel(entry), entry.title, ...(entry.tags ?? []), ...(entry.aliases ?? [])]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}

function hitsFor(q) {
  if (!isActiveQuery(q)) return [];
  return catalog.entries.filter((entry) =>
    matchesQuery(primary(entry), displayBlurb(entry).toLocaleLowerCase("zh-CN"), q, {
      url: `${entry.url} ${entry.url}`.toLocaleLowerCase("zh-CN"),
      section: entry.section,
    }),
  );
}

function hasCjk(value) {
  return /[\u3400-\u9fff]/.test(value);
}

function collectSeeds() {
  const seeds = new Set(SHARE_CORE.length ? SHARE_CORE : ["Slack", "Debbie", "坑", "定价", "安装"]);
  for (const label of Object.values(INDEX_LABELS)) {
    if (!SKIP.has(label)) seeds.add(label);
  }
  seeds.add("小土");
  seeds.add("必读坑");
  seeds.add("Debbie");
  seeds.add("Price Foulger");
  for (const entry of catalog.entries) {
    for (const alias of entry.aliases ?? []) {
      if (SKIP.has(alias)) continue;
      if (hasCjk(alias) && [...alias].length >= 2) seeds.add(alias);
    }
  }
  for (const key of Object.keys(QUERY_EXPAND)) {
    if (SKIP.has(key)) continue;
    if (hasCjk(key)) seeds.add(key);
  }
  return [...seeds].filter((q) => !SKIP.has(q) && hitsFor(q).length > 0).sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function zhResultCount(n) {
  const map = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n >= 0 && n <= 10) return `${map[n]}个结果`;
  return `${n}个结果`;
}

function safeName(q) {
  return q.replace(/[/\\?%*:|"<>]/g, "").slice(0, 40);
}

const SEARCH_ACCENT = [194, 59, 34];
const SEARCH_PAPER = [245, 236, 220];
const SECTION_STYLE = {
  official: { badge: "非官方 · 官方资源", accent: [194, 59, 34], paper: [247, 236, 228] },
  tutorials: { badge: "非官方 · 教程", accent: [90, 64, 24], paper: [246, 240, 224] },
  cases: { badge: "非官方 · 实战案例", accent: [46, 92, 64], paper: [236, 244, 236] },
  skills: { badge: "非官方 · 技能", accent: [110, 58, 74], paper: [246, 232, 236] },
  reviews: { badge: "非官方 · 评测对比", accent: [28, 25, 22], paper: [236, 234, 228] },
  alternatives: { badge: "非官方 · 开源替代", accent: [36, 92, 102], paper: [232, 242, 242] },
  community: { badge: "非官方 · 社区与坑", accent: [154, 40, 28], paper: [248, 232, 226] },
  takes: { badge: "非官方 · 观点与实测", accent: [90, 64, 24], paper: [246, 240, 224] },
};

const SECTIONS = ["official", "tutorials", "cases", "skills", "reviews", "alternatives", "community", "takes"];

function sectionHits(section, q) {
  return hitsFor(q).filter((entry) => {
    if (section === "takes") return CASE_TAKE_IDS.has(entry.id);
    if (entry.section !== section) return false;
    if (section === "cases" && CASE_TAKE_IDS.has(entry.id)) return false;
    return true;
  });
}

const queries = collectSeeds();
const cards = [];

for (const q of queries) {
  const hits = hitsFor(q);
  cards.push({
    file: `og-q-${safeName(q)}.png`,
    badge: "非官方 · 搜索",
    title: `「${q}」的搜索`,
    footer: hits.slice(0, 2).map(ogHitName).join(" · "),
    accent: SEARCH_ACCENT,
    paper: SEARCH_PAPER,
    kicker: zhResultCount(hits.length),
  });
  for (const section of SECTIONS) {
    const slice = sectionHits(section, q);
    if (slice.length === 0) continue;
    const style = SECTION_STYLE[section];
    cards.push({
      file: `og-q-${safeName(q)}-${section}.png`,
      badge: style.badge,
      title: `「${q}」的搜索`,
      footer: slice.slice(0, 2).map(ogHitName).join(" · "),
      accent: style.accent,
      paper: style.paper,
      kicker: zhResultCount(slice.length),
    });
  }
}

const out = join(root, "scripts/og-cards.json");
writeFileSync(out, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`og cards: ${queries.length} queries · ${cards.length} images → ${out}`);
