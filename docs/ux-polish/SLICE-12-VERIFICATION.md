# Slice 12 — Productivity, Accessibility and Graph Polish

## Command history policy

- Graph edits are immutable domain commands recorded in a session-only history.
- Undo and redo survive normal saves; reload, import and recovery deliberately start a new history.
- Related clock and shard changes can be committed as one transaction and reversed in one step.
- A new command after undo discards the divergent redo branch.

## Keyboard and toolbar map

| Action | Keyboard | Visible control |
| --- | --- | --- |
| Undo | `Ctrl/Cmd+Z` | Undo |
| Redo | `Ctrl/Cmd+Shift+Z` or `Ctrl/Cmd+Y` | Redo |
| Select all | `Ctrl/Cmd+A` | — |
| Copy selection | `Ctrl/Cmd+C` | Copy |
| Paste | `Ctrl/Cmd+V` | Paste |
| Duplicate selection | `Ctrl/Cmd+D` | Duplicate |
| Delete selection | `Delete` or `Backspace` | — |
| Next diagnostic | `Alt+D` | Next diagnostic |
| Next Somersloop use | `Alt+S` | Next sloop |
| Insert catalog item | focus item, then `Enter` | Catalog item label |

Shortcuts do not intercept keystrokes while an input, select or editable element is active.

## Clipboard contract

Copy serializes selected nodes and edges whose two endpoints are both inside the selection. Paste
validates the payload, rejects external or malformed edges, assigns fresh UUIDs to every node, port
and edge, offsets positions and runs the complete FactoryPlan validator before committing. The
internal clipboard is retained as an offline fallback when the system clipboard is unavailable.

## Layout, grouping and navigation

- Auto-layout is an explicit, deterministic layered layout command and therefore undoable.
- Locked nodes retain their exact position.
- The performance characterization covers 500 nodes and requires completion below 250 ms.
- Groups store label, note, color and node ids only in `userMetadata`; nodes and edges retain object
  identity, proving that grouping cannot alter calculation semantics.
- Diagnostic and Somersloop navigation select and focus the next matching node.
- The minimap can filter all, machine or resource nodes without removing graph content.

## Accessibility evidence

- Catalog insertion, graph selection, inspector access and diagnostic navigation have keyboard paths.
- Node accessible names include the displayed name, kind, purity when relevant and active/standby
  state. Edge names include connection state, carried item and active state.
- Status is expressed with text and icons as well as color; toolbar controls use icon plus text.
- Zoom controls have explicit labels and reduced-motion preferences disable animated viewport moves.
- Playwright runs an axe WCAG A/AA smoke scan and verifies diagnostic focus with accessible names.
- Existing visual snapshots remain part of the end-to-end gate.

## Verification gates

- `pnpm quality`
- `pnpm test:e2e`
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`

Rust verification is also executed by the Linux, macOS and Windows GitHub Actions release matrix.
