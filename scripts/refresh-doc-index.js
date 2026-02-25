#!/usr/bin/env node
"use strict";

/**
 * Refresh doc index: read data/docs-index/<version>.json, validate each URL,
 * then write back a deterministic index with only live URLs.
 * Supports Phase 1 schema: scenarios is object, each value is { docs: [...] }.
 * Requires Node 18+ (fetch).
 * Usage: node scripts/refresh-doc-index.js [--dry-run] [path/to/docs-index/4.20.json]
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const defaultPath = path.join(repoRoot, "data", "docs-index", "4.20.json");

async function fetchOk(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  return res.ok;
}

function getDocList(scenarioValue) {
  if (!scenarioValue) return [];
  if (Array.isArray(scenarioValue)) return scenarioValue;
  if (scenarioValue && Array.isArray(scenarioValue.docs)) return scenarioValue.docs;
  return [];
}

function collectUrls(index) {
  const urls = new Map();
  if (index.baseUrl) urls.set(index.baseUrl, "baseUrl");
  if (index.scenarios && typeof index.scenarios === "object" && !Array.isArray(index.scenarios)) {
    for (const scenarioValue of Object.values(index.scenarios)) {
      for (const d of getDocList(scenarioValue)) {
        if (d && d.url) urls.set(d.url, d.id || d.url);
      }
    }
  }
  if (Array.isArray(index.sharedDocs)) {
    for (const d of index.sharedDocs) {
      if (d && d.url) urls.set(d.url, d.id || d.url);
    }
  }
  return urls;
}

function filterLive(index, liveUrls) {
  const out = { ...index };
  if (index.scenarios && typeof index.scenarios === "object" && !Array.isArray(index.scenarios)) {
    out.scenarios = {};
    const sortedIds = Object.keys(index.scenarios).sort();
    for (const sid of sortedIds) {
      const scenarioValue = index.scenarios[sid];
      const docs = getDocList(scenarioValue);
      const filtered = docs.filter((d) => d && d.url && liveUrls.has(d.url));
      const sortedDocs = [...filtered].sort((a, b) => (a.title || a.id || "").localeCompare(b.title || b.id || ""));
      out.scenarios[sid] = { docs: sortedDocs };
    }
  }
  if (Array.isArray(index.sharedDocs)) {
    out.sharedDocs = index.sharedDocs
      .filter((d) => d && d.url && liveUrls.has(d.url))
      .sort((a, b) => (a.title || a.id || "").localeCompare(b.title || b.id || ""));
  }
  return out;
}

function summary(index) {
  const counts = {};
  if (index.scenarios && typeof index.scenarios === "object" && !Array.isArray(index.scenarios)) {
    for (const [sid, scenarioValue] of Object.entries(index.scenarios)) {
      counts[sid] = getDocList(scenarioValue).length;
    }
  }
  const sharedCount = Array.isArray(index.sharedDocs) ? index.sharedDocs.length : 0;
  return { byScenario: counts, sharedDocs: sharedCount };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filePath = args.filter((a) => a !== "--dry-run")[0] || defaultPath;
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);

  let index;
  try {
    index = JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (e) {
    console.error("Failed to read index:", absPath, e.message);
    process.exit(1);
  }

  const urls = collectUrls(index);
  const liveUrls = new Set();
  const dead = [];

  for (const [url, id] of urls) {
    try {
      const ok = await fetchOk(url);
      if (ok) liveUrls.add(url);
      else dead.push({ id, url });
    } catch (e) {
      dead.push({ id, url, error: e.message });
    }
  }

  if (dead.length) {
    console.error("Dead or unreachable URLs:");
    dead.forEach(({ id, url, error }) => console.error("  ", id, url, error || ""));
  }

  const filtered = filterLive(index, liveUrls);
  const deterministic = JSON.stringify(filtered, null, 2);

  const sum = summary(index);
  if (dryRun) {
    console.log("Dry run: would write", absPath);
    console.log("Docs per scenario:", sum.byScenario);
    console.log("Shared docs count:", sum.sharedDocs);
    console.log("Live:", liveUrls.size, "Dead:", dead.length);
    process.exit(dead.length ? 1 : 0);
  }

  fs.writeFileSync(absPath, deterministic + "\n", "utf8");
  console.log("Wrote", absPath);
  console.log("Docs per scenario:", summary(filtered).byScenario);
  console.log("Shared docs count:", summary(filtered).sharedDocs);
  console.log("Live:", liveUrls.size, "Dead:", dead.length);
  process.exit(dead.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
