# Slice 14 — Desktop Packaging ve Release Pipeline

**SatisPlanner milestone:** 15/16 · **Release:** `v0.15.0` (display `0.15`, published development)

## Amaç

Windows öncelikli güvenilir installer, reproducible artifact, checksums ve release automation.

## Task'lar

- [S14-T01 — Desktop capabilities ve packaging](../tasks/S14-T01-DESKTOP-PACKAGING.md)
- [S14-T02 — Release CI ve supply chain](../tasks/S14-T02-RELEASE-CI.md)
- [S14-T03 — Clean-machine smoke](../tasks/S14-T03-CLEAN-MACHINE.md)

## Slice acceptance

- Installer/portable kararı belgeli ve artifact üretiliyor.
- Capability scope minimum.
- Artifact checksum/SBOM/third-party notices var.
- Clean Windows kurulum, save ve real Docs import smoke geçiyor.

## Test kapısı

Packaged app E2E, install/uninstall, no-game fallback, real-game import smoke.

## Zorunlu release + bildirim + kullanıcı onayı

`build(slice-14): package and verify desktop release artifacts`. Verified push sonrası `v0.15.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.15.0 yayımlandı. Slice 15/16 tamamlandı. Slice 15'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

## Delivery Record

- Branch: `slice/14-packaging-release`
- Closing SHA: `ed08120c404e6846dcf6afe2d8b6c257b605d10c`
- Remote SHA: `ed08120c404e6846dcf6afe2d8b6c257b605d10c`
- Tag: `v0.15.0` (annotated, target `ed08120c404e6846dcf6afe2d8b6c257b605d10c`)
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.15.0
- CI: main quality https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31674323977; verified release https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31674862542
- Codex notification: `SatisPlanner v0.15.0 yayımlandı. Slice 15/16 tamamlandı. Slice 15'e devam edilsin mi?`
- User approval: Bekleniyor.
- Tarih: 2026-08-13
