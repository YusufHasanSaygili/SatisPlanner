# S01-T01 — Workspace Scaffold

**Amaç:** Seçilen mimariyi minimum çalışan vertical shell olarak kurmak.

**Çıktılar:** `SatisPlanner` adlı desktop UI app; `domain`, `game-data`, `calculation`, `graph-adapter` paket sınırları; app layout; lockfile ve supported toolchain dosyaları.

**Kabul:** Clean checkout ile tek komut build/dev; pencere başlığı ve uygulama metadata'sı `SatisPlanner` adını taşır; desktop window library/canvas/inspector placeholder'larını gösterir; domain paketi React/Tauri import etmez; upstream tag/history korunur.

**Test/Kanıt:** Clean build ve package boundary test/lint rule.

**Bağımlılık:** Slice 00. **Boyut:** M.
