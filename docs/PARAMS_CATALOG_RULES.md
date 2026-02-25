# Params catalog rules (data/params)

## Schema

- One JSON file per scenario per version: `data/params/<version>/<scenario-id>.json`.
- Top-level keys: `version`, `scenarioId`, `parameters` (array).
- Each parameter: `path`, `outputFile`, `type`, `allowed` (optional), `default` (optional), `required`, `description`, `applies_to`, `citations` (array).
- Citation: `docId`, `docTitle`, `sectionHeading`, `url` are all **required**. `docTitle` must be non-empty; derive from `data/docs-index/<version>.json` (scenarios and sharedDocs).

## Validation rules

- **path**, **outputFile**, **description**, **applies_to**, **citations** are required.
- No duplicate (path, outputFile) within the same file.
- Each citation: `docId`, `docTitle`, `sectionHeading`, `url` must be present and non-empty. `docTitle` is **required** (Phase 3).
- **allowed**, **type**, **required**, **default**: must be present on every parameter; value must be either a concrete value or the exact string "not specified in docs" where the docs do not define them. For `required`, concrete means `true` or `false`.

## How to run the validator

- **No arguments (default):** validate all catalog files under `data/params/4.20/*.json` (or default version).
- **Directory:** `node scripts/validate-catalog.js data/params` or `node scripts/validate-catalog.js data/params/4.20` — validate all `*.json` in that directory (and version subdirs when target is `data/params`).
- **Single file:** `node scripts/validate-catalog.js data/params/4.20/bare-metal-agent.json` — validate that file only.

Exit code 0 if all selected files pass; non-zero and stderr output on validation failure.

## Proxy and trust-bundle parameters

The install-config parameters **proxy.httpProxy**, **proxy.httpsProxy**, **proxy.noProxy**, and **additionalTrustBundlePolicy** are documented in the platform-agnostic install doc (section 1.11.2 Configuring the cluster-wide proxy during installation), not in the Agent-based Installer parameter doc. They apply to all install-config scenarios; cite **installing-platform-agnostic** with that section heading and URL.

## Image mirroring (imageContentSources vs imageDigestSources)

**imageContentSources** (with sub-fields **imageContentSources[].source** and **imageContentSources[].mirrors**) is the documented parameter for release-image mirroring in the 4.20 Agent/install parameter tables. **imageDigestSources** is the replacement for soon-to-be-deprecated imageContentSources; it has the same sub-field structure (**mirrors**, **source**) and the same meaning (sources and repositories for release-image content). Both are included in all scenario catalogs for install-config.yaml.

- **imageDigestSources** is documented in 4.20 **Edge computing → Image-based installation for single-node OpenShift** (Table 17.5 Optional specifications for image-based-installation-config.yaml; Table 17.8 for ImageClusterInstall). Doc reference: [Image-based installation for single-node OpenShift](https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/edge_computing/image-based-installation-for-single-node-openshift#ibi-installer-installation-config_ibi-factory-image-based-install).
- All scenario catalogs include **imageDigestSources**, **imageDigestSources[].mirrors**, and **imageDigestSources[].source** for install-config.yaml, with descriptions that state they replace imageContentSources and that sub-fields are the same.
- Post-install digest mirroring uses cluster API resources (**ImageDigestMirrorSet**, **ImageTagMirrorSet**) from oc-mirror v2, which are not install-config parameters.

## Agent-config hosts.networkConfig (nmstate)

The **hosts[].networkConfig** field in agent-config.yaml accepts a dictionary that must match the **Host Network Management API** defined in the [nmstate documentation](https://nmstate.io/examples.html). Red Hat OpenShift 4.20 supports static IPs, DNS, routes, and interfaces of type **ethernet**, **bond**, and **vlan** (VLANs and NIC bonds per Preparing to install).

The bare-metal-agent catalog includes sub-parameters for:

- **hosts[].networkConfig.interfaces** — name, type (ethernet, bond, vlan), state, mac-address; ipv4/ipv6 (enabled, dhcp, address with ip and prefix-length); **link-aggregation** (port, mode) for bonds; **vlan** (base-iface, id) for VLANs.
- **hosts[].networkConfig.dns-resolver** — config.server, config.search.
- **hosts[].networkConfig.routes** — config array with destination, next-hop-address, next-hop-interface, metric, table-id.

Top-level networkConfig and interface list cite **installation-config-parameters-agent** (9.2.2) and **nmstate-examples** (https://nmstate.io/examples.html). Deeper sub-fields cite nmstate-examples with the relevant section (Interfaces: ethernet, bond, VLAN, Route, DNS).

## Expanding scenario catalogs from the Agent-based Installer doc

The **Installation configuration parameters for the Agent-based Installer** (Chapter 9) doc defines shared `install-config.yaml` parameters (9.1.1–9.1.3) and platform-specific sections (9.1.4 bare metal, 9.1.5 vSphere) that apply to other scenarios. To expand all non–bare-metal-agent scenario catalogs with these parameters (so each has the same depth as `bare-metal-agent` for install-config):

```bash
node scripts/expand-catalogs-from-agent-doc.js
```

This reads `data/params/4.20/bare-metal-agent.json`, takes all `install-config.yaml` parameters (shared + platform.baremetal), and merges them into each of: bare-metal-ipi, bare-metal-upi, vsphere-ipi, vsphere-upi, nutanix-ipi, aws-govcloud-ipi, aws-govcloud-upi, azure-government-ipi (with `applies_to` set to that scenario and existing platform-specific params preserved). Run from the repo root. Then run `node scripts/validate-catalog.js` to confirm.
