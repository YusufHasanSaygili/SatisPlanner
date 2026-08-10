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

## Slice 04 karar eki — v0.5.0

**Karar: NO-GO.** `v0.5.0` otomatik `.pak`/IoStore extractor, sidecar veya
üçüncü taraf binary bundle etmez. Manual extracted-folder akışı ürünün tam ve
varsayılan yerel icon yoludur.

Değerlendirilen `repak`, UE Viewer ve UAssetGUI permissive lisanslı olsa da
archive okuma, cooked texture çözme ve görsel export tek, Satisfactory 1.2 için
pinlenmiş/güvenli bir zincir oluşturmuyor. Unreal container şifreleme/anahtar,
compression, engine-version uyumu, path traversal, untrusted native parser ve
büyük disk yazımı riskleri ayrı kalıyor. Araç lisansı oyun artwork'ünü yeniden
dağıtma izni de vermez.

Karar yalnız yeni bir hukuk değerlendirmesi, pinlenmiş source+binary checksum,
sandbox/read-only PoC, açık kullanıcı onayı ve Satisfactory patch uyumluluk
matrisi birlikte sağlanırsa yeniden açılabilir. Ayrıntılı gate ve threat model:
`docs/local-icons/EXTRACTOR-DECISION.md`.
