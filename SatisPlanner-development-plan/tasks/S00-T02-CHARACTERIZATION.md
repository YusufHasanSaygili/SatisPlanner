# S00-T02 — Characterization ve Save Davranışı

**Durum:** Done — Kanıt: `docs/baseline/UPSTREAM-CHARACTERIZATION.md` ve
`tests/upstream-characterization`.

**Amaç:** Rewrite sırasında kaybedilmemesi gereken upstream davranışlarını executable örneklerle kilitlemek.

**Çıktılar:** basit recipe chain save; splitter/merger örneği; Somersloop rate örneği; `.fcs` v7 schema örneği ve migration notu; UI/graph limitation listesi.

**Kabul:** Save→load semantic eşitliği gösterilir; rate propagation girdisi/çıktısı kaydedilir; aggregate craft-node davranışı açıklanır; testlerin upstream'i değiştirmeden koştuğu belgelenir.

**Test/Kanıt:** Golden `.fcs` fixtures ve beklenen JSON/rate raporu.

**Bağımlılık:** S00-T01. **Boyut:** M.
