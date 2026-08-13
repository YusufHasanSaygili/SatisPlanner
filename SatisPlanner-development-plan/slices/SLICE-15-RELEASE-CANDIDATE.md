# Slice 15 — Dokümantasyon ve Release Candidate

**SatisPlanner milestone:** 16/16 · **Release:** `v1.0.0` (display `1.0`, stable)

## Amaç

Kullanıcıya hazır onboarding, örnek fabrikalar, credits ve tüm P0 kabulünün final kanıtı.

## Task'lar

- [S15-T01 — Onboarding ve kullanım belgeleri](../tasks/S15-T01-ONBOARDING-DOCS.md)
- [S15-T02 — Örnek planlar ve export](../tasks/S15-T02-EXAMPLE-PLANS.md)
- [S15-T03 — RC audit ve release notes](../tasks/S15-T03-RC-AUDIT.md)

## Slice acceptance

- İlk açılış data/icon importu açıkça anlatıyor.
- En az üç versioned örnek plan mevcut; oyun artwork'ü gömülü değil.
- Credits/disclaimer/license/known limitations tamam.
- Traceability, DoD ve tüm slice delivery record'ları audit edilmiş.
- Ana Coal ve bağımsız Constructor senaryosu packaged app'te geçiyor.

## Test kapısı

RC full regression, docs link check, artifact content scan, user acceptance walkthrough.

## Zorunlu release + bildirim + final kullanıcı onayı

`release(slice-15): finalize documentation and release candidate`. Push/remote SHA/CI doğrulamasından sonra `v1.0.0` stable GitHub Release yayımlanır. Codex `SatisPlanner v1.0.0 yayımlandı. Slice 16/16 tamamlandı. Release kabul edilsin ve geliştirme görevi tamamlandı olarak kapatılsın mı?` sorusunu gönderir; açık kullanıcı onayı olmadan görevi tamamlamaz veya arşivlemez.

## Delivery Record

- Branch: `slice/15-release-candidate`
- Closing SHA: `b5ded6ed80752057d3b64eb1698e05dda74e5ce0`
- Remote SHA: `b5ded6ed80752057d3b64eb1698e05dda74e5ce0` (`origin/slice/15-release-candidate` ve `origin/main`)
- Tag: `v1.0.0` (annotated tag object `b485217efb14944f9eedba182e75e2f78bc56bba`, target `b5ded6ed80752057d3b64eb1698e05dda74e5ce0`)
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v1.0.0
- CI: [branch quality](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31679181775), [main quality](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31679728283), [verified release](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31680296982)
- Codex notification: `SatisPlanner v1.0.0 yayımlandı. Slice 16/16 tamamlandı. Release kabul edilsin ve geliştirme görevi tamamlandı olarak kapatılsın mı?`
- User approval: Bekleniyor
- Tarih: 2026-08-13
