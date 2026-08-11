# Slice 09 — Logistics capacity and bottleneck evidence

SatisPlanner `v0.10.0` models every graph connection as versioned transport equipment.
The rule pack contains Conveyor Mk.1–Mk.6 at 60/120/270/480/780/1200 items per minute
and Pipeline Mk.1–Mk.2 at 300/600 cubic metres per minute. Solid ports require conveyors;
fluid ports require pipelines, and gas follows the pipeline policy when gas ports are introduced.

FactoryPlan schema v4 persists `transportTierId`. The v3→v4 migration assigns Conveyor Mk.1,
Pipeline Mk.1, or the unlimited virtual-link descriptor according to the saved edge medium.
Tier changes are domain commands and reject medium-incompatible equipment.

The steady-state solver applies capacity while allocating supply. Each edge result exposes
requested, required, capacity, actual and lost rates, all as exact rationals. Diagnostics retain
capacity, upstream-supply and downstream-demand causes independently. Capacity bottlenecks are
ranked by lost rate and include the smallest tier that can carry the required rate.

The inspector and bottleneck list communicate status with the warning icon, text, an ARIA alert,
and an edge ARIA label; color is supplementary. Selecting a ranked warning navigates to its edge.
The main Playwright acceptance builds a Pure Coal Miner Mk.3 at 250%, proves Mk.5 yields
780/min actual and 420/min lost, then upgrades to Mk.6 and verifies the diagnostic disappears.

Verification commands:

```powershell
pnpm quality
pnpm test:e2e
```
