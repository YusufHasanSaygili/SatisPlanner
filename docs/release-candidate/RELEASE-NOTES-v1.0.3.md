# SatisPlanner v1.0.3

Throughput clarity and live node-drag hotfix.

## Fixed

- Resource cards now distinguish the amount transported by connected consumers from the source's
  theoretical extraction capacity (for example, `225 / 480/min used/max`).
- Splitter and Merger demand propagation now respects every outgoing belt's capacity, keeping live
  input and sent output totals conserved.
- Connection labels identify the selected transport tier and show actual/capacity rates, making an
  accidental Mk.1 branch immediately visible.
- Existing resources, machines and logistics nodes now follow the pointer continuously while being
  dragged and persist the final position on release.

A Pure Miner Mk.3 feeding three 250% Iron Ingot Smelters through Mk.5 conveyors correctly reports
480/min available, 225/min used and three 75/min branches. The remaining 255/min is unused source
capacity because the connected machines do not demand it.

The release remains offline-first and contains no raw game Docs, artwork or personal paths. Artifacts
are unsigned; download only from this official Release and verify GitHub/Sigstore provenance when
needed.
