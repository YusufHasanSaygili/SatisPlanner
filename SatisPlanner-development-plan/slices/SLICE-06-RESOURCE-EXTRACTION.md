# Slice 06 — Resource Node ve Extraction

**SatisPlanner milestone:** 7/16 · **Release:** `v0.7.0` (display `0.7`, pre-release)

## Amaç

Purity, miner/extractor tier, clock ve shard ayarlı gerçek resource source instance'ları eklemek.

## Task'lar

- [S06-T01 — Resource/purity instance modeli](../tasks/S06-T01-RESOURCE-PURITY.md)
- [S06-T02 — Miner ve extractor stratejileri](../tasks/S06-T02-EXTRACTOR-STRATEGIES.md)
- [S06-T03 — Resource inspector ve fixtures](../tasks/S06-T03-RESOURCE-INSPECTOR.md)

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

- Branch:
- Closing SHA:
- Remote SHA:
- Tag:
- GitHub Release URL:
- CI:
- Codex notification:
- User approval:
- Tarih:
