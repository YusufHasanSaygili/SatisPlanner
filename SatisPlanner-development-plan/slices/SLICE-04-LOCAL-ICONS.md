# Slice 04 — Yerel Icon Resolver ve Cache

**SatisPlanner milestone:** 5/16 · **Release:** `v0.5.0` (display `0.5`, published development)

## Amaç

Oyun artwork'ünü yeniden dağıtmadan yerel icon deneyimi ve güvenli fallback sağlamak.

## Task'lar

- [S04-T01 — Resolver contract ve fallback](../tasks/S04-T01-ICON-RESOLVER.md)
- [S04-T02 — Local cache ve manifest](../tasks/S04-T02-ICON-CACHE.md)
- [S04-T03 — Optional extractor karar kapısı](../tasks/S04-T03-EXTRACTOR-GATE.md)

## Slice acceptance

- App hiçbir oyun iconu olmadan çalışıyor.
- Kullanıcının extracted klasöründen iconlar resolve/cache ediliyor.
- Cache yalnız app-owned path içinde yönetiliyor.
- Repo/release artifact kontrolünde Satisfactory iconu yok.

## Test kapısı

Missing/duplicate/renamed icon fixtures, cache invalidation, canonical path güvenlik testi.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-04): add local-only icon resolution and safe cache`. Verified push sonrası `v0.5.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.5.0 yayımlandı. Slice 5/16 tamamlandı. Slice 05'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
