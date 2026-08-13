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

- Branch: `slice/03-game-data-import`
- Closing SHA: `3181d25dc64f0d002d58a175ffcdb7a9ca3c76c3`
- Remote SHA: tag ve yayımlanmış branch/main geçmişi `3181d25dc64f0d002d58a175ffcdb7a9ca3c76c3`
- Tag: annotated `v0.4.0` → `3181d25dc64f0d002d58a175ffcdb7a9ca3c76c3`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.4.0
- CI: quality `31396576426`; verified release `31397929176` başarılı
- Codex notification: v0.4.0 yayımlandı ve Slice 04 devam onayı istendi.
- User approval: 2026-08-10 tarihinde kullanıcı `Devam et izin veriyorum` diyerek Slice 04 için açık onay verdi.
- Tarih: 2026-08-10
