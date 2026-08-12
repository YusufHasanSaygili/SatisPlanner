# Slice 13 — Performance, Resilience and Flaky-Test Policy

## Enforced performance baseline

`pnpm test:performance` generates deterministic 100, 500 and 1000-node graphs and records:

- full steady-state calculation duration;
- 500-node incremental normal-edit p95 across 25 edits;
- graph projection and deterministic layout p95 across 20 samples;
- repeated-calculation heap-growth smoke.

The release-blocking target is **500-node incremental edit p95 < 100 ms**. Projection and layout
also enforce <100 ms at every generated size. Full calculation has a conservative 2000 ms guard to
detect pathological regressions. CI captures exact measurements in `performance-baseline.txt`.
Loops remain bounded by the solver iteration limit and retain explicit non-convergence diagnostics.

## Parser resilience

FactoryPlan text is limited to 8 MiB, nesting to 128 levels and traversed JSON values to 250,000.
Iterative validation rejects cycles, non-finite numbers and excessive depth before recursive clone or
migration work. Docs imports retain their 32 MiB/64-level limits. Both parsers run deterministic
128-sample malformed-input fuzz sets; the seed and sample number are included in failure labels.
Rejected input produces structured diagnostics and never a partial activated snapshot.

## E2E and flaky-test policy

- CI retries are **zero**. A transient failure remains visible and cannot be converted into a green
  result by retrying.
- Tests use roles, accessible labels and stable test ids; CSS selectors are limited to graph-node
  type assertions where they are the product contract.
- Unexpected failures attach the current serialized plan. Playwright retains the failure screenshot
  and trace; CI uploads `playwright-report` and `test-results` for 14 days.
- Windows owns pixel golden snapshots. Other platforms use semantic assertions and axe checks to
  avoid hiding real failures behind font/rasterization-specific snapshot churn.
- A test may be quarantined only with a tracked root-cause issue, owner and removal date; quarantine
  is not accepted for R-001, R-003, R-009 or release gates.

The desktop matrix runs a release binary `--version` smoke on Windows, macOS and Linux after every
build, keeping the executable check headless and deterministic.
