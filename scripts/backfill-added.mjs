#!/usr/bin/env node
/**
 * Backfill CatalogEntry.added from git history of data/catalog.json.
 * Date = Asia/Shanghai calendar day of the first commit that introduced
 * that entry id (fallback: first appearance of its url; else 2026-08-21).
 */
import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FALLBACK = "2026-08-21";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function shanghaiDate(iso) {
  const dt = new Date(iso);
  const sh = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
  return sh.toISOString().slice(0, 10);
}

function git(args, encoding = "utf8") {
  return execSync(args, { cwd: root, encoding, maxBuffer: 20 * 1024 * 1024 });
}

const log = git("git log --reverse --format=%H%x09%cI%x09%s -- data/catalog.json")
  .trim()
  .split("\n")
  .filter(Boolean);

const byId = new Map();
const byUrl = new Map();
const idMeta = new Map();

for (const line of log) {
  const [sha, iso, subject] = line.split("\t");
  const date = shanghaiDate(iso);
  const raw = git(`git show ${sha}:data/catalog.json`);
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    continue;
  }
  for (const entry of data.entries ?? []) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.id === "string" && !byId.has(entry.id)) {
      byId.set(entry.id, date);
      idMeta.set(entry.id, { sha, date, iso, subject, via: "id" });
    }
    if (typeof entry.url === "string" && !byUrl.has(entry.url)) {
      byUrl.set(entry.url, { date, sha, iso, subject });
    }
  }
}

const catalogPath = join(root, "data/catalog.json");
const text = readFileSync(catalogPath, "utf8");
const catalog = JSON.parse(text);

const mapping = [];
const dates = {};
for (const entry of catalog.entries) {
  const meta = idMeta.get(entry.id);
  if (meta) {
    dates[entry.id] = meta.date;
    mapping.push({ id: entry.id, added: meta.date, via: "id", sha: meta.sha, subject: meta.subject });
    continue;
  }
  const urlHit = byUrl.get(entry.url);
  if (urlHit) {
    dates[entry.id] = urlHit.date;
    mapping.push({
      id: entry.id,
      added: urlHit.date,
      via: "url",
      sha: urlHit.sha,
      subject: urlHit.subject,
    });
    continue;
  }
  dates[entry.id] = FALLBACK;
  mapping.push({ id: entry.id, added: FALLBACK, via: "fallback", sha: "", subject: "" });
}

const lines = text.split("\n");
const out = [];
for (let i = 0; i < lines.length; i += 1) {
  out.push(lines[i]);
  const match = /^(\s*)"id": "([^"]+)",\s*$/.exec(lines[i]);
  if (!match) continue;
  const [, indent, id] = match;
  if (!dates[id]) continue;
  const next = lines[i + 1] ?? "";
  if (/^\s*"added":/.test(next)) continue;
  out.push(`${indent}"added": "${dates[id]}",`);
}

writeFileSync(catalogPath, out.join("\n"));

const byDate = {};
const byVia = { id: 0, url: 0, fallback: 0 };
for (const row of mapping) {
  byDate[row.added] = (byDate[row.added] ?? 0) + 1;
  byVia[row.via] += 1;
}

const report = { total: mapping.length, byDate, byVia, mapping };
writeFileSync(join(root, "scripts/backfill-added-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`backfill-added: ${mapping.length} entries`);
for (const date of Object.keys(byDate).sort()) {
  console.log(`  ${date}: ${byDate[date]}`);
}
console.log(`  via id=${byVia.id} url=${byVia.url} fallback=${byVia.fallback}`);
