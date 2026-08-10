# S02-T01 — Units ve Rational Arithmetic

**Amaç:** Material rate hesaplarını kesin ve unit-safe yapmak.

**Çıktılar:** rational value object; item/fluid rate, clock ve power types; parse/format policies; overflow/zero-division handling.

**Kabul:** `1/3 + 1/3 + 1/3 = 1`; item ve fluid rate yanlışlıkla toplanamaz; UI rounding domain değerini değiştirmez; JSON temsil deterministik.

**Test/Kanıt:** Arithmetic unit/property tests ve serialization round-trip.

**Bağımlılık:** Slice 01. **Boyut:** M.
