# Slice 07 — Bağımsız Production Machine Instance'ları

**SatisPlanner milestone:** 8/16 · **Release:** `v0.8.0` (display `0.8`, pre-release)

## Amaç

Her Smelter/Constructor/Foundry/Assembler/Manufacturer/Refinery/Blender vb. node'u bağımsız recipe, clock, shard ve sloop state'iyle çalıştırmak.

## Task'lar

- [S07-T01 — Building/recipe binding](../tasks/S07-T01-BUILDING-RECIPE.md)
- [S07-T02 — Per-instance clock/shard/sloop controls](../tasks/S07-T02-INSTANCE-CONTROLS.md)
- [S07-T03 — Instance isolation ve batch create](../tasks/S07-T03-INSTANCE-ISOLATION.md)

## Slice acceptance

- Aynı recipe'li iki instance farklı değerleri saklıyor.
- Clock/shard UI invalid state üretmiyor.
- Sloop düğmeleri gerçek slot sayısı ve çarpanı gösteriyor.
- Recipe değişimi portları ve diagnostics'i güvenli güncelliyor.

## Test kapısı

Instance isolation property test; Constructor/Assembler/Manufacturer sloop UI E2E.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-07): add independent machine instance controls`. Verified push sonrası `v0.8.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.8.0 yayımlandı. Slice 8/16 tamamlandı. Slice 08'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
