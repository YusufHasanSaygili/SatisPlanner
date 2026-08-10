# S11-T03 — App/Game Localization

**Amaç:** Uygulama dili ile oyun data locale'ını bağımsız yönetmek.

**Çıktılar:** UI translation catalog (TR/EN); game locale selector; fallback chain; localized search aliases; number/unit format policy.

**Kabul:** Türkçe UI + İngilizce item adları mümkün; missing translation key görünür CI hatası veya fallback; stable class id save'de localized name yerine kullanılır; locale switch bağlantıları kırmaz.

**Test/Kanıt:** Locale matrix, missing key, Turkish casing/search ve snapshot switch E2E.

**Bağımlılık:** S03,S05. **Boyut:** M.
