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

- Branch: `slice/10-persistence-migration`
- Closing SHA: `f87cc82cd7c57427aac2bd6495b03e04af33dfd0`
- Remote SHA: `f87cc82cd7c57427aac2bd6495b03e04af33dfd0`
- Tag: annotated `v0.11.0` → `f87cc82cd7c57427aac2bd6495b03e04af33dfd0`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.11.0
- CI: branch `31531695495` 5/5 success; release `31532248113` 6/6 success; local `pnpm quality` and 9/9 Playwright E2E success
- Codex notification: `SatisPlanner v0.11.0 yayımlandı. Slice 11/16 tamamlandı. Slice 11'e devam edilsin mi?`
- User approval: Bekleniyor; Slice 11 açık onay olmadan başlatılmayacak.
- Tarih: 2026-08-11
