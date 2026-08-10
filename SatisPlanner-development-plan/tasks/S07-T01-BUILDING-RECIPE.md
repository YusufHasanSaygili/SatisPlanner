# S07-T01 — Building/Recipe Binding

**Amaç:** Machine instance'ı normalized catalog building ve uyumlu recipe ile bağlamak.

**Çıktılar:** machine creation command; produced-in filter; recipe search; typed input/output port generation; unresolved state.

**Kabul:** Assembler'a yalnız uygun recipe; Foundry “alloy” recipe'lerini destekler; recipe değişiminde uyumsuz edges raporlanır ve sessiz silinmez; removed catalog entry unresolved kalır.

**Test/Kanıt:** Building/recipe compatibility matrix ve catalog-update case.

**Bağımlılık:** Slice 02,03,05. **Boyut:** L.
