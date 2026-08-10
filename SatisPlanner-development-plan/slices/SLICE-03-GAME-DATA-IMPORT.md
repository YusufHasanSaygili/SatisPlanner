# Slice 03 — Satisfactory 1.2 Game Data Import

**SatisPlanner milestone:** 4/16 · **Release:** `v0.4.0` (display `0.4`, published development)

## Amaç

Kurulu oyunun localized Docs dosyalarından deterministic, provenance taşıyan catalog snapshot üretmek.

## Task'lar

- [S03-T01 — Install discovery ve source probe](../tasks/S03-T01-INSTALL-DISCOVERY.md)
- [S03-T02 — Localized Docs parser/normalizer](../tasks/S03-T02-DOCS-NORMALIZER.md)
- [S03-T03 — Snapshot validation ve diff](../tasks/S03-T03-SNAPSHOT-VALIDATION.md)

## Slice acceptance

- Steam/Epic/custom path akışı var.
- UTF-16 locale file ve legacy Docs parse ediliyor.
- Building/item/recipe referansları normalize ve validate ediliyor.
- Snapshot source/importer/locale/hash provenance taşıyor.
- Aynı kaynak deterministic çıktı üretiyor.

## Test kapısı

İki locale, legacy, corrupt/missing reference ve determinism fixtures.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-03): import versioned Satisfactory 1.2 catalogs`. Verified push sonrası `v0.4.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.4.0 yayımlandı. Slice 4/16 tamamlandı. Slice 04'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
