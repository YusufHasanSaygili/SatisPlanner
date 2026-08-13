# SatisPlanner v1.0.1

Catalog completeness and production-library hotfix for the first stable release.

## Fixed

- the bundled catalog now contains 195 normalized items, 11 production buildings and 291 recipes;
- Resources now includes Iron, Copper, Limestone, Coal, Caterium, Sulfur, Raw Quartz, Bauxite,
  Uranium, SAM, Crude Oil, Water and Nitrogen Gas;
- Production now shows one clear machine card for Smelter, Constructor, Foundry, Assembler,
  Manufacturer, Refinery, Packager, Blender, Particle Accelerator, Converter and Quantum Encoder;
- each machine exposes every compatible recipe in its inspector and uses catalog-derived rates and
  power formulas;
- local `CommunityResources/Docs/*.json` can be selected read-only from **Game data catalog**;
- v1.0 Iron Ingot plans are normalized to the official 1.2 recipe identity when loaded.

The bundled dataset contains no raw game descriptions, artwork or personal paths. Release downloads
remain intentionally compact: Windows setup, Windows portable, Linux portable and macOS portable,
plus GitHub's automatic source archives. Artifacts are unsigned; download only from this official
Release and verify GitHub/Sigstore provenance when needed.
