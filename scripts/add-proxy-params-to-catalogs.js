#!/usr/bin/env node
"use strict";
/**
 * Add proxy and additionalTrustBundlePolicy params to all scenario catalogs
 * that have install-config (all except bare-metal-agent which already has them).
 * Reads from bare-metal-agent to get the exact param objects, then injects
 * with applies_to set to each scenario.
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const paramsDir = path.join(repoRoot, "data", "params", "4.20");
const agentPath = path.join(paramsDir, "bare-metal-agent.json");

const PROXY_PATHS = [
  "additionalTrustBundlePolicy",
  "proxy.httpProxy",
  "proxy.httpsProxy",
  "proxy.noProxy",
];

function main() {
  const agent = JSON.parse(fs.readFileSync(agentPath, "utf8"));
  const agentParamsByPath = new Map();
  for (const p of agent.parameters) {
    if (p.outputFile === "install-config.yaml" && PROXY_PATHS.includes(p.path)) {
      agentParamsByPath.set(p.path, p);
    }
  }
  if (agentParamsByPath.size !== 4) {
    console.error("Expected 4 proxy/trust params in agent catalog, found", agentParamsByPath.size);
    process.exit(1);
  }

  const scenarios = [
    "bare-metal-ipi",
    "bare-metal-upi",
    "vsphere-ipi",
    "vsphere-upi",
    "nutanix-ipi",
    "aws-govcloud-ipi",
    "aws-govcloud-upi",
    "azure-government-ipi",
  ];

  for (const scenarioId of scenarios) {
    const filePath = path.join(paramsDir, `${scenarioId}.json`);
    if (!fs.existsSync(filePath)) continue;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const byKey = new Map();
    for (const p of data.parameters) {
      byKey.set(`${p.path}\0${p.outputFile}`, p);
    }
    let added = 0;
    for (const pathName of PROXY_PATHS) {
      const key = `${pathName}\0install-config.yaml`;
      if (byKey.has(key)) continue;
      const template = agentParamsByPath.get(pathName);
      if (!template) continue;
      const param = {
        ...template,
        applies_to: [scenarioId],
      };
      byKey.set(key, param);
      added++;
    }
    if (added === 0) continue;
    data.parameters = Array.from(byKey.values()).sort((a, b) => {
      if (a.path !== b.path) return a.path.localeCompare(b.path);
      return (a.outputFile || "").localeCompare(b.outputFile || "");
    });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(scenarioId, "added", added, "params");
  }
}

main();
