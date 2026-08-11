# Slice 08 — Material Flow ve Power Engine

**SatisPlanner milestone:** 9/16 · **Release:** `v0.9.0` (display `0.9`, published development)

## Amaç

Resource, machine ve organization node'ları boyunca exact steady-state rate, demand, production, power ve diagnostics hesaplamak.

## Task'lar

- [x] [S08-T01 — Machine/extractor formula strategies](../tasks/S08-T01-FORMULA-STRATEGIES.md)
- [x] [S08-T02 — Flow propagation ve split/merge](../tasks/S08-T02-FLOW-PROPAGATION.md)
- [x] [S08-T03 — Loops, diagnostics ve incremental compute](../tasks/S08-T03-LOOPS-DIAGNOSTICS.md)

## Slice acceptance

- Inputs clock ile; outputs clock × amplification ile hesaplanıyor.
- Power formülleri golden fixture'larla doğru.
- Equal/manual splitter ve merger conservation sağlıyor.
- Cycle/loop çözülemiyorsa açık diagnostic var.
- UI actual/required/efficiency okuyabiliyor.

## Test kapısı

Golden rules, property conservation, byproduct loop fixture, determinism ve benchmark smoke.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-08): deliver deterministic material and power engine`. Verified push sonrası `v0.9.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.9.0 yayımlandı. Slice 9/16 tamamlandı. Slice 09'a devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler.

## Delivery Record

- Branch: `slice/08-calculation-engine`
- Closing SHA: `592b8fb24b412bb9cef88cd845f9df2d05417f04`
- Remote SHA: branch ve `main` kapanışta `592b8fb24b412bb9cef88cd845f9df2d05417f04`
- Tag: annotated `v0.9.0` → `592b8fb24b412bb9cef88cd845f9df2d05417f04`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.9.0
- CI: branch run `31523532431` 5/5; main run `31524047573` 5/5; release run `31524526793` 6/6 başarılı
- Codex notification: aynı görevde `WAITING_FOR_USER_APPROVAL` onay kapısı hazırlanmıştır
- User approval: bekleniyor; açık onay olmadan Slice 09 başlamaz
- Tarih: 2026-08-11
