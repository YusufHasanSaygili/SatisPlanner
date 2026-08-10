# Slice 00 — Upstream Baseline ve Karar Kapısı

**SatisPlanner milestone:** 1/16 · **Release:** `v0.1.0` (display `0.1`, published development)

## Amaç

Audited upstream commit'i yeniden üretilebilir baseline olarak sabitlemek ve rewrite kararını ölçülebilir kanıtla kapatmak.

## Task'lar

- [x] [S00-T01 — Baseline ve lisans envanteri](../tasks/S00-T01-BASELINE-INVENTORY.md)
- [x] [S00-T02 — Characterization ve save davranışı](../tasks/S00-T02-CHARACTERIZATION.md)
- [x] [S00-T03 — Rewrite spike ve ADR kararı](../tasks/S00-T03-REWRITE-DECISION.md)

## Slice acceptance

- [x] Upstream SHA immutable tag ile kaydedilmiş.
- [x] Build/behavior/save baseline raporu mevcut.
- [x] Korunacak davranışlar ve kaldırılabilecek teknik borç listesi mevcut.
- [x] ADR-001 accepted veya rejected olarak kanıtla güncellenmiş.
- [x] Eski kod silinmemiş.

## Test kapısı

Desktop build smoke, örnek save round-trip, iki graph propagation characterization testi.

**Sonuç:** PASS — Ayrıntılı kanıt: `docs/baseline/SLICE-00-VERIFICATION.md`.

## Zorunlu release + bildirim + kullanıcı onayı

Öneri: `chore(slice-00): baseline upstream and record rewrite decision`. Commit ve push doğrulandıktan sonra `v0.1.0` tag'i ve GitHub Release yayımlanır. Codex `SatisPlanner v0.1.0 yayımlandı. Slice 1/16 tamamlandı. Slice 01'e devam edilsin mi?` sorusunu gönderir ve açık kullanıcı onayına kadar bekler.

## Delivery Record

Patch correction: Kullanıcı incelemesinde kök README'nin upstream ürün adını
taşımaya devam ettiği saptandı. Slice 00 yeniden açıldı; SatisPlanner ürün
kimliği README ve release workflow'unda düzeltilecek ve `v0.1.1` yayımlanacak.

- Branch: `slice/00-upstream-baseline`
- Closing SHA: `ef4f7d57388e8b9a9e584fc3d74fe91baa9165cf`
- Remote SHA: `ef4f7d57388e8b9a9e584fc3d74fe91baa9165cf`
- Tag: `v0.1.1` (`v0.1.0` README product-identity correction ile superseded)
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.1.1
- CI: PASS — https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31346575310
- Codex notification: Gönderildi; `v0.1.1` düzeltmesi ve onay kapısı bildirildi.
- User approval: `Slice 2 ye geç`
- Tarih: 2026-08-10
