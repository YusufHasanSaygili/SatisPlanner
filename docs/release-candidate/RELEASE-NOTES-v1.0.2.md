# SatisPlanner v1.0.2

Graph-rate visibility, drag-preview and logistics hotfix.

## Fixed and added

- Resource cards now show their extraction amount per minute.
- Machine inputs show actual/required rates and outputs show actual/maximum rates per minute.
- Library cards remain visibly attached to the pointer through a styled drag preview.
- The **Logistics** library contains Conveyor Splitter and Conveyor Merger nodes.
- Splitters route one input to at most three equal-demand branches; Mergers conserve at most three
  inputs into one output.
- Schema v6 preserves existing plans through an automatic v5-to-v6 migration.

The release remains offline-first and contains no raw game Docs, artwork or personal paths. Artifacts
are unsigned; download only from this official Release and verify GitHub/Sigstore provenance when
needed.
