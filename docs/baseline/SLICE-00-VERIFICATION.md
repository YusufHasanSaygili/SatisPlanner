# Slice 00 verification kaydı

Tarih: 2026-08-10

Branch: `slice/00-upstream-baseline`

## Acceptance

- Upstream `d5c449adebe335cf326b6cb2d49c106888fc06c8`, annotated
  `upstream-d5c449a` tag'i ile doğrulandı.
- Upstream C++ kaynakları değiştirilmedi veya silinmedi.
- Baseline envanteri, JSON checksum/sayımları, lisans ve artwork
  sınıflandırması kaydedildi.
- `.fcs` v7 round-trip golden fixture byte/semantic eşitliği sağladı.
- Craft chain ile splitter/merger propagation characterization testleri geçti.
- 200-node React Flow, typed domain command ve Tauri read-only Docs probe
  ölçüldü ve derlendi.
- ADR-001 kontrollü rewrite kararı `Kabul edildi` durumuna geçti.

## Kalite ve test kapıları

| Kapı | Sonuç |
|---|---|
| Upstream CMake configure + Windows desktop build | PASS, 317/317 adım |
| Upstream desktop runtime smoke | PASS, 3 saniye |
| Upstream characterization CTest | PASS, 1/1 |
| `.fcs` JSON fixture parse + round-trip | PASS |
| Biome format | PASS |
| Biome lint | PASS |
| TypeScript typecheck + Vite production build | PASS |
| Vitest typed domain command | PASS, 2/2 |
| 200-node Edge benchmark | PASS; update konservatif 10,8 ms, pan/zoom 5,56 ms/frame |
| Rust fmt | PASS |
| Rust clippy (`-D warnings`) | PASS |
| Rust unit test | PASS, 1/1 |
| Cargo check | PASS |
| Tauri release build (`--no-bundle`) | PASS |
| Tauri release runtime smoke | PASS, 3 saniye |
| Newly added Coffee Stain artwork/raw Docs/save | PASS, yok |

## Bilinen sınırlamalar

- Spike 200 node içindir; ürünün 500 node performans bütçesi Slice 13'te
  doğrulanacaktır.
- Docs probe ilk dört byte ve metadata'yı salt-okunur inceler; parse/normalize
  Slice 03 kapsamındadır.
- Tauri artifact unsigned spike executable'dır ve release artifact'ı değildir.
- CI, remote SHA, `v0.1.0` tag'i ve GitHub Release kanıtları closing commit
  remote'a gönderildikten sonra Delivery Record'a kaydedilecektir.
