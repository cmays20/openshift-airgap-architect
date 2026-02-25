#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data", "params", "4.20");
const vsphere = JSON.parse(fs.readFileSync(path.join(dataDir, "vsphere-ipi.json"), "utf8"));
const nutanixCurrent = JSON.parse(fs.readFileSync(path.join(dataDir, "nutanix-ipi.json"), "utf8"));

const shared = vsphere.parameters.filter((p) => !p.path.startsWith("platform.vsphere."));
const nutanixParams = nutanixCurrent.parameters.filter((p) => p.path.startsWith("platform.nutanix."));

const parameters = [
  ...shared.map((p) => ({
    ...p,
    applies_to: ["nutanix-ipi"],
  })),
  ...nutanixParams,
].sort((a, b) => a.path.localeCompare(b.path));

const out = {
  version: "4.20",
  scenarioId: "nutanix-ipi",
  parameters,
};

fs.writeFileSync(
  path.join(dataDir, "nutanix-ipi.json"),
  JSON.stringify(out, null, 2),
  "utf8"
);
console.log("Wrote nutanix-ipi.json with", parameters.length, "parameters");
