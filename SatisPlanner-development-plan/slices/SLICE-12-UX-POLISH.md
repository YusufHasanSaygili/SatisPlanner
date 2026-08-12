# Slice 12 — Üretkenlik, Accessibility ve Graph Polish

**SatisPlanner milestone:** 13/16 · **Release:** `v0.13.0` (display `0.13`, published development)

## Amaç

Büyük planlarda hızlı ve erişilebilir çalışma: undo/redo, keyboard, grouping, auto-layout ve diagnostics navigasyonu.

## Task'lar

- [S12-T01 — Command history ve clipboard](../tasks/S12-T01-UNDO-CLIPBOARD.md)
- [S12-T02 — Auto-layout/group/navigation](../tasks/S12-T02-LAYOUT-NAVIGATION.md)
- [S12-T03 — Accessibility ve visual states](../tasks/S12-T03-ACCESSIBILITY.md)

## Slice acceptance

- Domain commands undo/redo ediliyor.
- Copy/paste yeni UUID üretip internal edges'i koruyor.
- Auto-layout explicit action ve undoable.
- Klavye ile library→canvas→inspector→diagnostic akışı mümkün.
- Renk tek durum göstergesi değil.

## Test kapısı

Keyboard E2E, clipboard round-trip, visual snapshots, axe/accessibility smoke.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-12): polish graph workflows and accessibility`. Verified push sonrası `v0.13.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.13.0 yayımlandı. Slice 13/16 tamamlandı. Slice 13'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

## Delivery Record

- Branch: `slice/12-ux-polish`
- Closing SHA: `19afa8f18cca87f5dd9fe60125c7959483c692fe`
- Remote SHA: Release öncesi doğrulanan branch ve `main` push SHA'sı
  `19afa8f18cca87f5dd9fe60125c7959483c692fe`; sonraki commit yalnızca Delivery Record
  metadata'sını günceller.
- Tag: Annotated `v0.13.0`, target `19afa8f18cca87f5dd9fe60125c7959483c692fe`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.13.0
- CI: Branch [31552364961](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31552364961)
  ve main [31552723723](https://github.com/YusufHasanSaygili/SatisPlanner/actions/runs/31552723723)
  başarılı; web quality/E2E, Rust fmt/clippy/test ve Windows/macOS/Linux native build geçti.
- Codex notification: `SatisPlanner v0.13.0 yayımlandı. Slice 13/16 tamamlandı. Slice 13'e devam edilsin mi?`
- User approval: 2026-08-12 tarihinde kullanıcı `devam et` diyerek Slice 13 için açık onay verdi.
- Tarih: 2026-08-12
