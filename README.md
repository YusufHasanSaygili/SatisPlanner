# SatisPlanner

Offline-first, graph-based desktop factory planner for Satisfactory 1.2.

> **Development status:** Slice 10 resilient persistence and upstream migration
> are implemented on the `slice/10-persistence-migration` branch. Atomic saves,
> recovery, schema migration and `.fcs` conversion form the `v0.11.0` milestone.

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

## Current milestone: v0.11.0

Slice 10 makes local plans durable and older plans safely portable:

- atomic native saves with a last-known-good copy and interrupted-write detection;
- debounced autosave plus an immediate browser-session safety copy;
- explicit recovery inspection and user-controlled last-good restoration;
- canonical plan export and preview-first import through every schema migration;
- game-data snapshot mismatch and unresolved-recipe reporting before import;
- upstream `.fcs` v1–v7 conversion with selectable expansion strategy;
- conversion reports that keep unknown nodes, dropped links and the original file visible.

Persistence and migration evidence is collected under
[docs/persistence-migration](docs/persistence-migration). Logistics, calculation,
machine instances, resource extraction, graph UX, local icons, game-data, domain,
foundation and baseline evidence remain under their respective documentation directories.

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
tests/fixtures/upstream-fcs/      Portable upstream save-format fixture
docs/foundation/                  Slice 01 architecture and verification evidence
docs/domain/                      Slice 02 domain/schema verification evidence
docs/game-data/                   Slice 03 import and snapshot verification evidence
docs/local-icons/                 Slice 04 cache, artwork and extractor evidence
docs/graph-ux/                    Slice 05 graph UX and persistence evidence
docs/resource-extraction/        Slice 06 extraction model and inspector evidence
docs/machine-instances/          Slice 07 machine binding and isolation evidence
docs/calculation-engine/         Slice 08 formula, flow and diagnostics evidence
docs/logistics-bottlenecks/      Slice 09 transport capacity and UX evidence
docs/persistence-migration/      Slice 10 save, recovery and import evidence
docs/baseline/                   Audits, measurements and verification records
```

The retired upstream C++ runtime, bundled game assets and disposable rewrite
spike were removed after the `v0.11.0` parity and migration gates passed. Their
audit records remain under `docs/baseline/`; the original source is reproducible
from the attributed upstream commit and the immutable pre-cleanup Git history.

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

## Game data and artwork policy

SatisPlanner releases do not redistribute Coffee Stain Studios game artwork or
raw `CommunityResources/Docs` dumps. The importer reads localized game data
from the user's own installation without modifying it and stores only a
normalized, provenance-bearing catalog snapshot. The icon resolver reads a
user-selected extracted folder without modifying it and writes resized WebP
entries only to an app-owned cache. Original generic fallback visuals remain
available when local assets are missing; automatic `.pak` extraction is not
shipped.

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
