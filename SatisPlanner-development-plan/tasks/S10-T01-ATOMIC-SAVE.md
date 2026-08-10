# S10-T01 — Atomic Save, Autosave ve Recovery

**Amaç:** Çökme/yarım yazma durumunda plan kaybını önlemek.

**Çıktılar:** app-owned save directory; temp-write/fsync/rename flow; debounced autosave; last-good backup; recovery UI.

**Kabul:** Oyun kurulumu hiç yazılmaz; yarım temp dosya ana save'i bozmaz; recovery kullanıcıya timestamp/schema ile sunulur; save sırasında icon cache bağımlılığı yoktur.

**Test/Kanıt:** Forced interruption, truncated JSON, permission error ve concurrent save tests.

**Bağımlılık:** Slice 02,05,08. **Boyut:** L.
