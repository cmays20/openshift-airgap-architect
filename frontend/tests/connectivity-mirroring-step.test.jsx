import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "../src/App.jsx";
import { apiFetch } from "../src/api.js";
import { stateWithBlueprintCompleteMethodologyIncomplete } from "./fixtures/minimalState.js";
import { validateStep } from "../src/validation.js";
import { getScenarioId, getParamMeta } from "../src/catalogResolver.js";

vi.mock("../src/api.js", () => ({ apiFetch: vi.fn() }));

function stateWithSegmentedFlow(segmentedFlowV1) {
  const base = stateWithBlueprintCompleteMethodologyIncomplete();
  return {
    ...base,
    credentials: {
      pullSecretPlaceholder: '{"auths":{"quay.io":{}}}',
      sshPublicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI test"
    },
    ui: { ...base.ui, segmentedFlowV1 }
  };
}

function stateForConnectivityMirroringStep(overrides = {}) {
  const base = stateWithBlueprintCompleteMethodologyIncomplete();
  return {
    ...base,
    credentials: {
      pullSecretPlaceholder: '{"auths":{"quay.io":{}}}',
      sshPublicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI test"
    },
    ui: {
      ...base.ui,
      segmentedFlowV1: true,
      activeStepId: "connectivity-mirroring",
      visitedSteps: {
        ...base.ui?.visitedSteps,
        blueprint: true,
        methodology: true,
        "identity-access": true,
        "networking-v2": true,
        "connectivity-mirroring": true
      },
      completedSteps: {
        ...base.ui?.completedSteps,
        blueprint: true,
        methodology: true,
        "identity-access": true,
        "networking-v2": true
      }
    },
    ...overrides
  };
}

describe("Connectivity & Mirroring replacement step (Phase 5 Prompt H)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(apiFetch).mockImplementation((path, opts) => {
      if (path === "/api/state") {
        const body = opts?.body ? JSON.parse(opts.body) : stateWithSegmentedFlow(true);
        return Promise.resolve(body);
      }
      return Promise.resolve({});
    });
  });

  it("renders Connectivity & Mirroring step when segmented flow ON and user navigates to Connectivity & Mirroring", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Continue install/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue install/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Installation Methodology/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByRole("button", { name: /Proceed/i }).pop());
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Identity & Access/i })).toBeInTheDocument();
    });
    const connectivityStepButton = screen.getByRole("button", { name: /Connectivity & Mirroring/i });
    fireEvent.click(connectivityStepButton);
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: /Connectivity & Mirroring/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(screen.getByRole("heading", { name: /Mirroring Configuration/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Time & NTP/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/registry\.corp\.local:5000/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/time\.corp\.local/)).toBeInTheDocument();
  });

  it("when scenario is bare-metal-agent, getScenarioId and getParamMeta return expected mirroring/NTP meta", () => {
    const state = stateForConnectivityMirroringStep();
    expect(getScenarioId(state)).toBe("bare-metal-agent");
    const imageDigestMeta = getParamMeta("bare-metal-agent", "imageDigestSources", "install-config.yaml");
    const ntpMeta = getParamMeta("bare-metal-agent", "additionalNTPSources", "agent-config.yaml");
    expect(imageDigestMeta?.required).toBe(false);
    expect(ntpMeta?.required).toBe(false);
  });

  it("state is read/written for mirroring and NTP", () => {
    const state = stateForConnectivityMirroringStep({
      globalStrategy: {
        ...stateForConnectivityMirroringStep().globalStrategy,
        mirroring: {
          registryFqdn: "registry.corp.local:5000",
          sources: [
            { source: "quay.io/openshift-release-dev/ocp-release", mirrors: ["registry.corp.local:5000/ocp-release"] }
          ]
        },
        ntpServers: ["time.corp.local", "10.90.0.10"]
      }
    });
    expect(state.globalStrategy.mirroring.registryFqdn).toBe("registry.corp.local:5000");
    expect(state.globalStrategy.mirroring.sources[0].source).toContain("ocp-release");
    expect(state.globalStrategy.ntpServers).toEqual(["time.corp.local", "10.90.0.10"]);
  });

  it("validation runs for connectivity-mirroring: error when mirror URL set but source empty", () => {
    const state = stateForConnectivityMirroringStep({
      globalStrategy: {
        ...stateForConnectivityMirroringStep().globalStrategy,
        mirroring: {
          registryFqdn: "registry.local:5000",
          sources: [
            { source: "", mirrors: ["registry.local:5000/ocp-release"] }
          ]
        }
      }
    });
    const result = validateStep(state, "connectivity-mirroring");
    expect(result.errors).toContain("Source repository is required when mirror URL(s) are set.");
  });

  it("validation runs for connectivity-mirroring: no errors when source and mirrors both set", () => {
    const state = stateForConnectivityMirroringStep({
      globalStrategy: {
        ...stateForConnectivityMirroringStep().globalStrategy,
        mirroring: {
          registryFqdn: "registry.local:5000",
          sources: [
            { source: "quay.io/openshift-release-dev/ocp-release", mirrors: ["registry.local:5000/ocp-release"] }
          ]
        },
        ntpServers: ["time.corp.local"]
      }
    });
    const result = validateStep(state, "connectivity-mirroring");
    expect(result.errors).toHaveLength(0);
  });
});
