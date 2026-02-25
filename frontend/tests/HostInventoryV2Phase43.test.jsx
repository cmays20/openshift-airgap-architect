/**
 * Phase 4.3: Catalog-driven controls and validation (inventory-v2 only).
 * (a) Enum field renders as select when allowed list present
 * (d) Legacy inventory step validation unaffected when flags OFF
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { getScenarioId } from "../src/hostInventoryV2Helpers.js";
import { validateStep } from "../src/validation.js";
import { AppContext } from "../src/store.jsx";
import HostInventoryV2Step from "../src/steps/HostInventoryV2Step.jsx";

const baseState = {
  blueprint: { platform: "Bare Metal" },
  methodology: { method: "Agent-Based Installer" },
  hostInventory: {
    nodes: [
      {
        role: "master",
        hostname: "master-0",
        rootDevice: "",
        dnsServers: "",
        dnsSearch: "",
        bmc: { address: "", username: "", password: "", bootMACAddress: "" },
        primary: { type: "ethernet", mode: "dhcp", ethernet: { name: "eth0", macAddress: "52:54:00:aa:11:01" }, bond: {}, vlan: {}, advanced: {} }
      }
    ],
    apiVip: "192.168.1.5",
    ingressVip: "192.168.1.7",
    enableIpv6: false
  },
  globalStrategy: { networking: { machineNetworkV4: "192.168.1.0/24" } },
  ui: { compareMode: false, scenarioAwareLayout: false }
};

function MockAppProvider({ children, stateOverride }) {
  const state = stateOverride ? { ...baseState, ...stateOverride } : baseState;
  const value = {
    state,
    updateState: () => {},
    loading: false,
    startOver: vi.fn()
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

describe("Phase 4.3: enum field renders as select when allowed list present", () => {
  it("Role field is a select with options from catalog (master, worker) for bare-metal-agent", () => {
    render(
      <MockAppProvider>
        <HostInventoryV2Step />
      </MockAppProvider>
    );
    const tile = screen.getByText(/master-0/i);
    expect(tile).toBeTruthy();
    fireEvent.click(tile);
    const roleLabel = screen.getByText(/^Role/);
    expect(roleLabel).toBeTruthy();
    const select = roleLabel.parentElement?.querySelector("select");
    expect(select).toBeTruthy();
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.value);
    expect(options).toContain("master");
    expect(options).toContain("worker");
    expect(options.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Phase 4.3: legacy inventory step unaffected when flags OFF", () => {
  it("validateStep('inventory') does not depend on catalog merge (same shape, no inventory-v2 path)", () => {
    const state = {
      ...baseState,
      hostInventory: { ...baseState.hostInventory, apiVip: "", ingressVip: "" }
    };
    const result = validateStep(state, "inventory");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(getScenarioId(state.blueprint?.platform, state.methodology?.method)).toBe("bare-metal-agent");
    // API/Ingress VIPs are validated on the Networking step (or Global Strategy), not on Hosts/inventory
    const errorsIncludeApiVip = result.errors.some((e) => /API VIP/i.test(e));
    expect(errorsIncludeApiVip).toBe(false);
  });

  it("validateStep('inventory-v2') merges catalog validation when scenarioId is set", () => {
    const state = {
      ...baseState,
      hostInventory: {
        nodes: [{ role: "master", hostname: "m-0", primary: { type: "ethernet", mode: "dhcp", ethernet: { name: "eth0", macAddress: "52:54:00:11:22:33" }, bond: {}, vlan: {}, advanced: {} } }],
        apiVip: "1.2.3.4",
        ingressVip: "1.2.3.5",
        enableIpv6: false
      }
    };
    const result = validateStep(state, "inventory-v2");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
