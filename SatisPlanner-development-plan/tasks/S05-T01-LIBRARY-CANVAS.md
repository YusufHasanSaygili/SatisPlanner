# S05-T01 — Library ve Drag/Drop Canvas

**Amaç:** Searchable catalog öğelerini domain-backed graph node'larına dönüştürmek.

**Çıktılar:** category library; search; drag payload; drop-to-command; canvas pan/zoom/minimap; node view registry.

**Kabul:** Drop stable UUID'li domain node yaratır; React Flow object source of truth olmaz; position ve viewport plan state'e yansır; duplicate display name class id'yle ayrılır.

**Test/Kanıt:** Search/drop/move/reload component ve E2E tests.

**Bağımlılık:** Slice 02, S01. **Boyut:** L.
