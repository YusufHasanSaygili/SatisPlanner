# S07-T03 — Instance Isolation ve Batch Create

**Amaç:** Aynı recipe'li makinelerin state paylaşmadığını kanıtlamak ve hızlı çoğaltmak.

**Çıktılar:** duplicate/batch create command; unique ids; optional label suffix; isolation regression suite.

**Kabul:** Üç Assembler farklı clock/shard/sloop/recipe taşıyabilir; birini düzenlemek diğer node serialization/result'ını değiştirmez; duplicate yeni UUID üretir; internal mutable object paylaşımı yoktur.

**Test/Kanıt:** Deep-freeze/isolation property test ve üç-machine E2E.

**Bağımlılık:** S07-T02. **Boyut:** M.
