# S10-T03 — Upstream `.fcs` Importer

**Amaç:** Upstream save'lerini best-effort ve veri kaybını görünür kılarak yeni plana taşımak.

**Çıktılar:** v1–v7 parser/migrator reuse veya adapter; node/link mapping; aggregate CraftNode expansion seçenekleri; preview ve conversion report.

**Kabul:** Original `.fcs` değişmez; bilinmeyen recipe/node raporlanır; aggregate rate fiziksel instance'lara hangi stratejiyle açıldığı gösterilir; iptal mümkün; supported fixture import sonrası açılır.

**Test/Kanıt:** Upstream characterization fixtures ve semantic comparison.

**Bağımlılık:** S10-T02,Slice 00. **Boyut:** L.
