# S12-T01 — Command History ve Clipboard

**Amaç:** Domain değişikliklerini güvenli undo/redo, copy/paste ve duplicate akışına bağlamak.

**Çıktılar:** command history; transaction grouping; clipboard schema; UUID remapping; shortcut map.

**Kabul:** Clock+auto-shard tek undo adımı; paste yeni ids üretir; selected subgraph internal edges'i korur, external edges'i kopyalamaz; save sonrası history politikası açık; invalid paste reddedilir.

**Test/Kanıt:** Command inverse property tests ve clipboard E2E.

**Bağımlılık:** Slice 02,05–11. **Boyut:** L.
