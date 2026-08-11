# Slice 08 — Material Flow and Power Engine Verification

## Delivered scope

- `packages/calculation/src/formula-engine.ts` provides a versioned fallback
  formula registry for Smelter, Constructor, Foundry, Assembler, Manufacturer
  and Refinery recipes.
- Production inputs use clock only. Outputs use clock multiplied by the exact
  Somersloop amplification ratio.
- Production power uses exponent `1.321928`; Somersloop power uses
  `(1 + filled / total)^2` with explicit provenance.
- `packages/calculation/src/flow-engine.ts` projects schema-v3 plans into
  deterministic per-port supply, demand, actual rate, efficiency and power
  results without changing the save schema.
- Fan-out supports equal, manual and ratio allocation. Fan-in is demand-capped
  and all allocation is performed in canonical ID order.
- Tarjan SCC detection and a bounded synchronous fixed-point solver report
  converged recycle loops or explicit unresolved non-convergence diagnostics.
- `IncrementalFlowEngine` invalidates and recomputes only the connected
  component touched by an edit, preserving cached results for disconnected
  factory sections.
- The inspector reads machine actual/required/potential rates, efficiency and
  power; connection inspection reads actual and required rates.

## Determinism and conservation

- Rates use the domain `Rational` type. Floating point is restricted to the
  final power formula and UI formatting.
- Solver inputs, adjacency, SCC members, nodes, edges and diagnostics are
  canonically sorted by stable IDs.
- Each output-port allocator is supply-capped and each input port is
  demand-capped. Somersloop-created output is identified by formula provenance
  rather than being treated as unexplained material creation.
- Fixed-point iterations are synchronous, bounded and use a rational
  `1/1,000,000,000` convergence tolerance.
- A non-convergent SCC is marked `unresolved`; its last intermediate values are
  not presented as a valid result.

## Automated evidence

- Formula goldens: Constructor, Assembler, Manufacturer and Refinery clock,
  amplification and power results.
- Extraction goldens: Miner tier, purity, clock and power matrix.
- Flow fixtures: Miner → Smelter → Constructor, equal/manual/ratio fan-out and
  two-source merger.
- Property coverage: 40 seeded randomized DAG fan-outs assert conservation.
- Determinism: reversed node and edge input order produces identical results
  and diagnostic order.
- Loop fixtures: a convergent byproduct/recycle SCC and a forced bounded
  non-convergence case.
- Incremental instrumentation: editing one of two disconnected chains
  recomputes only the edited chain.
- Benchmark smoke: a 50-node chain settles within the bounded iteration count
  and a generous two-second test ceiling.
- Browser E2E: a Resource → Smelter → Constructor graph exposes `100%`
  efficiency, `30/min` actual/required input, `20/min` actual/potential output,
  power and connection rates.

## Compatibility and known limits

- Factory-plan schema remains version 3, so Slice 07 saves load without a
  migration. Calculation results are derived and are not persisted as stale
  source-of-truth values.
- Split policy configuration is available through the calculation API; the
  current graph UI uses deterministic equal allocation by default. Dedicated
  organization-node editing belongs to a later UX slice.
- The fallback table is explicitly versioned and contains identifiers and
  numeric planning data only. It does not redistribute game artwork or raw
  `CommunityResources/Docs` files.
- Generator and variable-power strategy interfaces are defined for extension;
  unsupported building/recipe pairs return an explicit diagnostic until a
  versioned strategy is registered.
