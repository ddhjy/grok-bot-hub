import raw from "../../data/catalog.json";
import { matchesQuery, QUERY_EXPAND } from "./query";

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

/** UI partitions that have a document, including 观点 which is not a catalog section. */
export const HUB_SECTION_IDS = [...SECTION_IDS, "takes"] as const;

export type HubSectionId = (typeof HUB_SECTION_IDS)[number];

export const OFFICIAL_CLUSTERS = [
  { id: "start", label: "入门" },
  { id: "computer", label: "电脑" },
  { id: "billing", label: "计费" },
  { id: "safety", label: "安全" },
] as const;

export type ClusterId = (typeof OFFICIAL_CLUSTERS)[number]["id"];

export type PinTone = "cinnabar" | "ink" | "bronze" | "plum";

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
  featured?: boolean;
}

export interface Catalog {
  updated?: string;
  sections: Section[];
  entries: CatalogEntry[];
}

export const catalog = raw as Catalog;

/** Visible section names. Catalog JSON labels stay as harvested. */
export const SECTION_CHIP_LABELS: Partial<Record<SectionId, string>> = {
  skills: "技能",
};

export function sectionDisplayName(id: HubSectionId | "all"): string {
  if (id === "all") return "全部";
  if (id === "takes") return "观点与实测";
  const section = catalog.sections.find((item) => item.id === id);
  if (!section) return id;
  return chipLabel(section);
}

export const SECTION_OG: Record<
  SectionId,
  { title: string; description: string; image: string; imageAlt: string }
> = {
  official: {
    title: "官方资源 · Grok Bot 目录",
    description: "官方入门、安装与第一次交接、电脑和计费文档。常驻云电脑队友的中文目录。",
    image: "og-official.png",
    imageAlt: "官方资源 · Grok Bot 目录：安装与第一次交接，非官方",
  },
  tutorials: {
    title: "教程 · Grok Bot 目录",
    description: "上手教程：从第一个 Bot、Slack 工作区到编制示例。非官方中文目录。",
    image: "og-tutorials.png",
    imageAlt: "教程 · Grok Bot 目录：如何开始用 Grok Bot，非官方",
  },
  cases: {
    title: "实战案例 · Grok Bot 目录",
    description: "先看小土把内容流水线写完的一篇。其余按电脑操作、销售、工程收纳。",
    image: "og-cases.png",
    imageAlt: "实战案例 · Grok Bot 目录：先看小土，非官方",
  },
  skills: {
    title: "技能 · Grok Bot 目录",
    description: "技能、插件与 MCP：短信、Discord、浏览器和官方市场包。非官方中文目录。",
    image: "og-skills.png",
    imageAlt: "技能 · Grok Bot 目录：MCP 与技能包，非官方",
  },
  reviews: {
    title: "评测对比 · Grok Bot 目录",
    description: "把 Grok Bot 和聊天助手、自托管方案拆开评的中文目录。",
    image: "og-reviews.png",
    imageAlt: "评测对比 · Grok Bot 目录，非官方",
  },
  alternatives: {
    title: "开源替代 · Grok Bot 目录",
    description: "自托管常驻队友和非官方 Linux 包。不是 grok.com 聊天。",
    image: "og-alternatives.png",
    imageAlt: "开源替代 · Grok Bot 目录，非官方",
  },
  community: {
    title: "社区与坑 · Grok Bot 目录",
    description: "必读坑：同一账号下 Bot 并不是安全边界。论坛现场与社区清单。",
    image: "og-community.png",
    imageAlt: "社区与坑 · Grok Bot 目录：必读坑，非官方",
  },
};

export const TAKES_OG = {
  title: "观点与实测 · Grok Bot 目录",
  description: "现场看法和实测，不是产品页。七篇已核验的评测与笔记。",
  image: "og-takes.png",
  imageAlt: "观点与实测 · Grok Bot 目录，非官方",
} as const;

export function chipLabel(section: Section): string {
  return SECTION_CHIP_LABELS[section.id] ?? section.label;
}

/** Compact chip text below 1024 so 观点 is not an orphan row. */
const CHIP_SHORT_LABELS: Partial<Record<HubSectionId | "all", string>> = {
  official: "官方",
  cases: "实战",
  reviews: "评测",
  alternatives: "开源",
  takes: "观点",
};

export function chipShortLabel(id: HubSectionId | "all"): string {
  if (id === "all") return "全部";
  return CHIP_SHORT_LABELS[id] ?? sectionDisplayName(id);
}

/** Chip row order: 观点 sits before 社区与坑 so the last destination is 社区与坑. */
export function hubChipItems(): { id: HubSectionId | "all"; label: string; short: string }[] {
  const items: { id: HubSectionId | "all"; label: string; short: string }[] = [
    { id: "all", label: "全部", short: "全部" },
  ];
  for (const section of catalog.sections) {
    if (section.id === "community") {
      items.push({ id: "takes", label: "观点与实测", short: chipShortLabel("takes") });
    }
    items.push({
      id: section.id,
      label: chipLabel(section),
      short: chipShortLabel(section.id),
    });
  }
  return items;
}

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

export const START_PATH_IDS = new Set<string>(START_PATH.map((step) => step.id));

/** No start-path row is demoted from 全部. 必读坑 leads 社区与坑 on the homepage too. */
export const DEMOTE_START_IDS = new Set<string>();

/** Official iOS help pages: App Store stays featured; these two sit in 电脑 rest. */
export const DEMOTE_UNLESS_SEARCH = new Set(["docs-mobile", "cursor-help-mobile"]);

/** 入门 fold: install + first Bot. Overview is rest. */
const START_FOLD_IDS = ["docs-get-started", "cursor-help-getting-started"] as const;

/** UI glosses only. Catalog JSON titles stay as harvested; do not write these back. */
const DISPLAY_TITLES: Record<string, string> = {
  "app-store-grok-bot": "苹果商店：Grok Bot 同伴应用",
  "chrome-devtools-mcp": "Chrome 开发者工具 MCP：驱动真浏览器",
  superpowers: "通用技能集：superpowers",
  "uncle-gizmo-notes": "公开笔记：Uncle-Gizmo",
  "verge-launch": "可以派活的 AI 队友（The Verge）",
  "venturebeat-coworkers": "持久数字同事（VentureBeat）",
  opengrokbot: "自带模型：OpenGrokBot",
  "grok-bot-flake": "非官方 Linux 包（Nix flake）",
  "grok-ship": "软件工厂编制：Grok Ship",
  "lenny-grok-bot-46-cursor": "把 Bot、模型和 Cursor 拆开评（Lenny）",
  "grok-bot-vs-openclaw": "云电脑还是自托管：Grok Bot 对 OpenClaw",
  "grok-bot-vs-claude-cowork": "谁更像常驻同事：Grok Bot 对 Claude Cowork",
  "coolify-cursor-plugin": "远程查看部署和日志：Coolify 插件",
  "grokbot-imessage-skill": "让 Bot 收发短信：iMessage 技能",
  "grok-bot-discord": "把频道消息交给 Bot（Discord 网关）",
  "n2parko-roster": "产品编制与拉取请求交接（n2parko）",
  "leerob-four-bets": "Lee：四条技术赌注，常驻电脑",
  "debbie-flights": "Debbie：让 Bot 订机票",
  "debbie-beer": "Debbie：周日夜买无麸质啤酒",
  "nates-twelve-bots": "Nate：八小时组起十二个 Bot",
  "logan-computer-unlock": "Logan：关键是电脑而不是模型号",
  "price-foulger-roofing": "两天办完屋顶许可与分包（Price Foulger）",
  "jon-oneill-plumbing": "水管公司的 Atlas 编制（Jon ONeill）",
  "chuck-russell-car-shopping": "Chuck Russell：三名 Bot 邮件竞价租 SUV",
  "jjcm-vietnam-fabric": "向越南四十家面料厂询价打样",
  "john-schoenith-amazon-return": "John Schoenith：拍照办亚马逊退货",
  "alex-finn-sponsor-deal": "谈成一万美元赞助（Alex Finn）",
  "nine-to-five-mac-etihad": "查阿提哈德里程票并写每日简报（9to5Mac）",
  "xonk-thirty-one-prs": "午睡两小时并入三十一份拉取请求",
  "skins-team-litigation-email": "十五分钟筛完三百九十 GB 诉讼邮件",
  "osushi-aituber-x": "四人编制接手 AITuber 的 X 运营",
  "kominami-music-site": "Kominami：让 Bot 巡检自己的音乐站",
  "kinopee-macos-notarize": "Kinopee：用 Bot 把 macOS 应用签到公证上架",
  "ed-dale-yellow-pad": "黄拍纸上画出岗位再雇他们",
  "aakash-sponsor-letters": "幕僚长起草十封赞助信",
  "ghiles-cold-email": "两行消息修好冷邮回复翻倍",
  "david-carbutt-stripe": "非开发者一周跑课与 Stripe",
  "orcdev-discord-scripts": "Discord 日更压成三条成片脚本",
  "eugene-orbital-drift": "用 Orbital Drift 编制跑 MV 成片",
  "craig-hewitt-castos": "Castos 客服研发市场编制",
  "dylan-haugen-website": "Dylan Haugen：Bot 自行扩编并改官网",
  "derya-x-to-notion": "Derya：每天扫 X 写入 Notion 库",
  "indra-warren-duffer": "Indra：把五十万卢比交给日内交易 Bot",
  "cigar-coupon-outreach": "雪茄优惠爬虫加销售外呼",
  "visual-ad-merchant-ops": "GitHub 交接后改商户资料",
  "nathan-discord-bridge": "Nathan：把 Discord 提问接到 Bot 云电脑",
  "xiaotu-content-ops": "小土：点赞进知识库并改写成多平台",
  "forum-not-security-boundary": "必读坑：Bot 不是安全边界",
  "docs-get-started": "安装与第一次交接",
  "cursor-help-plans": "方案与用量（Cursor 帮助）",
  "cursor-help-getting-started": "开始使用：创建第一个 Bot",
  "cursor-help-sign-in": "登录帮助（Cursor）",
  "cursor-help-mobile": "手机端帮助（Cursor）",
  "debbie-get-started": "如何开始用 Grok Bot（Debbie）",
  "dailydose-masterclass": "实操课：把流程录成技能",
  "peter-yang-use-cases": "五个值得先试的用法（Peter Yang）",
  "ayautomate-explained": "Grok Bot 是什么（配真实编制）",
  "ronglecat-awesome": "社区清单：已核验的链接",
  "mindstudio-setup": "安装并建立第一批 Bot",
  "grok-bot-vs-chatgpt-work": "工作场景里：Grok Bot 对 ChatGPT",
  guaca: "guaca：电脑操作 Bot",
};

const DISPLAY_BLURBS: Record<string, string> = {
  "cursor-help-getting-started": "用同一 Cursor 账号登录、创建第一个 Bot，不要把密钥贴进聊天。",
  "mindstudio-setup": "从安装走到第一个 Bot，并写清 Heavy、Ultra 与团队 Premium 的门槛。",
  "introducing-grok-bot":
    "二〇二六年八月十一日的发布说明：自带电脑、合上笔记本也继续干活的常驻 Bot。",
  "nates-twelve-bots": "用第一天就拉起的十二人编制，讨论这个价位的 Bot 小队值不值得。",
};

/** Named rest pills for non-电脑 clusters. How-tos are not a nine-pill wall. */
export const OFFICIAL_REST_SHORT_IDS = new Set([
  "xai-bot",
  "introducing-grok-bot",
  "plugin-marketplace",
  "docs-overview",
  "docs-use-cases",
  "docs-teams",
  "cursor-help-sign-in",
  "docs-troubleshooting",
  "docs-faq",
]);

/** 电脑 named rest: 产品页 / 发布稿 / 插件市场. How-tos sit behind 其余文档. */
export const COMPUTER_REST_SHORT_IDS = new Set([
  "xai-bot",
  "introducing-grok-bot",
  "plugin-marketplace",
]);

/** 电脑 fold: 云电脑 / 插件 / 商店 / 岗位示例. 创建与管理 is a named pill, not 其余. */
const COMPUTER_FOLD_IDS = [
  "docs-computer-and-apps",
  "cursor-help-connect-plugins",
  "app-store-grok-bot",
  "docs-use-cases",
] as const;

/** One named pin so a phone first screen still reaches the groups. */
export const CASE_PINS = [
  {
    id: "xiaotu-content-ops",
    name: "小土",
    hostNote: "知乎",
    reason: "中文里把内容流水线写完的一篇，先看这个。",
    mark: "知",
    tone: "cinnabar" as PinTone,
  },
] as const;

export const CASE_OPS_LEAD = {
  id: "debbie-flights",
  name: "Debbie",
  hostNote: "debbie.codes",
  reason: "让 Bot 去航司网站订机票。",
  mark: "订",
  tone: "cinnabar" as PinTone,
} as const;

export const CASE_OPS_RANKED_IDS = ["debbie-flights"] as const;

/** Ranked sales on `/cases/`. Same named-pin language, not a leftover tile. */
export const CASE_SALES_RANKED = [
  {
    id: "price-foulger-roofing",
    name: "Price Foulger",
    hostNote: "X",
    reason: "两天办完的真业务：许可、分包、电子签。",
    mark: "许",
    tone: "cinnabar" as PinTone,
  },
  {
    id: "alex-finn-sponsor-deal",
    name: "Alex Finn",
    hostNote: "YouTube",
    reason: "谈成一万美元赞助，不是演示。",
    mark: "赞",
    tone: "ink" as PinTone,
  },
] as const;

export const CASE_SALES_LEAD = CASE_SALES_RANKED[0];

export const CASE_SALES_RANKED_IDS = CASE_SALES_RANKED.map((item) => item.id);

export const CASE_PINNED_IDS = CASE_PINS.map((pin) => pin.id);

/** Opinion / week-in-review posts. Shown under 观点与实测, not inside 实战. */
export const CASE_TAKE_IDS = [
  "leerob-four-bets",
  "logan-computer-unlock",
  "nates-twelve-bots",
  "jp-note-cloud-computer",
  "nine-to-five-mac-etihad",
  "derya-x-to-notion",
  "indra-warren-duffer",
] as const;

export const CASE_TAKE_ID_SET = new Set<string>(CASE_TAKE_IDS);

export const CASE_GROUPS = [
  {
    id: "ops",
    label: "电脑操作",
    ids: [
      "debbie-flights",
      "debbie-beer",
      "chuck-russell-car-shopping",
      "john-schoenith-amazon-return",
      "kominami-music-site",
      "dylan-haugen-website",
      "visual-ad-merchant-ops",
    ],
  },
  {
    id: "sales",
    label: "销售与编制",
    ids: [
      "price-foulger-roofing",
      "n2parko-roster",
      "alex-finn-sponsor-deal",
      "jon-oneill-plumbing",
      "jjcm-vietnam-fabric",
      "osushi-aituber-x",
      "ed-dale-yellow-pad",
      "aakash-sponsor-letters",
      "ghiles-cold-email",
      "david-carbutt-stripe",
      "orcdev-discord-scripts",
      "eugene-orbital-drift",
      "craig-hewitt-castos",
      "cigar-coupon-outreach",
      "nathan-discord-bridge",
    ],
  },
  {
    id: "eng",
    label: "工程",
    ids: ["xonk-thirty-one-prs", "skins-team-litigation-email", "kinopee-macos-notarize"],
  },
] as const;

const INDEX_LABELS: Record<string, string> = {
  "xai-bot": "产品页",
  "introducing-grok-bot": "发布稿",
  "docs-overview": "文档总览",
  "docs-use-cases": "岗位示例",
  "docs-mobile": "iOS 文档",
  "docs-bots": "创建与管理",
  "docs-chat-and-collaboration": "消息与协作",
  "docs-files-and-results": "文件与结果",
  "docs-skills-routines": "技能与例程",
  "docs-settings-notifications": "设置与通知",
  "cursor-help-computer-recovery": "恢复数据",
  "cursor-help-mobile": "手机端帮助",
  "plugin-marketplace": "插件市场",
  "docs-teams": "团队与企业",
  "cursor-help-sign-in": "登录帮助",
  "docs-troubleshooting": "官方排障",
  "docs-faq": "常见问题",
};

export function displayTitle(entry: CatalogEntry): string {
  return DISPLAY_TITLES[entry.id] ?? entry.title;
}

export function displayBlurb(entry: CatalogEntry): string {
  return DISPLAY_BLURBS[entry.id] ?? entry.blurb;
}

export function indexLabel(entry: CatalogEntry): string {
  return INDEX_LABELS[entry.id] ?? displayTitle(entry);
}

export function isHiddenOnDefaultGrid(entry: CatalogEntry): boolean {
  return DEMOTE_START_IDS.has(entry.id) || DEMOTE_UNLESS_SEARCH.has(entry.id);
}

export function isCaseTake(entry: CatalogEntry): boolean {
  return CASE_TAKE_ID_SET.has(entry.id);
}

export function visibleOnDefaultGrid(sectionId?: SectionId): CatalogEntry[] {
  return catalog.entries.filter((entry) => {
    if (isHiddenOnDefaultGrid(entry)) return false;
    if (sectionId && entry.section !== sectionId) return false;
    if (sectionId === "cases" && isCaseTake(entry)) return false;
    return true;
  });
}

/** Section page / open-chip count: start-path rows come back; iOS docs and 观点 stay out of 实战. */
export function visibleInSection(sectionId: SectionId): CatalogEntry[] {
  return catalog.entries.filter((entry) => {
    if (entry.section !== sectionId) return false;
    if (DEMOTE_UNLESS_SEARCH.has(entry.id)) return false;
    if (sectionId === "cases" && isCaseTake(entry)) return false;
    return true;
  });
}

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

export function officialClusterGroups(clusterId: ClusterId): {
  featured: CatalogEntry[];
  rest: CatalogEntry[];
} {
  const entries = officialByCluster(clusterId);
  const featured = entries.filter((entry) => entry.featured);
  const rest = entries.filter((entry) => !entry.featured);
  if (featured.length === 0) return { featured: entries, rest: [] };
  return { featured, rest };
}

export function officialRestBuckets(clusterId: ClusterId): {
  featured: CatalogEntry[];
  short: CatalogEntry[];
  extra: CatalogEntry[];
} {
  const entries = officialByCluster(clusterId);
  let featured: CatalogEntry[];
  let rest: CatalogEntry[];
  if (clusterId === "start") {
    const fold = new Set<string>(START_FOLD_IDS);
    featured = START_FOLD_IDS.map((id) => entryById(id)).filter((entry): entry is CatalogEntry => Boolean(entry));
    rest = entries.filter((entry) => !fold.has(entry.id));
  } else if (clusterId === "computer") {
    const fold = new Set<string>(COMPUTER_FOLD_IDS);
    featured = COMPUTER_FOLD_IDS.map((id) => entryById(id)).filter((entry): entry is CatalogEntry => Boolean(entry));
    rest = entries.filter((entry) => !fold.has(entry.id));
  } else {
    const grouped = officialClusterGroups(clusterId);
    featured = grouped.featured;
    rest = grouped.rest;
  }
  const shortIds = clusterId === "computer" ? COMPUTER_REST_SHORT_IDS : OFFICIAL_REST_SHORT_IDS;
  const short = rest.filter((entry) => shortIds.has(entry.id));
  const extra = rest.filter((entry) => !shortIds.has(entry.id));
  if (short.length === 0 || extra.length === 0) {
    return { featured, short: rest, extra: [] };
  }
  return { featured, short, extra };
}

function entriesByIds(ids: readonly string[]): CatalogEntry[] {
  return ids
    .map((id) => entryById(id))
    .filter((entry): entry is CatalogEntry => Boolean(entry));
}

export function casePinned(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
}[] {
  return CASE_PINS.flatMap((pin) => {
    const entry = entryById(pin.id);
    if (!entry) return [];
    return [
      {
        entry,
        name: pin.name,
        hostNote: pin.hostNote,
        reason: pin.reason,
        mark: pin.mark,
        tone: pin.tone,
      },
    ];
  });
}

export function caseGroups(): { id: string; label: string; entries: CatalogEntry[] }[] {
  return CASE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    entries: entriesByIds(group.ids),
  }));
}

export function caseTakes(): CatalogEntry[] {
  return entriesByIds(CASE_TAKE_IDS);
}

export function caseSalesLead(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
} | undefined {
  const entry = entryById(CASE_SALES_LEAD.id);
  if (!entry) return undefined;
  return {
    entry,
    name: CASE_SALES_LEAD.name,
    hostNote: CASE_SALES_LEAD.hostNote,
    reason: CASE_SALES_LEAD.reason,
    mark: CASE_SALES_LEAD.mark,
    tone: CASE_SALES_LEAD.tone,
  };
}

export function caseSalesRanked(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
}[] {
  return CASE_SALES_RANKED.flatMap((item) => {
    const entry = entryById(item.id);
    if (!entry) return [];
    return [
      {
        entry,
        name: item.name,
        hostNote: item.hostNote,
        reason: item.reason,
        mark: item.mark,
        tone: item.tone,
      },
    ];
  });
}

export function caseSalesSplit(): { ranked: CatalogEntry[]; rest: CatalogEntry[] } {
  const sales = CASE_GROUPS.find((group) => group.id === "sales");
  const entries = entriesByIds(sales?.ids ?? []);
  const rankedSet = new Set<string>(CASE_SALES_RANKED_IDS);
  const ranked = CASE_SALES_RANKED_IDS.map((id) => entryById(id)).filter((entry): entry is CatalogEntry =>
    Boolean(entry),
  );
  const rest = entries.filter((entry) => !rankedSet.has(entry.id));
  return { ranked, rest };
}

export function caseOpsLead(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
} | undefined {
  const entry = entryById(CASE_OPS_LEAD.id);
  if (!entry) return undefined;
  return {
    entry,
    name: CASE_OPS_LEAD.name,
    hostNote: CASE_OPS_LEAD.hostNote,
    reason: CASE_OPS_LEAD.reason,
    mark: CASE_OPS_LEAD.mark,
    tone: CASE_OPS_LEAD.tone,
  };
}

export function caseOpsSplit(): { ranked: CatalogEntry[]; rest: CatalogEntry[] } {
  const ops = CASE_GROUPS.find((group) => group.id === "ops");
  const entries = entriesByIds(ops?.ids ?? []);
  const rankedSet = new Set<string>(CASE_OPS_RANKED_IDS);
  const ranked = CASE_OPS_RANKED_IDS.map((id) => entryById(id)).filter((entry): entry is CatalogEntry =>
    Boolean(entry),
  );
  const rest = entries.filter((entry) => !rankedSet.has(entry.id));
  return { ranked, rest };
}

/** Ranked canvas on `/cases/`: pin + ops ranked + sales ranked + 工程. Rest is search-only. */
export function casesCanvasCount(): number {
  const eng = CASE_GROUPS.find((group) => group.id === "eng");
  return CASE_PINS.length + CASE_OPS_RANKED_IDS.length + CASE_SALES_RANKED_IDS.length + (eng?.ids.length ?? 0);
}

export function casePageRest(): CatalogEntry[] {
  return [...caseOpsSplit().rest, ...caseSalesSplit().rest];
}

const CASE_CANVAS_IDS = new Set<string>([
  ...CASE_PINNED_IDS,
  ...CASE_OPS_RANKED_IDS,
  ...CASE_SALES_RANKED_IDS,
  ...(CASE_GROUPS.find((group) => group.id === "eng")?.ids ?? []),
]);

export function isCasesCanvasEntry(entry: CatalogEntry): boolean {
  return CASE_CANVAS_IDS.has(entry.id);
}

export function isCasesRestEntry(entry: CatalogEntry): boolean {
  return entry.section === "cases" && !isCaseTake(entry) && !CASE_CANVAS_IDS.has(entry.id);
}

export const SKILL_LEAD = {
  id: "chrome-devtools-mcp",
  name: "真浏览器",
  hostNote: "GitHub",
  reason: "用真实 Chrome 看网络和性能，不是再包一层。",
  mark: "览",
  tone: "cinnabar" as PinTone,
} as const;

export const SKILL_REST_RANKED = [
  {
    id: "grokbot-imessage-skill",
    name: "短信",
    hostNote: "GitHub",
    reason: "让 Bot 在本机收发 iMessage。",
    mark: "信",
    tone: "plum" as PinTone,
  },
  {
    id: "grok-bot-discord",
    name: "频道",
    hostNote: "GitHub",
    reason: "把 Discord 频道消息交给 Bot。",
    mark: "频",
    tone: "ink" as PinTone,
  },
  {
    id: "coolify-cursor-plugin",
    name: "部署",
    hostNote: "GitHub",
    reason: "远程看服务器、应用、部署和日志。",
    mark: "部",
    tone: "bronze" as PinTone,
  },
  {
    id: "grok-ship",
    name: "工厂",
    hostNote: "GitHub",
    reason: "侦察与交付分工，合入前先对抗审查。",
    mark: "厂",
    tone: "ink" as PinTone,
  },
  {
    id: "superpowers",
    name: "通用",
    hostNote: "GitHub",
    reason: "先计划、用证据调试，再写出可过审的东西。",
    mark: "通",
    tone: "bronze" as PinTone,
  },
  {
    id: "werewolf-gamemaster",
    name: "狼人杀",
    hostNote: "GitHub",
    reason: "能主持一局狼人杀的真实技能包。",
    mark: "狼",
    tone: "plum" as PinTone,
  },
] as const;

export function skillLead(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
} | undefined {
  const entry = entryById(SKILL_LEAD.id);
  if (!entry) return undefined;
  return { entry, ...SKILL_LEAD };
}

export function skillRestRanked(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
}[] {
  return SKILL_REST_RANKED.flatMap((item) => {
    const entry = entryById(item.id);
    if (!entry) return [];
    return [{ entry, ...item }];
  });
}

export const COMMUNITY_LEAD = {
  id: "forum-not-security-boundary",
  name: "必读坑",
  hostNote: "Cursor 论坛",
  reason: "同一账号下 Bot 并不是安全边界。先读这篇，再看下面的现场。",
  mark: "坑",
  tone: "cinnabar" as PinTone,
} as const;

export function communityLead(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
} | undefined {
  const entry = entryById(COMMUNITY_LEAD.id);
  if (!entry) return undefined;
  return {
    entry,
    name: COMMUNITY_LEAD.name,
    hostNote: COMMUNITY_LEAD.hostNote,
    reason: COMMUNITY_LEAD.reason,
    mark: COMMUNITY_LEAD.mark,
    tone: COMMUNITY_LEAD.tone,
  };
}

export const COMMUNITY_REST_RANKED = [
  {
    id: "forum-introducing",
    name: "首发帖",
    hostNote: "Cursor 论坛",
    reason: "上线最初两天，大家真正在问什么。",
    mark: "首",
    tone: "cinnabar" as PinTone,
  },
  {
    id: "forum-x-login-lock",
    name: "登录锁",
    hostNote: "Cursor 论坛",
    reason: "云电脑撞上 X 风控，已经发生的现场。",
    mark: "锁",
    tone: "bronze" as PinTone,
  },
  {
    id: "forum-reconnect",
    name: "重连失败",
    hostNote: "Cursor 论坛",
    reason: "「连不上你的电脑」的截图和讨论。",
    mark: "重",
    tone: "ink" as PinTone,
  },
  {
    id: "forum-local-mcp",
    name: "本地 MCP",
    hostNote: "Cursor 论坛",
    reason: "接不了本机 MCP，只能远程 HTTP。",
    mark: "本",
    tone: "plum" as PinTone,
  },
  {
    id: "ronglecat-awesome",
    name: "社区清单",
    hostNote: "GitHub",
    reason: "CC0 链接清单，本站核验过的那些。",
    mark: "清",
    tone: "ink" as PinTone,
  },
  {
    id: "forum-always-on-workers",
    name: "常驻工人",
    hostNote: "Cursor 论坛",
    reason: "把 Bot 当同事，而不是每个话题新开一页。",
    mark: "常",
    tone: "bronze" as PinTone,
  },
  {
    id: "forum-orphaned-link",
    name: "删号挂空",
    hostNote: "Cursor 论坛",
    reason: "删掉 Cursor 账号会把 Grok 绑定留在失效身份上。",
    mark: "号",
    tone: "plum" as PinTone,
  },
] as const;

const COMMUNITY_REST_RANKED_IDS = new Set<string>(COMMUNITY_REST_RANKED.map((item) => item.id));

export function communityRest(): CatalogEntry[] {
  return catalog.entries.filter(
    (entry) => entry.section === "community" && entry.id !== COMMUNITY_LEAD.id,
  );
}

export function communityRestRanked(): {
  entry: CatalogEntry;
  name: string;
  hostNote: string;
  reason: string;
  mark: string;
  tone: PinTone;
}[] {
  return COMMUNITY_REST_RANKED.flatMap((item) => {
    const entry = entryById(item.id);
    if (!entry) return [];
    return [
      {
        entry,
        name: item.name,
        hostNote: item.hostNote,
        reason: item.reason,
        mark: item.mark,
        tone: item.tone,
      },
    ];
  });
}

export function communityRestExtra(): CatalogEntry[] {
  return communityRest().filter((entry) => !COMMUNITY_REST_RANKED_IDS.has(entry.id));
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

export function searchPrimary(entry: CatalogEntry): string {
  return [
    displayTitle(entry),
    indexLabel(entry),
    entry.title,
    ...(entry.tags ?? []),
    ...(entry.aliases ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}

export function searchUrl(entry: CatalogEntry): string {
  return [hostnameOf(entry.url), entry.url].join(" ").toLocaleLowerCase("zh-CN");
}

export function searchBlurb(entry: CatalogEntry): string {
  return displayBlurb(entry).toLocaleLowerCase("zh-CN");
}

export const SEARCH_OG = {
  title: "搜索 · Grok Bot 目录",
  description: "在目录里搜标题、别名和分区。输入关键词开始。",
  image: "og-search.png",
  imageAlt: "搜索 · Grok Bot 目录，非官方",
} as const;

export function searchDocumentTitle(q: string): string {
  return `「${q}」的搜索 · Grok Bot 目录`;
}

export function ogHitName(entry: CatalogEntry): string {
  if (INDEX_LABELS[entry.id]) return INDEX_LABELS[entry.id];
  const title = displayTitle(entry);
  const cut = title.split("：")[0];
  return [...cut].length <= 10 ? cut : title;
}

export function queryHits(q: string): CatalogEntry[] {
  if (!q) return [];
  return catalog.entries.filter((entry) =>
    matchesQuery(searchPrimary(entry), searchBlurb(entry), q, {
      url: searchUrl(entry),
      section: entry.section,
    }),
  );
}

export function searchDocumentDescription(q: string): string {
  const hits = queryHits(q);
  if (hits.length === 0) return `目录里标题、别名和分区含「${q}」的条目。`;
  const names = hits.slice(0, 3).map((entry) => ogHitName(entry)).join("、");
  return `目录里「${q}」有${hits.length}条：${names}。`;
}

export function searchOgFile(q: string): string {
  const safe = q.replace(/[/\\?%*:|"<>]/g, "").slice(0, 40);
  if (!safe) return "og-search.png";
  return `og-q-${safe}.png`;
}

const SKIP_SHARE_QUERY = new Set([
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

/** Core share documents (indexable). Additional catalog tokens are noindex share cards. */
export const SHARE_CORE = ["Slack", "Debbie", "坑", "定价", "安装"] as const;

/** @deprecated Use SHARE_CORE. Kept so older call sites still type-check during the swap. */
export const SHARE_QUERIES = SHARE_CORE;

function hasCjk(value: string): boolean {
  return /[\u3400-\u9fff]/.test(value);
}

function collectShareQuerySeeds(): string[] {
  const seeds = new Set<string>(SHARE_CORE);
  for (const label of Object.values(INDEX_LABELS)) {
    if (!SKIP_SHARE_QUERY.has(label)) seeds.add(label);
  }
  seeds.add("小土");
  seeds.add("必读坑");
  seeds.add(CASE_OPS_LEAD.name);
  seeds.add(CASE_SALES_LEAD.name);
  for (const entry of catalog.entries) {
    for (const alias of entry.aliases ?? []) {
      if (SKIP_SHARE_QUERY.has(alias)) continue;
      if (hasCjk(alias) && [...alias].length >= 2) seeds.add(alias);
    }
  }
  for (const key of Object.keys(QUERY_EXPAND)) {
    if (SKIP_SHARE_QUERY.has(key)) continue;
    if (hasCjk(key)) seeds.add(key);
  }
  return [...seeds];
}

let cachedShareQueries: string[] | undefined;

/** Static `/search/{q}/` documents. Section names go to section pages instead. */
export function shareQueries(): string[] {
  if (cachedShareQueries) return cachedShareQueries;
  cachedShareQueries = collectShareQuerySeeds()
    .filter((q) => !SKIP_SHARE_QUERY.has(q))
    .filter((q) => queryHits(q).length > 0)
    .sort((a, b) => a.localeCompare(b, "zh-CN"));
  return cachedShareQueries;
}

export function isShareQuery(q: string): boolean {
  if (!q) return false;
  const lower = q.toLocaleLowerCase("en-US");
  return shareQueries().some((item) => item === q || item.toLocaleLowerCase("en-US") === lower);
}

export function isCoreShareQuery(q: string): boolean {
  const key = canonicalShareQuery(q);
  return SHARE_CORE.some((item) => item === key);
}

export function canonicalShareQuery(q: string): string {
  const all = shareQueries();
  if (all.includes(q)) return q;
  const lower = q.toLocaleLowerCase("en-US");
  return all.find((item) => item.toLocaleLowerCase("en-US") === lower) ?? q;
}

export function searchQueryOgMeta(q: string): {
  file: string;
  kicker: string;
  footer: string;
} | null {
  const hits = queryHits(q);
  if (hits.length === 0) return null;
  return {
    file: searchOgFile(q),
    kicker: zhResultCount(hits.length),
    footer: hits.slice(0, 2).map((entry) => ogHitName(entry)).join(" · "),
  };
}

export function sectionSearchTitle(section: HubSectionId, q: string): string {
  return `「${q}」的搜索 · ${sectionDisplayName(section)} · Grok Bot 目录`;
}

export function sectionSearchDescription(section: HubSectionId, q: string): string {
  const hits = queryHitsInSection(section, q);
  if (hits.length === 0) {
    return `${sectionDisplayName(section)}里没有「${q}」的条目。`;
  }
  const names = hits.slice(0, 3).map((entry) => displayTitle(entry)).join("、");
  return `${sectionDisplayName(section)}里「${q}」有${hits.length}条：${names}。`;
}

export function queryHitsInSection(section: HubSectionId, q: string): CatalogEntry[] {
  const needle = canonicalShareQuery(q);
  return catalog.entries.filter((entry) => {
    if (section === "takes") {
      if (!isCaseTake(entry)) return false;
    } else if (entry.section !== section) {
      return false;
    } else if (section === "cases" && isCaseTake(entry)) {
      return false;
    }
    return matchesQuery(searchPrimary(entry), searchBlurb(entry), needle, {
      url: searchUrl(entry),
      section: entry.section,
    });
  });
}

export function shareSectionQueryPairs(): { section: HubSectionId; q: string }[] {
  const pairs: { section: HubSectionId; q: string }[] = [];
  for (const q of shareQueries()) {
    for (const section of HUB_SECTION_IDS) {
      if (queryHitsInSection(section, q).length > 0) {
        pairs.push({ section, q });
      }
    }
  }
  return pairs;
}

export function sectionQueryOgFile(section: HubSectionId, q: string): string {
  const safe = q.replace(/[/\\?%*:|"<>]/g, "").slice(0, 40);
  if (!safe) return "og-search.png";
  return `og-q-${safe}-${section}.png`;
}

export function zhResultCount(n: number): string {
  const map = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];
  if (n >= 0 && n <= 10) return `${map[n]}个结果`;
  return `${n}个结果`;
}

export function sectionQueryOgMeta(section: HubSectionId, q: string): {
  file: string;
  kicker: string;
  footer: string;
} | null {
  const hits = queryHitsInSection(section, q);
  if (hits.length === 0) return null;
  const names = hits.slice(0, 2).map((entry) => displayTitle(entry));
  return {
    file: sectionQueryOgFile(section, q),
    kicker: zhResultCount(hits.length),
    footer: names.join(" · "),
  };
}

export function searchHaystack(entry: CatalogEntry): string {
  return `${searchPrimary(entry)} ${searchBlurb(entry)}`;
}
