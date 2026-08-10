# Slice 10 — Save, Autosave ve Upstream Migration

**SatisPlanner milestone:** 11/16 · **Release:** `v0.11.0` (display `0.11`, published development)

## Amaç

Planların güvenli saklanması, recovery ve upstream `.fcs` dönüşümü.

## Task'lar

- [S10-T01 — Atomic save/autosave/recovery](../tasks/S10-T01-ATOMIC-SAVE.md)
- [S10-T02 — Schema migrations ve import/export](../tasks/S10-T02-SCHEMA-MIGRATIONS.md)
- [S10-T03 — Upstream `.fcs` importer](../tasks/S10-T03-UPSTREAM-FCS.md)

## Slice acceptance

- Atomic save ve son-good recovery.
- Schema fixture'ları ileri migrate oluyor.
- Game-data snapshot mismatch raporlanıyor.
- `.fcs` import preview/rapor/orijinal koruma ile çalışıyor.

## Test kapısı

Crash/truncated write, round-trip, all-version migration, representative `.fcs` fixtures.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-10): add resilient saves and upstream migration`. Verified push sonrası `v0.11.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.11.0 yayımlandı. Slice 11/16 tamamlandı. Slice 11'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
