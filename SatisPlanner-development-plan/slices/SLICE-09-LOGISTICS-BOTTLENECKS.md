# Slice 09 — Logistics Tier ve Bottleneck Diagnostics

**SatisPlanner milestone:** 10/16 · **Release:** `v0.10.0` (display `0.10`, published development)

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

- Branch: `slice/09-logistics-bottlenecks`
- Closing SHA: `489f1edc939497c5e3ff28d7cace552e99775fde`
- Remote SHA: `489f1edc939497c5e3ff28d7cace552e99775fde`
- Tag: annotated `v0.10.0` → `489f1edc939497c5e3ff28d7cace552e99775fde`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.10.0
- CI: branch `31527682480` 5/5 success; release `31528212598` 6/6 success; local `pnpm quality` and 8/8 Playwright E2E success
- Codex notification: `SatisPlanner v0.10.0 yayımlandı. Slice 10/16 tamamlandı. Slice 10'a devam edilsin mi?`
- User approval: Bekleniyor; Slice 10 açık onay olmadan başlatılmayacak.
- Tarih: 2026-08-11
