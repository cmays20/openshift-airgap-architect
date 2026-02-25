# OpenShift Airgap Architect

Local-first wizard that generates OpenShift disconnected installation assets:
- `install-config.yaml`
- `agent-config.yaml` (only for Bare Metal + Agent-Based Installer)
- `imageset-config.yaml` (oc-mirror v2)
- A tailored **Architect Field Manual** in Markdown

The app runs entirely on your laptop using Docker or Podman with a simple two-service stack.

## Quick start (Docker)
```bash
docker compose up --build
```

Open the UI at: http://localhost:5173

## Quick start (Podman)
```bash
podman compose up --build
```

Open the UI at: http://localhost:5173

If your system uses `podman-compose`:
```bash
podman-compose up --build
```

### SELinux note
If you mount files or folders with Podman on Fedora, add `:Z` or `:z` to your volume mounts.

## Operator discovery credentials (registry.redhat.io)
Operator scanning uses `oc-mirror list operators` and requires valid registry.redhat.io credentials.

### Recommended: mount an auth file
Create or export a pull secret or `auth.json`, then mount it into the backend container and set `REGISTRY_AUTH_FILE`.

Docker example:
```bash
REGISTRY_AUTH_FILE=/data/registry-auth.json docker compose up --build
```

Podman example (with SELinux label):
```bash
REGISTRY_AUTH_FILE=/data/registry-auth.json podman compose up --build
```

To mount a local file into the backend container, update `docker-compose.yml`:
```yaml
services:
  backend:
    volumes:
      - ./local-pull-secret.json:/data/registry-auth.json:Z
```

### Optional: paste pull secret in the UI
In the Operators step, paste a Red Hat pull secret JSON. It is used only for the scan job, not stored permanently, and removed on **Start Over**.

## Mock mode (offline demo)
Set `MOCK_MODE=true` to use bundled Cincinnati and operator datasets:
```bash
MOCK_MODE=true docker compose up --build
```

## Architecture
- **Frontend**: React + Vite
- **Backend**: Node + Express + SQLite
- **Cache**: SQLite stored in a named volume (`backend-data`)

## Run bundles (export/import)
- **Export Run** downloads a JSON bundle of the current wizard state.
- **Import Run** restores a prior bundle.
- Exports **exclude credentials by default** and can optionally include certificates and client tools.

## Trust and Certificates
- Provide **mirror registry CA** and/or **proxy CA** in the Trust and Certificates section.
- The app combines them into an **effective trust bundle** and writes `additionalTrustBundle` (and policy) when present.
- `additionalTrustBundlePolicy` options are version-specific (4.17–4.20): `Proxyonly` or `Always`.

## Platform Configuration (IPI)
The Platform Configuration section appears only for IPI and the selected platform:
- **AWS GovCloud**: region, hosted zone/role, subnets, load balancer type, optional AMI ID and instance types.
- **VMware vSphere**: vCenter, datacenter, cluster, datastore, network, optional folder/resource pool.
- **Nutanix**: Prism Central endpoint/port, credentials, subnet UUID, cluster name.
- **Azure Government**: cloudName, region, resource group names.

## Export options
The Assets & Guide step includes export options:
- Include credentials (pull secret, BMC/vCenter/Prism credentials)
- Include certificates (CA bundles)
- Include client tools (`oc`, `oc-mirror`)
- Include version-specific `openshift-install` (downloaded after release confirmation)
- Draft mode when warnings are present (adds `DRAFT_NOT_VALIDATED.txt`)

## Notes
- Cincinnati channels are loaded from upstream and cached; use the **Update** button to refresh.
- Operator scans can take **5–10 minutes**. Navigation does not cancel jobs.
- Documentation links are validated at generation time and cached. Use **Update Docs Links** to refresh.
- AWS GovCloud AMI auto-population uses `openshift-install coreos print-stream-json` for the confirmed version.
- IDMS values in `install-config.yaml` are prepopulated; the authoritative manifests are in `cluster-resources` output from oc-mirror v2.

## Install-config references (4.20)
Use these official docs to validate `install-config.yaml` fields for the supported platforms:
- AWS GovCloud (AWS): https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_on_aws/installation-config-parameters-aws
- Azure Government (Azure): https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_on_azure/installation-config-parameters-azure
- VMware vSphere: https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_on_vmware_vsphere/installation-config-parameters-vsphere
- Nutanix: https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_on_nutanix/installation-config-parameters-nutanix
- Agent-based Installer: https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/installing_an_on-premise_cluster_with_the_agent-based_installer/installation-config-parameters-agent

Guidance based on these references:
- `credentialsMode` applies to AWS/Azure cloud installs (CCO-backed). It is not applicable for vSphere, Nutanix, or bare metal agent-based installs.
- `publish` applies to AWS/Azure. Non-cloud platforms note that `Internal` is not supported.
