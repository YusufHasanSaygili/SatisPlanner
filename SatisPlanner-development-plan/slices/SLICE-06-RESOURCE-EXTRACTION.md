# Slice 06 — Resource Node ve Extraction

**SatisPlanner milestone:** 7/16 · **Release:** `v0.7.0` (display `0.7`, published development)

## Amaç

Purity, miner/extractor tier, clock ve shard ayarlı gerçek resource source instance'ları eklemek.

## Task'lar

- [x] [S06-T01 — Resource/purity instance modeli](../tasks/S06-T01-RESOURCE-PURITY.md)
- [x] [S06-T02 — Miner ve extractor stratejileri](../tasks/S06-T02-EXTRACTOR-STRATEGIES.md)
- [x] [S06-T03 — Resource inspector ve fixtures](../tasks/S06-T03-RESOURCE-INSPECTOR.md)

## Slice acceptance

- Impure/Normal/Pure seçimi instance bazında.
- Miner Mk.1–Mk.3 rate ve power doğru.
- Oil/water/well türleri ayrı strategy ile genişletilebilir.
- Pure Miner Mk.3 @250% = 1200/min golden sonucu.

## Test kapısı

Purity × tier × clock matrix, shard validation, resource drag/drop E2E.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-06): model resource purity and extraction tiers`. Verified push sonrası `v0.7.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.7.0 yayımlandı. Slice 7/16 tamamlandı. Slice 07'ye devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

## Delivery Record

- Branch: `slice/06-resource-extraction`
- Closing SHA: `f481524bf41e926f23da35edd6d858399bf3d4e0`
- Remote SHA: branch ve `main` kapanışta `f481524bf41e926f23da35edd6d858399bf3d4e0`
- Tag: annotated `v0.7.0` → `f481524bf41e926f23da35edd6d858399bf3d4e0`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.7.0
- CI: push run `31504923694` 5/5; main run `31504927958` 5/5 başarılı. Release run `31506457238` build işleri 5/5 başarılı; publish işi GitHub billing/spending-limit nedeniyle runner'a başlamadan engellendi. Aynı run'ın doğrulanmış artifact'ları indirildi, arşiv içerikleri ve SHA-256 değerleri doğrulandı ve release GitHub CLI ile `Latest` olarak yayımlandı.
- Codex notification: aynı görevde `WAITING_FOR_USER_APPROVAL` onay kapısı hazırlanmıştır
- User approval: 2026-08-11 tarihinde kullanıcı `Devam et` diyerek Slice 07 için açık onay verdi.
- Tarih: 2026-08-11
