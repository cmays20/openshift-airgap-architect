import { describe, it, expect } from "vitest";
import { getStateForPersistence } from "../src/store.jsx";

describe("Blueprint pull secret: no persistence", () => {
  const secretValue = '{"auths":{"registry.redhat.io":{"auth":"secret"}}}';

  it("getStateForPersistence strips blueprintPullSecretEphemeral", () => {
    const state = {
      blueprint: { platform: "Bare Metal", blueprintPullSecretEphemeral: secretValue },
      release: {}
    };
    const out = getStateForPersistence(state);
    expect(out?.blueprint?.blueprintPullSecretEphemeral).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain("secret");
  });

  it("persisted state never includes pull secret value in string form", () => {
    const state = {
      blueprint: { arch: "x86_64", blueprintPullSecretEphemeral: secretValue },
      release: {}
    };
    const out = getStateForPersistence(state);
    const str = JSON.stringify(out);
    expect(str).not.toMatch(/blueprintPullSecretEphemeral/);
    expect(str).not.toContain("registry.redhat.io");
  });
});

describe("Identity & Access credentials: no persistence (Prompt E)", () => {
  const redHatSecret = '{"auths":{"quay.io":{"auth":"redhat-secret"}}}';
  const mirrorSecret = '{"auths":{"registry.corp:5000":{"auth":"mirror-secret"}}}';

  it("getStateForPersistence strips pullSecretPlaceholder and mirrorRegistryPullSecret", () => {
    const state = {
      credentials: {
        pullSecretPlaceholder: redHatSecret,
        mirrorRegistryPullSecret: mirrorSecret,
        sshPublicKey: "ssh-rsa AAAA test"
      }
    };
    const out = getStateForPersistence(state);
    expect(out?.credentials?.pullSecretPlaceholder).toBeUndefined();
    expect(out?.credentials?.mirrorRegistryPullSecret).toBeUndefined();
    expect(out?.credentials?.sshPublicKey).toBe("ssh-rsa AAAA test");
    const str = JSON.stringify(out);
    expect(str).not.toContain("redhat-secret");
    expect(str).not.toContain("mirror-secret");
  });

  it("persisted state string contains no credential secret values", () => {
    const state = {
      credentials: {
        pullSecretPlaceholder: redHatSecret,
        mirrorRegistryPullSecret: mirrorSecret
      }
    };
    const out = getStateForPersistence(state);
    const str = JSON.stringify(out);
    expect(str).not.toMatch(/pullSecretPlaceholder/);
    expect(str).not.toMatch(/mirrorRegistryPullSecret/);
  });
});
