# Slice 07 — Bağımsız Production Machine Instance'ları

**SatisPlanner milestone:** 8/16 · **Release:** `v0.8.0` (display `0.8`, published development)

## Amaç

Her Smelter/Constructor/Foundry/Assembler/Manufacturer/Refinery/Blender vb. node'u bağımsız recipe, clock, shard ve sloop state'iyle çalıştırmak.

## Task'lar

- [x] [S07-T01 — Building/recipe binding](../tasks/S07-T01-BUILDING-RECIPE.md)
- [x] [S07-T02 — Per-instance clock/shard/sloop controls](../tasks/S07-T02-INSTANCE-CONTROLS.md)
- [x] [S07-T03 — Instance isolation ve batch create](../tasks/S07-T03-INSTANCE-ISOLATION.md)

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

- Branch: `slice/07-machine-instances`
- Closing SHA: `97ff76c32c2ffa6e6fe7fbc57a8cc82b197b059a`
- Remote SHA: branch ve `main` kapanışta `97ff76c32c2ffa6e6fe7fbc57a8cc82b197b059a`
- Tag: annotated `v0.8.0` → `97ff76c32c2ffa6e6fe7fbc57a8cc82b197b059a`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.8.0
- CI: public repository geçişi sonrası manuel doğrulama run `31521238187` 5/5 başarılı (web quality/E2E, Rust quality/test, Linux, Windows ve macOS desktop smoke). Önceki private-repository run'ları hesap Actions bütçesi `$0` olduğu için runner'a başlamadan engellenmişti.
- Codex notification: aynı görevde `WAITING_FOR_USER_APPROVAL` onay kapısı hazırlanmıştır
- User approval: 2026-08-11 tarihinde kullanıcı `Devam` diyerek Slice 08 için açık onay verdi.
- Tarih: 2026-08-11
