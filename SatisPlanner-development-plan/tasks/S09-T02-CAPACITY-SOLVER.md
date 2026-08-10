# S09-T02 — Capacity-Aware Solver

**Amaç:** Transport edge kapasitesini supply/demand çözümüne dahil etmek.

**Çıktılar:** requested/capacity/actual/lost model; upstream/downstream deficit attribution; bottleneck ranking.

**Kabul:** `actual ≤ capacity`; 1200→Mk.5=780 ve 420 lost; downstream efficiency doğru; birden fazla dar boğaz nedeni kaybolmaz; tier değişimi incremental recompute tetikler.

**Test/Kanıt:** Capacity chains, parallel edges, demand-limited ve supply-limited fixtures.

**Bağımlılık:** S09-T01,S08. **Boyut:** L.
