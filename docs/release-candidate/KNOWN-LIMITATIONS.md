# SatisPlanner v1.0.3 Known Limitations

- Windows artifacts are not Authenticode-signed. GitHub/Sigstore attestations are the provenance
  verification mechanism. macOS artifacts are not notarized.
- Windows is the supported installer platform. Linux/macOS builds are portable development binaries;
  the web build is verified in CI but not duplicated as a Release download.
- The normalized Docs importer is connected to the **Game data catalog** file selector. The local
  icon cache engine remains read-only but has no activation screen, so catalog entries use generic
  artwork.
- The bundled normalized catalog includes 195 items, 11 production buildings and 291 recipes. It
  intentionally omits game descriptions and artwork. Unlock progression is not filtered; alternate
  recipes remain searchable.
- Nitrogen Gas is listed as a Resource Well source, but exact output requires a pressure-well context
  that the current steady-state graph does not model.
- Conveyor Splitter and Merger junctions support solid items with the vanilla 1-to-3 and 3-to-1
  connection limits. Pipeline Junction Cross routing is not yet modeled.
- Automatic `.pak` extraction, world-map coordinates/seed simulation, transient fluid simulation,
  cloud collaboration and PNG/SVG/PDF plan export are outside v1.0.
- Imported upstream `.fcs` aggregates require an explicit expansion strategy and may report loss or
  unresolved recipes before application.

None of these limitations allows game assets, raw Docs, personal paths or secrets into a release.
