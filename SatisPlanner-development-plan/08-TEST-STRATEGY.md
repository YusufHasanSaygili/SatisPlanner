# Test Stratejisi

## Test piramidi

1. **Unit:** units, rational arithmetic, clock/shard/sloop invariant'ları, formüller.
2. **Property/invariant:** rate conservation, kapasite üst sınırı, instance izolasyonu, serialization round-trip.
3. **Golden fixtures:** Resmi 1.2 örnek sonuçları ve normalize edilmiş küçük Docs parçaları.
4. **Integration:** importer → catalog → plan → calculation; save/migration; Tauri filesystem adapter.
5. **E2E:** drag-drop, inspector, connection, bottleneck, save/reopen.
6. **Visual/accessibility:** graph node durumları, klavye akışı, contrast ve accessible names.
7. **Performance:** 100/500/1000 node sentetik graph benchmark'ları.

## Zorunlu golden vakalar

- Pure Miner Mk.3 @250% = 1200/min
- 1200/min source + Mk.5 belt = 780 actual, 420 lost
- 1200/min source + Mk.6 belt = 1200 actual
- Constructor: 1 sloop = 2× output; input değişmez
- Assembler: 1/2 sloop = 1.5×/2× output
- Manufacturer: 1/2/3/4 sloop = 1.25×/1.5×/1.75×/2×
- 200% production clock power multiplier = 2.5× (sloopsuz)
- İki aynı recipe instance'ından yalnız seçilenin clock/shard/sloop değişmesi
- Pipeline Mk.1/Mk.2 limitleri = 300/600 m³/min

## Importer fixture matrisi

- UTF-16 `en-US` ve ikinci locale
- Legacy `Docs.json`
- Eksik class reference
- Duplicate class id
- Bilinmeyen building/form
- Büyük gerçekçi fixture
- Aynı inputtan byte-identical normalized snapshot

## Save/migration

- Her schema version için fixture
- Upgrade sonrası semantic equality
- Unknown field koruma
- Truncated autosave recovery
- Upstream `.fcs` aggregate craft conversion raporu

## CI kapıları

- PR: format, lint, typecheck, unit, integration, build
- Graph/UI slice: Chromium E2E + seçilmiş visual snapshot
- Main/nightly: tüm browser matrix'i, Rust tests, performance regression, dependency audit
- Release: Windows clean-install smoke, import smoke, artifact checksum
