# Slice 01 — Repo ve Uygulama Temeli

**SatisPlanner milestone:** 2/16 · **Release:** `v0.2.0` (display `0.2`, pre-release)

## Amaç

Karar verilen stack ile güvenli, test edilebilir workspace ve CI iskeleti kurmak.

## Task'lar

- [x] [S01-T01 — Workspace scaffold](../tasks/S01-T01-WORKSPACE-SCAFFOLD.md)
- [x] [S01-T02 — Quality ve CI kapıları](../tasks/S01-T02-QUALITY-CI.md)
- [x] [S01-T03 — Native/frontend contract sınırı](../tasks/S01-T03-CONTRACT-BOUNDARY.md)

## Slice acceptance

- [x] Desktop shell açılıyor; boş ana layout render oluyor.
- [x] Domain paketi framework bağımsız test çalıştırıyor.
- [x] Rust/native komutu typed contract üzerinden çağrılıyor.
- [x] PR CI format/lint/typecheck/test/build koşuyor.

## Test kapısı

Clean checkout build, shell smoke, contract round-trip.

**Sonuç:** PASS — Ayrıntılı kanıt: `docs/foundation/SLICE-01-VERIFICATION.md`.

## Zorunlu release + bildirim + kullanıcı onayı

`chore(slice-01): establish workspace and quality gates`. Verified push sonrası `v0.2.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.2.0 yayımlandı. Slice 2/16 tamamlandı. Slice 02'ye devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

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
