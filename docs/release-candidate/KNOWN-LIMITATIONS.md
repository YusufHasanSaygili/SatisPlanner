# SatisPlanner v1.0.0 Known Limitations

- Windows artifacts are not Authenticode-signed. GitHub/Sigstore attestations are the provenance
  verification mechanism. macOS artifacts are not notarized.
- Windows is the supported installer platform. Linux/macOS builds are portable development binaries;
  the web build is verified in CI but not duplicated as a Release download.
- The normalized Docs importer and local icon cache are tested read-only engines, but v1.0 has no
  native folder-picker activation screen. The bundled fallback catalog remains intentionally small.
- Generic fallback formulas cover the shipped example recipes, not every recipe present in a full
  Satisfactory Docs snapshot.
- Automatic `.pak` extraction, world-map coordinates/seed simulation, transient fluid simulation,
  cloud collaboration and PNG/SVG/PDF plan export are outside v1.0.
- Imported upstream `.fcs` aggregates require an explicit expansion strategy and may report loss or
  unresolved recipes before application.

None of these limitations allows game assets, raw Docs, personal paths or secrets into a release.
