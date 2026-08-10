# Slice 05 Graph UX Verification

Target release: `v0.6.0`

## Scope

Slice 05 replaces the canvas placeholder with a domain-backed graph workspace.
React Flow projects immutable FactoryPlan state; it does not own machine,
position, viewport, port, edge or selection identity.

The initial library uses the explicit `fallback-graph-catalog-v1` table. It is
small, versioned and redistribution-safe, and will be replaced by the user's
normalized catalog snapshot after import. It contains class-name identifiers
and original generic SatisPlanner icons only; no raw Docs dump or Satisfactory
artwork is stored in the application or release inputs.

## Acceptance evidence

| Requirement | Result | Evidence |
| --- | --- | --- |
| Searchable categorized library | PASS | Name, alias, recipe, building and compound class-id E2E search; duplicate Constructor display family remains class-id-distinguishable |
| Drag payload to command | PASS | HTML drag payload resolves a catalog template and calls the immutable domain add command |
| Stable graph identity | PASS | Each drop creates independent machine and port UUIDs; unit and E2E inspector checks |
| Domain source of truth | PASS | React Flow nodes/edges are rebuilt by `projectFactoryPlan`; adapter has no mutation API |
| Position and viewport persistence | PASS | Domain move/viewport tests, serialized FactoryPlan v2 and reload E2E |
| Pan, zoom and minimap | PASS | React Flow controls plus pannable/zoomable minimap are present on the canvas |
| Typed direction and material validation | PASS | Output→input, self, item-id, material-form, medium and duplicate matrix unit test |
| Solid/fluid transport rule | PASS | Conveyor is derived for solids, pipeline for fluids; forced wrong medium is rejected |
| Accessible connection feedback | PASS | Hover validation writes an `aria-live` status; invalid E2E drops create no edge |
| Node and edge inspector | PASS | UUID selection resolves the current plan instance; edge medium/material summary E2E |
| Empty/multi/stale selection | PASS | Empty and Ctrl multi-select states plus delete-clears-selection reload E2E |
| Duplicate/delete commands | PASS | Independent UUID duplication and incident-edge cleanup domain/E2E checks |
| Save compatibility | PASS | FactoryPlan v2 JSON Schema, canonical fixture and deterministic v1 migration test |

## Verification commands

```powershell
pnpm quality
pnpm test:e2e
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
pnpm desktop:build
```

The local Windows environment used for Slice 05 does not expose a Rust
toolchain. The three Rust gates and the desktop smoke build are therefore
required to pass in GitHub Actions before `v0.6.0` publication is accepted.

## Known boundaries

- The fallback catalog is intentionally small; importing the complete local
  normalized catalog into the library is a later integration step.
- Inspector editing in this slice is limited to duplicate and delete commands.
  Machine clock, shard, Somersloop and recipe editors arrive with their domain
  slices.
- Undo/redo, group, copy/paste and auto-layout remain scheduled for later UX
  slices.
- Persistence currently uses browser/Tauri WebView local storage. Atomic plan
  files and recovery are delivered by the persistence slice.
