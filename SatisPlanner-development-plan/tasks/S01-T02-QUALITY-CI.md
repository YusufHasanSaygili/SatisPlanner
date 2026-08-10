# S01-T02 — Quality ve CI Kapıları

**Amaç:** İlk günden tekrarlanabilir kalite kapıları kurmak.

**Çıktılar:** format/lint/typecheck/unit/build scripts; Rust fmt/clippy/test; dependency cache; PR CI; artifact retention politikası.

**Kabul:** Bilerek oluşturulan lint/type/test hataları CI'ı kırar; warnings-as-errors kapsamı belgeli; generated/cache/game assets gitignore'da; CI local komutlarla eşleşir.

**Test/Kanıt:** Yeşil CI ve kontrollü failure deneyi.

**Bağımlılık:** S01-T01. **Boyut:** M.
