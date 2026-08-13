# Slice 02 — Domain, Units ve Save Schema

**SatisPlanner milestone:** 3/16 · **Release:** `v0.3.0` (display `0.3`, published development)

## Amaç

UI'dan bağımsız exact units, fiziksel instance model ve versioned plan schema oluşturmak.

## Task'lar

- [S02-T01 — Units ve rational arithmetic](../tasks/S02-T01-UNITS-RATIONAL.md)
- [S02-T02 — Machine instance invariant'ları](../tasks/S02-T02-MACHINE-INVARIANTS.md)
- [S02-T03 — Plan schema ve migration harness](../tasks/S02-T03-PLAN-SCHEMA.md)

## Slice acceptance

- `MachineInstance` aggregate olmayan stable UUID modelidir.
- Clock/shard/sloop invalid state oluşturulamıyor.
- Plan JSON schema versioned ve round-trip testli.
- UI/React import etmeyen domain package.

## Test kapısı

Property tests, serialization round-trip, invalid-state matrix.

## Zorunlu release + bildirim + kullanıcı onayı

`feat(slice-02): define exact domain and versioned plan schema`. Verified push sonrası `v0.3.0` GitHub Release yayımlanır. Codex `SatisPlanner v0.3.0 yayımlandı. Slice 3/16 tamamlandı. Slice 03'e devam edilsin mi?` sorusunu gönderir ve açık onaya kadar bekler; onaydan sonra bağımlılık planına göre ilerlenir.

## Delivery Record

- Branch: `slice/02-domain-schema`
- Closing SHA: `0628bcb5bfeae075b7542f812dd6a083c6cfa7ef`
- Remote SHA: tag ve yayımlanmış branch/main geçmişi `0628bcb5bfeae075b7542f812dd6a083c6cfa7ef`
- Tag: annotated `v0.3.0` → `0628bcb5bfeae075b7542f812dd6a083c6cfa7ef`
- GitHub Release URL: https://github.com/YusufHasanSaygili/SatisPlanner/releases/tag/v0.3.0
- CI: quality `31390861164`; verified release `31391896651` başarılı
- Codex notification: v0.3.0 yayımlandı ve Slice 03 devam onayı istendi.
- User approval: Kullanıcı `Bugün güzel çalıştın ... yarın Slice 3'den başlayarak` diyerek Slice 03 için açık onay verdi.
- Tarih: 2026-08-10
