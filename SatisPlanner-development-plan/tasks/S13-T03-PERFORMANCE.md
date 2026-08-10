# S13-T03 — Performance ve Resilience

**Amaç:** Büyük graph ve bozuk import/save girdilerinde hedef bütçeyi korumak.

**Çıktılar:** 100/500/1000-node generators; calculate/render/layout benchmarks; incremental recompute metrics; parser fuzz/size limits; regression thresholds.

**Kabul:** 500-node normal edit p95 hedefi <100 ms veya onaylı gerekçe; pan/zoom etkileşimli; malformed JSON crash/RCE üretmez; non-convergent loop bounded; baseline CI'da izlenir.

**Test/Kanıt:** Benchmark report, fuzz/property run, memory smoke.

**Bağımlılık:** S13-T01,T02. **Boyut:** L.
