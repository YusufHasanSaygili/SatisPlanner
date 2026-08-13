# Changelog

All notable SatisPlanner changes are documented here. Versions follow Semantic Versioning while
the application remains in published development.

## [1.0.0] - 2026-08-13

### Stable release

- Added first-run offline onboarding, complete user/troubleshooting/recovery documentation and
  explicit credits, disclaimer, known limitations and rollback guidance.
- Added three versioned canonical example plans with calculation goldens for Coal, independent
  machine settings and fluid capacity.
- Completed R-001–R-018 traceability, Definition of Done and historical Delivery Record audits.
- Promoted the verified Windows installer and portable Windows/Linux/macOS/web artifacts to the
  first stable release with SHA-256, SPDX SBOM and GitHub/Sigstore attestations.

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
