# Changelog

All notable SatisPlanner changes are documented here. Versions follow Semantic Versioning while
the application remains in published development.

## [1.0.4] - 2026-08-13

### Fixed

- Replaced frame-by-frame plan projection during node dragging with React Flow's native controlled
  node-change stream, preventing resources, machines and logistics cards from disappearing during
  fast pointer movement.
- Kept transient drag positions inside the canvas and persisted only the final drop position, so
  history and autosave still record one deliberate move.
- Removed drag-time opacity/filter compositing that could flash on slower Windows WebView GPUs.

## [1.0.3] - 2026-08-13

### Fixed

- Distinguished transported resource flow from theoretical extraction capacity on graph cards.
- Corrected junction demand propagation so downstream conveyor capacity cannot create an apparent
  input/output mismatch.
- Added conveyor/pipeline tier, actual flow and capacity directly to graph connection labels.
- Restored continuous on-canvas movement while dragging existing resource, machine and logistics
  nodes; positions remain persisted only when the pointer is released.

## [1.0.2] - 2026-08-13

### Fixed

- Added actual/required input and actual/maximum output rates per minute directly to resource and
  production graph cards.
- Restored a visible, styled card preview while dragging Resources, Machines and Logistics entries.
- Added persistent Conveyor Splitter and Conveyor Merger nodes with live conserved throughput,
  material binding and vanilla 1-to-3 / 3-to-1 connection limits.
- Added schema v6 migration so v1.0.0/v1.0.1 plans load unchanged while logistics nodes serialize
  and round-trip safely.

## [1.0.1] - 2026-08-13

### Fixed

- Replaced the six-resource/ten-recipe test fallback with a sanitized complete Satisfactory 1.2
  catalog containing 195 items, 11 production buildings and 291 recipes.
- Added Caterium, Sulfur, Raw Quartz, Bauxite, Uranium, SAM and Nitrogen Gas to the 13 extractable
  resource sources.
- Changed the production library from repeated machine/recipe cards to one clear card per building,
  ordered from Smelter through Quantum Encoder; recipes are selected in the machine inspector.
- Connected normalized recipe rates and building power metadata to the calculation registry so all
  bundled recipes calculate instead of only the original test fixtures.
- Added a read-only local Docs JSON selector and persistent normalized snapshots without retaining
  the raw source file, personal paths, descriptions or game artwork.
- Preserved v1.0 plans by normalizing the legacy Iron Ingot recipe identity on load.

## [1.0.0] - 2026-08-13

### Stable release

- Added first-run offline onboarding, complete user/troubleshooting/recovery documentation and
  explicit credits, disclaimer, known limitations and rollback guidance.
- Added three versioned canonical example plans with calculation goldens for Coal, independent
  machine settings and fluid capacity.
- Completed R-001–R-018 traceability, Definition of Done and historical Delivery Record audits.
- Promoted the verified Windows installer and portable Windows/Linux/macOS packages to the first
  stable release with GitHub/Sigstore provenance.

## [0.15.0] - 2026-08-13

### Added

- Current-user Windows NSIS installer plus portable Windows, Linux and macOS binaries.
- Clean-machine install, no-game launch, save/reopen and uninstall-preserves-data smoke gate.
- SPDX JSON SBOM, third-party notices, SHA-256 manifest and Sigstore-backed GitHub attestations.
- Automated annotated-tag release workflow with strict tag/package/SHA verification.

### Security and distribution

- Desktop capability remains default-deny with no filesystem, shell, dialog or network plugin.
- Satisfactory installation data remains read-only and user-selected; game assets are never bundled.
- Development artifacts are unsigned because no platform code-signing certificate is configured.
