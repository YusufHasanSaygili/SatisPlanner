# SatisPlanner

Offline-first, graph-based desktop factory planner for Satisfactory 1.2.

> **Development status:** Slice 03 game-data import is implemented on the
> `slice/03-game-data-import` branch. Read-only source discovery, localized
> Docs normalization and immutable catalog snapshots form the `v0.4.0`
> milestone.

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

## Current milestone: v0.4.0

Slice 03 adds the versioned Satisfactory 1.2 catalog boundary on top of the
Slice 02 domain contract:

- read-only Steam, Epic and custom-path source discovery with canonical path
  authorization and explicit multi-install selection;
- UTF-8/UTF-16 locale decoding plus the legacy single-file Docs adapter;
- stable item, building and recipe IDs with exact solid/fluid rate conversion;
- immutable catalog snapshots carrying importer, source, game build, locale and
  SHA-256 provenance;
- deterministic serialization, integrity verification, catalog diff, guarded
  activation and rollback;
- malformed, duplicate, unknown-form, missing-reference, large-fixture and
  real-install read-only verification.

Game-data evidence is collected under [docs/game-data](docs/game-data). Domain,
foundation and baseline evidence remain under their respective documentation
directories.

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
docs/domain/                      Slice 02 domain/schema verification evidence
docs/game-data/                   Slice 03 import and snapshot verification evidence
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
raw `CommunityResources/Docs` dumps. The importer reads localized game data
from the user's own installation without modifying it and stores only a
normalized, provenance-bearing catalog snapshot. A later slice will keep
imported icons in a user-local cache; original generic fallback visuals remain
available when local assets are missing.

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
