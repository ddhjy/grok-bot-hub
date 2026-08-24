#!/usr/bin/env node
/** Smoke-check query rules used by the directory (keep in sync with src/lib/query.ts). */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
const DISPLAY = {
  "app-store-grok-bot": "苹果商店：Grok Bot 同伴应用",
  "forum-not-security-boundary": "必读坑：Bot 不是安全边界",
  "docs-skills-routines": "技能与例程",
  "dailydose-masterclass": "实操课：把流程录成技能",
};

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

const catalog = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../data/catalog.json"), "utf8"));

function primary(entry) {
  return [DISPLAY[entry.id] ?? entry.title, entry.title, ...(entry.tags ?? []), ...(entry.aliases ?? [])].join(" ");
}

function hits(q) {
  if (!isActiveQuery(q)) return [];
  return catalog.entries
    .filter((entry) => matchesQuery(primary(entry), entry.blurb, q, { url: entry.url, section: entry.section }))
    .map((entry) => entry.id);
}

function assert(cond, message) {
  if (!cond) {
    console.error(`search: ${message}`);
    process.exitCode = 1;
  }
}

const install = hits("安装");
assert(install.includes("docs-get-started"), "安装 misses 安装与第一次交接");
assert(install.includes("mindstudio-setup"), "安装 misses 安装并建立第一批智能体");
assert(!install.includes("cursor-help-mobile"), "安装 hits 手机端帮助");
assert(!install.includes("debbie-get-started"), "安装 hits Debbie 上手文 via get-started");

const slack = hits("Slack");
assert(slack.includes("cursor-help-connect-plugins"), "Slack misses 连接插件");
assert(slack.includes("usecarly-slack"), "Slack misses Slack 工作区");
assert(!slack.includes("cigar-coupon-outreach"), "Slack hits cigar via blurb list");
assert(!slack.includes("grok-bot-discord"), "Slack hits Discord deny-phrase");
assert(slack.length === 2, `Slack should be plugin + tutorial, got ${slack.length}: ${slack.join(",")}`);

const skillIds = [
  "chrome-devtools-mcp",
  "coolify-cursor-plugin",
  "discord-agent-bridge",
  "elves-grok-bot",
  "grok-bot-cli",
  "grok-bot-discord",
  "grok-ship",
  "grok-wechat-plugin",
  "grokbot-for-gtm",
  "grokbot-imessage-skill",
  "grokbot-sdk",
  "hypergrok-trading-desk",
  "locum",
  "really-bot",
  "superpowers",
  "werewolf-gamemaster",
];
const skill = hits("技能");
for (const id of skillIds) {
  assert(skill.includes(id), `技能 misses ${id}`);
}
assert(skill.includes("docs-skills-routines"), "技能 misses official 技能与例程");
assert(!skill.includes("dailydose-masterclass"), "技能 hits 实操课 via 技能 in display title");
assert(!skill.includes("usecarly-slack"), "技能 hits Slack 工作区 via 例程");
assert(!skill.includes("docs-teams"), "技能 hits 团队与企业 via 插件 blurb");
assert(!skill.includes("forum-local-mcp"), "技能 hits 本地 MCP via expansion");
assert(
  skill.length === skillIds.length + 1,
  `技能 should be ${skillIds.length} skills + 技能与例程, got ${skill.length}: ${skill.join(",")}`,
);

const letterS = hits("s");
assert(letterS.length === 0, `one-letter s still searches (${letterS.length})`);
assert(hits("S").length === 0, "one-letter S still searches");

if (process.exitCode) {
  console.error("search check failed");
  console.error("安装", install);
  console.error("Slack", slack);
  console.error("技能", skill);
  console.error("s", letterS.length, letterS.slice(0, 12));
  process.exit(process.exitCode);
}

console.log(
  `search OK：安装 ${install.length} · Slack ${slack.length} · 技能 ${skill.length} · s ${letterS.length}`,
);
