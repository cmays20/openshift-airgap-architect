#!/usr/bin/env node
"use strict";

/**
 * Phase 3 consistency fix: backfill docTitle in all citations using data/docs-index/<version>.json.
 * - Builds docId -> title from scenarios[*].docs[] and sharedDocs[].
 * - If same docId has different titles, reports conflict and exits.
 * - For each catalog file, for each citation: if docId not in map, reports and exits; if docTitle missing/empty, sets from map.
 * - Does not change docId, sectionHeading, or url.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const version = process.argv[2] || "4.20";
const docsIndexPath = path.join(repoRoot, "data", "docs-index", `${version}.json`);
const paramsDir = path.join(repoRoot, "data", "params", version);

function buildDocIdToTitleMap() {
  const raw = fs.readFileSync(docsIndexPath, "utf8");
  const index = JSON.parse(raw);
  const map = new Map();
  const conflicts = [];

  function add(id, title) {
    if (!id || !title) return;
    const t = String(title).trim();
    if (!t) return;
    if (map.has(id)) {
      if (map.get(id) !== t) conflicts.push({ docId: id, existing: map.get(id), other: t });
    } else {
      map.set(id, t);
    }
  }

  const scenarios = index.scenarios || {};
  for (const scenarioId of Object.keys(scenarios)) {
    const docs = scenarios[scenarioId].docs || [];
    for (const d of docs) {
      add(d.id, d.title);
    }
  }
  const sharedDocs = index.sharedDocs || [];
  for (const d of sharedDocs) {
    add(d.id, d.title);
  }

  if (conflicts.length) {
    console.error("Conflict: same docId with different titles in docs-index:");
    conflicts.forEach((c) => console.error(`  docId "${c.docId}": "${c.existing}" vs "${c.other}"`));
    process.exit(1);
  }
  return map;
}

function getCatalogFiles() {
  const files = fs.readdirSync(paramsDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => path.join(paramsDir, e.name));
  return files.sort();
}

function processFile(filePath, map) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  let backfilled = 0;
  const unmapped = new Set();

  for (const param of data.parameters || []) {
    const citations = param.citations || [];
    for (const c of citations) {
      const docId = c && c.docId;
      if (!docId) continue;
      if (!map.has(docId)) {
        unmapped.add(docId);
        continue;
      }
      const hasTitle = c.docTitle !== undefined && c.docTitle !== null && String(c.docTitle).trim() !== "";
      if (!hasTitle) {
        c.docTitle = map.get(docId);
        backfilled++;
      }
    }
  }

  return { backfilled, unmapped: [...unmapped], data };
}

function main() {
  if (!fs.existsSync(docsIndexPath)) {
    console.error("Docs index not found:", docsIndexPath);
    process.exit(1);
  }
  if (!fs.existsSync(paramsDir)) {
    console.error("Params dir not found:", paramsDir);
    process.exit(1);
  }

  const map = buildDocIdToTitleMap();
  const files = getCatalogFiles();
  const results = [];
  const allUnmapped = new Map();

  for (const filePath of files) {
    const { backfilled, unmapped, data } = processFile(filePath, map);
    const baseName = path.basename(filePath);
    if (unmapped.length) {
      allUnmapped.set(baseName, unmapped);
    }
    if (backfilled > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      results.push({ file: baseName, backfilled });
    }
  }

  if (allUnmapped.size) {
    console.error("Unmapped docId(s) in docs-index; no changes written:");
    allUnmapped.forEach((ids, file) => console.error(`  ${file}: ${ids.join(", ")}`));
    process.exit(1);
  }

  results.forEach((r) => console.log(r.file, ":", r.backfilled, "citation(s) backfilled"));
  if (results.length === 0) {
    console.log("No citation objects needed docTitle backfill.");
  }
  process.exit(0);
}

main();
