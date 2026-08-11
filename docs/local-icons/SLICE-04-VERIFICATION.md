# Slice 04 Local Icon Verification

Target release: `v0.5.0`

## Scope

Slice 04 adds a local-only icon resolver and cache without redistributing
Satisfactory artwork. The `@satisplanner/game-data` boundary now provides:

- safe normalization of Docs `mSmallIcon` `/Game/...Package.Object` keys;
- stable class-id/category/asset-path mappings;
- generic solid, fluid, building, recipe and unknown fallbacks;
- a platform-neutral extracted-folder picker and read-only source port;
- a browser-capable decode/resize/WebP processor capped at 128 px;
- an app-owned atomic cache/manifest port with source and cache SHA-256 values;
- per-entry invalidation, deterministic duplicate handling and manifest-only
  clear behavior.

No absolute source path is stored in the manifest. Each entry records only its
source-relative path; the selected root is represented by a SHA-256 identifier.

## Acceptance evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| App works with no game icons | PASS | Five original generic SVG fallbacks render in the shell and Playwright visual snapshot |
| Resolver is UI-framework independent | PASS | Core package imports no React, React Flow or Tauri module |
| Arbitrary URL/path is never rendered | PASS | Unreal-key allowlist and cache-relative-path allowlist tests |
| Missing/unknown mapping | PASS | Warning diagnostic plus category fallback, never a broken image URL |
| Duplicate class/source mapping | PASS | Duplicate class is fail-loud; ambiguous source files are not selected arbitrarily |
| Manual extracted-folder flow | PASS | Picker/source/cache/processor integration test with synthetic bytes |
| Source is read-only | PASS | Source port exposes no write/delete operation; byte input is copied before processing |
| Cache is app-owned | PASS | Lexical and canonical cache-root confinement including traversal/symlink rejection |
| Resize/format pipeline | PASS | Decode, aspect-preserving max-128 resize and WebP output validation |
| Source change invalidation | PASS | Changed source hash rebuilds only the matching entry and removes the stale allowlisted cache file |
| Safe clear | PASS | Only valid manifest entries and the manifest are deleted; untracked app-data files remain |
| Invalid image | PASS | No partial entry; diagnostic and fallback remain active |
| No redistributed artwork | PASS | CI game-asset policy gate and release archive inspection |
| Optional extractor decision | PASS | `EXTRACTOR-DECISION.md` threat model and v0.5.0 NO-GO ADR appendix |

## Fixture and artwork policy

Cache integration tests use tiny synthetic byte arrays and a fake WebP
processor. The visual fallback set and screenshot are original generic
SatisPlanner assets. No user-extracted image is copied into the repository.

The 153 upstream game icons used during the controlled-rewrite audit were retired
after the parity and migration gates passed. `scripts/check-game-assets.mjs`
prevents those legacy roots from returning, rejects unexpected raster locations
and validates that generic SVG fallbacks contain no external/executable resources.

## Verification commands

```powershell
pnpm --filter @satisplanner/game-data typecheck
pnpm --filter @satisplanner/game-data test
pnpm check:game-assets
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

## Known boundaries

- Automatic `.pak`/IoStore extraction is intentionally not shipped.
- The picker, read-only filesystem and app-data cache are capability ports; a
  platform host supplies them without moving path authority into the UI.
- Accepted manual source formats are PNG, JPEG and WebP. Originals remain in
  the user-selected folder; cached outputs are WebP only.
