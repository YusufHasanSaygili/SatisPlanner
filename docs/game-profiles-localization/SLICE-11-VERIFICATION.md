# Slice 11 — Satisfactory 1.2 profiles and localization

## Official option matrix

The versioned profile is pinned to the official Satisfactory Wiki copy of the
[1.2.0.0 patch notes](https://satisfactory.wiki.gg/wiki/Patch_1.2.0.0). The application accepts only
the published values:

| Setting | Supported values | Vanilla |
| --- | --- | --- |
| Recipe parts cost | 0.25, 0.50, 0.75, 1, 1.25, 1.50, 1.75, 2 | 1 |
| Power consumption | 0.25, 0.50, 0.75, 1, 2, 5 | 1 |
| Space Elevator cost | 0.25, 0.50, 0.75, 1, 2, 5, 10, 25, 50, 100 | 1 |
| Resource randomization | default, random, basic-resource-rich, advanced-resource-rich, fossil-fuel-rich | default |
| Resource purity | default, all-pure, mostly-pure, average, mostly-impure, all-impure, random | default |
| World seed | unsigned decimal metadata | 0 |

The world seed and randomization labels are plan metadata only. SatisPlanner does not infer or
generate resource-node coordinates from them.

## Characterized multiplier semantics

The recipe-parts multiplier decorates required ingredient rates. It does not change output rates.
The power multiplier decorates the final machine/extractor consumption after clock and Somersloop
rules. Both values are written into result provenance so downstream UI cannot silently apply them a
second time. Golden tests cover every accepted multiplier, vanilla identity, input/output separation
and save/reload persistence.

## Localization and identity policy

- UI locale (`en`/`tr`) and game-data locale are independent FactoryPlan v5 fields.
- Catalog lookup and graph/save references continue to use stable class ids.
- Localized display names are presentation aliases and never replace recipe, building or item ids.
- Locale resolution tries exact locale, language, configured fallback, `en-US`, then deterministic
  first available catalog.
- Turkish search applies locale-aware casing plus an ASCII-friendly fold (`I`, `İ`, `ı`, `i`).
- The typed TR catalog must implement every EN key, turning missing keys into a TypeScript/CI error.

## Verification gates

- `pnpm quality`
- `pnpm test:e2e`
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`

The Playwright profile/locale scenario proves recipe and power result changes, Turkish UI with
English game names, localized game-name switching, cross-locale search aliases and reload survival.
