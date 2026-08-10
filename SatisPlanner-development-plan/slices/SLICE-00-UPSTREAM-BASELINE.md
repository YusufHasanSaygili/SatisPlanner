# Slice 00 — Upstream Baseline ve Karar Kapısı

**SatisPlanner milestone:** 1/16 · **Release:** `v0.1.0` (display `0.1`, pre-release)

## Amaç

Audited upstream commit'i yeniden üretilebilir baseline olarak sabitlemek ve rewrite kararını ölçülebilir kanıtla kapatmak.

## Task'lar

- [x] [S00-T01 — Baseline ve lisans envanteri](../tasks/S00-T01-BASELINE-INVENTORY.md)
- [x] [S00-T02 — Characterization ve save davranışı](../tasks/S00-T02-CHARACTERIZATION.md)
- [ ] [S00-T03 — Rewrite spike ve ADR kararı](../tasks/S00-T03-REWRITE-DECISION.md)

## Slice acceptance

- Upstream SHA immutable tag ile kaydedilmiş.
- Build/behavior/save baseline raporu mevcut.
- Korunacak davranışlar ve kaldırılabilecek teknik borç listesi mevcut.
- ADR-001 accepted veya rejected olarak kanıtla güncellenmiş.
- Eski kod silinmemiş.

## Test kapısı

Desktop build smoke, örnek save round-trip, iki graph propagation characterization testi.

## Zorunlu release + bildirim + kullanıcı onayı

Öneri: `chore(slice-00): baseline upstream and record rewrite decision`. Commit ve push doğrulandıktan sonra `v0.1.0` tag'i ve GitHub Release yayımlanır. Codex `SatisPlanner v0.1.0 yayımlandı. Slice 1/16 tamamlandı. Slice 01'e devam edilsin mi?` sorusunu gönderir ve açık kullanıcı onayına kadar bekler.

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
