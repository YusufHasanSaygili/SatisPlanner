# Gereksinim İzlenebilirliği

R-001–R-016 için stable evidence id, tam test dosyası ve golden/property provenance eşlemesi
[`docs/hardening-performance/TRACEABILITY.md`](../docs/hardening-performance/TRACEABILITY.md)
içinde CI tarafından doğrulanan yürütülebilir kanıta bağlanır.

| ID | Gereksinim | Slice | Ana test |
|---|---|---|---|
| R-001 | Her machine instance bağımsız clock/shard/sloop | 02,07 | Instance isolation property + E2E |
| R-002 | 0–3 Power Shard ve manuel clock | 07 | Clock/shard invariant matrix |
| R-003 | Makineye göre 0–1/2/4 Somersloop | 03,07,08 | Golden multiplier matrix |
| R-004 | Impure/Normal/Pure resource | 06 | Purity golden fixtures |
| R-005 | Miner Mk.1–Mk.3 | 06 | Pure Mk.3 @250% fixture |
| R-006 | Conveyor Mk.1–Mk.6 | 09 | Capacity matrix |
| R-007 | Pipeline Mk.1–Mk.2 | 09 | Fluid capacity matrix |
| R-008 | Drag/drop graph | 05 | Library-to-canvas E2E |
| R-009 | Bottleneck ve actual/required | 08,09 | 1200→780 E2E |
| R-010 | Satisfactory 1.2 current data | 03,11 | Snapshot provenance + import fixtures |
| R-011 | Kurulu oyundan data import | 03 | Windows path/import integration |
| R-012 | Kurulu oyundan icon import | 04 | Local resolver/cache integration |
| R-013 | Upstream kısmi/tam rewrite mümkün | 00,01 | ADR + baseline/parity report |
| R-014 | Save ve eski `.fcs` migration | 10 | Round-trip + migration fixtures |
| R-015 | Her slice commit + push | Tümü | Delivery Record + remote SHA check |
| R-016 | 1.2 game-mode profiles | 11 | Profile multiplier fixtures |
| R-017 | Ürün adı her yerde SatisPlanner | 01,14,15 | Branding/content scan |
| R-018 | Her slice sonrası versioned GitHub Release + Codex onayı | Tümü | Release URL + notification + approval record |

## Kritik çapraz kabul

R-001, R-003, R-009, R-015, R-017 ve R-018 release blocker'dır. Bu gereksinimlerden biri karşılanmadan sonraki milestone veya final RC başlatılamaz.
