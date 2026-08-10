# S03-T03 — Snapshot Validation ve Diff

**Amaç:** Import çıktısını provenance taşıyan immutable snapshot yapmak ve update etkisini göstermek.

**Çıktılar:** catalog validator; canonical hash; importer/source/game/locale metadata; old/new diff; activation transaction.

**Kabul:** Aynı input aynı hash; duplicate id/missing building/invalid duration yakalanır; snapshot değişiminde removed/changed recipe raporu; aktif plan sessiz kırılmaz.

**Test/Kanıt:** Determinism, corruption, diff ve rollback integration tests.

**Bağımlılık:** S03-T02. **Boyut:** L.
