# Slice 13 — Test Sertleştirme ve Performans

**SatisPlanner milestone:** 14/16 · **Release:** `v0.14.0` (display `0.14`, pre-release)

## Amaç

Release öncesi regression güveni, büyük graph bütçesi ve importer/calculation fuzz dayanıklılığı.

## Task'lar

- [S13-T01 — Golden/property coverage](../tasks/S13-T01-GOLDEN-PROPERTY.md)
- [S13-T02 — E2E/visual/recovery suite](../tasks/S13-T02-E2E-VISUAL.md)
- [S13-T03 — Performance ve resilience](../tasks/S13-T03-PERFORMANCE.md)

## Slice acceptance

- Traceability'deki P0 gereksinimler testlere bağlı.
- 500-node hedefi p95 bütçeyi karşılıyor veya onaylı istisna var.
- Importer malformed inputta crash etmiyor.
- Flaky test politikası ve performance baseline CI'da.

## Test kapısı

Tam suite, sentetik graph benchmarks, fuzz/property runs, memory/leak smoke.

## Zorunlu release + bildirim + kullanıcı onayı

`test(slice-13): harden calculations imports and graph performance`. Verified push sonrası `v0.14.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.14.0 yayımlandı. Slice 14/16 tamamlandı. Slice 14'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
