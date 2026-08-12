# Slice 13 — Test Sertleştirme ve Performans

**SatisPlanner milestone:** 14/16 · **Release:** `v0.14.0` (display `0.14`, published development)

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

- Branch: `slice/13-hardening-performance`
- Closing SHA: `a51c80cd7201d48b71af0fcfbb93e18a83da16ff`
- Remote SHA: Release öncesi doğrulanan branch ve `main` push SHA'sı
  `a51c80cd7201d48b71af0fcfbb93e18a83da16ff`; sonraki commit yalnızca Delivery Record
  metadata'sını günceller.
- Tag: Annotated `v0.14.0`, target `a51c80cd7201d48b71af0fcfbb93e18a83da16ff`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.14.0
- CI: Branch [31569952482](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31569952482)
  ve main [31570348877](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31570348877)
  başarılı; coverage/performance evidence, sıfır-retry E2E, Rust fmt/clippy/test ve
  Windows/macOS/Linux release-binary smoke geçti.
- Codex notification: `SatisPlanner v0.14.0 yayımlandı. Slice 14/16 tamamlandı. Slice 14'e devam edilsin mi?`
- User approval: Bekleniyor.
- Tarih: 2026-08-12
