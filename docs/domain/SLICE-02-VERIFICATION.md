# Slice 02 Domain and Schema Verification

Date: 2026-08-10  
Branch: `slice/02-domain-schema`  
Target release: `v0.3.0`

## Delivered contracts

### Exact values and units

- `Rational` normalizes sign and greatest-common-divisor with a positive
  denominator and arbitrary-precision `bigint` components.
- Each normalized component is limited to 256 digits so malformed inputs and
  runaway operations fail with `RATIONAL_OVERFLOW`; zero denominators and
  division by zero fail with `DIVISION_BY_ZERO`.
- `ItemRatePerMinute` and `FluidRateM3PerMinute` are nominally distinct types.
  UI decimal formatting returns a rounded string without mutating the exact
  value.
- `ClockPercent` is stored as an exact scaled integer and serializes with four
  decimal places in the inclusive `1.0000–250.0000` range.

### Physical machine instances

- Every `MachineInstance` has its own RFC 4122 UUID, settings object and typed
  input/output port UUIDs.
- Construction and immutable commands enforce 0–3 Power Shards, the
  `100/150/200/250%` shard capacity matrix, definition-specific Somersloop
  slots and building/recipe compatibility.
- Lowering shard capacity below the current clock is rejected instead of
  silently creating invalid state.
- Extractor configuration uses explicit resource purity and exact clock types.

### FactoryPlan v1

- The distributable schema is
  `packages/domain/schema/factory-plan-v1.schema.json` using JSON Schema
  2020-12.
- `parseFactoryPlan`, `validateFactoryPlan` and `serializeFactoryPlan` provide
  field-addressed errors and byte-stable canonical export.
- Unknown JSON fields are preserved at every level so later readers can safely
  round-trip extensions. Malformed JSON, unavailable legacy migrations and
  future schema versions are rejected without partial plans.
- `PlanMigrationRegistry` only accepts sequential migrations and verifies that
  each migration advances `schemaVersion` correctly.
- Every plan is explicitly bound to `gameDataSnapshotId` and `gameProfile`.

## Acceptance evidence

| Requirement | Result | Evidence |
|---|---|---|
| Exact rational arithmetic | PASS | Recurring-fraction examples plus 500-case deterministic algebra property matrix |
| Unit-safe item/fluid rates | PASS | Nominal type assertions and separate arithmetic APIs |
| Clock/shard/Somersloop invalid state prevention | PASS | Full clock boundary and invalid-state matrices |
| Physical instance isolation | PASS | 100-instance UUID/settings/property matrix and immutable command tests |
| Versioned plan round-trip | PASS | v1 fixture parse → canonical serialize → parse with byte equality |
| Unknown-field preservation | PASS | Top-level and node extension fields survive canonical export |
| Migration/future-version safety | PASS | Sequential registry, missing migration and future-version tests |
| Framework-independent package | PASS | Workspace boundary scan rejects React, React Flow and Tauri imports |

## Known limitations

- FactoryPlan v1 intentionally contains only the machine node and transport
  edge contracts needed by this slice. Resource, splitter, merger and visual
  organization node variants arrive in their owning slices.
- Building-specific recipe and Somersloop compatibility is enforced when a
  `MachineInstance` is constructed with its snapshot definition. Revalidation
  against imported Satisfactory data is added with the game-data importer.
- Atomic filesystem persistence and recovery belong to Slice 10; this slice
  defines the serializable contract and migration harness only.
