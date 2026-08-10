# S03-T02 — Localized Docs Parser ve Normalizer

**Amaç:** UTF-16 locale dump'ını stable item/building/recipe catalog'a çevirmek.

**Çıktılar:** encoding detection; class-group parser; counted item parser; solid/fluid unit conversion; produced-in mapping; legacy Docs adapter.

**Kabul:** Locale display name ile stable class id ayrılır; missing reference fail-loud diagnostic üretir; recipe duration/rates doğru normalize edilir; raw source mutate edilmez.

**Test/Kanıt:** `en-US` + ikinci locale + legacy + malformed fixtures.

**Bağımlılık:** S03-T01,S02. **Boyut:** L.
