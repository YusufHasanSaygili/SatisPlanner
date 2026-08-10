# Slice 03 Game Data Import Verification

Target release: `v0.4.0`

## Scope

Slice 03 creates a deterministic, versioned catalog from a user's own
Satisfactory 1.2 `CommunityResources/Docs` source. It does not redistribute raw
Docs data, artwork or installation paths.

The `@satisplanner/game-data` boundary now provides:

- read-only Steam, Epic and custom install hints;
- canonical path authorization, source probing and explicit multi-install
  selection;
- UTF-8, UTF-16LE and UTF-16BE decoding with BOM and conservative heuristic
  detection;
- localized class-group and legacy single-file Docs parsing;
- stable item, building and recipe normalization with exact rational rates;
- immutable catalog snapshots with importer, source, game, build, locale and
  SHA-256 provenance;
- canonical serialization, integrity verification, update diff, guarded
  activation and rollback.

## Source and redistribution policy

The official Community Resources format publishes localized Docs files in the
game installation. The importer only reads the user-selected source through a
capability-limited adapter. It never exposes a write operation, does not store
the absolute source path in a snapshot and does not include raw Docs in source
control or release artifacts.

All committed fixtures are small, synthetic schema examples created for this
test suite. They are not extracted game data. Because the official Docs page
does not grant a separate redistribution license for the generated data,
SatisPlanner treats the user's local installation as the source of truth and
ships only code and generic fixtures.

## Acceptance evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| Steam/Epic/custom source flow | PASS | Source-kind helpers, read-only adapter and discovery tests |
| Missing/fake/oversized source safety | PASS | Fail-loud diagnostics without crashes or fallback reads |
| Multiple installations | PASS | Discovery returns `selectionRequired` and all valid candidates |
| Canonical path confinement | PASS | Escaping paths are rejected before any source read |
| UTF-16 locale and legacy Docs | PASS | LE/BE/UTF-8 encoding tests, two locales and legacy fixture |
| Stable IDs and display names | PASS | Localized names remain separate from stable class IDs |
| Solid/fluid rate conversion | PASS | Exact rational per-minute normalization assertions |
| Reference and schema validation | PASS | Missing item, duplicate ID, unknown form, malformed JSON and invalid duration tests |
| Deterministic snapshot | PASS | Repeated imports produce identical hashes and canonical JSON |
| Provenance and integrity | PASS | Raw and normalized SHA-256 values plus tamper detection |
| Diff and safe activation | PASS | Added/removed/changed recipes, confirmation guard and rollback tests |
| Large source behavior | PASS | 500-recipe synthetic fixture and real-install smoke test |

## Real-install read-only smoke

On 2026-08-10 the integration test discovered a user-owned Steam installation
of Satisfactory 1.2, build `23855724`, selected its `en-US` localized Docs file,
decoded and normalized it successfully, and verified byte-for-byte equality of
the source before and after import. The source was approximately 10.6 MB. The
test is environment-gated and therefore skipped in generic CI where no licensed
game installation is present.

Reproduction on a machine that owns the game:

```powershell
$env:SATISPLANNER_LOCAL_INSTALL_ROOT = '<Satisfactory install directory>'
$env:SATISPLANNER_LOCAL_BUILD_ID = '<installed build id>'
pnpm --dir packages/game-data exec vitest run src/local-install.integration.test.ts
```

## Verification commands

```powershell
pnpm --filter @satisplanner/game-data typecheck
pnpm --filter @satisplanner/game-data test
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

## Known boundary

The importer exposes a platform-neutral discovery and read-only filesystem port.
The future catalog UI can supply native Steam/Epic scan results or a folder
picker through that port without moving parsing, normalization or validation
into React or Tauri. Icon extraction and caching remain explicitly deferred to
Slice 04.
