# S05-T03 — Selection ve Inspector Shell

**Amaç:** Seçili node/edge UUID'sine göre tür güvenli düzenleme alanı kurmak.

**Çıktılar:** selection store; node/edge inspector registry; summary cards; delete/duplicate commands; empty/multi-selection states.

**Kabul:** Inspector state'i seçili instance'tan okur; stale selection crash etmez; edit domain command üzerinden gider; başka instance'a geçişte değer sızıntısı yoktur.

**Test/Kanıt:** Selection switching ve stale-delete component/E2E tests.

**Bağımlılık:** S05-T01,T02. **Boyut:** M.
