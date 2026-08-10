# SatisPlanner

Offline-first, graph-based desktop factory planner for Satisfactory 1.2.

> **Development status:** Slice 01 foundation is implemented on the
> `slice/01-foundation` branch. The React/Tauri shell, workspace packages,
> native contract and quality gates are ready for `v0.2.0` verification.

[![SatisPlanner Quality](https://github.com/YusufHasanSaygili/SatisPlanner/actions/workflows/build.yaml/badge.svg)](https://github.com/YusufHasanSaygili/SatisPlanner/actions/workflows/build.yaml)

[Releases](https://github.com/YusufHasanSaygili/SatisPlanner/releases)

## Product goal

SatisPlanner will let players model the factory they will actually build:

- every production machine is an independent physical instance;
- clock, Power Shard, Somersloop and standby settings belong to that instance;
- resource purity, extractor tier, conveyor and pipeline capacities are part of
  the graph;
- exact steady-state material flow, power usage and bottlenecks are calculated
  outside the UI in deterministic domain functions;
- plans, imported game data and local icon caches remain offline and
  user-controlled.

The full scope and the 16-slice delivery roadmap are in the
[development plan](SatisPlanner-development-plan/00-MASTER-PLAN.md).

## Current milestone: v0.2.0

Slice 01 turns the accepted rewrite decision into a production workspace:

- pnpm monorepo with `domain`, `game-data`, `calculation` and `graph-adapter`
  package boundaries;
- a Tauri 2 + React desktop shell with library, canvas and inspector regions;
- a versioned native request/response/error contract and Tauri-free mock adapter;
- default-deny native capabilities with no filesystem, shell, dialog or network
  plugin permission;
- format, lint, boundary, typecheck, unit, E2E, Rust and desktop build gates.

Foundation evidence is collected under [docs/foundation](docs/foundation).
Slice 00 evidence remains under [docs/baseline](docs/baseline), and its
disposable decision spike remains under [spikes/rewrite](spikes/rewrite).

## Repository layout

```text
SatisPlanner-development-plan/   Product, architecture and slice/task plans
apps/desktop-ui/                  React + React Flow application shell
packages/domain/                 Framework-independent domain boundary
packages/game-data/              Normalized game-data boundary
packages/calculation/            Deterministic calculation boundary
packages/graph-adapter/           Domain-to-React-Flow projection boundary
src-tauri/                        Narrow native runtime and capability policy
tests/e2e/                        Browser shell smoke tests
docs/foundation/                  Slice 01 architecture and verification evidence
docs/baseline/                   Audits, measurements and verification records
tests/upstream-characterization/ Executable upstream behavior fixtures
spikes/rewrite/                  Disposable React/Tauri decision spike
ficsit-companion/                Preserved upstream C++ baseline
assets/                          Preserved upstream data/artwork baseline
```

The `ficsit-companion/` and `assets/` directories remain in the repository only
to preserve the audited upstream baseline until parity and migration gates are
passed. They are not the SatisPlanner product source or a game-data source of
truth.

## Develop and verify

Requirements: Node.js 24, pnpm 11.16.0 and the stable Rust toolchain. From the
repository root:

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

The full frontend/package quality gate is one command:

```powershell
pnpm quality
pnpm test:e2e
```

Desktop-native checks and the release-mode shell build are:

```powershell
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

`pnpm quality` also runs controlled negative probes proving that lint,
typecheck and unit-test failures return non-zero status. The package boundary
gate prevents React, React Flow and Tauri imports from entering core packages.

Slice 00 upstream characterization remains reproducible with:

```powershell
ctest --test-dir build/upstream-characterization --output-on-failure
```

## Game data and artwork policy

SatisPlanner releases do not redistribute Coffee Stain Studios game artwork or
raw `CommunityResources/Docs` dumps. Future versions will read localized game
data from the user's own installation and keep imported icons in a user-local
cache. Original generic fallback visuals remain available when local assets are
missing.

The upstream runtime build artifacts produced during Slice 00 CI are retained
only as short-lived private build evidence and are not attached to SatisPlanner
releases because they contain upstream-bundled game assets.

## Upstream attribution

SatisPlanner uses
[adepierre/ficsit-companion](https://github.com/adepierre/ficsit-companion) as
an upstream source, behavior, save-format and architecture reference. The
audited baseline is commit `d5c449a` (upstream tag `v1.2.2`) and remains locally
tagged as `upstream-d5c449a`.

The upstream project is MIT licensed, Copyright (c) 2024 adepierre. Its license
and attribution are preserved in [LICENSE](LICENSE). Dear ImGui and ImGui Node
Editor credits inherited from the baseline are recorded in the baseline
inventory and will be included in third-party notices before distribution.

## Disclaimer

SatisPlanner is an independent fan-made planning tool. It is not affiliated
with, endorsed by or an official product of Coffee Stain Studios. Satisfactory
and related game artwork and names belong to their respective owners.
