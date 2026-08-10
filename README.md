# SatisPlanner

Offline-first, graph-based desktop factory planner for Satisfactory 1.2.

> **Development status:** Slice 00 (upstream baseline and architecture decision)
> is complete. The SatisPlanner product workspace has not been scaffolded yet;
> that work belongs to Slice 01 and requires explicit user approval.

[![Slice 00 verification](https://github.com/YusufHasanSaygili/SatisPlanner/actions/workflows/slice-00-verify.yaml/badge.svg)](https://github.com/YusufHasanSaygili/SatisPlanner/actions/workflows/slice-00-verify.yaml)

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

## Current milestone: v0.1.x

Slice 00 established the evidence needed to choose the implementation path:

- immutable upstream baseline: `d5c449adebe335cf326b6cb2d49c106888fc06c8`;
- Windows desktop build/runtime smoke;
- executable `.fcs` v7 save and graph-propagation characterization tests;
- 200-node React Flow performance spike;
- framework-independent typed domain-command spike;
- Tauri 2 read-only local JSON selection probe;
- accepted controlled-rewrite decision in
  [ADR-001](SatisPlanner-development-plan/decisions/ADR-001-CONTROLLED-REWRITE.md).

Evidence is collected under [docs/baseline](docs/baseline). The React/Tauri
decision spike lives under [spikes/rewrite](spikes/rewrite); it is not the
production application workspace.

## Repository layout

```text
SatisPlanner-development-plan/   Product, architecture and slice/task plans
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

## Verify Slice 00 locally

### Upstream characterization

Configure `tests/upstream-characterization` with CMake, build it, then run:

```powershell
ctest --test-dir build/upstream-characterization --output-on-failure
```

### Rewrite spike

```powershell
cd spikes/rewrite
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm test
pnpm build
pnpm benchmark
```

The Tauri probe additionally requires the Rust stable MSVC toolchain:

```powershell
cd spikes/rewrite/src-tauri
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo check
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
