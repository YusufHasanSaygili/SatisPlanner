# Slice 09 — Logistics Tier ve Bottleneck Diagnostics

**SatisPlanner milestone:** 10/16 · **Release:** `v0.10.0` (display `0.10`, pre-release)

## Amaç

Graph edge'lerini gerçek conveyor/pipeline ekipmanına dönüştürmek ve kapasite kaynaklı kaybı açıklamak.

## Task'lar

- [S09-T01 — Conveyor/pipeline tier catalog](../tasks/S09-T01-TRANSPORT-TIERS.md)
- [S09-T02 — Capacity-aware solver](../tasks/S09-T02-CAPACITY-SOLVER.md)
- [S09-T03 — Bottleneck UX ve ana E2E](../tasks/S09-T03-BOTTLENECK-UX.md)

## Slice acceptance

- Conveyor Mk.1–Mk.6 ve Pipeline Mk.1–Mk.2 seçilebilir.
- Solid/fluid medium invariant'ları enforced.
- Required/capacity/actual/lost ayrı gösteriliyor.
- 1200/min + Mk.5 = 780 actual/420 lost; Mk.6 = 1200.

## Test kapısı

Tüm tier matrix unit; Coal ana acceptance E2E; color-independent accessibility check.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-09): enforce transport capacity and expose bottlenecks`. Verified push sonrası `v0.10.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.10.0 yayımlandı. Slice 10/16 tamamlandı. Slice 10'a devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

## Delivery Record

- Branch:
- Closing SHA:
- Remote SHA:
- Tag:
- GitHub Release URL:
- CI:
- Codex notification:
- User approval:
- Tarih:
