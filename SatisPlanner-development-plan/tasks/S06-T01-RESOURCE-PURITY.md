# S06-T01 — Resource/Purity Instance Modeli

**Amaç:** Canvas source node'unda resource ve Impure/Normal/Pure seçimini modellemek.

**Çıktılar:** `ResourceNodeInstance`; purity value/rules; resource-specific compatibility; output port contract.

**Kabul:** Purity multiplier 0.5/1/2; state instance'a ait; unsupported resource/extractor combination hata verir; save round-trip exact selection'ı korur.

**Test/Kanıt:** Resource×purity matrix ve serialization tests.

**Bağımlılık:** Slice 02,03,05. **Boyut:** M.
