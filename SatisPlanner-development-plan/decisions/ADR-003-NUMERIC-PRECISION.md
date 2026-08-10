# ADR-003 — Numeric Precision ve Units

- Durum: Kabul edildi
- Tarih: 2026-08-10

## Karar

- Material counts/rates exact rational olarak hesaplanır.
- Clock yüzdesi dört ondalıklı decimal string/value object olarak saklanır.
- Power formülleri irrational exponent nedeniyle yüksek hassasiyetli decimal veya kontrollü floating point kullanır; karşılaştırma toleransı test sözleşmesinde sabittir.
- Units type seviyesinde ayrılır: `ItemRatePerMinute`, `FluidRateM3PerMinute`, `PowerMW`, `ClockPercent`.
- UI yuvarlaması domain değerini değiştirmez.

## Gerekçe

Uzun recipe zincirlerinde binary float sapması bottleneck ve equality kararlarını bozabilir. Upstream'in fractional rate yaklaşımı korunmaya değer bir davranıştır.
