# ADR-005 — Yerel Oyun Asset'leri

- Durum: Kabul edildi
- Tarih: 2026-08-10

## Karar

Satisfactory icon/artwork dosyaları source repo, installer veya release artifact'ına eklenmez. Uygulama, kullanıcının seçtiği yerel extracted asset kaynağından app-owned cache üretir. Bulunamayan icon için uygulamanın özgün generic fallback'i gösterilir.

Otomatik .pak extraction yalnız şu koşullarda ayrı adapter olarak eklenebilir:

- hukuk/lisans değerlendirmesi tamamlanmış,
- güvenilir ve checksum'lı toolchain,
- explicit kullanıcı onayı,
- oyun kurulumuna write yapmayan tasarım,
- cache temizliğinde allowlist/canonical path güvenliği.

## Gerekçe

Official Wiki Docs verilerinin açık lisans taşımadığını, upstream ise oyun görsellerinin Coffee Stain fikri mülkiyeti olduğunu belirtir. Yerel import ürün deneyimini korurken yeniden dağıtım riskini azaltır.
