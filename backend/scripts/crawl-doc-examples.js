#!/usr/bin/env node
/**
 * Part 4: Fetch every 4.20 doc URL from data/docs-index/4.20.json, extract every
 * install-config/agent-config/imageset full and snippet example (code blocks).
 * Saves to docs/e2e-examples/snippets/ with source URL and index.
 * Run from backend: node scripts/crawl-doc-examples.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DOCS_INDEX = path.join(REPO_ROOT, "data", "docs-index", "4.20.json");
const OUT_DIR = path.join(REPO_ROOT, "docs", "e2e-examples", "snippets");
const INV_PATH = path.join(REPO_ROOT, "docs", "e2e-examples", "SNIPPETS_INVENTORY.md");

const CODE_BLOCK_RE = /```(?:yaml|plaintext|json)?\s*\n([\s\S]*?)```/gi;
const HTML_PRE_RE = /<pre[^>]*>([\s\S]*?)<\/pre>/gi;
const HTML_CODE_RE = /<code[^>]*>([\s\S]*?)<\/code>/gi;

function collectUrls(index) {
  const urls = new Set();
  if (index.scenarios) {
    for (const scenario of Object.values(index.scenarios)) {
      if (scenario.docs) {
        for (const doc of scenario.docs) urls.add(doc.url);
      }
    }
  }
  if (index.sharedDocs) {
    for (const doc of index.sharedDocs) {
      if (doc.url && !doc.url.includes("nmstate.io")) urls.add(doc.url);
    }
  }
  return [...urls];
}

async function fetchUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "OpenShift-Airgap-Architect-E2E/1.0" },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) return { ok: false, status: res.status, text: "" };
  const text = await res.text();
  return { ok: true, status: res.status, text };
}

function decodeHtml(html) {
  return html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractBlocks(text) {
  const blocks = [];
  let m;
  CODE_BLOCK_RE.lastIndex = 0;
  while ((m = CODE_BLOCK_RE.exec(text)) !== null) {
    const content = m[1].trim();
    if (content.length > 0) blocks.push(content);
  }
  if (blocks.length > 0) return blocks;
  HTML_PRE_RE.lastIndex = 0;
  while ((m = HTML_PRE_RE.exec(text)) !== null) {
    const raw = m[1];
    const content = decodeHtml(raw).replace(/<[^>]+>/g, "").trim();
    if (content.length > 20) blocks.push(content);
  }
  if (blocks.length > 0) return blocks;
  HTML_CODE_RE.lastIndex = 0;
  while ((m = HTML_CODE_RE.exec(text)) !== null) {
    const raw = m[1];
    const content = decodeHtml(raw).replace(/<[^>]+>/g, "").trim();
    if (content.length > 15) blocks.push(content);
  }
  return blocks;
}

function isLikelyInstallConfig(s) {
  return (/apiVersion|baseDomain|metadata|platform|pullSecret|controlPlane|compute|networking/.test(s) && /^apiVersion:|baseDomain:|metadata:/m.test(s)) || /platform:\s*\n\s+baremetal/.test(s);
}

function isLikelyAgentConfig(s) {
  return /kind:\s*AgentConfig|rendezvousIP|hosts:/m.test(s);
}

function isLikelyImageset(s) {
  return /kind:\s*ImageSetConfiguration|mirror:|imageDigestSources/m.test(s);
}

function tagBlock(content, url) {
  const tags = [];
  if (isLikelyInstallConfig(content)) tags.push("install-config");
  if (isLikelyAgentConfig(content)) tags.push("agent-config");
  if (isLikelyImageset(content)) tags.push("imageset");
  if (content.includes("proxy") || content.includes("httpProxy")) tags.push("with-proxy");
  if (content.includes("failureDomains") || content.includes("failureDomains")) tags.push("failure-domains");
  if (content.includes("fd00:") || content.includes("fd01:") || content.includes("fd02:")) tags.push("dual-stack");
  if (content.includes("fips:") || content.includes("fips: true")) tags.push("with-fips");
  if (content.includes("additionalTrustBundle")) tags.push("trust-bundle");
  if (content.includes("hyperthreading")) tags.push("hyperthreading");
  return tags;
}

function slug(url) {
  return url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80);
}

// Skip blocks that are not install-config, agent-config, or imageset (e.g. kind: Secret, status:, oc output).
const ALLOWED_KINDS = new Set(["AgentConfig", "ImageSetConfiguration"]);
function isDisallowedBlock(content) {
  const kindMatch = content.match(/^\s*kind:\s*(\S+)/m);
  if (kindMatch) {
    const kind = kindMatch[1];
    if (!ALLOWED_KINDS.has(kind)) return true;
  }
  if (/^\s*status:\s*$/m.test(content) || /^oc (get|describe|adm)\s/.test(content)) return true;
  return false;
}

async function main() {
  const indexRaw = fs.readFileSync(DOCS_INDEX, "utf8");
  const index = JSON.parse(indexRaw);
  const urls = collectUrls(index);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const inventory = [];
  let totalBlocks = 0;
  for (const url of urls) {
    const name = slug(url);
    try {
      const { ok, status, text } = await fetchUrl(url);
      if (!ok) {
        inventory.push({ url, status, blocks: 0, note: `HTTP ${status}` });
        continue;
      }
      const blocks = extractBlocks(text);
      let saved = 0;
      blocks.forEach((content, i) => {
        if (isDisallowedBlock(content)) return;
        const tags = tagBlock(content, url);
        const ext = content.includes("apiVersion") || content.includes("kind:") ? "yaml" : "txt";
        const fname = `${name}_${i}.${ext}`;
        const outPath = path.join(OUT_DIR, fname);
        const header = `# Extracted from ${url}\n# Block index: ${i}\n# Tags: ${tags.join(", ") || "none"}\n`;
        fs.writeFileSync(outPath, header + content, "utf8");
        inventory.push({ file: fname, url, blockIndex: i, tags, path: `snippets/${fname}` });
        saved++;
        totalBlocks++;
      });
      if (blocks.length === 0) inventory.push({ url, blocks: 0, note: "no code blocks found" });
    } catch (err) {
      inventory.push({ url, note: String(err?.message || err) });
    }
  }
  const invLines = [
    "# Snippets inventory (Part 4 crawl)",
    "",
    "| File | Source URL | Block | Tags |",
    "|------|-------------|-------|------|"
  ];
  inventory.filter((e) => e.file).forEach((e) => {
    invLines.push(`| ${e.file} | ${e.url} | ${e.blockIndex} | ${(e.tags || []).join(", ")} |`);
  });
  invLines.push("", `Total extracted blocks: ${totalBlocks}`, "");
  invLines.push("## URLs fetched (no blocks or error)", "");
  inventory.filter((e) => !e.file).forEach((e) => {
    invLines.push(`- ${e.url}: ${e.note || "no blocks"}`);
  });
  fs.writeFileSync(INV_PATH, invLines.join("\n"), "utf8");
  console.log("Crawl complete. Total blocks extracted:", totalBlocks);
  console.log("Snippets:", OUT_DIR);
  console.log("Inventory:", INV_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
