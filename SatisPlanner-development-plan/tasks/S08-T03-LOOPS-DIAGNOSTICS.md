# S08-T03 — Loops, Diagnostics ve Incremental Compute

**Amaç:** Byproduct/recycle loop'larını güvenli çözmek ve yalnız etkilenen altgraph'ı yeniden hesaplamak.

**Çıktılar:** SCC detection; bounded fixed-point strategy; non-convergence diagnostic; dependency invalidation; diagnostics taxonomy.

**Kabul:** Basit recycle fixture yakınsar; limit aşımında stale/yanlış sayı yerine unresolved diagnostic; tek node edit'i bütün graph'ı gereksiz hesaplamaz; aynı plan aynı diagnostic sırasını üretir.

**Test/Kanıt:** Convergent/divergent loop fixtures ve recompute instrumentation.

**Bağımlılık:** S08-T02. **Boyut:** L.
