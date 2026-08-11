# Slice 07 Machine Instance Verification

Target release: `v0.8.0`

## Scope

Slice 07 binds persisted machine instances to compatible building and recipe
catalog entries. Every instance retains its own recipe, clock, Power Shards,
Somersloops and standby state. Recipe changes rebuild typed ports by stable key,
preserve connected edges and return explicit review diagnostics instead of
silently deleting graph state.

## Acceptance evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| Building/recipe compatibility | PASS | Catalog compatibility matrix; Assembler rejects Foundry recipes |
| Foundry alloy recipes | PASS | Steel and Aluminum recipes are grouped under the Foundry definition |
| Typed recipe ports | PASS | Recipe templates rebuild material IDs while preserving stable port UUIDs |
| Edge-safe recipe changes | PASS | Changed ports report affected edge UUIDs; connected port removal rejects without deleting edges |
| Removed catalog entries | PASS | Unresolved E2E fixture remains serialized with its recipe and settings intact |
| Atomic clock/shard state | PASS | Domain transition tests plus UI clamping and invalid clock recovery |
| Exact sloop multipliers | PASS | Constructor 1/2, Assembler 1/1.5/2 and Manufacturer 1/1.25/1.5/1.75/2 matrices |
| Zero-slot behavior | PASS | Disabled explanatory UI state and calculation boundary validation |
| Instance isolation | PASS | Existing 100-instance deep-freeze property test plus graph batch identity regression |
| Batch create | PASS | Two-copy command creates unique node/port UUIDs and independent arrays |
| Three-machine persistence | PASS | Playwright configures three Assemblers independently and verifies reload state |

## Verification commands

```powershell
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

The local Windows environment does not expose a Rust toolchain. GitHub Actions
must pass the native quality and Windows/macOS/Linux desktop build gates before
`v0.8.0` publication is accepted.

## Known boundaries

- The fallback catalog remains intentionally small. Imported normalized catalog
  activation and UI selection are integrated in a later product slice.
- Recipe changes preserve incompatible edges for review; automated edge repair
  is intentionally deferred.
- Somersloop production multipliers are exposed now. Full machine throughput,
  power and graph balancing calculations arrive in Slice 08.
- Batch creation uses deterministic visual offsets. Auto-layout and undo/redo
  remain scheduled for later UX slices.
