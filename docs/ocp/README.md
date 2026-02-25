# Versioned OpenShift documentation

This directory is reserved for versioned, scenario-specific OpenShift documentation (4.17–4.20).

## Intended structure

- `4.17/` — Docs and references for OCP 4.17
- `4.18/` — Docs and references for OCP 4.18
- `4.19/` — Docs and references for OCP 4.19
- `4.20/` — Docs and references for OCP 4.20

Schema store citations (in `schema/parameters.json` and install-method questions) reference these by version and section. Prefer official Red Hat documentation; if not available locally, add a placeholder and surface "needs review" in developer mode.

Existing repo docs (e.g. `docs/ocp-4.20-*.md`) remain the current reference until migrated under this structure.
