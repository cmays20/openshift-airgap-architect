#!/usr/bin/env node
"use strict";

/**
 * Phase 3.x: Backfill missing citation.docTitle in data/params/<version>/*.json.
 * - Builds docId -> title from data/docs-index/<version>.json (scenarios + sharedDocs).
 * - For each citation missing or empty docTitle: set from map if docId found; else fetch URL (H1 or <title>).
 * - Only modifies data/params/**; minimal and deterministic.
 *
 * Usage: node scripts/backfill-citation-doc-title.js [version]
 *   version defaults to 4.20
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..");
const version = process.argv[2] || "4.20";
const indexPath = path.join(repoRoot, "data", "docs-index", `${version}.json`);
const paramsDir = path.join(repoRoot, "data", "params", version);

function buildDocIdToTitle(index) {
  const map = {};
  if (index.scenarios && typeof index.scenarios === "object") {
    for (const s of Object.values(index.scenarios)) {
      if (Array.isArray(s.docs)) {
        for (const d of s.docs) {
          if (d.id && d.title && typeof d.title === "string" && d.title.trim()) {
            map[d.id] = d.title.trim();
          }
        }
      }
    }
  }
  if (Array.isArray(index.sharedDocs)) {
    for (const d of index.sharedDocs) {
      if (d.id && d.title && typeof d.title === "string" && d.title.trim()) {
        map[d.id] = d.title.trim();
      }
    }
  }
  return map;
}

function fetchTitleFromUrl(url, callback) {
  const lib = url.startsWith("https") ? https : http;
  const timeout = 10000;
  const req = lib.get(url, { timeout, headers: { "User-Agent": "OpenShift-Airgap-Architect-Backfill/1.0" } }, (res) => {
    const redirect = res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location;
    if (redirect) {
      fetchTitleFromUrl(redirect, callback);
      return;
    }
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      const h1Match = data.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match && h1Match[1].trim()) {
        callback(null, h1Match[1].replace(/&nbsp;|&#\d+;/g, " ").trim());
        return;
      }
      const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1].trim()) {
        callback(null, titleMatch[1].replace(/&nbsp;|&#\d+;/g, " ").trim());
        return;
      }
      callback(new Error("No H1 or title found"));
    });
  });
  req.on("error", callback);
  req.on("timeout", () => { req.destroy(); callback(new Error("Timeout")); });
}

function getFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...getFiles(full));
    else if (e.name.endsWith(".json")) out.push(full);
  }
  return out.sort();
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error("Docs index not found:", indexPath);
    process.exit(1);
  }
  if (!fs.existsSync(paramsDir)) {
    console.error("Params dir not found:", paramsDir);
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const docIdToTitle = buildDocIdToTitle(index);
  const urlFallbackDocIds = [];
  const stats = { files: 0, updated: 0, urlFallback: 0 };

  const files = getFiles(paramsDir);
  for (const filePath of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (e) {
      console.error(filePath, e.message);
      continue;
    }
    if (!Array.isArray(data.parameters)) continue;

    let fileUpdated = 0;
    for (const p of data.parameters) {
      if (!Array.isArray(p.citations)) continue;
      for (const c of p.citations) {
        if (!c || !c.docId) continue;
        const needTitle = c.docTitle === undefined || (typeof c.docTitle === "string" && !c.docTitle.trim());
        if (!needTitle) continue;

        const fromMap = docIdToTitle[c.docId];
        if (fromMap) {
          c.docTitle = fromMap;
          fileUpdated++;
          stats.updated++;
          continue;
        }
        if (!c.url) continue;
        try {
          const title = await new Promise((resolve, reject) => {
            fetchTitleFromUrl(c.url, (err, t) => (err ? reject(err) : resolve(t)));
          });
          if (title) {
            c.docTitle = title;
            fileUpdated++;
            stats.updated++;
            stats.urlFallback++;
            if (!urlFallbackDocIds.includes(c.docId)) urlFallbackDocIds.push(c.docId);
          }
        } catch (e) {
          console.error("URL fallback failed", c.docId, c.url, e.message);
        }
      }
    }
    if (fileUpdated > 0) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      stats.files++;
    }
  }

  console.log("Backfill summary: " + stats.updated + " citation(s) updated across " + stats.files + " file(s).");
  if (urlFallbackDocIds.length) {
    console.log("docIds that required URL fallback: " + urlFallbackDocIds.join(", "));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
