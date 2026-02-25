#!/usr/bin/env node
"use strict";

/**
 * Expand all 4.20 scenario catalogs with shared install-config parameters from the
 * Agent-based Installer doc (installation-config-parameters-agent), so every
 * install-config scenario has the same full parameter set as bare-metal-agent
 * (9.1.1 Required, 9.1.2 Network, 9.1.3 Optional), plus platform-specific params.
 * Reads data/params/4.20/bare-metal-agent.json and existing scenario files;
 * writes updated scenario files (never overwrites bare-metal-agent).
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const paramsDir = path.join(repoRoot, "data", "params", "4.20");
const agentCatalogPath = path.join(paramsDir, "bare-metal-agent.json");
const agentDocUrl =
  "https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_an_on-premise_cluster_with_the_agent-based_installer/installation-config-parameters-agent";
const agentDocId = "installation-config-parameters-agent";
const agentDocTitle = "Installation configuration parameters for the Agent-based Installer";

const INSTALL_CONFIG = "install-config.yaml";

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

/** Shared install-config params: from agent catalog, outputFile install-config and path not platform.baremetal.* */
function getSharedInstallConfigParams(agentCatalog) {
  return agentCatalog.parameters.filter(
    (p) =>
      p.outputFile === INSTALL_CONFIG &&
      !p.path.startsWith("platform.baremetal")
  );
}

/** Platform.baremetal params from agent (for bare-metal-ipi and bare-metal-upi). */
function getBareMetalParams(agentCatalog) {
  return agentCatalog.parameters.filter(
    (p) =>
      p.outputFile === INSTALL_CONFIG &&
      p.path.startsWith("platform.baremetal.")
  );
}

/** Clone param for a scenario: set applies_to and ensure citation points to agent doc. */
function cloneForScenario(param, scenarioId) {
  const q = { ...param, applies_to: [scenarioId] };
  if (q.citations && q.citations.length) {
    q.citations = q.citations.map((c) => ({
      ...c,
      docId: c.docId || agentDocId,
      docTitle: c.docTitle != null ? c.docTitle : agentDocTitle,
      url: c.url || agentDocUrl,
    }));
  }
  return q;
}

/** Platform-specific param paths per scenario (we keep existing ones, merge with shared). */
function getPlatformParamPaths(scenarioId) {
  const platformPaths = {
    "bare-metal-ipi": ["platform.baremetal."],
    "bare-metal-upi": ["platform.baremetal."],
    "vsphere-ipi": ["platform.vsphere."],
    "vsphere-upi": ["platform.vsphere."],
    "nutanix-ipi": ["platform.nutanix."],
    "aws-govcloud-ipi": ["platform.aws."],
    "aws-govcloud-upi": ["platform.aws."],
    "azure-government-ipi": ["platform.azure."],
  };
  return platformPaths[scenarioId] || [];
}

function isPlatformParam(path, scenarioId) {
  const prefixes = getPlatformParamPaths(scenarioId);
  return prefixes.some((pref) => path.startsWith(pref));
}

function mergeParams(sharedParams, bareMetalParams, existingParams, scenarioId) {
  const byKey = new Map();
  for (const p of sharedParams) {
    const key = `${p.path}\0${p.outputFile}`;
    byKey.set(key, cloneForScenario(p, scenarioId));
  }
  if (scenarioId === "bare-metal-ipi" || scenarioId === "bare-metal-upi") {
    for (const p of bareMetalParams) {
      const key = `${p.path}\0${p.outputFile}`;
      byKey.set(key, cloneForScenario(p, scenarioId));
    }
  }
  for (const p of existingParams) {
    const key = `${p.path}\0${p.outputFile}`;
    if (p.outputFile === INSTALL_CONFIG && isPlatformParam(p.path, scenarioId)) {
      byKey.set(key, { ...p, applies_to: [scenarioId] });
    } else if (p.outputFile !== INSTALL_CONFIG) {
      byKey.set(key, { ...p, applies_to: [scenarioId] });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return (a.outputFile || "").localeCompare(b.outputFile || "");
  });
}

function main() {
  let agentCatalog;
  try {
    agentCatalog = loadJson(agentCatalogPath);
  } catch (e) {
    console.error("Failed to load", agentCatalogPath, e.message);
    process.exit(1);
  }
  const shared = getSharedInstallConfigParams(agentCatalog);
  const bareMetal = getBareMetalParams(agentCatalog);
  if (shared.length === 0) {
    console.error("No shared install-config params found in agent catalog");
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
    const existing = loadJson(filePath);
    const merged = mergeParams(shared, bareMetal, existing.parameters || [], scenarioId);
    const out = {
      version: existing.version || "4.20",
      scenarioId,
      parameters: merged,
    };
    saveJson(filePath, out);
  }
}

main();
