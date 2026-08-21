#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_SECTIONS = [
  "official",
  "tutorials",
  "cases",
  "skills",
  "reviews",
  "alternatives",
  "community",
];

const REQUIRED_LABELS = {
  official: "官方资源",
  tutorials: "教程",
  cases: "实战案例",
  skills: "技能/插件/MCP",
  reviews: "评测对比",
  alternatives: "开源替代",
  community: "社区与坑",
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHINESE_PERIOD = "。";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "data/catalog.json");

function fail(message) {
  console.error(`catalog: ${message}`);
  process.exitCode = 1;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const raw = readFileSync(catalogPath, "utf8");
let catalog;

try {
  catalog = JSON.parse(raw);
} catch (error) {
  fail(`无法解析 JSON：${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
  fail("根对象必须是 JSON object。");
  process.exit(1);
}

if (!Array.isArray(catalog.sections)) {
  fail("缺少 sections 数组。");
  process.exit(1);
}

if (!Array.isArray(catalog.entries)) {
  fail("缺少 entries 数组。");
  process.exit(1);
}

const sectionIds = catalog.sections.map((section) => section?.id);
if (sectionIds.join(",") !== REQUIRED_SECTIONS.join(",")) {
  fail(
    `sections 的 id 顺序必须是：${REQUIRED_SECTIONS.join(", ")}，实际为：${sectionIds.join(", ")}。`,
  );
}

for (const id of REQUIRED_SECTIONS) {
  const section = catalog.sections.find((item) => item?.id === id);
  if (!section) {
    fail(`缺少分区 ${id}。`);
    continue;
  }
  if (section.label !== REQUIRED_LABELS[id]) {
    fail(`分区 ${id} 的 label 应为「${REQUIRED_LABELS[id]}」，实际为「${section.label}」。`);
  }
}

const ids = new Set();
const urls = new Set();
let entryIndex = 0;

for (const entry of catalog.entries) {
  entryIndex += 1;
  const where = `entries[${entryIndex - 1}]${entry?.id ? ` (${entry.id})` : ""}`;

  if (!entry || typeof entry !== "object") {
    fail(`${where} 必须是对象。`);
    continue;
  }

  for (const key of ["id", "title", "url", "blurb", "section"]) {
    if (typeof entry[key] !== "string" || entry[key].trim() === "") {
      fail(`${where} 缺少非空字段 ${key}。`);
    }
  }

  if (typeof entry.id === "string" && !ID_PATTERN.test(entry.id)) {
    fail(`${where} id 须为小写 kebab-case。`);
  }

  if (typeof entry.id === "string") {
    if (ids.has(entry.id)) fail(`${where} 重复 id。`);
    ids.add(entry.id);
  }

  if (typeof entry.url === "string") {
    if (!isHttpUrl(entry.url)) fail(`${where} url 不是合法的 http(s) 地址。`);
    if (urls.has(entry.url)) fail(`${where} 重复 url。`);
    urls.add(entry.url);
  }

  if (typeof entry.section === "string" && !REQUIRED_SECTIONS.includes(entry.section)) {
    fail(`${where} section「${entry.section}」不在允许列表中。`);
  }

  if (typeof entry.blurb === "string") {
    const blurb = entry.blurb.trim();
    if (!blurb.endsWith(CHINESE_PERIOD)) {
      fail(`${where} blurb 必须以中文句号「。」结尾。`);
    }
    const body = blurb.slice(0, -1);
    if (body.includes(CHINESE_PERIOD) || /\.\s/.test(body)) {
      fail(`${where} blurb 必须是一句中文，中间不要再出现句号。`);
    }
    if (blurb.length < 12) {
      fail(`${where} blurb 过短。`);
    }
  }

  if (typeof entry.blurb === "string") {
    const opener = entry.blurb.trim();
    if (/^(说明如何|文档写明|介绍如何|介绍了)/.test(opener)) {
      fail(`${where} blurb 不要用「说明如何 / 文档写明 / 介绍…」开头，写清为什么要点。`);
    }
  }

  if (entry.tags !== undefined) {
    if (!Array.isArray(entry.tags) || entry.tags.some((tag) => typeof tag !== "string" || tag.trim() === "")) {
      fail(`${where} tags 必须是非空字符串数组。`);
    }
  }

  if (entry.aliases !== undefined) {
    if (
      !Array.isArray(entry.aliases) ||
      entry.aliases.some((alias) => typeof alias !== "string" || alias.trim() === "")
    ) {
      fail(`${where} aliases 必须是非空字符串数组。`);
    }
  }

  const clusters = new Set(["start", "computer", "billing", "safety"]);
  if (entry.cluster !== undefined) {
    if (typeof entry.cluster !== "string" || !clusters.has(entry.cluster)) {
      fail(`${where} cluster 只能是 start / computer / billing / safety。`);
    }
    if (entry.section !== "official") {
      fail(`${where} 只有 official 条目可以带 cluster。`);
    }
  }
}

const count = catalog.entries.length;
if (count < 40 || count > 70) {
  fail(`条目数量应为 40–70，当前为 ${count}。`);
}

if (process.exitCode) {
  console.error(`校验失败：${catalogPath}`);
  process.exit(process.exitCode);
}

const bySection = Object.fromEntries(REQUIRED_SECTIONS.map((id) => [id, 0]));
for (const entry of catalog.entries) {
  bySection[entry.section] += 1;
}

console.log(`catalog OK：${count} 条`);
for (const id of REQUIRED_SECTIONS) {
  console.log(`  ${REQUIRED_LABELS[id]} (${id}): ${bySection[id]}`);
}
