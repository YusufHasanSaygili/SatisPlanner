# S04-T02 — Local Icon Cache ve Manifest

**Amaç:** Kullanıcının extracted asset klasöründen optimize edilmiş app-owned cache üretmek.

**Çıktılar:** folder picker; manifest; source/cache hash; resize/format pipeline; cache invalidation/clear action.

**Kabul:** Source read-only; cache yalnız app data altında; temizleme manifest allowlist'i dışına çıkmaz; source değişince ilgili entry yenilenir; original asset repoya kopyalanmaz.

**Test/Kanıt:** Canonical-path traversal, invalid image, duplicate resolution, invalidation integration tests.

**Bağımlılık:** S04-T01,S03. **Boyut:** M.
