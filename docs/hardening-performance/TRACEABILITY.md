# Slice 13 — R-001–R-016 Automated Traceability

Each evidence id below is stable. The referenced test title and file are the executable source of
truth; CI runs the complete unit, E2E, coverage and performance suites.

| Requirement | Evidence id | Executable evidence |
| --- | --- | --- |
| R-001 | S13-R001 | `three Assembler instances keep ... isolated through reload` in `tests/e2e/shell.spec.ts`; instance isolation in `packages/domain/src/graph.test.ts` |
| R-002 | S13-R002 | clock/shard invariant matrix in `packages/domain/src/machine.test.ts` and inspector E2E |
| R-003 | S13-R003 | Somersloop matrices in `packages/calculation/src/somersloop.test.ts`, `formula-engine.test.ts` and machine inspector E2E |
| R-004 | S13-R004 | complete purity matrix in `packages/calculation/src/resource-extraction.test.ts` |
| R-005 | S13-R005 | Miner tier golden matrix and Pure Mk.3 at 250% in `resource-extraction.test.ts` and Coal E2E |
| R-006 | S13-R006 | Conveyor Mk.1–Mk.6 matrix in `packages/calculation/src/transport-capacity.test.ts` |
| R-007 | S13-R007 | Pipeline Mk.1–Mk.2 matrix in `packages/calculation/src/transport-capacity.test.ts` |
| R-008 | S13-R008 | library drag/drop and keyboard insertion scenarios in `tests/e2e/shell.spec.ts` |
| R-009 | S13-R009 | exact 1200→780 Coal bottleneck scenario in `tests/e2e/shell.spec.ts` |
| R-010 | S13-R010 | canonical 1.2 snapshot/provenance tests in `packages/game-data/src/snapshot.test.ts` and `importer.test.ts` |
| R-011 | S13-R011 | installed Docs discovery/import integration in `packages/game-data/src/local-install.integration.test.ts` |
| R-012 | S13-R012 | local icon resolver/cache/image tests in `packages/game-data/src/icon-*.test.ts` |
| R-013 | S13-R013 | controlled rewrite ADR and executable foundation boundary tests |
| R-014 | S13-R014 | schema migration, import preview, atomic save and recovery unit/E2E tests |
| R-015 | S13-R015 | slice Delivery Records plus verified remote SHA checks during release |
| R-016 | S13-R016 | every official profile multiplier and persistence test in `game-profile.test.ts`, `formula-engine.test.ts` and profile E2E |
| R-017 | S15-R017 | `scripts/check-release-candidate.mjs` scans product surfaces and packaging identity for SatisPlanner-only branding |
| R-018 | S15-R018 | Slice 00–14 Delivery Records are complete and the RC gate rejects missing release/approval fields |

## Golden and property provenance

Golden expectations are derived from the pinned Satisfactory 1.2 profile provenance, versioned
fallback catalog descriptors and exact rational arithmetic—not values copied from UI output. Miner,
purity, belt, pipe, Somersloop, recipe-cost and power branches are covered by explicit matrices.
Random graph/import tests use fixed seeds printed in their failure labels, so every failure can be
reproduced without relying on execution order.

Formula-engine branch coverage is enforced at **85% or higher** by `pnpm test:coverage`; CI retains
the V8 JSON summary as a hardening evidence artifact.
