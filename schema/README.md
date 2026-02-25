# Schema store (docs-derived, first-class artifact)

This directory holds the schema store for the OpenShift Airgap Architect wizard.

## Contents

- **stepMap.json** — MVP wizard step flow (0–6) and sub-steps. Drives left nav and step ordering.
- **parameters.json** — Parameter definitions: key, YAML path, type, constraints, defaults, required/optional, tooltip, doc reference, applicability rules.
- **scenarios.json** — Scenario definitions: platform, version range, install family, install method, required output files.
- **needsReview.json** — Developer-mode list of parameters/questions missing doc citations. Surface in UI when in dev mode.

## Conventions

- **Applicability**: Parameters and UI blocks are filtered by `platform`, `versionRange`, `installFamily`, `installMethod`. Only applicable fields are shown and emitted in YAML.
- **Doc vs heuristic**: Every question/guidance has `source_type: "doc" | "heuristic"`. Doc-sourced items include `citation` (doc id + section). Heuristic items are rendered with distinct styling and a short disclaimer.
- **Ambiguity**: If a parameter is unclear or contradictory across docs, add to `needsReview.json`; do not guess.

## Versioned docs

Official docs are referenced by version under `docs/ocp/` (e.g. 4.17, 4.18, 4.19, 4.20). Citation pointers in the schema refer to these or to external doc IDs.
