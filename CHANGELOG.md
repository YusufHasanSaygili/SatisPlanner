# Changelog

All notable SatisPlanner changes are documented here. Versions follow Semantic Versioning while
the application remains in published development.

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
