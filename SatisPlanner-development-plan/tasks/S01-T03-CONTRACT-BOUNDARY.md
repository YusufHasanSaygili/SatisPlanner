# S01-T03 — Native/Frontend Contract Sınırı

**Amaç:** Filesystem/native işlemlerini UI'dan dar, versioned kontratla ayırmak.

**Çıktılar:** request/response/error envelope; generated veya compile-time checked TypeScript/Rust types; capability policy; mock native adapter.

**Kabul:** UI testleri Tauri olmadan mock adapter ile koşar; path ve raw exception UI'ya sızmaz; contract version mismatch anlaşılır hata üretir; native izinler default-deny.

**Test/Kanıt:** Contract round-trip ve error mapping tests.

**Bağımlılık:** S01-T01,T02. **Boyut:** M.
