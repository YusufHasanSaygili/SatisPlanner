# Slice 12 — Üretkenlik, Accessibility ve Graph Polish

**SatisPlanner milestone:** 13/16 · **Release:** `v0.13.0` (display `0.13`, pre-release)

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

- Branch:
- Closing SHA:
- Remote SHA:
- Tag:
- GitHub Release URL:
- CI:
- Codex notification:
- User approval:
- Tarih:
