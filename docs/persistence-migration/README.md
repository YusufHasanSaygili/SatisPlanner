# Slice 10 — Persistence and migration evidence

SatisPlanner `v0.11.0` stores plans through a narrow native contract. A save is written to a
temporary file, flushed, synchronized and atomically promoted inside the application-owned data
directory. Before replacement, the valid primary file becomes the last-known-good copy. Recovery
inspection reports valid primary and backup metadata plus interrupted temporary writes without
exposing host paths.

The graph workspace keeps an immediate browser-session copy and debounces native autosaves. When
recovery is recommended, automatic native writes pause until the user explicitly restores the
last-known-good plan or keeps the current plan. Save failures remain visible and retryable.

Plan export uses a versioned canonical manifest. Import is preview-first: every historical schema
fixture migrates sequentially to FactoryPlan v4, while the report exposes applied steps, catalog
snapshot mismatch and unresolved recipes. Cancel leaves the active plan untouched, and the exact
original import text remains available for auditing.

The upstream importer accepts `.fcs` save versions 1 through 7 and applies the upstream migration
sequence before conversion. Aggregate upstream production nodes can become rounded-up physical
machine instances or a single aggregate instance. The preview reports expansion counts, unknown
recipes, unsupported node kinds and dropped links; unresolved production nodes remain visible in
the converted plan instead of silently disappearing.

Automated evidence includes atomic-save, truncated-primary, recovery, contention and permission
tests in Rust; canonical round-trip and all-version schema migration tests in the domain package;
v1–v7 `.fcs` fixtures in the game-data package; and a Playwright scenario that previews, cancels
and applies both plan migration and upstream conversion while proving the source bytes are
unchanged.

Verification commands:

```powershell
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```
