# Slice 06 Resource Extraction Verification

Target release: `v0.7.0`

## Scope

Slice 06 introduces persisted resource source instances. Resource identity,
purity, extractor strategy and tier, clock percent and Power Shard count live
in FactoryPlan v3 and remain independent for every node. Extraction math lives
in the calculation package and returns exact rational rates plus power and
descriptor provenance.

The bundled fallback resource catalog is an explicit, redistribution-safe
table. Verified Satisfactory 1.2 miner rates and power values were transcribed
as descriptors; no raw CommunityResources Docs dump or game artwork is stored
or shipped.

## Acceptance evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| Per-instance purity | PASS | Immutable resource command test and two-node E2E isolation check |
| Purity multipliers | PASS | Full Impure/Normal/Pure matrix using exact 1/2, 1 and 2 rational factors |
| Miner tier baselines | PASS | Descriptor tests for Mk.1 60/min, Mk.2 120/min and Mk.3 240/min |
| Clock and shard capacity | PASS | 100/150/200/250% matrix, domain validation and invalid E2E edit rejection |
| Golden extraction result | PASS | Pure Miner Mk.3 at 250% equals exactly 1200/min in unit and UI tests |
| Power calculation | PASS | Tier power descriptors and verified 1.321929 clock exponent |
| Extensible extractor types | PASS | Separate Miner, Oil, Water and contextual Resource Well strategy contracts |
| Unsupported combinations | PASS | Explicit unknown strategy/tier, material form, resource and context diagnostics |
| Save compatibility | PASS | FactoryPlan v3 JSON Schema, exact resource round-trip and chained v1/v2 migrations |
| Resource inspector | PASS | Labeled purity, tier, shard and clock controls with theoretical/transportable output |
| Resource drag/drop | PASS | Two-instance creation, configuration, rejection and reload Playwright scenario |

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
must therefore pass the Rust formatting, lint, test and desktop build gates
before `v0.7.0` publication is accepted.

## Known boundaries

- The fallback catalog intentionally contains only a small safe resource set;
  normalized local catalog integration remains a later slice.
- Oil and Water have independent working strategies. Resource Well extraction
  deliberately reports that pressure context is required until its contextual
  graph model is delivered.
- Transportable output currently equals theoretical output when no downstream
  transport capacity is attached. Conveyor and pipeline capacity propagation
  is scheduled for Slice 08.
- Resource nodes expose one typed output. Complete production-chain balancing
  and diagnostics arrive in later calculation slices.
