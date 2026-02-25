const SUPPORTED_MINORS = ["4.17", "4.18", "4.19", "4.20"];

const TRUST_BUNDLE_POLICY_ALLOWLIST = {
  "4.17": ["Proxyonly", "Always"],
  "4.18": ["Proxyonly", "Always"],
  "4.19": ["Proxyonly", "Always"],
  "4.20": ["Proxyonly", "Always"]
};

const getMinorVersion = (version) => {
  if (!version || typeof version !== "string") return null;
  const parts = version.split(".");
  if (parts.length < 2) return null;
  return `${parts[0]}.${parts[1]}`;
};

const isSupportedMinor = (minor) => SUPPORTED_MINORS.includes(minor);

const getTrustBundlePolicies = (version) => {
  const minor = getMinorVersion(version);
  if (!minor) return [];
  return TRUST_BUNDLE_POLICY_ALLOWLIST[minor] || [];
};

export { SUPPORTED_MINORS, getMinorVersion, isSupportedMinor, getTrustBundlePolicies };
