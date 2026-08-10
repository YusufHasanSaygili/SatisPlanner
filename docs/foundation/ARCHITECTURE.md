# Slice 01 Foundation Architecture

## Workspace boundaries

The production workspace is a pnpm monorepo with one application and four
explicit package boundaries:

```text
apps/desktop-ui
  -> packages/domain
  -> packages/game-data
  -> packages/calculation
  -> packages/graph-adapter -> @xyflow/react

src-tauri
  -> versioned native contract command
```

`domain`, `game-data`, and `calculation` are framework-independent. The
`scripts/check-boundaries.mjs` gate rejects React, React Flow, and Tauri imports
inside those packages. React Flow types and projections belong only to
`graph-adapter`; React rendering belongs only to `desktop-ui`.

Slice 01 deliberately exposes foundation status objects instead of defining
the actual factory plan schema or formulas. Those are owned by later slices.

## Native/frontend contract

All native calls cross one versioned `native_request` boundary:

```text
RuntimeInfoRequest
  contractVersion: 1
  requestId: string
  command.type: system.runtime-info

NativeResponse
  contractVersion: 1
  requestId: string
  ok: boolean
  data | safe error envelope
```

The TypeScript boundary treats incoming native data as `unknown`, validates
the envelope, correlates the request ID, checks the contract version and only
then exposes typed data. Native exceptions are mapped to fixed safe messages;
paths and raw exception strings are never rendered by the UI.

Rust uses Serde-checked request types and produces the same camel-case wire
shape. Rust and TypeScript tests cover the success round-trip, version mismatch
and safe error mapping.

## Capability policy

`src-tauri/capabilities/default.json` grants only `core:default` to the main
window. No filesystem, shell, dialog, HTTP or other plugin permissions are
enabled. Future slices must add narrowly scoped capabilities with matching
contract tests; direct native access from UI components is not allowed.

## Application shell

The shell renders three stable regions: building library, React Flow factory
canvas and inspector. They are intentionally non-functional placeholders in
this slice. In a browser the UI uses a deterministic mock adapter; under Tauri
it uses the Rust command through the same application service.
