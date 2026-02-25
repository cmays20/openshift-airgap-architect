#!/usr/bin/env node
/**
 * Validates data/docs-index/*.json (Phase 1 schema):
 * - Required top-level keys: version, baseUrl, generatedAt, scenarios, sharedDocs
 * - scenarios is an object (map): keys = scenarioId, value = { docs: array }
 * - Each doc has id, title, url, configTypes (array), tags (array)
 * Run from repo root: node scripts/validate-docs-index.js
 */

const fs = require("fs");
const path = require("path");

const INDEX_DIR = path.join(process.cwd(), "data", "docs-index");
const VALID_CONFIG_TYPES = ["install-config", "agent-config", "imageset-config", "other"];

function main() {
  if (!fs.existsSync(INDEX_DIR)) {
    console.error("Missing data/docs-index/ directory.");
    process.exit(1);
  }

  const files = fs.readdirSync(INDEX_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error("No .json files in data/docs-index/.");
    process.exit(1);
  }

  let failed = false;
  for (const file of files) {
    const filePath = path.join(INDEX_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error(`${file}: Invalid JSON: ${e.message}`);
      failed = true;
      continue;
    }

    const requiredTop = ["version", "baseUrl", "generatedAt", "scenarios", "sharedDocs"];
    for (const key of requiredTop) {
      if (!(key in data)) {
        console.error(`${file}: Missing required key: ${key}`);
        failed = true;
      }
    }

    if (!data.scenarios || Array.isArray(data.scenarios) || typeof data.scenarios !== "object") {
      console.error(`${file}: "scenarios" must be an object (map of scenarioId to { docs: [] }).`);
      failed = true;
    }

    if (data.scenarios && typeof data.scenarios === "object" && !Array.isArray(data.scenarios)) {
      for (const [sid, scenarioValue] of Object.entries(data.scenarios)) {
        if (!scenarioValue || typeof scenarioValue !== "object") {
          console.error(`${file}: scenarios["${sid}"] must be an object.`);
          failed = true;
          continue;
        }
        if (!Array.isArray(scenarioValue.docs)) {
          console.error(`${file}: scenarios["${sid}"].docs must be an array.`);
          failed = true;
        } else {
          for (let j = 0; j < scenarioValue.docs.length; j++) {
            const doc = scenarioValue.docs[j];
            if (!doc || typeof doc !== "object") {
              console.error(`${file}: scenarios["${sid}"].docs[${j}] must be an object.`);
              failed = true;
              continue;
            }
            const docRequired = ["id", "title", "url", "configTypes", "tags"];
            for (const k of docRequired) {
              if (!(k in doc)) {
                console.error(`${file}: scenarios["${sid}"].docs[${j}] missing "${k}".`);
                failed = true;
              }
            }
            if (doc.configTypes != null && !Array.isArray(doc.configTypes)) {
              console.error(`${file}: scenarios["${sid}"].docs[${j}].configTypes must be an array.`);
              failed = true;
            } else if (doc.configTypes) {
              const invalid = doc.configTypes.filter((t) => !VALID_CONFIG_TYPES.includes(t));
              if (invalid.length) {
                console.error(`${file}: scenarios["${sid}"].docs[${j}].configTypes invalid: ${invalid.join(", ")}. Allowed: ${VALID_CONFIG_TYPES.join(", ")}.`);
                failed = true;
              }
            }
            if (doc.tags != null && !Array.isArray(doc.tags)) {
              console.error(`${file}: scenarios["${sid}"].docs[${j}].tags must be an array.`);
              failed = true;
            }
          }
        }
      }
    }

    if (data.sharedDocs != null && !Array.isArray(data.sharedDocs)) {
      console.error(`${file}: "sharedDocs" must be an array.`);
      failed = true;
    } else if (data.sharedDocs) {
      for (let i = 0; i < data.sharedDocs.length; i++) {
        const doc = data.sharedDocs[i];
        if (!doc || typeof doc !== "object") continue;
        const docRequired = ["id", "title", "url", "configTypes", "tags"];
        for (const k of docRequired) {
          if (!(k in doc)) {
            console.error(`${file}: sharedDocs[${i}] missing "${k}".`);
            failed = true;
          }
        }
        if (doc.configTypes && !Array.isArray(doc.configTypes)) {
          console.error(`${file}: sharedDocs[${i}].configTypes must be an array.`);
          failed = true;
        } else if (doc.configTypes) {
          const invalid = doc.configTypes.filter((t) => !VALID_CONFIG_TYPES.includes(t));
          if (invalid.length) {
            console.error(`${file}: sharedDocs[${i}].configTypes invalid: ${invalid.join(", ")}.`);
            failed = true;
          }
        }
      }
    }
  }

  if (failed) process.exit(1);
  console.log("Docs index validation passed.");
}

main();
