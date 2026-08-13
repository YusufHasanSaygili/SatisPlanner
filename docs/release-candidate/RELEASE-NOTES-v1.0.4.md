# SatisPlanner v1.0.4

Fast node-drag rendering hotfix.

## Fixed

- Resources, machines, Splitters and Mergers now use React Flow's native controlled node-change
  stream while the pointer is held, so even rapid single-frame movements remain visible.
- The canvas keeps the transient position during the gesture and writes only the final drop position
  to plan history and autosave.
- Drag-time opacity and filter effects were removed to avoid GPU compositing flashes in Windows
  WebView2.

Regression coverage rapidly moves an existing production node right, left and right again with one
pointer event per jump. The card must remain visible, unique, fully opaque and in the dragging state
until release, after which its final position must survive reload.

The release remains offline-first and contains no raw game Docs, artwork or personal paths. Artifacts
are unsigned; download only from this official Release and verify GitHub/Sigstore provenance when
needed.
