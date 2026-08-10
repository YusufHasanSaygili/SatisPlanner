# Slice 01 Verification

Date: 2026-08-10  
Branch: `slice/01-foundation`  
Target release: `v0.2.0`

## Acceptance results

| Requirement | Result | Evidence |
|---|---|---|
| SatisPlanner desktop shell opens | PASS | Windows release binary remained healthy during a four-second runtime smoke |
| Library, canvas and inspector render | PASS | Chromium E2E and 1280×800 visual inspection |
| Framework-independent domain package test | PASS | Boundary gate plus domain Vitest suite |
| Typed Rust/native command round-trip | PASS | TypeScript mock tests and Rust Serde round-trip tests |
| Version mismatch has an actionable error | PASS | TypeScript and Rust mismatch tests |
| Native path/raw exception does not reach UI | PASS | Safe error mapping tests on both sides of the boundary |
| Native permissions default-deny | PASS | Main window has `core:default`; no plugin permissions |
| PR CI runs all required gates | PASS | Reusable quality workflow defines web, Rust and three-OS desktop jobs |
| Upstream baseline remains preserved | PASS | C++ source, assets, immutable upstream tag and history were not removed |

## Local verification

The following commands passed from the working repository and again from a
detached clean checkout at implementation commit `45ef543`:

```text
pnpm install --frozen-lockfile
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --locked -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
pnpm desktop:build
```

Observed results:

- 7 TypeScript unit/contract tests passed across five workspace projects;
- 3 Rust contract and error-mapping tests passed;
- 1 Chromium shell E2E passed;
- Biome format/lint, strict TypeScript, package boundaries and Vite build passed;
- controlled lint, typecheck and unit-test failures were rejected as expected;
- Rust format and clippy with warnings-as-errors passed;
- release-mode Windows binary built at `src-tauri/target/release/satisplanner.exe`;
- the clean-checkout binary started successfully and remained running until the
  smoke harness stopped it.

## Visual verification

The shell was inspected at 1280×800. The title and runtime-contract status are
visible, all three workspace regions fit without overlap, React Flow controls
remain inside the canvas and placeholder states are readable. The screenshot
was generated under ignored `build/` evidence and is not a release artifact.

## Quality gate behavior

`pnpm verify:quality-failures` generated isolated temporary fixtures and proved
that Biome lint, strict TypeScript and Vitest each return failure for a known bad
input. Temporary fixtures were removed after the probe. The clean-checkout run
also exposed and verified the fix for cross-platform CRLF/LF formatter behavior.

## Data and artifact safety

No Satisfactory artwork, save file or raw `CommunityResources/Docs` data was
added. Local game-data/artwork caches, generated output and saves are ignored.
CI smoke artifacts are retained for seven days and contain only SatisPlanner
web output or the foundation desktop binary.

## Known limitations

- Library, factory node and inspector are foundation placeholders.
- Game-data import, persisted plans and calculation formulas are intentionally
  not implemented in this slice.
- The native contract exposes only read-only runtime metadata.
- Desktop output is an unbundled smoke binary; installer packaging belongs to a
  later release slice.
