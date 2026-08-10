# Slice 11 — 1.2 Game Profiles ve Localization

**SatisPlanner milestone:** 12/16 · **Release:** `v0.12.0` (display `0.12`, pre-release)

## Amaç

1.2 Game Modes multiplier'larını ve localized game data/UI ayrımını güvenli modellemek.

## Task'lar

- [S11-T01 — Game profile model ve characterization](../tasks/S11-T01-GAME-PROFILES.md)
- [S11-T02 — Multiplier integration](../tasks/S11-T02-MULTIPLIERS.md)
- [S11-T03 — App/game localization](../tasks/S11-T03-LOCALIZATION.md)

## Slice acceptance

- Default profile vanilla sonuçları değiştirmiyor.
- Power/recipe multiplier semantiği fixture ile kanıtlı.
- Resource purity/randomization seçimi plan metadata'sında; seed map simülasyonu yapılmıyor.
- UI dili ve game-data locale bağımsız seçilebilir.

## Test kapısı

Profile matrix, locale fallback, missing translation, snapshot switch E2E.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-11): support 1.2 profiles and localized catalogs`. Verified push sonrası `v0.12.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.12.0 yayımlandı. Slice 12/16 tamamlandı. Slice 12'ye devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
