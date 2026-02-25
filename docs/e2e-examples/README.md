# E2E example collection (4.20)

**Purpose:** Local reference of OpenShift 4.20 install-config and agent-config structure for E2E validation (Workstream K follow-up). Primary sources: official Red Hat 4.20 installation docs and param catalogs in `data/params/4.20/`.

**Use:** Compare generated outputs from the wizard against these examples and params to report alignments, misalignments, and unverified items. No automatic app changes—report only.

## Contents

- **install-config/** — Canonical install-config examples by scenario or config type (minimal, with-proxy, dual-stack, etc.). Structure and required/optional keys per 4.20.
- **agent-config/** — Agent-config examples for bare-metal Agent-Based Installer.
- **REFERENCE.md** — Required top-level keys and scenario-specific platform blocks per 4.20 params.

## Official docs (4.20)

- [Installation configuration](https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html-single/installation_configuration/index)
- [Installation configuration parameters for the Agent-based Installer](https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_an_on-premise_cluster_with_the_agent-based_installer/installation-config-parameters-agent)
- Scenario-specific: AWS GovCloud, Azure Government, vSphere, Nutanix, Bare Metal UPI — see `data/docs-index/4.20.json`.

## Validation rules (from params)

- **install-config:** apiVersion, baseDomain, metadata, compute, controlPlane, networking, platform, pullSecret. Optional: controlPlane.platform / compute[].platform only when required (bare-metal UPI → "none"; AWS IPI instance types → object with aws.type).
- **agent-config:** apiVersion, kind (AgentConfig), metadata, rendezvousIP, hosts.
