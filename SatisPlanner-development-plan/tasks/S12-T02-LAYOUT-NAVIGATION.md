# S12-T02 — Auto-layout, Group ve Navigation

**Amaç:** Büyük graph'ta link crossing'i azaltmak ve diagnostic'e hızla gitmek.

**Çıktılar:** explicit auto-layout adapter; group/note/color metadata; focus-next diagnostic/sloop; minimap filters.

**Kabul:** Auto-layout undoable ve kullanıcı tetiklemeli; locked/manual nodes korunabilir; group calculation semantics'i değiştirmez; focus action görünür node'a zoom eder; 500-node layout UI'ı bloklamaz.

**Test/Kanıt:** Deterministic layout fixture, undo ve navigation E2E.

**Bağımlılık:** S12-T01,S05. **Boyut:** L.
