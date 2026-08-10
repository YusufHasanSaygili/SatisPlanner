# S14-T01 — Desktop Capabilities ve Packaging

**Amaç:** Minimum izinli Windows desktop artifact üretmek.

**Çıktılar:** Tauri capability scopes; installer/portable ADR; app data/save/cache paths; yalnız özgün `SatisPlanner` branding/iconları; version metadata.

**Kabul:** Installer, executable, pencere başlığı ve artifact adları `SatisPlanner` kullanır; oyun folder read-only; arbitrary filesystem izni yok; install/uninstall kullanıcı planlarını politika dışı silmez; no-game fallback açılır; artifact oyun artwork'ü içermez.

**Test/Kanıt:** Packaged capability smoke ve artifact content scan.

**Bağımlılık:** Slice 13. **Boyut:** M.
