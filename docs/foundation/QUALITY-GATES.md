# Slice 01 Quality Gates

## Local and CI command mapping

| Gate | Local command | CI job |
|---|---|---|
| Format | `pnpm format:check` | `web-quality` |
| Lint, warnings as errors | `pnpm lint` | `web-quality` |
| Package boundaries | `pnpm check:boundaries` | `web-quality` |
| Controlled failure probes | `pnpm verify:quality-failures` | `web-quality` |
| TypeScript typecheck | `pnpm typecheck` | `web-quality` |
| Unit and contract tests | `pnpm test` | `web-quality` |
| Web build | `pnpm build:web` | `web-quality` |
| Chromium shell smoke | `pnpm test:e2e` | `web-quality` |
| Rust format | `cargo fmt --manifest-path src-tauri/Cargo.toml --check` | `rust-quality` |
| Rust lint, warnings as errors | `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` | `rust-quality` |
| Rust tests | `cargo test --manifest-path src-tauri/Cargo.toml` | `rust-quality` |
| Release-mode desktop build | `pnpm desktop:build` | `desktop-smoke` on Windows, Linux and macOS |

`pnpm quality` composes every web/package gate except the E2E test, which is a
separate command because it owns a browser process. CI runs both.

## Controlled failure evidence

`scripts/verify-quality-failures.mjs` creates isolated files under the ignored
`build/` directory and confirms that:

- a `debugger` statement is rejected by Biome lint;
- assigning a number to a string is rejected by TypeScript strict mode;
- a deliberately false Vitest expectation fails the unit-test runner.

The probe succeeds only when all three child commands return non-zero, and it
removes its temporary directory after execution. This keeps intentional bad
fixtures out of normal compilation while continuously proving the gates fail
closed.

## Artifact retention and local-data exclusion

CI keeps web and desktop smoke artifacts for seven days. `node_modules`, build
outputs, test reports, Tauri targets, local game-data caches, local artwork
caches and Satisfactory save/autosave files are ignored. No game artwork or raw
`CommunityResources/Docs` file is part of a CI artifact or release input.
